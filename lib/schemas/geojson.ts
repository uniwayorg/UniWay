import { z } from "zod";

const PositionSchema = z.array(z.number()).min(2).max(3);

export const GeoJSONPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: PositionSchema,
});
export type GeoJSONPoint = z.infer<typeof GeoJSONPointSchema>;

export const GeoJSONPolygonSchema = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(PositionSchema)),
});
export type GeoJSONPolygon = z.infer<typeof GeoJSONPolygonSchema>;

export const GeoJSONLineStringSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(PositionSchema),
});
export type GeoJSONLineString = z.infer<typeof GeoJSONLineStringSchema>;

export const GeoJSONGeometrySchema = z.discriminatedUnion("type", [
  GeoJSONPointSchema,
  GeoJSONPolygonSchema,
  GeoJSONLineStringSchema,
]);
export type GeoJSONGeometry = z.infer<typeof GeoJSONGeometrySchema>;
