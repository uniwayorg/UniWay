import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEdgesFromCampus } from "@/lib/spatial/edges";
import { RoutingEdgeSchema } from "@/lib/schemas/db";
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
    const validUuid1 = "123e4567-e89b-12d3-a456-426614174001";
    const validUuid2 = "123e4567-e89b-12d3-a456-426614174002";
    const validUuid3 = "123e4567-e89b-12d3-a456-426614174003";

    const mockDbRow = {
      id: validUuid1,
      source_node_id: validUuid2,
      target_node_id: validUuid3,
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

  it("parses edge with geom and edge_type", () => {
    const mockLineString = { type: "LineString", coordinates: [[-73.985, 40.748], [-73.984, 40.749]] };
    const row = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      source_node_id: "123e4567-e89b-12d3-a456-426614174002",
      target_node_id: "123e4567-e89b-12d3-a456-426614174003",
      distance_meters: 10,
      is_accessible: true,
      floor_id: "1",
      geom: mockLineString,
      edge_type: "corridor" as const,
    };
    const parsed = RoutingEdgeSchema.parse(row);
    expect(parsed.geom?.type).toBe("LineString");
    expect(parsed.geom?.coordinates).toHaveLength(2);
    expect(parsed.edge_type).toBe("corridor");
  });

  it("parses edge without geom and edge_type (backward compat)", () => {
    const row = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      source_node_id: "123e4567-e89b-12d3-a456-426614174002",
      target_node_id: "123e4567-e89b-12d3-a456-426614174003",
      distance_meters: 10,
      is_accessible: true,
      floor_id: "1",
    };
    const parsed = RoutingEdgeSchema.parse(row);
    expect(parsed.geom).toBeUndefined();
    expect(parsed.edge_type).toBeUndefined();
  });

  it("rejects invalid edge_type", () => {
    const row = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      source_node_id: "123e4567-e89b-12d3-a456-426614174002",
      target_node_id: "123e4567-e89b-12d3-a456-426614174003",
      distance_meters: 10,
      is_accessible: true,
      floor_id: "1",
      edge_type: "escalator",
    };
    expect(() => RoutingEdgeSchema.parse(row)).toThrow();
  });
});
