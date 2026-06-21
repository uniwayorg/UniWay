import { sql } from "@/lib/db";
import { POISearchResultSchema, type POISearchResult } from "@/lib/schemas/db";

const DEFAULT_SEARCH_LIMIT = 20;
const MAX_SEARCH_LIMIT = 50;

export async function searchPois(
  campusId: string,
  query: string,
  limit: number = DEFAULT_SEARCH_LIMIT,
  offset = 0
): Promise<{ results: POISearchResult[]; total: number }> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) {
    return { results: [], total: 0 };
  }

  const boundedLimit = Math.min(Math.max(limit, 1), MAX_SEARCH_LIMIT);

  const result = await sql`
    SELECT
      p.id,
      p.room_id,
      p.name,
      p.category,
      p.tags,
      ts_rank(p.search_vector, plainto_tsquery('english', ${trimmedQuery})) AS rank,
      COUNT(*) OVER() AS total
    FROM pois p
    JOIN rooms r ON p.room_id = r.id
    JOIN buildings b ON r.building_id = b.id
    WHERE b.campus_id = ${campusId}
      AND p.search_vector @@ plainto_tsquery('english', ${trimmedQuery})
    ORDER BY rank DESC, p.name ASC
    LIMIT ${boundedLimit}
    OFFSET ${offset}
  `;

  const total = result.length > 0 ? Number(result[0].total) : 0;
  const results = result.map((row: Record<string, unknown>) => {
    const { total: _total, ...item } = row;
    return POISearchResultSchema.parse(item);
  });

  return { results, total };
}
