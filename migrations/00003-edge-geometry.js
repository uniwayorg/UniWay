export async function up(sql) {
  await sql`
    ALTER TABLE routing_edges
      ADD COLUMN geom GEOMETRY(LineString, 4326),
      ADD COLUMN edge_type TEXT NOT NULL DEFAULT 'corridor'
        CHECK (edge_type IN ('corridor', 'stairs', 'elevator', 'door'))
  `;

  await sql`UPDATE routing_edges SET distance_meters = ST_Length(geom::geography) WHERE geom IS NOT NULL`;

  await sql`CREATE INDEX IF NOT EXISTS routing_edges_geom_idx ON routing_edges USING GIST (geom)`;
}

export async function down(sql) {
  await sql`DROP INDEX IF EXISTS routing_edges_geom_idx`;
  await sql`ALTER TABLE routing_edges DROP COLUMN IF EXISTS geom`;
  await sql`ALTER TABLE routing_edges DROP COLUMN IF EXISTS edge_type`;
}
