import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCampusMetadata, fetchCampuses, isPointInCampus } from "@/lib/spatial/campus";
import { sql } from "@/lib/db";
import { mockPolygon } from "./fixtures/geojson";

vi.mock("@/lib/db", () => {
  const sqlMock = vi.fn();
  return { sql: sqlMock };
});

describe("Spatial Queries - Campus Metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when campus does not exist", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    const result = await fetchCampusMetadata("123e4567-e89b-12d3-a456-426614174000");
    expect(result).toBeNull();
  });

  it("returns campus metadata with buildings and poi counts", async () => {
    const campusId = "123e4567-e89b-12d3-a456-426614174000";
    const mockCampus = {
      id: campusId,
      name: "Main Campus",
      bounds: mockPolygon,
    };
    const mockBuilding = {
      id: "987e6543-e21b-12d3-a456-426614174000",
      name: "Engineering Building",
      outline: mockPolygon,
      floors: ["1", "2"],
    };
    const mockPoiCounts = [{ category: "lab", count: 3 }];

    (sql as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([mockCampus])
      .mockResolvedValueOnce([mockBuilding])
      .mockResolvedValueOnce(mockPoiCounts);

    const result = await fetchCampusMetadata(campusId);

    expect(result).not.toBeNull();
    expect(result?.campus.name).toBe("Main Campus");
    expect(result?.buildings).toHaveLength(1);
    expect(result?.buildings[0]?.floors).toEqual(["1", "2"]);
    expect(result?.poiCounts).toEqual([{ category: "lab", count: 3 }]);
  });

  it("returns campuses with GeoJSON bounds", async () => {
    const mockCampus = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Main Campus",
      bounds: mockPolygon,
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockCampus]);

    const result = await fetchCampuses();
    expect(result[0]?.bounds.type).toBe("Polygon");
  });

  it("checks whether a point is inside campus bounds", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ inside: true }]);

    const result = await isPointInCampus(-73.985, 40.748, "123e4567-e89b-12d3-a456-426614174000");
    expect(result).toBe(true);
  });
});
