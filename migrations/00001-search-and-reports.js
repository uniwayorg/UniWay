export async function up(sql) {
  await sql`
    ALTER TABLE pois
    ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (to_tsvector('english', name || ' ' || category)) STORED
  `;

  await sql`CREATE INDEX pois_search_idx ON pois USING GIN (search_vector);`;

  await sql`
    CREATE TABLE obstruction_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
      edge_id UUID REFERENCES routing_edges(id) ON DELETE SET NULL,
      description TEXT NOT NULL CHECK (char_length(description) BETWEEN 1 AND 1000),
      geom GEOMETRY(Point, 4326),
      reported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT obstruction_reports_target_check CHECK (room_id IS NOT NULL OR edge_id IS NOT NULL)
    )
  `;

  await sql`CREATE INDEX obstruction_reports_room_id_idx ON obstruction_reports (room_id);`;
  await sql`CREATE INDEX obstruction_reports_edge_id_idx ON obstruction_reports (edge_id);`;
  await sql`CREATE INDEX obstruction_reports_reported_at_idx ON obstruction_reports (reported_at DESC);`;
}

export async function down(sql) {
  await sql`DROP TABLE obstruction_reports CASCADE;`;
  await sql`DROP INDEX IF EXISTS pois_search_idx;`;
  await sql`ALTER TABLE pois DROP COLUMN IF EXISTS search_vector;`;
}
