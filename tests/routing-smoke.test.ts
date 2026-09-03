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
    it("returns direct route from AB1 to Dome Building", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${SYNTHETIC_NODES[0].lng}&fromLat=${SYNTHETIC_NODES[0].lat}&toRoomId=${SYNTHETIC_NODES[5].id}`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.type).toBe("Feature");
      expect(json.data.geometry.type).toBe("LineString");
      expect(json.data.geometry.coordinates).toEqual([
        [SYNTHETIC_NODES[0].lng, SYNTHETIC_NODES[0].lat],
        [SYNTHETIC_NODES[5].lng, SYNTHETIC_NODES[5].lat],
      ]);
      expect(json.data.properties.distance_meters).toBe(191.0);
    });

    it("returns route across campus to Academic Block 3", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${SYNTHETIC_NODES[0].lng}&fromLat=${SYNTHETIC_NODES[0].lat}&toRoomId=${SYNTHETIC_NODES[2].id}`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
      expect(json.data.properties.distance_meters).toBe(133.0);
    });

    it("returns zero distance valid LineString when start node equals target node", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${SYNTHETIC_NODES[0].lng}&fromLat=${SYNTHETIC_NODES[0].lat}&toRoomId=${SYNTHETIC_NODES[0].id}`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.type).toBe("Feature");
      expect(json.data.geometry.type).toBe("LineString");
      expect(json.data.geometry.coordinates).toEqual([
        [SYNTHETIC_NODES[0].lng, SYNTHETIC_NODES[0].lat],
        [SYNTHETIC_NODES[0].lng, SYNTHETIC_NODES[0].lat],
      ]);
      expect(json.data.properties.distance_meters).toBe(0);
    });
  });

  describe("2. Branching & Shortest Path Decisions", () => {
    it("chooses direct path between AB1 and Old Mess", async () => {
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${SYNTHETIC_NODES[0].lng}&fromLat=${SYNTHETIC_NODES[0].lat}&toRoomId=${SYNTHETIC_NODES[3].id}`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(126.0);
      expect(json.data.geometry.coordinates).toHaveLength(2);
    });
  });

  describe("3. Accessibility Routing (Shortcut vs. Bypass)", () => {
    it("takes 280m direct shortcut when accessible is false", async () => {
      const nodeAB3 = SYNTHETIC_NODES[2];
      const nodeDome = SYNTHETIC_NODES[5];
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${nodeAB3.lng}&fromLat=${nodeAB3.lat}&toRoomId=${nodeDome.id}&accessible=false`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(280.0);
      expect(json.data.geometry.coordinates).toEqual([
        [nodeAB3.lng, nodeAB3.lat],
        [nodeDome.lng, nodeDome.lat],
      ]);
    });

    it("takes 294m bypass when accessible is true", async () => {
      const nodeAB3 = SYNTHETIC_NODES[2];
      const nodeOldMess = SYNTHETIC_NODES[3];
      const nodeDome = SYNTHETIC_NODES[5];
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${nodeAB3.lng}&fromLat=${nodeAB3.lat}&toRoomId=${nodeDome.id}&accessible=true`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(294.0);
      expect(json.data.geometry.coordinates).toEqual([
        [nodeAB3.lng, nodeAB3.lat],
        [nodeOldMess.lng, nodeOldMess.lat],
        [nodeDome.lng, nodeDome.lat],
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
      const url = `http://localhost/api/route?fromLng=${SYNTHETIC_NODES[0].lng}&fromLat=${SYNTHETIC_NODES[0].lat}&toRoomId=${SYNTHETIC_NODES[5].id}`;
      const res = await getGlobalRoute(createRequest(url));

      expect(res.status).toBe(200);
      const json = await res.json();

      expect(json.data.properties.distance_meters).toBe(191.0);
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
      const url = `http://localhost/api/campus/${SYNTHETIC_CAMPUS_ID}/route?fromLng=${SYNTHETIC_NODES[0].lng}&fromLat=${SYNTHETIC_NODES[0].lat}&toRoomId=${fakeRoomId}`;
      const res = await getCampusRoute(createRequest(url), createParams(SYNTHETIC_CAMPUS_ID));

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Could not find a valid route to the destination");
    });
  });
});
