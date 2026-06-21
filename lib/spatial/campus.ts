import { sql } from "@/lib/db";
import { z } from "zod";
import {
  BuildingSchema,
  CampusMetadataSchema,
  CampusSchema,
  type Building,
  type Campus,
  type CampusMetadata,
} from "@/lib/schemas/db";

export async function fetchCampuses(): Promise<Campus[]> {
  const campuses = await sql`
    SELECT
      id,
      name,
      ST_AsGeoJSON(bounds)::json AS bounds
    FROM campuses
    ORDER BY name ASC
  `;

  return campuses.map((campus) => CampusSchema.parse(campus));
}

export async function fetchCampusMetadata(
  campusId: string
): Promise<CampusMetadata | null> {
  const campuses = await sql`
    SELECT
      id,
      name,
      ST_AsGeoJSON(bounds)::json AS bounds
    FROM campuses
    WHERE id = ${campusId}
  `;

  if (campuses.length === 0) {
    return null;
  }

  const [buildings, poiCounts] = await Promise.all([
    sql`
      SELECT
        b.id,
        b.name,
        ST_AsGeoJSON(b.outline)::json AS outline,
        COALESCE(array_agg(DISTINCT r.floor ORDER BY r.floor) FILTER (WHERE r.floor IS NOT NULL), '{}') AS floors
      FROM buildings b
      LEFT JOIN rooms r ON r.building_id = b.id
      WHERE b.campus_id = ${campusId}
      GROUP BY b.id, b.name, b.outline
      ORDER BY b.name ASC
    `,
    sql`
      SELECT p.category, COUNT(*)::int AS count
      FROM pois p
      JOIN rooms r ON p.room_id = r.id
      JOIN buildings b ON r.building_id = b.id
      WHERE b.campus_id = ${campusId}
      GROUP BY p.category
      ORDER BY p.category ASC
    `,
  ]);

  return CampusMetadataSchema.parse({
    campus: CampusSchema.parse(campuses[0]),
    buildings,
    poiCounts,
  });
}

export async function fetchBuildings(campusId: string): Promise<Building[]> {
  const buildings = await sql`
    SELECT
      b.id,
      b.campus_id,
      b.name,
      ST_AsGeoJSON(b.outline)::json AS outline
    FROM buildings b
    WHERE b.campus_id = ${campusId}
    ORDER BY b.name ASC
  `;

  return z.array(BuildingSchema).parse(buildings);
}

export async function findCampusByPoint(
  lng: number,
  lat: number
): Promise<Campus | null> {
  const result = await sql`
    SELECT
      id,
      name,
      ST_AsGeoJSON(bounds)::json AS bounds
    FROM campuses
    WHERE ST_Contains(bounds, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
    LIMIT 1
  `;

  if (result.length === 0) return null;
  return CampusSchema.parse(result[0]);
}

export async function isPointInCampus(
  lng: number,
  lat: number,
  campusId: string
): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM campuses
      WHERE id = ${campusId}
        AND ST_Contains(bounds, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
    ) AS inside
  `;

  return Boolean(result[0]?.inside);
}
