import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("*/api/campus", () =>
    HttpResponse.json({
      data: [
        { id: "123e4567-e89b-12d3-a456-426614174000", name: "Main Campus", bounds: { type: "Polygon", coordinates: [] } },
      ],
    })
  ),

  http.get("*/api/campus/:id", ({ params }) =>
    HttpResponse.json({
      data: {
        campus: { id: params.id, name: "Main Campus", bounds: { type: "Polygon", coordinates: [] } },
        buildings: [],
        poiCounts: [],
      },
    })
  ),

  http.get("*/api/campus/:id/pois", () =>
    HttpResponse.json({
      data: [
        { id: "123e4567-e89b-12d3-a456-426614174001", room_id: "123e4567-e89b-12d3-a456-426614174002", name: "CS Lab", category: "lab", tags: [] },
      ],
    })
  ),

  http.get("*/api/campus/:id/buildings", () =>
    HttpResponse.json({
      data: [
        { id: "123e4567-e89b-12d3-a456-426614174001", campus_id: "123e4567-e89b-12d3-a456-426614174000", name: "Engineering Building", outline: null },
      ],
    })
  ),

  http.get("*/api/campus/:id/rooms", () =>
    HttpResponse.json({
      data: [
        { id: "123e4567-e89b-12d3-a456-426614174002", building_id: "123e4567-e89b-12d3-a456-426614174001", floor: "1", name: "101", geom: null },
      ],
    })
  ),

  http.get("*/api/campus/:id/route", () =>
    HttpResponse.json({
      data: {
        type: "Feature",
        properties: { distance_meters: 10 },
        geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      },
    })
  ),

  http.get("*/api/route", ({ request }) => {
    const url = new URL(request.url);
    if (!url.searchParams.has("fromLng")) {
      return HttpResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    return HttpResponse.json({
      data: {
        type: "Feature",
        properties: { distance_meters: 10 },
        geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] },
      },
    });
  }),

  http.get("*/api/search", ({ request }) => {
    const url = new URL(request.url);
    if (!url.searchParams.has("q") || !url.searchParams.has("campus")) {
      return HttpResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
    }
    return HttpResponse.json({
      data: [
        { id: "123e4567-e89b-12d3-a456-426614174001", room_id: "123e4567-e89b-12d3-a456-426614174002", name: "CS Lab", category: "lab", tags: ["computers"], rank: 0.12 },
      ],
    });
  }),

  http.post("*/api/report", async ({ request }) => {
    const body = (await request.json()) as { description?: string };
    if (!body.description) {
      return HttpResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    return HttpResponse.json(
      {
        data: { id: "123e4567-e89b-12d3-a456-426614174000", room_id: null, edge_id: null, description: body.description, reported_at: "2026-01-01T00:00:00.000Z" },
      },
      { status: 201 }
    );
  }),
];
