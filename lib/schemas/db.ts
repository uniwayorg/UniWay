import { z } from "zod";
import { GeoJSONLineStringSchema, GeoJSONPointSchema, GeoJSONPolygonSchema } from "@/lib/schemas/geojson";

// Base Schema for the Campus
export const CampusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  bounds: GeoJSONPolygonSchema,
});
export type Campus = z.infer<typeof CampusSchema>;

// Base Schema for Buildings
export const BuildingSchema = z.object({
  id: z.string().uuid(),
  campus_id: z.string().uuid(),
  name: z.string(),
  outline: GeoJSONPolygonSchema,
});
export type Building = z.infer<typeof BuildingSchema>;

// Base Schema for Rooms
export const RoomSchema = z.object({
  id: z.string().uuid(),
  building_id: z.string().uuid(),
  floor: z.string(),
  name: z.string(),
  geom: GeoJSONPolygonSchema,
  centroid: GeoJSONPointSchema.optional(),
});
export type Room = z.infer<typeof RoomSchema>;

// THE DATA CONTRACT FOR TRACK B
export const RoutingEdgeSchema = z.object({
  id: z.string().uuid(),
  source_node_id: z.string().uuid(),
  target_node_id: z.string().uuid(),
  distance_meters: z.number().positive(),
  is_accessible: z.boolean(),
  floor_id: z.string(),
  geom: GeoJSONLineStringSchema.nullable().optional(),
  edge_type: z.enum(["corridor", "stairs", "elevator", "door"]).nullable().optional(),
});
export type RoutingEdge = z.infer<typeof RoutingEdgeSchema>;

// POI Schema
export const POISchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
});
export type POI = z.infer<typeof POISchema>;

// POI search result (includes ts_rank + room/building context)
export const POISearchResultSchema = POISchema.extend({
  rank: z.number(),
  floor: z.string(),
  building_id: z.string().uuid(),
  building_name: z.string(),
});
export type POISearchResult = z.infer<typeof POISearchResultSchema>;

// POI suggest result (minimal)
export const POISuggestResultSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
});
export type POISuggestResult = z.infer<typeof POISuggestResultSchema>;

// Campus metadata (campus + buildings + POI counts)
export const CampusMetadataSchema = z.object({
  campus: CampusSchema,
  buildings: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    outline: GeoJSONPolygonSchema,
    floors: z.array(z.string()),
  })),
  poiCounts: z.array(z.object({
    category: z.string(),
    count: z.number(),
  })),
});
export type CampusMetadata = z.infer<typeof CampusMetadataSchema>;

// Obstruction report (DB row)
export const ObstructionReportSchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().uuid().nullable(),
  edge_id: z.string().uuid().nullable(),
  description: z.string(),
  status: z.enum(["open", "resolved", "dismissed"]),
  reported_at: z.date(),
  resolved_at: z.date().nullable(),
});
export type ObstructionReport = z.infer<typeof ObstructionReportSchema>;

// Create obstruction report (POST body)
export const CreateObstructionReportSchema = z.object({
  roomId: z.string().uuid().optional(),
  edgeId: z.string().uuid().optional(),
  description: z.string().min(1).max(1000),
  lng: z.number().min(-180).max(180).optional(),
  lat: z.number().min(-90).max(90).optional(),
}).refine(
  (data) => data.roomId !== undefined || data.edgeId !== undefined,
  { message: "Must provide at least one of roomId or edgeId" }
).refine(
  (data) => {
    const hasLng = data.lng !== undefined;
    const hasLat = data.lat !== undefined;
    return hasLng === hasLat;
  },
  { message: "Both lng and lat must be provided together" }
);
export type CreateObstructionReportInput = z.infer<typeof CreateObstructionReportSchema>;
