import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCampusRoute } from "@/app/api/campus/[id]/route/route";
import { GET as getGlobalRoute } from "@/app/api/route/route";
import {
  SYNTHETIC_CAMPUS_ID,
  SYNTHETIC_BUILDING_ID,
  SYNTHETIC_NODES,
  SYNTHETIC_EDGES,
  SYNTHETIC_DESTINATIONS,
} from "@/scripts/seed-synthetic-phase0";
import type { RoutingEdge } from "@/lib/schemas/db";

vi.mock("@/lib/spatial/campus", () => ({
  isPointInCampus: vi.fn(async (lng: number, lat: number, campusId: string) => {
    if (campusId !== SYNTHETIC_CAMPUS_ID) return false;
    return lng >= 75.56 && lng <= 75.57 && lat >= 26.84 && lat <= 26.85;
  }),
}));

vi.mock("@/lib/spatial/edges", () => ({
  fetchEdgesFromCampus: vi.fn(async (campusId: string) => {
    if (campusId !== SYNTHETIC_CAMPUS_ID) return [];
    const edges: RoutingEdge[] = SYNTHETIC_EDGES.map((e) => ({
      id: e.id,
      source_node_id: e.src,
      target_node_id: e.tgt,
      distance_meters: e.dist,
      is_accessible: e.accessible,
      floor_id: "0",
    }));
    return edges;
  }),
}));

vi.mock("@/lib/spatial/rooms", () => ({
  getCampusIdForRoom: vi.fn(async (roomId: string) => {
    const exists = SYNTHETIC_NODES.some((n) => n.id === roomId);
    return exists ? SYNTHETIC_CAMPUS_ID : null;
  }),
  fetchRoomCentroidsForCampus: vi.fn(async (campusId: string) => {
    if (campusId !== SYNTHETIC_CAMPUS_ID) return new Map();
    const map = new Map<string, [number, number]>();
    for (const node of SYNTHETIC_NODES) {
      map.set(node.id, [node.lng, node.lat]);
    }
    return map;
  }),
}));

vi.mock("@/lib/spatial/knn", () => ({
  getNearestRoom: vi.fn(async (lng: number, lat: number, campusId?: string) => {
    if (campusId && campusId !== SYNTHETIC_CAMPUS_ID) return null;
    if (lng < 75.56 || lng > 75.57 || lat < 26.84 || lat > 26.85) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const node of SYNTHETIC_NODES) {
      const dLng = (node.lng - lng) * 111320 * Math.cos((lat * Math.PI) / 180);
      const dLat = (node.lat - lat) * 110540;
      const dist = Math.sqrt(dLng * dLng + dLat * dLat);

      if (dist < minDistance) {
        minDistance = dist;
        nearest = node;
      }
    }

    if (minDistance > 50) return null;

    return nearest
      ? {
          id: nearest.id,
          building_id: SYNTHETIC_BUILDING_ID,
          floor: "0",
          name: nearest.name,
          geom: { type: "Polygon", coordinates: [] },
          centroid: { type: "Point", coordinates: [nearest.lng, nearest.lat] },
        }
      : null;
  }),
}));

function createRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("UNI-88 & UNI-89: Routing API Smoke and Remediation Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Direct and Multi-Edge Routes", () => {
    it("returns direct route from Main Gate to Dome Building", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5620&fromLat=26.8420&toRoomId=30000000-0000-4000-8000-000000000003`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.type).toBe("Feature");
      expect(json.data.geometry.type).toBe("LineString");
      expect(json.data.geometry.coordinates).toEqual([
        [75.5620, 26.8420],
        [75.5630, 26.8425],
        [75.5625, 26.8435],
      ]);
      expect(json.data.properties.distance_meters).toBe(235.0);
    });

    it("returns multi-edge route across campus to Academic Block 3", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5620&fromLat=26.8420&toRoomId=30000000-0000-4000-8000-000000000011`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.geometry.coordinates.length).toBeGreaterThanOrEqual(4);
      expect(json.data.properties.distance_meters).toBeGreaterThan(0);
    });

    it("returns zero distance valid LineString when start node equals target node", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5620&fromLat=26.8420&toRoomId=30000000-0000-4000-8000-000000000001`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.type).toBe("Feature");
      expect(json.data.geometry.type).toBe("LineString");
      expect(json.data.geometry.coordinates).toEqual([
        [75.5620, 26.8420],
        [75.5620, 26.8420],
      ]);
      expect(json.data.properties.distance_meters).toBe(0);
    });
  });

  describe("2. Branching & Shortest Path Decisions", () => {
    it("chooses direct road over scenic detour to Central Plaza", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5620&fromLat=26.8420&toRoomId=30000000-0000-4000-8000-000000000004`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(310.0);
      expect(json.data.geometry.coordinates).toHaveLength(3);
    });
  });

  describe("3. Accessibility Routing (Stairs vs. Ramp)", () => {
    it("takes 90m stairs shortcut when accessible is false", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5640&fromLat=26.8440&toRoomId=30000000-0000-4000-8000-000000000008&accessible=false`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(90.0);
      expect(json.data.geometry.coordinates).toEqual([
        [75.5640, 26.8440],
        [75.5642, 26.8447],
        [75.5645, 26.8455],
      ]);
    });

    it("takes 140m ramp bypass when accessible is true", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5640&fromLat=26.8440&toRoomId=30000000-0000-4000-8000-000000000008&accessible=true`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(140.0);
      expect(json.data.geometry.coordinates).toEqual([
        [75.5640, 26.8440],
        [75.5649, 26.8448],
        [75.5645, 26.8455],
      ]);
    });
  });

  describe("4. Pairwise Routability Across All 7 Phase-0 Destinations", () => {
    it("calculates deterministic routes for every destination pair", async () => {
      for (const src of SYNTHETIC_DESTINATIONS) {
        const srcNode = SYNTHETIC_NODES.find((n) => n.id === src.room_id)!;
        for (const tgt of SYNTHETIC_DESTINATIONS) {
          if (src.id === tgt.id) continue;

          const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${srcNode.lng}&fromLat=${srcNode.lat}&toRoomId=${tgt.room_id}`;
          const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

          expect(res.status).toBe(200);
          const json = await res.json();

          expect(json.data.type).toBe("Feature");
          expect(json.data.geometry.type).toBe("LineString");
          expect(json.data.properties.distance_meters).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("5. Global /api/route Endpoint", () => {
    it("routes via fallback /api/route endpoint with valid coordinates", async () => {
      const url = `http://localhost/api/route?fromLng=75.5620&fromLat=26.8420&toRoomId=30000000-0000-4000-8000-000000000003`;
      const res = await getGlobalRoute(createRequest(url));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(235.0);
    });
  });

  describe("6. Error and Boundary Conditions", () => {
    it("returns 400 when missing required parameters", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(400);
    });

    it("returns 404 when coordinates are outside campus bounds", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=70.0000&fromLat=20.0000&toRoomId=30000000-0000-4000-8000-000000000003`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Location is outside campus bounds");
    });

    it("returns 404 when no node is within 50m search radius", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5695&fromLat=26.8495&toRoomId=30000000-0000-4000-8000-000000000003`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Could not find a valid starting location nearby");
    });

    it("returns 404 when destination room does not exist in graph", async () => {
      const fakeRoomId = "99999999-9999-4999-8999-999999999999";
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=75.5620&fromLat=26.8420&toRoomId=${fakeRoomId}`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Could not find a valid route to the destination");
    });
  });
});
