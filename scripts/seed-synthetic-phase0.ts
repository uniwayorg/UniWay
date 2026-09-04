import { sql } from "../lib/db";

function pointToPolygon(lng: number, lat: number, delta = 0.00005): string {
  const minX = lng - delta;
  const maxX = lng + delta;
  const minY = lat - delta;
  const maxY = lat + delta;
  return JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY],
      ],
    ],
  });
}

function createBoundaryPolygon(coords: [number, number][]): string {
  return JSON.stringify({
    type: "Polygon",
    coordinates: [coords],
  });
}

export const SYNTHETIC_CAMPUS_ID = "10000000-0000-4000-8000-000000000001";
export const SYNTHETIC_BUILDING_ID = "20000000-0000-4000-8000-000000000001";

export const SYNTHETIC_NODES = [
  { id: "30000000-0000-4000-8000-000000000001", name: "Main Gate Anchor", lng: 75.5620, lat: 26.8420, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000002", name: "Junction South", lng: 75.5630, lat: 26.8425, type: "junction" },
  { id: "30000000-0000-4000-8000-000000000003", name: "Dome Building Anchor", lng: 75.5625, lat: 26.8435, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000004", name: "Junction Central Plaza", lng: 75.5640, lat: 26.8440, type: "junction" },
  { id: "30000000-0000-4000-8000-000000000005", name: "Turn East Promenade", lng: 75.5655, lat: 26.8430, type: "turn" },
  { id: "30000000-0000-4000-8000-000000000006", name: "Old Mess Anchor", lng: 75.5665, lat: 26.8435, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000007", name: "Junction North-East", lng: 75.5660, lat: 26.8450, type: "junction" },
  { id: "30000000-0000-4000-8000-000000000008", name: "Academic Block 1 Anchor", lng: 75.5645, lat: 26.8455, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000009", name: "Library Anchor", lng: 75.5635, lat: 26.8450, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000010", name: "Academic Block 2 Anchor", lng: 75.5625, lat: 26.8460, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000011", name: "Academic Block 3 Anchor", lng: 75.5615, lat: 26.8470, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000012", name: "Lecture Hall Complex Anchor", lng: 75.5670, lat: 26.8465, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000013", name: "Stairs Shortcut Waypoint", lng: 75.5642, lat: 26.8447, type: "turn" },
  { id: "30000000-0000-4000-8000-000000000014", name: "Ramp Bypass Waypoint", lng: 75.5649, lat: 26.8448, type: "turn" },
];

export const SYNTHETIC_EDGES = [
  { id: "40000000-0000-4000-8000-000000000001", src: SYNTHETIC_NODES[0].id, tgt: SYNTHETIC_NODES[1].id, dist: 115.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000002", src: SYNTHETIC_NODES[1].id, tgt: SYNTHETIC_NODES[3].id, dist: 195.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000003", src: SYNTHETIC_NODES[1].id, tgt: SYNTHETIC_NODES[2].id, dist: 120.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000004", src: SYNTHETIC_NODES[2].id, tgt: SYNTHETIC_NODES[3].id, dist: 160.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000005", src: SYNTHETIC_NODES[3].id, tgt: SYNTHETIC_NODES[4].id, dist: 180.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000006", src: SYNTHETIC_NODES[4].id, tgt: SYNTHETIC_NODES[5].id, dist: 110.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000007", src: SYNTHETIC_NODES[5].id, tgt: SYNTHETIC_NODES[6].id, dist: 175.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000008", src: SYNTHETIC_NODES[6].id, tgt: SYNTHETIC_NODES[7].id, dist: 160.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000009", src: SYNTHETIC_NODES[6].id, tgt: SYNTHETIC_NODES[11].id, dist: 190.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000010", src: SYNTHETIC_NODES[3].id, tgt: SYNTHETIC_NODES[8].id, dist: 125.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000011", src: SYNTHETIC_NODES[8].id, tgt: SYNTHETIC_NODES[9].id, dist: 150.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000012", src: SYNTHETIC_NODES[9].id, tgt: SYNTHETIC_NODES[10].id, dist: 155.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000013", src: SYNTHETIC_NODES[7].id, tgt: SYNTHETIC_NODES[9].id, dist: 210.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000014", src: SYNTHETIC_NODES[3].id, tgt: SYNTHETIC_NODES[12].id, dist: 45.0, accessible: false },
  { id: "40000000-0000-4000-8000-000000000015", src: SYNTHETIC_NODES[12].id, tgt: SYNTHETIC_NODES[7].id, dist: 45.0, accessible: false },
  { id: "40000000-0000-4000-8000-000000000016", src: SYNTHETIC_NODES[3].id, tgt: SYNTHETIC_NODES[13].id, dist: 70.0, accessible: true },
  { id: "40000000-0000-4000-8000-000000000017", src: SYNTHETIC_NODES[13].id, tgt: SYNTHETIC_NODES[7].id, dist: 70.0, accessible: true },
];

export const SYNTHETIC_DESTINATIONS = [
  { id: "50000000-0000-4000-8000-000000000001", room_id: SYNTHETIC_NODES[7].id, name: "Academic Block 1", category: "academic", tags: ["ab1", "classes", "labs"] },
  { id: "50000000-0000-4000-8000-000000000002", room_id: SYNTHETIC_NODES[9].id, name: "Academic Block 2", category: "academic", tags: ["ab2", "classes", "labs"] },
  { id: "50000000-0000-4000-8000-000000000003", room_id: SYNTHETIC_NODES[10].id, name: "Academic Block 3", category: "academic", tags: ["ab3", "classes", "labs"] },
  { id: "50000000-0000-4000-8000-000000000004", room_id: SYNTHETIC_NODES[5].id, name: "Old Mess (Food Court)", category: "amenity", tags: ["mess", "food court", "cafeteria", "food"] },
  { id: "50000000-0000-4000-8000-000000000005", room_id: SYNTHETIC_NODES[8].id, name: "Library", category: "academic", tags: ["central library", "books", "study", "reading"] },
  { id: "50000000-0000-4000-8000-000000000006", room_id: SYNTHETIC_NODES[2].id, name: "Dome Building", category: "academic", tags: ["dome", "admin", "central"] },
  { id: "50000000-0000-4000-8000-000000000007", room_id: SYNTHETIC_NODES[11].id, name: "Lecture Hall Complex", category: "academic", tags: ["lhc", "lecture hall", "auditorium"] },
];

export async function seedSyntheticPhase0() {
  await sql.begin(async (tx) => {
    console.log("Resetting existing campus data...");
    await tx`DELETE FROM campuses WHERE id = ${SYNTHETIC_CAMPUS_ID} OR name = 'MUJ Synthetic Campus'`;

    console.log("Inserting Synthetic Campus...");
    const campusBounds = createBoundaryPolygon([
      [75.560, 26.840],
      [75.570, 26.840],
      [75.570, 26.850],
      [75.560, 26.850],
      [75.560, 26.840],
    ]);

    await tx`
      INSERT INTO campuses (id, name, bounds)
      VALUES (
        ${SYNTHETIC_CAMPUS_ID},
        'MUJ Synthetic Campus',
        ST_SetSRID(ST_GeomFromGeoJSON(${campusBounds}), 4326)
      )
    `;

    console.log("Inserting Outdoor Grounds Container Building...");
    const buildingBounds = createBoundaryPolygon([
      [75.561, 26.841],
      [75.569, 26.841],
      [75.569, 26.849],
      [75.561, 26.849],
      [75.561, 26.841],
    ]);

    await tx`
      INSERT INTO buildings (id, campus_id, name, outline)
      VALUES (
        ${SYNTHETIC_BUILDING_ID},
        ${SYNTHETIC_CAMPUS_ID},
        'Outdoor Grounds',
        ST_SetSRID(ST_GeomFromGeoJSON(${buildingBounds}), 4326)
      )
    `;

    console.log(`Inserting ${SYNTHETIC_NODES.length} Synthetic Outdoor Nodes...`);
    for (const node of SYNTHETIC_NODES) {
      const nodePolygon = pointToPolygon(node.lng, node.lat);
      await tx`
        INSERT INTO rooms (id, building_id, floor, name, geom)
        VALUES (
          ${node.id},
          ${SYNTHETIC_BUILDING_ID},
          '0',
          ${node.name},
          ST_SetSRID(ST_GeomFromGeoJSON(${nodePolygon}), 4326)
        )
      `;
    }

    console.log(`Inserting ${SYNTHETIC_EDGES.length} Synthetic Walkable Edges...`);
    for (const edge of SYNTHETIC_EDGES) {
      await tx`
        INSERT INTO routing_edges (id, source_node_id, target_node_id, distance_meters, is_accessible, floor_id)
        VALUES (
          ${edge.id},
          ${edge.src},
          ${edge.tgt},
          ${edge.dist},
          ${edge.accessible},
          '0'
        )
      `;
    }

    console.log(`Inserting ${SYNTHETIC_DESTINATIONS.length} Phase-0 Destinations (POIs)...`);
    for (const poi of SYNTHETIC_DESTINATIONS) {
      await tx`
        INSERT INTO pois (id, room_id, name, category, tags)
        VALUES (
          ${poi.id},
          ${poi.room_id},
          ${poi.name},
          ${poi.category},
          ${poi.tags}::text[]
        )
      `;
    }
  });

  console.log("Synthetic Phase-0 dataset seeded successfully.");
}

if (import.meta.main || process.argv[1]?.endsWith("seed-synthetic-phase0.ts")) {
  seedSyntheticPhase0()
    .then(() => {
      console.log("Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Synthetic seeding failed:", err);
      process.exit(1);
    });
}
