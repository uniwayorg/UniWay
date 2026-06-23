// PostGIS integration validation.
// Run against a real Neon database to verify spatial queries work.
// Usage: bun run validate:spatial

import { sql } from "@/lib/db";

interface ValidationResult {
  name: string;
  passed: boolean;
  detail?: string;
}

async function validate(): Promise<void> {
  console.log("🔍 Running PostGIS integration validation...\n");

  const results: ValidationResult[] = [];

  // 1. PostGIS extension
  try {
    const [row] = await sql`SELECT PostGIS_Version() AS v`;
    results.push({ name: "PostGIS extension", passed: true, detail: row.v });
  } catch (e) {
    results.push({ name: "PostGIS extension", passed: false, detail: String(e) });
  }

  // 2. KNN spatial query (nearest rooms to a point)
  try {
    const [row] = await sql`
      SELECT id, name,
        ST_Distance(centroid, ST_SetSRID(ST_MakePoint(-73.985, 40.748), 4326)::geography) AS dist
      FROM rooms
      ORDER BY centroid <-> ST_SetSRID(ST_MakePoint(-73.985, 40.748), 4326)::geometry
      LIMIT 1
    `;
    results.push({ name: "KNN (centroid <-> point)", passed: true, detail: `nearest: ${row.name}, dist: ${row.dist}m` });
  } catch (e) {
    results.push({ name: "KNN (centroid <-> point)", passed: false, detail: String(e) });
  }

  // 3. ST_DWithin (nearby rooms)
  try {
    const rows = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM rooms
      WHERE ST_DWithin(
        centroid::geography,
        ST_SetSRID(ST_MakePoint(-73.985, 40.748), 4326)::geography,
        50
      )
    `;
    results.push({ name: "ST_DWithin (50m radius)", passed: true, detail: `${rows[0].cnt} rooms within 50m` });
  } catch (e) {
    results.push({ name: "ST_DWithin (50m radius)", passed: false, detail: String(e) });
  }

  // 4. ST_Contains (point-in-polygon)
  try {
    const [row] = await sql`
      SELECT COUNT(*)::int AS cnt
      FROM buildings
      WHERE ST_Contains(
        outline,
        ST_SetSRID(ST_MakePoint(-73.985, 40.748), 4326)
      )
    `;
    results.push({ name: "ST_Contains (point-in-building)", passed: true, detail: `${row.cnt} buildings contain point` });
  } catch (e) {
    results.push({ name: "ST_Contains (point-in-building)", passed: false, detail: String(e) });
  }

  // 5. GeoJSON parsing (ST_AsGeoJSON)
  try {
    const [row] = await sql`
      SELECT ST_AsGeoJSON(centroid)::jsonb AS geojson
      FROM rooms
      LIMIT 1
    `;
    const valid = row.geojson?.type === "Point";
    results.push({ name: "ST_AsGeoJSON output", passed: valid, detail: valid ? `type=${row.geojson.type}` : `unexpected: ${JSON.stringify(row.geojson)}` });
  } catch (e) {
    results.push({ name: "ST_AsGeoJSON output", passed: false, detail: String(e) });
  }

  // 6. Routing edges with geometry
  try {
    const [row] = await sql`
      SELECT ST_AsGeoJSON(geom)::jsonb AS geojson
      FROM routing_edges
      WHERE geom IS NOT NULL
      LIMIT 1
    `;
    const valid = row?.geojson?.type === "LineString";
    results.push({ name: "Edge geometry (LineString)", passed: valid, detail: valid ? `type=${row.geojson.type}` : "no LineString found" });
  } catch (e) {
    results.push({ name: "Edge geometry (LineString)", passed: false, detail: String(e) });
  }

  // 7. Campus bounds
  try {
    const [row] = await sql`
      SELECT ST_AsGeoJSON(bounds)::jsonb AS geojson
      FROM campuses
      LIMIT 1
    `;
    const valid = row?.geojson?.type === "Polygon";
    results.push({ name: "Campus bounds (Polygon)", passed: valid, detail: valid ? "valid Polygon" : `unexpected: ${JSON.stringify(row?.geojson)}` });
  } catch (e) {
    results.push({ name: "Campus bounds (Polygon)", passed: false, detail: String(e) });
  }

  // Print results
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.passed ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}: ${r.detail}`);
    if (r.passed) passed++;
    else failed++;
  }

  console.log(`\n📊 ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);

  await sql.end();
}

validate().catch((e) => {
  console.error("❌ Validation failed:", e);
  process.exit(1);
});
