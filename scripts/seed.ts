import { sql } from "../lib/db";

async function seed() {
  console.log("🌱 Wiping existing data...");
  // Cascades to buildings, rooms, routing_edges, and pois
  await sql`DELETE FROM campuses`;

  console.log("🌱 Seeding Campus...");
  const campusGeoJSON = JSON.stringify({
    type: "Polygon",
    coordinates: [[[-73.985, 40.748], [-73.985, 40.749], [-73.984, 40.749], [-73.984, 40.748], [-73.985, 40.748]]]
  });

  const [campus] = await sql`
    INSERT INTO campuses (name, bounds) 
    VALUES ('Main Campus', ST_SetSRID(ST_GeomFromGeoJSON(${campusGeoJSON}), 4326))
    RETURNING id
  `;

  console.log("🌱 Seeding Buildings...");
  const bldgGeoJSON = JSON.stringify({
    type: "Polygon",
    coordinates: [[[-73.9848, 40.7482], [-73.9848, 40.7488], [-73.9842, 40.7488], [-73.9842, 40.7482], [-73.9848, 40.7482]]]
  });

  const [building] = await sql`
    INSERT INTO buildings (campus_id, name, outline) 
    VALUES (${campus.id}, 'Engineering Building', ST_SetSRID(ST_GeomFromGeoJSON(${bldgGeoJSON}), 4326))
    RETURNING id
  `;

  console.log("🌱 Seeding Rooms (Generating Centroids)...");
  const room1GeoJSON = JSON.stringify({
    type: "Polygon",
    coordinates: [[[-73.9847, 40.7483], [-73.9847, 40.7484], [-73.9846, 40.7484], [-73.9846, 40.7483], [-73.9847, 40.7483]]]
  });
  const room2GeoJSON = JSON.stringify({
    type: "Polygon",
    coordinates: [[[-73.9845, 40.7483], [-73.9845, 40.7484], [-73.9844, 40.7484], [-73.9844, 40.7483], [-73.9845, 40.7483]]]
  });

  const [room1] = await sql`
    INSERT INTO rooms (building_id, floor, name, geom) 
    VALUES (${building.id}, '1', 'Room 101', ST_SetSRID(ST_GeomFromGeoJSON(${room1GeoJSON}), 4326))
    RETURNING id
  `;
  const [room2] = await sql`
    INSERT INTO rooms (building_id, floor, name, geom) 
    VALUES (${building.id}, '1', 'Room 102', ST_SetSRID(ST_GeomFromGeoJSON(${room2GeoJSON}), 4326))
    RETURNING id
  `;

  console.log("🌱 Seeding Routing Edges (The Data Contract)...");
  await sql`
    INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id) 
    VALUES (${room1.id}, ${room2.id}, 15.5, true, '1')
  `;

  console.log("🌱 Seeding POIs...");
  await sql`
    INSERT INTO pois (room_id, name, category, tags) 
    VALUES (${room1.id}, 'CS Lecture Hall', 'lecture_hall', ARRAY['computers', 'projector']::text[])
  `;

  console.log("✅ Seed complete! You now have a working Campus, Building, Rooms, Edges, and POIs.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
