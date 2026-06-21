import { sql } from "@/lib/db";
import { POISchema, type POI } from "@/lib/schemas/db";

export async function fetchPois(
  campusId: string,
  offset = 0,
  limit = 20
): Promise<{ pois: POI[]; total: number }> {
  const rows = await sql`
    SELECT p.*, COUNT(*) OVER() AS total
    FROM pois p
    JOIN rooms r ON p.room_id = r.id
    JOIN buildings b ON r.building_id = b.id
    WHERE b.campus_id = ${campusId}
    ORDER BY p.name ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const total = rows.length > 0 ? Number(rows[0].total) : 0;
  const pois = rows.map((row: Record<string, unknown>) => {
    const { total: _total, ...poi } = row;
    return POISchema.parse(poi);
  });

  return { pois, total };
}
