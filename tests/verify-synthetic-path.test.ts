import { describe, it, expect } from "vitest";
import {
  SYNTHETIC_CAMPUS_ID,
  SYNTHETIC_BUILDING_ID,
  SYNTHETIC_NODES,
  SYNTHETIC_EDGES,
  SYNTHETIC_DESTINATIONS,
} from "@/scripts/seed-synthetic-phase0";
import { buildGraph } from "@/lib/routing/graph";
import { assembleRoute } from "@/lib/routing/route-assembly";
import { dijkstra } from "graphology-shortest-path";
import type { RoutingEdge } from "@/lib/schemas/db";

describe("UNI-87: Importer and DB Query Path Verification", () => {
  const routingEdges: RoutingEdge[] = SYNTHETIC_EDGES.map((e) => ({
    id: e.id,
    source_node_id: e.src,
    target_node_id: e.tgt,
    distance_meters: e.dist,
    is_accessible: e.accessible,
    floor_id: "0",
  }));

  const coordMap = new Map<string, [number, number]>();
  for (const node of SYNTHETIC_NODES) {
    coordMap.set(node.id, [node.lng, node.lat]);
  }

  describe("1. Synthetic Seed Counts and Integrity", () => {
    it("has exactly 1 synthetic campus and 1 container building", () => {
      expect(SYNTHETIC_CAMPUS_ID).toBeDefined();
      expect(SYNTHETIC_BUILDING_ID).toBeDefined();
    });

    it("has recorded 14 nodes, 17 edges, and 7 destinations", () => {
      expect(SYNTHETIC_NODES).toHaveLength(14);
      expect(SYNTHETIC_EDGES).toHaveLength(17);
      expect(SYNTHETIC_DESTINATIONS).toHaveLength(7);
    });

    it("ensures all 7 destinations map to existing entrance nodes", () => {
      const entranceNodeIds = new Set(
        SYNTHETIC_NODES.filter((n) => n.type === "entrance").map((n) => n.id)
      );

      for (const dest of SYNTHETIC_DESTINATIONS) {
        expect(entranceNodeIds.has(dest.room_id)).toBe(true);
      }
    });
  });

  describe("2. Spatial Validity and Graph Coordinate Verification", () => {
    it("ensures every node has valid coordinate bounds within MUJ region", () => {
      for (const node of SYNTHETIC_NODES) {
        expect(node.lng).toBeGreaterThanOrEqual(75.56);
        expect(node.lng).toBeLessThanOrEqual(75.57);
        expect(node.lat).toBeGreaterThanOrEqual(26.84);
        expect(node.lat).toBeLessThanOrEqual(26.85);
      }
    });

    it("ensures coordinate map resolves all nodes in the graph", () => {
      expect(coordMap.size).toBe(14);
      for (const node of SYNTHETIC_NODES) {
        const coords = coordMap.get(node.id);
        expect(coords).toEqual([node.lng, node.lat]);
      }
    });
  });

  describe("3. In-Memory Graph Construction", () => {
    it("builds an undirected graph with 14 nodes and 17 edges when accessibility is not required", () => {
      const graph = buildGraph(routingEdges, false);
      expect(graph.order).toBe(14);
      expect(graph.size).toBe(17);
    });

    it("drops inaccessible edges (stairs) when accessibility is required", () => {
      const accessibleGraph = buildGraph(routingEdges, true);
      expect(accessibleGraph.order).toBe(13);
      expect(accessibleGraph.size).toBe(15);
    });
  });

  describe("4. Shortest Path Routing on Synthetic Dataset", () => {
    const nodeCentral = "30000000-0000-4000-8000-000000000004";
    const nodeAB1 = "30000000-0000-4000-8000-000000000008";

    it("takes the shorter stairs shortcut when accessibility is false", () => {
      const graph = buildGraph(routingEdges, false);
      const path = dijkstra.bidirectional(graph, nodeCentral, nodeAB1, "distance_meters");

      expect(path).toEqual([
        nodeCentral,
        "30000000-0000-4000-8000-000000000013",
        nodeAB1,
      ]);

      let dist = 0;
      for (let i = 0; i < path!.length - 1; i++) {
        const edge = graph.edge(path![i], path![i + 1]);
        dist += graph.getEdgeAttribute(edge!, "distance_meters");
      }
      expect(dist).toBe(90.0);
    });

    it("takes the ramp bypass when accessibility is required", () => {
      const graph = buildGraph(routingEdges, true);
      const path = dijkstra.bidirectional(graph, nodeCentral, nodeAB1, "distance_meters");

      expect(path).toEqual([
        nodeCentral,
        "30000000-0000-4000-8000-000000000014",
        nodeAB1,
      ]);

      let dist = 0;
      for (let i = 0; i < path!.length - 1; i++) {
        const edge = graph.edge(path![i], path![i + 1]);
        dist += graph.getEdgeAttribute(edge!, "distance_meters");
      }
      expect(dist).toBe(140.0);
    });

    it("assembles a valid GeoJSON LineString feature from Dijkstra node sequence", () => {
      const graph = buildGraph(routingEdges, false);
      const path = dijkstra.bidirectional(graph, nodeCentral, nodeAB1, "distance_meters");

      const feature = assembleRoute(path!, coordMap, 90.0);
      expect(feature).not.toBeNull();
      expect(feature?.type).toBe("Feature");
      expect(feature?.geometry.type).toBe("LineString");
      expect(feature?.geometry.coordinates).toHaveLength(3);
      expect(feature?.properties.distance_meters).toBe(90.0);
    });

    it("verifies routability between all 7 Phase-0 destinations", () => {
      const graph = buildGraph(routingEdges, false);
      const destNodeIds = SYNTHETIC_DESTINATIONS.map((d) => d.room_id);

      for (let i = 0; i < destNodeIds.length; i++) {
        for (let j = i + 1; j < destNodeIds.length; j++) {
          const fromNode = destNodeIds[i];
          const toNode = destNodeIds[j];
          const path = dijkstra.bidirectional(graph, fromNode, toNode, "distance_meters");

          expect(path).not.toBeNull();
          expect(path!.length).toBeGreaterThanOrEqual(2);

          const feature = assembleRoute(path!, coordMap, 100);
          expect(feature?.geometry.coordinates.length).toBe(path!.length);
        }
      }
    });
  });
});
