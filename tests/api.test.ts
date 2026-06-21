import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCampuses } from "@/app/api/campus/route";
import { GET as getCampusMetadata } from "@/app/api/campus/[id]/route";
import { GET as getBuildings } from "@/app/api/campus/[id]/buildings/route";
import { GET as getRooms } from "@/app/api/campus/[id]/rooms/route";
import { GET as getCampusRoute } from "@/app/api/campus/[id]/route/route";
import { GET as getPois } from "@/app/api/campus/[id]/pois/route";
import { GET as getRoute } from "@/app/api/route/route";
import { sql } from "@/lib/db";
import { getNearestRoom } from "@/lib/spatial/knn";
import { findShortestPath } from "@/lib/routing/graph";

vi.mock("@/lib/db", () => ({
  sql: vi.fn(),
}));

vi.mock("@/lib/spatial/knn", () => ({
  getNearestRoom: vi.fn(),
}));

vi.mock("@/lib/routing/graph", () => ({
  findShortestPath: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: vi.fn().mockReturnValue(null),
}));

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;
const mockGetNearestRoom = getNearestRoom as unknown as ReturnType<typeof vi.fn>;
const mockFindShortestPath = findShortestPath as unknown as ReturnType<typeof vi.fn>;
const req = (url = "http://localhost") => new Request(url);
const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/campus", () => {
    it("returns a list of campuses", async () => {
      const mockCampus = { id: "123e4567-e89b-12d3-a456-426614174000", name: "Main Campus", bounds: { type: "Polygon", coordinates: [] } };
      mockSql.mockResolvedValueOnce([mockCampus]);

      const response = await getCampuses(req());
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].id).toBe(mockCampus.id);
    });

    it("handles errors gracefully", async () => {
      mockSql.mockRejectedValueOnce(new Error("DB Error"));

      const response = await getCampuses(req());
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Internal Server Error");
    });
  });

  describe("GET /api/campus/[id]/pois", () => {
    it("returns a list of POIs", async () => {
      const mockPoi = { id: "123e4567-e89b-12d3-a456-426614174001", room_id: "123e4567-e89b-12d3-a456-426614174002", name: "CS Lab", category: "lab", tags: [] };
      mockSql.mockResolvedValueOnce([mockPoi]);

      const response = await getPois(req(), params("campus-1"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe("CS Lab");
    });

    it("handles errors gracefully", async () => {
      mockSql.mockRejectedValueOnce(new Error("DB Error"));

      const response = await getPois(req(), params("campus-1"));
      expect(response.status).toBe(500);
    });
  });

  describe("GET /api/campus/[id]", () => {
    it("returns 404 if campus not found", async () => {
      mockSql.mockResolvedValueOnce([]);

      const response = await getCampusMetadata(req(), params("123e4567-e89b-12d3-a456-426614174000"));
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/campus/[id]/buildings", () => {
    it("returns buildings for a campus", async () => {
      const mockBuilding = { id: "123e4567-e89b-12d3-a456-426614174001", campus_id: "123e4567-e89b-12d3-a456-426614174000", name: "Engineering Building", outline: null };
      mockSql.mockResolvedValueOnce([mockBuilding]);

      const response = await getBuildings(req(), params("campus-1"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe("Engineering Building");
    });

    it("handles errors gracefully", async () => {
      mockSql.mockRejectedValueOnce(new Error("DB Error"));

      const response = await getBuildings(req(), params("campus-1"));
      expect(response.status).toBe(500);
    });
  });

  describe("GET /api/campus/[id]/rooms", () => {
    it("returns rooms for a campus", async () => {
      const mockRoom = { id: "123e4567-e89b-12d3-a456-426614174002", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "101", geom: null };
      mockSql.mockResolvedValueOnce([mockRoom]);

      const response = await getRooms(req(), params("campus-1"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe("101");
    });

    it("handles errors gracefully", async () => {
      mockSql.mockRejectedValueOnce(new Error("DB Error"));

      const response = await getRooms(req(), params("campus-1"));
      expect(response.status).toBe(500);
    });
  });

  describe("GET /api/campus/[id]/route", () => {
    it("returns 400 if missing parameters", async () => {
      const response = await getCampusRoute(req(), params("campus-1"));
      expect(response.status).toBe(400);
    });

    it("scopes nearest room search to campus", async () => {
      mockGetNearestRoom.mockResolvedValueOnce({ id: "123e4567-e89b-12d3-a456-426614174000", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "Lobby", geom: null });
      mockFindShortestPath.mockResolvedValueOnce({
        type: "Feature",
        properties: { distance_meters: 10 },
        geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      });

      const response = await getCampusRoute(req("http://localhost/api/campus/campus-1/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"), params("campus-1"));
      expect(response.status).toBe(200);

      expect(mockGetNearestRoom).toHaveBeenCalledWith(-73.98, 40.74, "campus-1");
    });
  });

  describe("GET /api/route", () => {
    it("returns 400 if missing parameters", async () => {
      const response = await getRoute(req("http://localhost/api/route"));
      expect(response.status).toBe(400);
    });

    it("returns 400 if coordinates out of bounds", async () => {
      const response = await getRoute(req("http://localhost/api/route?fromLng=999&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(400);
    });

    it("returns 404 if no nearest room found", async () => {
      mockGetNearestRoom.mockResolvedValueOnce(null);
      const response = await getRoute(req("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(404);
    });

    it("returns 200 with route if nearest room is found", async () => {
      mockGetNearestRoom.mockResolvedValueOnce({ id: "123e4567-e89b-12d3-a456-426614174000", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "Lobby", geom: null });
      mockFindShortestPath.mockResolvedValueOnce({
        type: "Feature",
        properties: { distance_meters: 10 },
        geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      });
      const response = await getRoute(req("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.type).toBe("Feature");
    });

    it("returns 404 if no route found", async () => {
      mockGetNearestRoom.mockResolvedValueOnce({ id: "123e4567-e89b-12d3-a456-426614174000", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "Lobby", geom: null });
      mockFindShortestPath.mockResolvedValueOnce(null);
      const response = await getRoute(req("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(404);
    });

    it("handles internal errors", async () => {
      mockGetNearestRoom.mockRejectedValueOnce(new Error("KNN crash"));
      const response = await getRoute(req("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(500);
    });

    it("accepts accessible parameter", async () => {
      mockGetNearestRoom.mockResolvedValueOnce({ id: "123e4567-e89b-12d3-a456-426614174000", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "Lobby", geom: null });
      mockFindShortestPath.mockResolvedValueOnce({
        type: "Feature",
        properties: { distance_meters: 10 },
        geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      });
      const response = await getRoute(req("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123&accessible=true"));
      expect(response.status).toBe(200);
    });
  });
});
