import type { ImportFeatureCollection, ImportFeature } from "./import-schemas";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  feature?: number;
}

function isBuilding(f: ImportFeature): f is ImportFeature & { properties: { type: "building"; name: string } } {
  return f.properties.type === "building";
}

function isRoom(f: ImportFeature): f is ImportFeature & { properties: { type: "room"; name: string; floor: string; building: string } } {
  return f.properties.type === "room";
}

function isCorridor(f: ImportFeature): f is ImportFeature & { properties: { type: "corridor"; from: string; to: string; floor: string } } {
  return f.properties.type === "corridor";
}

function isPoi(f: ImportFeature): f is ImportFeature & { properties: { type: "poi"; name: string; category: string; room: string; tags: string[] } } {
  return f.properties.type === "poi";
}

export function validateImportData(fc: ImportFeatureCollection): ValidationError[] {
  const errors: ValidationError[] = [];

  if (fc.features.length === 0) {
    errors.push({ type: "error", message: "FeatureCollection is empty" });
    return errors;
  }

  const buildings = fc.features.filter(isBuilding);
  const rooms = fc.features.filter(isRoom);
  const corridors = fc.features.filter(isCorridor);
  const pois = fc.features.filter(isPoi);

  if (buildings.length === 0) {
    errors.push({ type: "error", message: "At least one building feature is required" });
    return errors;
  }

  // Validate coordinate bounds
  for (let i = 0; i < fc.features.length; i++) {
    const f = fc.features[i];
    const coords = extractCoords(f);
    for (const [lng, lat] of coords) {
      if (lat < -90 || lat > 90) {
        errors.push({ type: "error", message: `Feature ${i}: latitude ${lat} out of range (-90 to 90)`, feature: i });
      }
      if (lng < -180 || lng > 180) {
        errors.push({ type: "error", message: `Feature ${i}: longitude ${lng} out of range (-180 to 180)`, feature: i });
      }
    }
  }

  // Validate building names are unique
  const buildingNames = new Set<string>();
  for (let i = 0; i < buildings.length; i++) {
    const name = buildings[i].properties.name;
    if (buildingNames.has(name)) {
      errors.push({ type: "error", message: `Duplicate building name: "${name}"`, feature: fc.features.indexOf(buildings[i]) });
    }
    buildingNames.add(name);
  }

  // Validate rooms reference existing buildings
  const roomBuildingPairs = new Set<string>();
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const { name, floor, building } = room.properties;

    if (!buildingNames.has(building)) {
      errors.push({
        type: "error",
        message: `Room "${name}" references unknown building "${building}"`,
        feature: fc.features.indexOf(rooms[i]),
      });
    }

    // Check duplicate room name per building/floor
    const pair = `${building}:${floor}:${name}`;
    if (roomBuildingPairs.has(pair)) {
      errors.push({
        type: "warning",
        message: `Duplicate room name "${name}" in ${building} floor ${floor}`,
        feature: fc.features.indexOf(rooms[i]),
      });
    }
    roomBuildingPairs.add(pair);
  }

  // Validate corridors reference existing rooms
  const roomNames = new Set(rooms.map((r) => r.properties.name));
  for (let i = 0; i < corridors.length; i++) {
    const { from, to } = corridors[i].properties;
    if (!roomNames.has(from)) {
      errors.push({ type: "error", message: `Corridor references unknown room "${from}"`, feature: fc.features.indexOf(corridors[i]) });
    }
    if (!roomNames.has(to)) {
      errors.push({ type: "error", message: `Corridor references unknown room "${to}"`, feature: fc.features.indexOf(corridors[i]) });
    }
  }

  // Validate POIs reference existing rooms
  for (let i = 0; i < pois.length; i++) {
    const room = pois[i].properties.room;
    if (!roomNames.has(room)) {
      errors.push({ type: "error", message: `POI references unknown room "${room}"`, feature: fc.features.indexOf(pois[i]) });
    }
  }

  return errors;
}

function extractCoords(feature: ImportFeature): [number, number][] {
  const g = feature.geometry;
  if (g.type === "Point") {
    return [g.coordinates as [number, number]];
  }
  if (g.type === "LineString") {
    return g.coordinates as [number, number][];
  }
  if (g.type === "Polygon") {
    return g.coordinates.flat() as [number, number][];
  }
  return [];
}
