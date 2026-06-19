import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getCampuses } from "@/app/api/campus/route";
import { GET as getPois } from "@/app/api/campus/[id]/pois/route";
import { GET as getRoute } from "@/app/api/route/route";
import { sql } from "@/lib/db";
import { getNearestRoom } from "@/lib/spatial/knn";

// Mock dependencies
vi.mock("@/lib/db", () => ({
  sql: vi.fn(),
}));

vi.mock("@/lib/spatial/knn", () => ({
  getNearestRoom: vi.fn(),
}));

describe("API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/campus", () => {
    it("returns a list of campuses", async () => {
      const mockCampus = { id: "123e4567-e89b-12d3-a456-426614174000", name: "Main Campus", bounds: "01030000000100000005000000" };
      (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockCampus]);

      const response = await getCampuses();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
      expect(json.data[0].id).toBe(mockCampus.id);
    });

    it("handles errors gracefully", async () => {
      (sql as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("DB Error"));
      
      const response = await getCampuses();
      const json = await response.json();
      
      expect(response.status).toBe(500);
      expect(json.error).toBe("Internal Server Error");
    });
  });

  describe("GET /api/campus/[id]/pois", () => {
    it("returns a list of POIs", async () => {
      const mockPoi = { id: "123e4567-e89b-12d3-a456-426614174001", room_id: "123e4567-e89b-12d3-a456-426614174002", name: "CS Lab", category: "lab", tags: [] };
      (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockPoi]);

      const response = await getPois(new Request("http://localhost"), { params: Promise.resolve({ id: "campus-1" }) });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveLength(1);
    });

    it("handles errors gracefully", async () => {
      (sql as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("DB Error"));
      
      const response = await getPois(new Request("http://localhost"), { params: Promise.resolve({ id: "campus-1" }) });
      expect(response.status).toBe(500);
    });
  });

  describe("GET /api/route", () => {
    it("returns 400 if missing parameters", async () => {
      const response = await getRoute(new Request("http://localhost/api/route"));
      expect(response.status).toBe(400);
    });

    it("returns 404 if no nearest room found", async () => {
      (getNearestRoom as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(404);
    });

    it("returns 200 with placeholder if nearest room is found", async () => {
      (getNearestRoom as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "start-room-123", name: "Lobby" });
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.data.type).toBe("Feature");
    });
    
    it("handles internal errors", async () => {
      (getNearestRoom as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("KNN crash"));
      const response = await getRoute(new Request("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=room123"));
      expect(response.status).toBe(500);
    });
  });
});
