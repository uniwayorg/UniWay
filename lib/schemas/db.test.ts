import { describe, expect, it } from "vitest";
import { QgisRoutingEdgeSchema, RoutingNodesFileSchema } from "./db";

describe("QGIS routing contract", () => {
  it("preserves QGIS IDs and accepts database NULL edge geometry", () => {
    const feature = {
      type: "Feature",
      properties: {
        node_id: "OUT_SPC_0_048",
        nid: 48,
        loc: "SPC",
        node_type: "junction",
        floor_id: "0",
        is_accessible: true,
      },
      geometry: { type: "Point", coordinates: [75.5647543, 26.84506] },
    };
    const file = { type: "FeatureCollection", features: [feature] };
    expect(RoutingNodesFileSchema.parse(file).features[0].properties.node_id)
      .toBe("OUT_SPC_0_048");
    expect(RoutingNodesFileSchema.safeParse({
      ...file,
      features: [{ ...feature, geometry: { type: "Point", coordinates: [181, 26] } }],
    }).success).toBe(false);

    const edge = {
      id: "40000000-0000-4000-8000-000000000001",
      campus_id: "10000000-0000-4000-8000-000000000001",
      source_node_id: "OUT_SPC_0_048",
      target_node_id: "OUT_SPC_0_023",
      distance_meters: 10,
      is_accessible: true,
      floor_id: "0",
      geom: null,
      edge_type: "corridor",
    };
    expect(QgisRoutingEdgeSchema.parse(edge).geom).toBeNull();
    expect(QgisRoutingEdgeSchema.safeParse({ ...edge, source_node_id: edge.id }).success)
      .toBe(false);
    expect(QgisRoutingEdgeSchema.safeParse({ ...edge, distance_meters: 0 }).success)
      .toBe(false);
  });
});
