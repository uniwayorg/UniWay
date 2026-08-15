import { UndirectedGraph } from "graphology";
import { dijkstra } from "graphology-shortest-path";
import { fetchEdgesFromCampus } from "@/lib/spatial/edges";
import { fetchRoomCentroidsForCampus, getCampusIdForRoom } from "@/lib/spatial/rooms";
import { routeCache } from "@/lib/cache";
import { assembleRoute, type GeoJSONLineStringFeature } from "./route-assembly";
import type { RoutingEdge } from "@/lib/schemas/db";

export function buildGraph(edges: RoutingEdge[], accessibilityRequired: boolean): UndirectedGraph {
  const graph = new UndirectedGraph();

  for (const edge of edges) {
    if (accessibilityRequired && !edge.is_accessible) {
      continue;
    }

    const { source_node_id, target_node_id, distance_meters } = edge;

    if (!graph.hasNode(source_node_id)) {
      graph.addNode(source_node_id);
    }
    if (!graph.hasNode(target_node_id)) {
      graph.addNode(target_node_id);
    }

    if (!graph.hasEdge(source_node_id, target_node_id)) {
      graph.addEdge(source_node_id, target_node_id, { distance_meters });
    }
  }

  return graph;
}

export async function findShortestPath(
  startRoomId: string,
  toRoomId: string,
  accessible: boolean
): Promise<GeoJSONLineStringFeature | null> {
  const cacheKey = `${startRoomId}:${toRoomId}:${accessible}`;
  const cachedRoute = routeCache.get(cacheKey);
  if (cachedRoute) {
    return cachedRoute;
  }

  const campusId = await getCampusIdForRoom(startRoomId);
  if (!campusId) {
    return null;
  }

  const [edges, coordMap] = await Promise.all([
    fetchEdgesFromCampus(campusId),
    fetchRoomCentroidsForCampus(campusId)
  ]);

  const graph = buildGraph(edges, accessible);

  if (startRoomId === toRoomId) {
    const singleNodePath = [startRoomId];
    const route = assembleRoute(singleNodePath, coordMap, 0);
    if (route) {
      routeCache.set(cacheKey, route);
    }
    return route;
  }

  if (!graph.hasNode(startRoomId) || !graph.hasNode(toRoomId)) {
    return null;
  }

  const path = dijkstra.bidirectional(graph, startRoomId, toRoomId, "distance_meters");
  if (!path) {
    return null;
  }

  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edge = graph.edge(u, v);
    if (edge !== undefined) {
      totalDistance += graph.getEdgeAttribute(edge, "distance_meters");
    }
  }

  const routeFeature = assembleRoute(path, coordMap, totalDistance);
  if (routeFeature) {
    routeCache.set(cacheKey, routeFeature);
  }

  return routeFeature;
}
