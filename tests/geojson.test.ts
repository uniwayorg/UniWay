import { describe, it, expect } from "vitest";
import { parseGeoJson, parseOptionalGeoJson } from "@/lib/spatial/geojson";

describe("GeoJSON parsing", () => {
  it("parses GeoJSON objects", () => {
    const geometry = {
      type: "Point" as const,
      coordinates: [-73.985, 40.748],
    };

    expect(parseGeoJson(geometry)).toEqual(geometry);
  });

  it("parses GeoJSON strings", () => {
    const geometry = {
      type: "Polygon" as const,
      coordinates: [
        [
          [-73.985, 40.748],
          [-73.985, 40.749],
          [-73.984, 40.749],
          [-73.984, 40.748],
          [-73.985, 40.748],
        ],
      ],
    };

    expect(parseGeoJson(JSON.stringify(geometry))).toEqual(geometry);
  });

  it("returns undefined for optional nullish values", () => {
    expect(parseOptionalGeoJson(null)).toBeUndefined();
    expect(parseOptionalGeoJson(undefined)).toBeUndefined();
  });
});
