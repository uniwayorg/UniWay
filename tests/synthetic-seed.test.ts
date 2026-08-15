import { describe, it, expect } from "vitest";
import {
  SYNTHETIC_CAMPUS_ID,
  SYNTHETIC_BUILDING_ID,
  SYNTHETIC_NODES,
  SYNTHETIC_EDGES,
  SYNTHETIC_DESTINATIONS,
} from "@/scripts/seed-synthetic-phase0";
import { RoutingEdgeSchema, POISchema } from "@/lib/schemas/db";
import { z } from "zod";

describe("UNI-86: Synthetic Phase-0 Dataset Validation", () => {
  it("has valid deterministic UUIDs for campus and container building", () => {
    const uuidSchema = z.string().uuid();
    expect(uuidSchema.safeParse(SYNTHETIC_CAMPUS_ID).success).toBe(true);
    expect(uuidSchema.safeParse(SYNTHETIC_BUILDING_ID).success).toBe(true);
  });

  it("contains exactly 7 Phase-0 dummy destinations", () => {
    expect(SYNTHETIC_DESTINATIONS).toHaveLength(7);
  });

  it("ensures all 7 destinations map to valid entrance node UUIDs", () => {
    const nodeIds = new Set(SYNTHETIC_NODES.map((n) => n.id));
    for (const dest of SYNTHETIC_DESTINATIONS) {
      expect(nodeIds.has(dest.room_id)).toBe(true);
      const parsed = POISchema.safeParse(dest);
      expect(parsed.success).toBe(true);
    }
  });

  it("ensures all synthetic edges conform strictly to RoutingEdgeSchema", () => {
    const nodeIds = new Set(SYNTHETIC_NODES.map((n) => n.id));
    for (const edge of SYNTHETIC_EDGES) {
      expect(nodeIds.has(edge.src)).toBe(true);
      expect(nodeIds.has(edge.tgt)).toBe(true);

      const routingEdgeObj = {
        id: edge.id,
        source_node_id: edge.src,
        target_node_id: edge.tgt,
        distance_meters: edge.dist,
        is_accessible: edge.accessible,
        floor_id: "0",
      };

      const parsed = RoutingEdgeSchema.safeParse(routingEdgeObj);
      expect(parsed.success).toBe(true);
    }
  });

  it("ensures the synthetic graph contains both accessible and non-accessible routes", () => {
    const accessibleEdges = SYNTHETIC_EDGES.filter((e) => e.accessible);
    const nonAccessibleEdges = SYNTHETIC_EDGES.filter((e) => !e.accessible);

    expect(accessibleEdges.length).toBeGreaterThan(0);
    expect(nonAccessibleEdges.length).toBeGreaterThan(0);
  });
});
