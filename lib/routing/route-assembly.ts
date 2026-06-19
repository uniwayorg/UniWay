export interface GeoJSONLineStringFeature {
  type: "Feature";
  properties: {
    distance_meters: number;
  };
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
}

export function assembleRoute(
  pathNodeIds: string[],
  coordMap: Map<string, [number, number]>,
  totalDistance: number
): GeoJSONLineStringFeature | null {
  if (!pathNodeIds || pathNodeIds.length === 0) {
    return null;
  }

  const coordinates: [number, number][] = [];
  
  for (const nodeId of pathNodeIds) {
    const coords = coordMap.get(nodeId);
    if (coords) {
      coordinates.push(coords);
    }
  }

  if (coordinates.length === 1) {
    coordinates.push([coordinates[0][0], coordinates[0][1]]);
  }

  if (coordinates.length < 2) {
    return null;
  }

  return {
    type: "Feature",
    properties: {
      distance_meters: Number(totalDistance.toFixed(2))
    },
    geometry: {
      type: "LineString",
      coordinates
    }
  };
}
