import { describe, it, expect, vi, beforeEach } from "vitest";
import { findPoisWithinRadius, findRoomsWithinRadius } from "@/lib/spatial/proximity";
import { sql } from "@/lib/db";
import { mockPoint, mockRoomPolygon } from "./fixtures/geojson";

vi.mock("@/lib/db", () => {
  const sqlMock = vi.fn();
  return { sql: sqlMock };
});

describe("Spatial Queries - Proximity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns nearby rooms within radius", async () => {
    const mockRoom = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      building_id: "987e6543-e21b-12d3-a456-426614174000",
      floor: "1",
      name: "Room 101",
      geom: mockRoomPolygon,
      centroid: mockPoint,
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockRoom]);

    const result = await findRoomsWithinRadius(
      -73.985,
      40.748,
      "111e2222-e89b-12d3-a456-426614174000"
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Room 101");
  });

  it("filters rooms by floor when provided", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await findRoomsWithinRadius(
      -73.985,
      40.748,
      "111e2222-e89b-12d3-a456-426614174000",
      50,
      "2"
    );

    const sqlCallStrings = (sql as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[];
    expect(sqlCallStrings.join("")).toContain("r.floor =");
  });

  it("returns nearby POIs within radius", async () => {
    const mockPoi = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      room_id: "123e4567-e89b-12d3-a456-426614174002",
      name: "CS Lab",
      category: "lab",
      tags: ["computers"],
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockPoi]);

    const result = await findPoisWithinRadius(
      -73.985,
      40.748,
      "111e2222-e89b-12d3-a456-426614174000"
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("CS Lab");
  });

  it("filters POIs by category when provided", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await findPoisWithinRadius(
      -73.985,
      40.748,
      "111e2222-e89b-12d3-a456-426614174000",
      50,
      "lab"
    );

    const sqlCallStrings = (sql as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[];
    expect(sqlCallStrings.join("")).toContain("p.category =");
  });

  it("throws for invalid coordinates", async () => {
    await expect(
      findRoomsWithinRadius(999, 40.748, "111e2222-e89b-12d3-a456-426614174000")
    ).rejects.toThrow("Invalid parameters");
  });
});
