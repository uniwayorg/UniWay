import { sql } from "@/lib/db";
import { POISearchResultSchema, type POISearchResult } from "@/lib/schemas/db";

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

export async function searchPois(
  campusId: string,
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT
): Promise<POISearchResult[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return [];
  }

  const boundedLimit = Math.min(Math.max(limit, 1), MAX_SEARCH_LIMIT);

  const result = await sql`
    SELECT
      p.id,
      p.room_id,
      p.name,
      p.category,
      p.tags,
      ts_rank(p.search_vector, plainto_tsquery('english', ${trimmedQuery})) AS rank
    FROM pois p
    JOIN rooms r ON p.room_id = r.id
    JOIN buildings b ON r.building_id = b.id
    WHERE b.campus_id = ${campusId}
      AND p.search_vector @@ plainto_tsquery('english', ${trimmedQuery})
    ORDER BY rank DESC, p.name ASC
    LIMIT ${boundedLimit}
  `;

  return result.map((row) => POISearchResultSchema.parse(row));
}
