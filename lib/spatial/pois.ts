import { sql } from "@/lib/db";
import { POISchema, type POI } from "@/lib/schemas/db";
import { z } from "zod";

export async function fetchPois(
  campusId: string,
  offset = 0,
  limit = 20
): Promise<{ pois: POI[]; total: number }> {
  const [countRow] = await sql`
    SELECT COUNT(*) AS total
    FROM pois p
    JOIN rooms r ON p.room_id = r.id
    JOIN buildings b ON r.building_id = b.id
    WHERE b.campus_id = ${campusId}
  `;
  const total = Number(countRow?.total ?? 0);

  const rows = await sql`
    SELECT p.*
    FROM pois p
    JOIN rooms r ON p.room_id = r.id
    JOIN buildings b ON r.building_id = b.id
    WHERE b.campus_id = ${campusId}
    ORDER BY p.name ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const pois = rows.map((row: Record<string, unknown>) => POISchema.parse(row));
  return { pois, total };
}

const PoiDetailSchema = POISchema.extend({
  room_name: z.string(),
  floor: z.string(),
  building_id: z.string().uuid(),
  building_name: z.string(),
});
export type PoiDetail = z.infer<typeof PoiDetailSchema>;

export async function fetchPoiById(poiId: string): Promise<PoiDetail | null> {
  const result = await sql`
    SELECT
      p.id,
      p.room_id,
      p.name,
      p.category,
      p.tags,
      r.name AS room_name,
      r.floor,
      b.id AS building_id,
      b.name AS building_name
    FROM pois p
    JOIN rooms r ON p.room_id = r.id
    JOIN buildings b ON r.building_id = b.id
    WHERE p.id = ${poiId}
  `;

  if (result.length === 0) return null;
  return PoiDetailSchema.parse(result[0]);
}
