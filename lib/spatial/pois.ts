import { sql } from "@/lib/db";
import { POISchema, type POI } from "@/lib/schemas/db";

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
