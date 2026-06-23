// Adds GIST index on obstruction_reports.geom for spatial queries
// (KNN, ST_DWithin) against report locations. This column was created
// in 00001-search-and-reports.js but never indexed.

export async function up(sql) {
  await sql`CREATE INDEX IF NOT EXISTS obstruction_reports_geom_gist ON obstruction_reports USING GIST (geom)`;
}

export async function down(sql) {
  await sql`DROP INDEX IF EXISTS obstruction_reports_geom_gist`;
}
