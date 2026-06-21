import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchRoomCentroidsForCampus,
  getCampusIdForRoom,
} from "@/lib/spatial/rooms";
import { sql } from "@/lib/db";
import { mockPoint } from "./fixtures/geojson";

vi.mock("@/lib/db", () => {
  const sqlMock = vi.fn();
  return { sql: sqlMock };
});

describe("Spatial Queries - Rooms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns campus id for a room", async () => {
    const campusId = "111e2222-e89b-12d3-a456-426614174000";
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ campus_id: campusId }]);

    const result = await getCampusIdForRoom("123e4567-e89b-12d3-a456-426614174001");
    expect(result).toBe(campusId);
  });

  it("returns null when room is not found", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const result = await getCampusIdForRoom("123e4567-e89b-12d3-a456-426614174001");
    expect(result).toBeNull();
  });

  it("builds a centroid map for a campus", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: "room-a", centroid: mockPoint },
      { id: "room-b", centroid: { type: "Point", coordinates: [-73.984, 40.749] } },
      { id: "room-c", centroid: null },
    ]);

    const result = await fetchRoomCentroidsForCampus("111e2222-e89b-12d3-a456-426614174000");

    expect(result.size).toBe(2);
    expect(result.get("room-a")).toEqual([-73.985, 40.748]);
    expect(result.get("room-b")).toEqual([-73.984, 40.749]);
  });
});
