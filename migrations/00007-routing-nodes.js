// Ley runs migrations inside a transaction. Do not execute up/down outside one.
export async function up(sql) {
  await sql`
    CREATE TABLE routing_nodes (
      campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
      node_id TEXT NOT NULL,
      nid INTEGER NOT NULL CHECK (nid > 0),
      loc TEXT NOT NULL CHECK (length(trim(loc)) > 0),
      node_type TEXT NOT NULL CHECK (node_type IN ('junction', 'entrance', 'turn')),
      floor_id TEXT NOT NULL CHECK (length(trim(floor_id)) > 0),
      is_accessible BOOLEAN NOT NULL,
      geom GEOMETRY(Point, 4326) NOT NULL,
      PRIMARY KEY (campus_id, node_id),
      UNIQUE (campus_id, nid),
      CHECK (node_id ~ '^OUT_[A-Z0-9_]+_[^_]+_[0-9]{3,}$'),
      CHECK (
        NOT ST_IsEmpty(geom)
        AND ST_X(geom) BETWEEN -180 AND 180
        AND ST_Y(geom) BETWEEN -90 AND 90
      )
    )
  `;
  await sql`CREATE INDEX routing_nodes_geom_idx ON routing_nodes USING GIST (geom)`;
}

export async function down(sql) {
  await sql`LOCK TABLE routing_nodes IN ACCESS EXCLUSIVE MODE`;
  await sql`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM routing_nodes) THEN
        RAISE EXCEPTION 'Cannot roll back populated routing_nodes. Export the data first.';
      END IF;
    END;
    $$
  `;
  await sql`DROP TABLE routing_nodes`;
}
