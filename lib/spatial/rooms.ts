import { sql } from "@/lib/db";
import { RoomSchema, type Room } from "@/lib/schemas/db";
import { z } from "zod";

const RoomListItemSchema = z.object({
  id: z.string().uuid(),
  building_id: z.string().uuid(),
  floor: z.string(),
  name: z.string(),
});
type RoomListItem = z.infer<typeof RoomListItemSchema>;

export async function fetchRooms(
  campusId: string,
  buildingId?: string,
  offset = 0,
  limit = 20
): Promise<{ rooms: RoomListItem[]; total: number }> {
  const buildingFilter = buildingId ? sql`AND r.building_id = ${buildingId}` : sql``;

  const rows = await sql`
    SELECT r.id, r.building_id, r.floor, r.name, COUNT(*) OVER() AS total
    FROM rooms r
    JOIN buildings b ON r.building_id = b.id
    WHERE b.campus_id = ${campusId} ${buildingFilter}
    ORDER BY r.floor ASC, r.name ASC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const total = rows.length > 0 ? Number(rows[0].total) : 0;
  const rooms = rows.map((row: Record<string, unknown>) => {
    const { total: _total, ...room } = row;
    return RoomListItemSchema.parse(room);
  });

  return { rooms, total };
}

export async function getCampusIdForRoom(roomId: string): Promise<string | null> {
  const result = await sql`
    SELECT b.campus_id
    FROM rooms r
    JOIN buildings b ON r.building_id = b.id
    WHERE r.id = ${roomId}
  `;

  return result[0]?.campus_id ?? null;
}

export async function fetchRoomCentroidsForCampus(
  campusId: string
): Promise<Map<string, [number, number]>> {
  const result = await sql`
    SELECT r.id, ST_AsGeoJSON(r.centroid)::json AS centroid
    FROM rooms r
    JOIN buildings b ON r.building_id = b.id
    WHERE b.campus_id = ${campusId}
  `;

  const map = new Map<string, [number, number]>();
  for (const row of result) {
    if (row.centroid && row.centroid.coordinates) {
      map.set(row.id, row.centroid.coordinates as [number, number]);
    }
  }

  return map;
}
