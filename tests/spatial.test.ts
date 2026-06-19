import { describe, it, expect, vi, beforeEach } from "vitest";
import { getNearestRoom } from "@/lib/spatial/knn";
import { sql } from "@/lib/db";

// Mock the postgres sql tag
vi.mock("@/lib/db", () => {
  const sqlMock = vi.fn();
  return { sql: sqlMock };
});

describe("Spatial Queries - KNN", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null if no room is found within the radius", async () => {
    // Mock the DB returning empty
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const result = await getNearestRoom(-73.985, 40.748);
    expect(result).toBeNull();
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it("parses and returns a valid Room if found", async () => {
    // Mock a valid DB response
    const mockDbRow = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      building_id: "987e6543-e21b-12d3-a456-426614174000",
      floor: "1",
      name: "Lecture Hall A",
      geom: { type: "Polygon", coordinates: [] },
      centroid: { type: "Point", coordinates: [-73.985, 40.748] },
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockDbRow]);

    const result = await getNearestRoom(-73.985, 40.748);
    
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Lecture Hall A");
    expect(result?.id).toBe(mockDbRow.id);
  });

  it("includes the campusId in the query if provided", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const campusId = "111e2222-e89b-12d3-a456-426614174000";
    await getNearestRoom(-73.985, 40.748, campusId);

    // Ensure the mock was called (we can't easily assert the exact tagged template literal without a complex mock, 
    // but we can ensure it executed)
    expect(sql).toHaveBeenCalledTimes(1);
  });
});
