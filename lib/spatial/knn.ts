import { sql } from "@/lib/db";
import { RoomSchema, type Room } from "@/lib/schemas/db";

/**
 * Snaps a given GPS coordinate to the nearest Room centroid within a certain radius.
 * Uses PostGIS `<->` operator for fast GIST index nearest-neighbor search.
 * @param lng Longitude (X)
 * @param lat Latitude (Y)
 * @param campusId (Optional) Restrict search to a specific campus
 * @param maxRadiusMeters Max distance to search (default 50m)
 */
export async function getNearestRoom(
  lng: number,
  lat: number,
  campusId?: string,
  maxRadiusMeters: number = 50
): Promise<Room | null> {
  if (!Number.isFinite(lng) || lng < -180 || lng > 180 || !Number.isFinite(lat) || lat < -90 || lat > 90 || maxRadiusMeters <= 0) {
    throw new Error("Invalid parameters: lng and lat must be valid coordinates, and maxRadiusMeters must be positive.");
  }
  let result;
  
  // The ::geography cast ensures distance is calculated spherically in meters
  if (campusId) {
    result = await sql`
      SELECT r.* 
      FROM rooms r
      JOIN buildings b ON r.building_id = b.id
      WHERE b.campus_id = ${campusId}
        AND ST_DWithin(r.centroid::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${maxRadiusMeters})
      ORDER BY r.centroid <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      LIMIT 1;
    `;
  } else {
    result = await sql`
      SELECT r.* 
      FROM rooms r
      WHERE ST_DWithin(r.centroid::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${maxRadiusMeters})
      ORDER BY r.centroid <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      LIMIT 1;
    `;
  }

  if (result.length === 0) {
    return null;
  }

  // Parse and validate the result coming from the DB
  return RoomSchema.parse(result[0]);
}
