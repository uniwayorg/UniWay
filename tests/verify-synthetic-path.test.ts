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

    it("has recorded 7 nodes, 21 edges, and 7 destinations", () => {
      expect(SYNTHETIC_NODES).toHaveLength(7);
      expect(SYNTHETIC_EDGES).toHaveLength(21);
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
      expect(coordMap.size).toBe(7);
      for (const node of SYNTHETIC_NODES) {
        const coords = coordMap.get(node.id);
        expect(coords).toEqual([node.lng, node.lat]);
      }
    });
  });

  describe("3. In-Memory Graph Construction", () => {
    it("builds an undirected graph with 7 nodes and 21 edges when accessibility is not required", () => {
      const graph = buildGraph(routingEdges, false);
      expect(graph.order).toBe(7);
      expect(graph.size).toBe(21);
    });

    it("drops inaccessible edges when accessibility is required", () => {
      const accessibleGraph = buildGraph(routingEdges, true);
      expect(accessibleGraph.order).toBe(7);
      expect(accessibleGraph.size).toBe(20);
    });
  });

  describe("4. Shortest Path Routing on Synthetic Dataset", () => {
    const nodeAB3 = SYNTHETIC_NODES[2].id;
    const nodeDome = SYNTHETIC_NODES[5].id;
    const nodeOldMess = SYNTHETIC_NODES[3].id;

    it("takes the direct shortcut when accessibility is false", () => {
      const graph = buildGraph(routingEdges, false);
      const path = dijkstra.bidirectional(graph, nodeAB3, nodeDome, "distance_meters");

      expect(path).toEqual([nodeAB3, nodeDome]);

      let dist = 0;
      for (let i = 0; i < path!.length - 1; i++) {
        const edge = graph.edge(path![i], path![i + 1]);
        dist += graph.getEdgeAttribute(edge!, "distance_meters");
      }
      expect(dist).toBe(280.0);
    });

    it("takes the accessible bypass when accessibility is required", () => {
      const graph = buildGraph(routingEdges, true);
      const path = dijkstra.bidirectional(graph, nodeAB3, nodeDome, "distance_meters");

      expect(path).toEqual([nodeAB3, nodeOldMess, nodeDome]);

      let dist = 0;
      for (let i = 0; i < path!.length - 1; i++) {
        const edge = graph.edge(path![i], path![i + 1]);
        dist += graph.getEdgeAttribute(edge!, "distance_meters");
      }
      expect(dist).toBe(294.0);
    });

    it("assembles a valid GeoJSON LineString feature from Dijkstra node sequence", () => {
      const graph = buildGraph(routingEdges, false);
      const path = dijkstra.bidirectional(graph, nodeAB3, nodeDome, "distance_meters");

      const feature = assembleRoute(path!, coordMap, 280.0);
      expect(feature).not.toBeNull();
      expect(feature?.type).toBe("Feature");
      expect(feature?.geometry.type).toBe("LineString");
      expect(feature?.geometry.coordinates).toHaveLength(2);
      expect(feature?.properties.distance_meters).toBe(280.0);
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
