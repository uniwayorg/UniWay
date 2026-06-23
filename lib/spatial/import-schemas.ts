import { z } from "zod";

const PositionSchema = z.array(z.number()).min(2).max(3);

const BuildingFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(PositionSchema)) }),
  properties: z.object({
    type: z.literal("building"),
    name: z.string().min(1),
  }),
});

const RoomFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(PositionSchema)) }),
  properties: z.object({
    type: z.literal("room"),
    name: z.string().min(1),
    floor: z.string().min(1),
    building: z.string().min(1),
  }),
});

const CorridorFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({ type: z.literal("LineString"), coordinates: z.array(PositionSchema).min(2) }),
  properties: z.object({
    type: z.literal("corridor"),
    from: z.string().min(1),
    to: z.string().min(1),
    floor: z.string().min(1),
    is_accessible: z.boolean().optional().default(true),
    edge_type: z.enum(["corridor", "stairs", "elevator", "door"]).optional().default("corridor"),
  }),
});

const PoiFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({ type: z.literal("Point"), coordinates: PositionSchema }),
  properties: z.object({
    type: z.literal("poi"),
    name: z.string().min(1),
    category: z.string().min(1),
    room: z.string().min(1),
    tags: z.array(z.string()).optional().default([]),
  }),
});

const ImportFeatureSchema = z.union([
  BuildingFeatureSchema,
  RoomFeatureSchema,
  CorridorFeatureSchema,
  PoiFeatureSchema,
]);

export const ImportFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(ImportFeatureSchema),
});

export type ImportFeatureCollection = z.infer<typeof ImportFeatureCollectionSchema>;
export type BuildingFeature = z.infer<typeof BuildingFeatureSchema>;
export type RoomFeature = z.infer<typeof RoomFeatureSchema>;
export type CorridorFeature = z.infer<typeof CorridorFeatureSchema>;
export type PoiFeature = z.infer<typeof PoiFeatureSchema>;
export type ImportFeature = z.infer<typeof ImportFeatureSchema>;
