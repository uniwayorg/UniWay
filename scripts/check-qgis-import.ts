import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sql } from "../lib/db";
import { importQgisDataset } from "../lib/spatial/import-qgis";

// Run only against a disposable database with all migrations applied.
assert.equal(process.env.QGIS_IMPORT_TEST, "1", "Set QGIS_IMPORT_TEST=1 for a disposable database");
const read = (name: string) => JSON.parse(readFileSync(`data/muj/${name}.geojson`, "utf8"));
const data = { nodes: read("nodes"), edges: read("edges"), destinations: read("destinations") };
const campusId = crypto.randomUUID();
const otherId = crypto.randomUUID();

try {
  await sql`
    INSERT INTO campuses (id, name, bounds)
    SELECT id, 'QGIS import test', ST_GeomFromText('POLYGON((0 0,0 1,1 1,1 0,0 0))', 4326)
    FROM unnest(${[campusId, otherId]}::uuid[]) id
  `;
  const result = await importQgisDataset(campusId, data);
  assert.equal(result.warnings.length, 3);
  await importQgisDataset(campusId, data);
  await importQgisDataset(otherId, data);
  const nodes = await sql`
    SELECT node_id, nid, loc, node_type, floor_id, is_accessible, ST_AsGeoJSON(geom, 15)::json AS geometry
    FROM routing_nodes WHERE campus_id = ${campusId}
  `;
  const edges = await sql`
    SELECT edge_id, source_node_id, target_node_id, distance_meters, is_accessible, floor_id, edge_type,
      ST_AsGeoJSON(geom, 15)::json AS geometry FROM routing_node_edges WHERE campus_id = ${campusId}
  `;
  const destinations = await sql`
    SELECT id, name, type, routing_node_id, ST_AsGeoJSON(geom, 15)::json AS geometry
    FROM routing_destinations WHERE campus_id = ${campusId}
  `;
  for (const [features, rows, key] of [
    [data.nodes.features, nodes, "node_id"],
    [data.edges.features, edges, "edge_id"],
    [data.destinations.features, destinations, "id"],
  ] as const) {
    assert.equal(rows.length, features.length);
    for (const feature of features) {
      assert.deepEqual(rows.find(row => row[key] === feature.properties[key]), {
        ...feature.properties, geometry: feature.geometry,
      });
    }
  }
  await assert.rejects(importQgisDataset(crypto.randomUUID(), data), /does not exist/);
  // Invalid identities must be rejected without changing other records.
  const conflicting = structuredClone(data);
  conflicting.nodes.features[0].properties.nid = data.nodes.features[1].properties.nid;
  await assert.rejects(importQgisDataset(campusId, conflicting), /Duplicate nid/);
  await sql`
    INSERT INTO routing_nodes (campus_id, node_id, nid, loc, node_type, floor_id, is_accessible, geom)
    VALUES (${otherId}, 'OUT_TEST_0_999', 999, 'TEST', 'junction', '0', true, ST_SetSRID(ST_MakePoint(0, 0), 4326))
  `;
  await assert.rejects(sql`
    UPDATE routing_node_edges SET source_node_id = 'OUT_TEST_0_999'
    WHERE campus_id = ${campusId} AND edge_id = 'E00001'
  `, /foreign key constraint/);
  const [count] = await sql`SELECT count(*)::int AS n FROM routing_nodes WHERE campus_id = ${otherId}`;
  assert.equal(count.n, 119);
  console.log("QGIS import passed: exact round-trip of 118 nodes, 153 edges and 7 destinations; repeat import and campus isolation.");
} finally {
  await sql`DELETE FROM campuses WHERE id IN (${campusId}, ${otherId})`;
  await sql.end();
}
