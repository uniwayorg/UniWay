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
  { id: "30000000-0000-4000-8000-000000000001", name: "Academic Block 1 (AB1)", lng: 75.564172, lat: 26.842601, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000002", name: "Academic Block 2 (AB2)", lng: 75.565953, lat: 26.842802, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000003", name: "Academic Block 3 (AB3)", lng: 75.564293, lat: 26.843791, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000004", name: "Old Mess (Food Court)", lng: 75.565352, lat: 26.843022, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000005", name: "Central Library", lng: 75.566790, lat: 26.842477, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000006", name: "Dome Building", lng: 75.565771, lat: 26.841644, type: "entrance" },
  { id: "30000000-0000-4000-8000-000000000007", name: "Lecture Hall Complex (LHC)", lng: 75.564676, lat: 26.844382, type: "entrance" },
];

export const SYNTHETIC_EDGES = [
  { id: "40000000-0000-4000-8000-000000000001", src: SYNTHETIC_NODES[0].id, tgt: SYNTHETIC_NODES[1].id, dist: 178, accessible: true },
  { id: "40000000-0000-4000-8000-000000000002", src: SYNTHETIC_NODES[0].id, tgt: SYNTHETIC_NODES[2].id, dist: 133, accessible: true },
  { id: "40000000-0000-4000-8000-000000000003", src: SYNTHETIC_NODES[0].id, tgt: SYNTHETIC_NODES[3].id, dist: 126, accessible: true },
  { id: "40000000-0000-4000-8000-000000000004", src: SYNTHETIC_NODES[0].id, tgt: SYNTHETIC_NODES[4].id, dist: 260, accessible: true },
  { id: "40000000-0000-4000-8000-000000000005", src: SYNTHETIC_NODES[0].id, tgt: SYNTHETIC_NODES[5].id, dist: 191, accessible: true },
  { id: "40000000-0000-4000-8000-000000000006", src: SYNTHETIC_NODES[0].id, tgt: SYNTHETIC_NODES[6].id, dist: 204, accessible: true },
  { id: "40000000-0000-4000-8000-000000000007", src: SYNTHETIC_NODES[1].id, tgt: SYNTHETIC_NODES[2].id, dist: 198, accessible: true },
  { id: "40000000-0000-4000-8000-000000000008", src: SYNTHETIC_NODES[1].id, tgt: SYNTHETIC_NODES[3].id, dist: 64, accessible: true },
  { id: "40000000-0000-4000-8000-000000000009", src: SYNTHETIC_NODES[1].id, tgt: SYNTHETIC_NODES[4].id, dist: 91, accessible: true },
  { id: "40000000-0000-4000-8000-000000000010", src: SYNTHETIC_NODES[1].id, tgt: SYNTHETIC_NODES[5].id, dist: 130, accessible: true },
  { id: "40000000-0000-4000-8000-000000000011", src: SYNTHETIC_NODES[1].id, tgt: SYNTHETIC_NODES[6].id, dist: 217, accessible: true },
  { id: "40000000-0000-4000-8000-000000000012", src: SYNTHETIC_NODES[2].id, tgt: SYNTHETIC_NODES[3].id, dist: 135, accessible: true },
  { id: "40000000-0000-4000-8000-000000000013", src: SYNTHETIC_NODES[2].id, tgt: SYNTHETIC_NODES[4].id, dist: 288, accessible: true },
  { id: "40000000-0000-4000-8000-000000000014", src: SYNTHETIC_NODES[2].id, tgt: SYNTHETIC_NODES[5].id, dist: 280, accessible: false },
  { id: "40000000-0000-4000-8000-000000000015", src: SYNTHETIC_NODES[2].id, tgt: SYNTHETIC_NODES[6].id, dist: 76, accessible: true },
  { id: "40000000-0000-4000-8000-000000000016", src: SYNTHETIC_NODES[3].id, tgt: SYNTHETIC_NODES[4].id, dist: 155, accessible: true },
  { id: "40000000-0000-4000-8000-000000000017", src: SYNTHETIC_NODES[3].id, tgt: SYNTHETIC_NODES[5].id, dist: 159, accessible: true },
  { id: "40000000-0000-4000-8000-000000000018", src: SYNTHETIC_NODES[3].id, tgt: SYNTHETIC_NODES[6].id, dist: 165, accessible: true },
  { id: "40000000-0000-4000-8000-000000000019", src: SYNTHETIC_NODES[4].id, tgt: SYNTHETIC_NODES[5].id, dist: 137, accessible: true },
  { id: "40000000-0000-4000-8000-000000000020", src: SYNTHETIC_NODES[4].id, tgt: SYNTHETIC_NODES[6].id, dist: 298, accessible: true },
  { id: "40000000-0000-4000-8000-000000000021", src: SYNTHETIC_NODES[5].id, tgt: SYNTHETIC_NODES[6].id, dist: 323, accessible: true },
];

export const SYNTHETIC_DESTINATIONS = [
  { id: "50000000-0000-4000-8000-000000000001", room_id: SYNTHETIC_NODES[0].id, name: "Academic Block 1", category: "academic", tags: ["ab1", "classes", "labs"] },
  { id: "50000000-0000-4000-8000-000000000002", room_id: SYNTHETIC_NODES[1].id, name: "Academic Block 2", category: "academic", tags: ["ab2", "classes", "labs"] },
  { id: "50000000-0000-4000-8000-000000000003", room_id: SYNTHETIC_NODES[2].id, name: "Academic Block 3", category: "academic", tags: ["ab3", "classes", "labs"] },
  { id: "50000000-0000-4000-8000-000000000004", room_id: SYNTHETIC_NODES[3].id, name: "Old Mess (Food Court)", category: "amenity", tags: ["mess", "food court", "cafeteria", "food"] },
  { id: "50000000-0000-4000-8000-000000000005", room_id: SYNTHETIC_NODES[4].id, name: "Library", category: "academic", tags: ["central library", "books", "study", "reading"] },
  { id: "50000000-0000-4000-8000-000000000006", room_id: SYNTHETIC_NODES[5].id, name: "Dome Building", category: "academic", tags: ["dome", "admin", "central"] },
  { id: "50000000-0000-4000-8000-000000000007", room_id: SYNTHETIC_NODES[6].id, name: "Lecture Hall Complex", category: "academic", tags: ["lhc", "lecture hall", "auditorium"] },
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
