import { GeoJSONGeometrySchema, type GeoJSONGeometry } from "@/lib/schemas/geojson";

export function parseGeoJson(value: unknown): GeoJSONGeometry {
  if (typeof value === "string") {
    return GeoJSONGeometrySchema.parse(JSON.parse(value));
  }

  return GeoJSONGeometrySchema.parse(value);
}

export function parseOptionalGeoJson(value: unknown): GeoJSONGeometry | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  return parseGeoJson(value);
}
