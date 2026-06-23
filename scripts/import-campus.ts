import fs from "fs";
import { sql } from "../lib/db";
import { ImportFeatureCollectionSchema } from "../lib/spatial/import-schemas";
import { validateImportData } from "../lib/spatial/validate";

function parseArgs(): { file: string; name: string } {
  const args = process.argv.slice(2);
  const file = args[args.indexOf("--file") + 1];
  const name = args[args.indexOf("--name") + 1];

  if (!file) {
    console.error("Usage: bun run import:campus -- --file <path> --name <campus_name>");
    process.exit(1);
  }

  return { file, name: name || "Imported Campus" };
}

async function importCampus() {
  const { file, name } = parseArgs();

  console.log(`📄 Reading ${file}...`);
  const raw = fs.readFileSync(file, "utf-8");
  const parsed = JSON.parse(raw);

  console.log("🔍 Validating GeoJSON structure...");
  const fc = ImportFeatureCollectionSchema.parse(parsed);

  console.log("🔍 Validating campus data...");
  const warnings = validateImportData(fc);
  const errors = warnings.filter((w) => w.type === "error");

  for (const w of warnings) {
    const prefix = w.type === "error" ? "❌" : "⚠️";
    console.log(`  ${prefix} ${w.message}`);
  }

  if (errors.length > 0) {
    console.error("❌ Validation failed. Aborting.");
    process.exit(1);
  }

  console.log("🌱 Importing campus data...");
  await sql.begin(async (tx) => {
    const boundsGeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: computeCampusBounds(fc),
    });

    const [campus] = await tx`
      INSERT INTO campuses (name, bounds)
      VALUES (${name}, ST_SetSRID(ST_GeomFromGeoJSON(${boundsGeoJSON}), 4326))
      RETURNING id
    `;

    console.log(`  🏛  Campus ID: ${campus.id}`);

    const buildingMap = new Map<string, string>();
    const roomMap = new Map<string, string>();

    // Insert buildings
    const buildingFeatures = fc.features.filter((f): f is typeof f & { properties: { type: "building"; name: string } } => f.properties.type === "building");
    for (const f of buildingFeatures) {
      const geoJSON = JSON.stringify(f.geometry);
      const [b] = await tx`
        INSERT INTO buildings (campus_id, name, outline)
        VALUES (${campus.id}, ${f.properties.name}, ST_SetSRID(ST_GeomFromGeoJSON(${geoJSON}), 4326))
        RETURNING id
      `;
      buildingMap.set(f.properties.name, b.id);
    }

    // Insert rooms
    const roomFeatures = fc.features.filter((f): f is typeof f & { properties: { type: "room"; name: string; floor: string; building: string } } => f.properties.type === "room");
    for (const f of roomFeatures) {
      const buildingId = buildingMap.get(f.properties.building);
      if (!buildingId) {
        throw new Error(`Building "${f.properties.building}" not found for room "${f.properties.name}"`);
      }
      const geoJSON = JSON.stringify(f.geometry);
      const [r] = await tx`
        INSERT INTO rooms (building_id, floor, name, geom)
        VALUES (${buildingId}, ${f.properties.floor}, ${f.properties.name}, ST_SetSRID(ST_GeomFromGeoJSON(${geoJSON}), 4326))
        RETURNING id
      `;
      roomMap.set(f.properties.name, r.id);
    }

    // Verify rooms are within building outlines (ST_Within)
    for (const f of roomFeatures) {
      const buildingId = buildingMap.get(f.properties.building)!;
      const [check] = await tx`
        SELECT COUNT(*) AS cnt
        FROM rooms r
        JOIN buildings b ON r.building_id = b.id
        WHERE r.name = ${f.properties.name}
          AND b.id = ${buildingId}
          AND ST_Within(r.centroid, b.outline)
      `;
      if (Number(check?.cnt ?? 0) === 0) {
        throw new Error(`Room "${f.properties.name}" is not within building "${f.properties.building}" outline`);
      }
    }

    // Insert corridors
    const corridorFeatures = fc.features.filter((f): f is typeof f & { properties: { type: "corridor"; from: string; to: string; floor: string; is_accessible: boolean; edge_type: string } } => f.properties.type === "corridor");
    for (const f of corridorFeatures) {
      const fromId = roomMap.get(f.properties.from);
      const toId = roomMap.get(f.properties.to);
      if (!fromId) throw new Error(`Corridor references unknown room "${f.properties.from}"`);
      if (!toId) throw new Error(`Corridor references unknown room "${f.properties.to}"`);
      const geoJSON = JSON.stringify(f.geometry);
      await tx`
        INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
        VALUES (${fromId}, ${toId}, ST_Length(ST_SetSRID(ST_GeomFromGeoJSON(${geoJSON}), 4326)::geography), ${f.properties.is_accessible}, ${f.properties.floor}, ST_SetSRID(ST_GeomFromGeoJSON(${geoJSON}), 4326), ${f.properties.edge_type})
      `;
    }

    // Insert POIs
    const poiFeatures = fc.features.filter((f): f is typeof f & { properties: { type: "poi"; name: string; category: string; room: string; tags: string[] } } => f.properties.type === "poi");
    for (const f of poiFeatures) {
      const roomId = roomMap.get(f.properties.room);
      if (!roomId) throw new Error(`POI references unknown room "${f.properties.room}"`);
      await tx`
        INSERT INTO pois (room_id, name, category, tags)
        VALUES (${roomId}, ${f.properties.name}, ${f.properties.category}, ${f.properties.tags})
      `;
    }

    const summary = {
      campus: campus.id,
      name,
      buildings: buildingFeatures.length,
      rooms: roomFeatures.length,
      corridors: corridorFeatures.length,
      pois: poiFeatures.length,
    };

    console.log("\n✅ Import complete!");
    console.log(`  📊 Summary: ${JSON.stringify(summary, null, 4)}`);
  });
}

function computeCampusBounds(fc: { features: { geometry: { type: string; coordinates: unknown } }[] }): number[][][] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const f of fc.features) {
    const coords = extractPositions(f.geometry);
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  if (!Number.isFinite(minLng)) {
    return [[[-73.985, 40.748], [-73.985, 40.749], [-73.984, 40.749], [-73.984, 40.748], [-73.985, 40.748]]];
  }

  return [[[minLng, minLat], [minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat]]];
}

function extractPositions(geom: { type: string; coordinates: unknown }): [number, number][] {
  if (geom.type === "Point") {
    return [geom.coordinates as [number, number]];
  }
  if (geom.type === "LineString") {
    return geom.coordinates as [number, number][];
  }
  if (geom.type === "Polygon") {
    return (geom.coordinates as number[][][]).flat() as [number, number][];
  }
  return [];
}

importCampus().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
