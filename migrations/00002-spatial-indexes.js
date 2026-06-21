export async function up(sql) {
  await sql`CREATE INDEX IF NOT EXISTS campus_geom_gist ON campuses USING GIST (geom)`;
  await sql`CREATE INDEX IF NOT EXISTS building_geom_gist ON buildings USING GIST (outline)`;
  await sql`CREATE INDEX IF NOT EXISTS room_centroid_gist ON rooms USING GIST (centroid)`;
  await sql`CREATE INDEX IF NOT EXISTS routing_edge_geom_gist ON routing_edges USING GIST (geom)`;
}

export async function down(sql) {
  await sql`DROP INDEX IF EXISTS campus_geom_gist`;
  await sql`DROP INDEX IF EXISTS building_geom_gist`;
  await sql`DROP INDEX IF EXISTS room_centroid_gist`;
  await sql`DROP INDEX IF EXISTS routing_edge_geom_gist`;
}
