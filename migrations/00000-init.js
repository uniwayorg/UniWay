export async function up(sql) {
  // 1. Enable PostGIS and PGCrypto
  await sql`CREATE EXTENSION IF NOT EXISTS postgis;`;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

  // 2. Core Tables
  await sql`
    CREATE TABLE campuses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      bounds GEOMETRY(Polygon, 4326) NOT NULL
    );
  `;

  await sql`
    CREATE TABLE buildings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campus_id UUID NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      outline GEOMETRY(Polygon, 4326) NOT NULL
    );
  `;

  await sql`
    CREATE TABLE rooms (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
      floor TEXT NOT NULL,
      name TEXT NOT NULL,
      geom GEOMETRY(Polygon, 4326) NOT NULL,
      centroid GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_Centroid(geom)) STORED
    );
  `;

  await sql`
    CREATE TABLE routing_edges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_node_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      target_node_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      distance_meters FLOAT NOT NULL,
      is_accessible BOOLEAN NOT NULL DEFAULT true,
      floor_id TEXT NOT NULL
    );
  `;

  await sql`
    CREATE TABLE pois (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      tags TEXT[] DEFAULT '{}'::text[]
    );
  `;

  // 3. Spatial Indexes (GIST)
  await sql`CREATE INDEX campuses_bounds_idx ON campuses USING GIST (bounds);`;
  await sql`CREATE INDEX buildings_outline_idx ON buildings USING GIST (outline);`;
  await sql`CREATE INDEX rooms_geom_idx ON rooms USING GIST (geom);`;
  await sql`CREATE INDEX rooms_centroid_idx ON rooms USING GIST (centroid);`;

  // 4. B-Tree Indexes for Foreign Keys
  await sql`CREATE INDEX buildings_campus_id_idx ON buildings (campus_id);`;
  await sql`CREATE INDEX rooms_building_id_idx ON rooms (building_id);`;
  await sql`CREATE INDEX routing_edges_source_node_id_idx ON routing_edges (source_node_id);`;
  await sql`CREATE INDEX routing_edges_target_node_id_idx ON routing_edges (target_node_id);`;
  await sql`CREATE INDEX pois_room_id_idx ON pois (room_id);`;
}

export async function down(sql) {
  await sql`DROP TABLE pois CASCADE;`;
  await sql`DROP TABLE routing_edges CASCADE;`;
  await sql`DROP TABLE rooms CASCADE;`;
  await sql`DROP TABLE buildings CASCADE;`;
  await sql`DROP TABLE campuses CASCADE;`;
  await sql`DROP EXTENSION IF EXISTS pgcrypto;`;
  await sql`DROP EXTENSION IF EXISTS postgis;`;
}
