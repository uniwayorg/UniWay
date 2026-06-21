import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCampuses } from "@/app/api/campus/route";
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

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;
const mockGetNearestRoom = getNearestRoom as unknown as ReturnType<typeof vi.fn>;
const mockFindShortestPath = findShortestPath as unknown as ReturnType<typeof vi.fn>;

describe("API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/campus", () => {
    it("returns a list of campuses", async () => {
      const mockCampus = { id: "123e4567-e89b-12d3-a456-426614174000", name: "Main Campus", bounds: "01030000000100000005000000" };
      mockSql.mockResolvedValueOnce([mockCampus]);

      const response = await getCampuses();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].id).toBe(mockCampus.id);
    });

    it("handles errors gracefully", async () => {
      mockSql.mockRejectedValueOnce(new Error("DB Error"));

      const response = await getCampuses();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("Internal Server Error");
    });
  });

  describe("GET /api/campus/[id]/pois", () => {
    it("returns a list of POIs", async () => {
      const mockPoi = { id: "123e4567-e89b-12d3-a456-426614174001", room_id: "123e4567-e89b-12d3-a456-426614174002", name: "CS Lab", category: "lab", tags: [] };
      mockSql.mockResolvedValueOnce([mockPoi]);

      const response = await getPois(new Request("http://localhost"), { params: Promise.resolve({ id: "campus-1" }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].name).toBe("CS Lab");
    });

    it("handles errors gracefully", async () => {
      mockSql.mockRejectedValueOnce(new Error("DB Error"));

      const response = await getPois(new Request("http://localhost"), { params: Promise.resolve({ id: "campus-1" }) });
      expect(response.status).toBe(500);
    });
  });

  describe("GET /api/route", () => {
    it("returns 400 if missing parameters", async () => {
      const response = await getRoute(new Request("http://localhost/api/route"));
      expect(response.status).toBe(400);
    });

    it("returns 400 if coordinates out of bounds", async () => {
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=999&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(400);
    });

    it("returns 404 if no nearest room found", async () => {
      mockGetNearestRoom.mockResolvedValueOnce(null);
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(404);
    });

    it("returns 200 with route if nearest room is found", async () => {
      mockGetNearestRoom.mockResolvedValueOnce({ id: "123e4567-e89b-12d3-a456-426614174000", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "Lobby", geom: null });
      mockFindShortestPath.mockResolvedValueOnce({
        type: "Feature",
        properties: { distance_meters: 10 },
        geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      });
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.type).toBe("Feature");
    });

    it("returns 404 if no route found", async () => {
      mockGetNearestRoom.mockResolvedValueOnce({ id: "123e4567-e89b-12d3-a456-426614174000", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "Lobby", geom: null });
      mockFindShortestPath.mockResolvedValueOnce(null);
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(404);
    });

    it("handles internal errors", async () => {
      mockGetNearestRoom.mockRejectedValueOnce(new Error("KNN crash"));
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(500);
    });

    it("accepts accessible parameter", async () => {
      mockGetNearestRoom.mockResolvedValueOnce({ id: "123e4567-e89b-12d3-a456-426614174000", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "Lobby", geom: null });
      mockFindShortestPath.mockResolvedValueOnce({
        type: "Feature",
        properties: { distance_meters: 10 },
        geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      });
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123&accessible=true"));
      expect(response.status).toBe(200);
    });
  });
});
