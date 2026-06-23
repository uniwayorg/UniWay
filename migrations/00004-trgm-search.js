export async function up(sql) {
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

  await sql`CREATE INDEX IF NOT EXISTS pois_name_trgm_idx ON pois USING GIN (name gin_trgm_ops)`;
}

export async function down(sql) {
  await sql`DROP INDEX IF EXISTS pois_name_trgm_idx`;
}
