export async function up(sql) {
  await sql`CREATE INDEX IF NOT EXISTS campus_bounds_gist ON campuses USING GIST (bounds)`;
  await sql`CREATE INDEX IF NOT EXISTS building_outline_gist ON buildings USING GIST (outline)`;
  await sql`CREATE INDEX IF NOT EXISTS room_centroid_gist ON rooms USING GIST (centroid)`;
}

export async function down(sql) {
  await sql`DROP INDEX IF EXISTS campus_bounds_gist`;
  await sql`DROP INDEX IF EXISTS building_outline_gist`;
  await sql`DROP INDEX IF EXISTS room_centroid_gist`;
}
