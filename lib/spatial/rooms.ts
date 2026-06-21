import { sql } from "@/lib/db";
import { RoomSchema, type Room } from "@/lib/schemas/db";
import { z } from "zod";

export async function fetchRooms(
  campusId: string,
  buildingId?: string
): Promise<Room[]> {
  const rows = buildingId
    ? await sql`
      SELECT r.*
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      WHERE b.campus_id = ${campusId} AND r.building_id = ${buildingId}
      ORDER BY r.floor ASC, r.name ASC
    `
    : await sql`
      SELECT r.*
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      WHERE b.campus_id = ${campusId}
      ORDER BY r.floor ASC, r.name ASC
    `;

  return z.array(RoomSchema).parse(rows);
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
