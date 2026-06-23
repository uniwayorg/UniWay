import { sql } from "@/lib/db";
import { z } from "zod";
import { RoutingEdgeSchema, type RoutingEdge } from "@/lib/schemas/db";

/**
 * The core Data Contract for Track B.
 * Fetches all routing edges that belong to rooms within a specific campus.
 * 
 * @param campusId The UUID of the campus
 * @returns An array of RoutingEdge objects validated by Zod
 */
export async function fetchEdgesFromCampus(campusId: string): Promise<RoutingEdge[]> {
  const result = await sql`
    SELECT 
      e.id, 
      e.source_node_id, 
      e.target_node_id, 
      e.distance_meters, 
      e.is_accessible, 
      e.floor_id,
      ST_AsGeoJSON(e.geom)::json AS geom,
      e.edge_type
    FROM routing_edges e
    JOIN rooms src ON e.source_node_id = src.id
    JOIN buildings b ON src.building_id = b.id
    JOIN rooms tgt ON e.target_node_id = tgt.id
    JOIN buildings tb ON tgt.building_id = tb.id
    WHERE b.campus_id = ${campusId} AND tb.campus_id = ${campusId}
      AND NOT EXISTS (
        SELECT 1 FROM obstruction_reports r
        WHERE r.edge_id = e.id
          AND r.status = 'open'
      )
  `;

  // Enforce the strict schema boundary before passing to Track B
  return z.array(RoutingEdgeSchema).parse(result);
}
