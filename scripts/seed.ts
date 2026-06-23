import { sql } from "../lib/db";

export async function seed() {
  await sql.begin(async (tx) => {
    console.log("🌱 Wiping existing data...");
    await tx`DELETE FROM campuses`;

    console.log("🌱 Seeding Campus...");
    const campusGeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.985, 40.748], [-73.985, 40.749], [-73.984, 40.749], [-73.984, 40.748], [-73.985, 40.748]]],
    });

    const [campus] = await tx`
      INSERT INTO campuses (name, bounds)
      VALUES ('Main Campus', ST_SetSRID(ST_GeomFromGeoJSON(${campusGeoJSON}), 4326))
      RETURNING id
    `;

    console.log("🌱 Seeding Buildings...");

    // Engineering Building
    const engBldgGeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9848, 40.7482], [-73.9848, 40.7488], [-73.9842, 40.7488], [-73.9842, 40.7482], [-73.9848, 40.7482]]],
    });
    const [engBldg] = await tx`
      INSERT INTO buildings (campus_id, name, outline)
      VALUES (${campus.id}, 'Engineering Building', ST_SetSRID(ST_GeomFromGeoJSON(${engBldgGeoJSON}), 4326))
      RETURNING id
    `;

    // Science Hall
    const sciBldgGeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9848, 40.7476], [-73.9848, 40.7481], [-73.9842, 40.7481], [-73.9842, 40.7476], [-73.9848, 40.7476]]],
    });
    const [sciBldg] = await tx`
      INSERT INTO buildings (campus_id, name, outline)
      VALUES (${campus.id}, 'Science Hall', ST_SetSRID(ST_GeomFromGeoJSON(${sciBldgGeoJSON}), 4326))
      RETURNING id
    `;

    console.log("🌱 Seeding Rooms...");

    // --- Engineering Building rooms ---
    const eng101GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9847, 40.7483], [-73.9847, 40.7484], [-73.9846, 40.7484], [-73.9846, 40.7483], [-73.9847, 40.7483]]],
    });
    const eng102GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9845, 40.7483], [-73.9845, 40.7484], [-73.9844, 40.7484], [-73.9844, 40.7483], [-73.9845, 40.7483]]],
    });
    const eng103GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9843, 40.7483], [-73.9843, 40.7484], [-73.9842, 40.7484], [-73.9842, 40.7483], [-73.9843, 40.7483]]],
    });
    const eng201GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9847, 40.7485], [-73.9847, 40.7486], [-73.9846, 40.7486], [-73.9846, 40.7485], [-73.9847, 40.7485]]],
    });
    const eng202GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9845, 40.7485], [-73.9845, 40.7486], [-73.9844, 40.7486], [-73.9844, 40.7485], [-73.9845, 40.7485]]],
    });

    const [eng101] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${engBldg.id}, '1', '101', ST_SetSRID(ST_GeomFromGeoJSON(${eng101GeoJSON}), 4326))
      RETURNING id
    `;
    const [eng102] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${engBldg.id}, '1', '102', ST_SetSRID(ST_GeomFromGeoJSON(${eng102GeoJSON}), 4326))
      RETURNING id
    `;
    const [eng103] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${engBldg.id}, '1', '103', ST_SetSRID(ST_GeomFromGeoJSON(${eng103GeoJSON}), 4326))
      RETURNING id
    `;
    const [eng201] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${engBldg.id}, '2', '201', ST_SetSRID(ST_GeomFromGeoJSON(${eng201GeoJSON}), 4326))
      RETURNING id
    `;
    const [eng202] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${engBldg.id}, '2', '202', ST_SetSRID(ST_GeomFromGeoJSON(${eng202GeoJSON}), 4326))
      RETURNING id
    `;

    // --- Science Hall rooms ---
    const sci101GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9847, 40.7477], [-73.9847, 40.7478], [-73.9846, 40.7478], [-73.9846, 40.7477], [-73.9847, 40.7477]]],
    });
    const sci102GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9845, 40.7477], [-73.9845, 40.7478], [-73.9844, 40.7478], [-73.9844, 40.7477], [-73.9845, 40.7477]]],
    });
    const sci201GeoJSON = JSON.stringify({
      type: "Polygon",
      coordinates: [[[-73.9847, 40.7479], [-73.9847, 40.7480], [-73.9846, 40.7480], [-73.9846, 40.7479], [-73.9847, 40.7479]]],
    });

    const [sci101] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${sciBldg.id}, '1', '101', ST_SetSRID(ST_GeomFromGeoJSON(${sci101GeoJSON}), 4326))
      RETURNING id
    `;
    const [sci102] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${sciBldg.id}, '1', '102', ST_SetSRID(ST_GeomFromGeoJSON(${sci102GeoJSON}), 4326))
      RETURNING id
    `;
    const [sci201] = await tx`
      INSERT INTO rooms (building_id, floor, name, geom)
      VALUES (${sciBldg.id}, '2', '201', ST_SetSRID(ST_GeomFromGeoJSON(${sci201GeoJSON}), 4326))
      RETURNING id
    `;

    console.log("🌱 Seeding Routing Edges...");

    function edgeLineString(coords: [number, number][]): string {
      return JSON.stringify({ type: "LineString", coordinates: coords });
    }

    // Engineering Building floor 1 corridor
    await tx`
      INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
      VALUES (${eng101.id}, ${eng102.id}, 10, true, '1', ST_SetSRID(ST_GeomFromGeoJSON(${edgeLineString([[-73.98465, 40.74835], [-73.98445, 40.74835]])}), 4326), 'corridor')
    `;
    await tx`
      INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
      VALUES (${eng102.id}, ${eng103.id}, 8, true, '1', ST_SetSRID(ST_GeomFromGeoJSON(${edgeLineString([[-73.98445, 40.74835], [-73.98425, 40.74835]])}), 4326), 'corridor')
    `;

    // Engineering Building floor 2 corridor
    await tx`
      INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
      VALUES (${eng201.id}, ${eng202.id}, 12, true, '2', ST_SetSRID(ST_GeomFromGeoJSON(${edgeLineString([[-73.98465, 40.74855], [-73.98445, 40.74855]])}), 4326), 'corridor')
    `;

    // Engineering Building stair (not accessible)
    await tx`
      INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
      VALUES (${eng101.id}, ${eng201.id}, 5, false, 'stairs', ST_SetSRID(ST_GeomFromGeoJSON(${edgeLineString([[-73.98465, 40.74835], [-73.98465, 40.74855]])}), 4326), 'stairs')
    `;

    // Engineering Building elevator (accessible)
    await tx`
      INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
      VALUES (${eng102.id}, ${eng202.id}, 5, true, 'elevator', ST_SetSRID(ST_GeomFromGeoJSON(${edgeLineString([[-73.98445, 40.74835], [-73.98445, 40.74855]])}), 4326), 'elevator')
    `;

    // Science Hall floor 1 corridor
    await tx`
      INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
      VALUES (${sci101.id}, ${sci102.id}, 10, true, '1', ST_SetSRID(ST_GeomFromGeoJSON(${edgeLineString([[-73.98465, 40.74775], [-73.98445, 40.74775]])}), 4326), 'corridor')
    `;

    // Science Hall stair (not accessible)
    await tx`
      INSERT INTO routing_edges (source_node_id, target_node_id, distance_meters, is_accessible, floor_id, geom, edge_type)
      VALUES (${sci101.id}, ${sci201.id}, 5, false, 'stairs', ST_SetSRID(ST_GeomFromGeoJSON(${edgeLineString([[-73.98465, 40.74775], [-73.98465, 40.74795]])}), 4326), 'stairs')
    `;

    console.log("🌱 Seeding POIs...");
    const pois = [
      { roomId: eng101.id, name: "CS Lecture Hall", category: "lecture_hall", tags: ["computers", "projector"] },
      { roomId: eng102.id, name: "Physics Lab", category: "lab", tags: ["microscopes", "sensors"] },
      { roomId: eng103.id, name: "Cafeteria", category: "cafeteria", tags: ["food", "seating"] },
      { roomId: eng201.id, name: "Faculty Office", category: "office", tags: ["desk", "meeting"] },
      { roomId: sci101.id, name: "Chemistry Lab", category: "lab", tags: ["fumehood", "beakers"] },
      { roomId: sci102.id, name: "Restroom", category: "restroom", tags: ["accessible"] },
    ];

    for (const poi of pois) {
      await tx`
        INSERT INTO pois (room_id, name, category, tags)
        VALUES (${poi.roomId}, ${poi.name}, ${poi.category}, ${poi.tags})
      `;
    }
  });

  console.log("✅ Seed complete! Campus with 2 buildings, 7 rooms, routing edges, and 6 POIs.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
