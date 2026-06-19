import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEdgesFromCampus } from "@/lib/spatial/edges";
import { sql } from "@/lib/db";

// Mock the postgres sql tag
vi.mock("@/lib/db", () => {
  const sqlMock = vi.fn();
  return { sql: sqlMock };
});

describe("Data Contract - Routing Edges", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array if no edges exist", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const result = await fetchEdgesFromCampus("123e4567-e89b-12d3-a456-426614174000");
    expect(result).toEqual([]);
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it("validates and returns edges correctly", async () => {
    const mockDbRow = {
      id: "edge-1",
      source_node_id: "src-1",
      target_node_id: "tgt-1",
      distance_meters: 10.5,
      is_accessible: true,
      floor_id: "floor-1",
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockDbRow]);

    const result = await fetchEdgesFromCampus("123e4567-e89b-12d3-a456-426614174000");
    
    expect(result.length).toBe(1);
    expect(result[0]).toEqual(mockDbRow);
  });

  it("throws a ZodError if the database returns invalid data shape", async () => {
    const invalidDbRow = {
      id: "edge-1",
      // missing target_node_id
      source_node_id: "src-1",
      distance_meters: -5, // invalid negative distance
      is_accessible: "yes", // invalid boolean
      floor_id: "floor-1",
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([invalidDbRow]);

    await expect(fetchEdgesFromCampus("123e4567-e89b-12d3-a456-426614174000"))
      .rejects.toThrow();
  });
});
