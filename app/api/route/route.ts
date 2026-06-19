import { NextResponse } from "next/server";
import { getNearestRoom } from "@/lib/spatial/knn";
// import { findShortestPath } from "@/lib/routing/graph"; // <-- Track B will provide this

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fromLng = parseFloat(searchParams.get("fromLng") || "");
    const fromLat = parseFloat(searchParams.get("fromLat") || "");
    const toRoomId = searchParams.get("toRoomId");
    // Prefix with underscore to satisfy ESLint until Track B is implemented
    const _accessible = searchParams.get("accessible") === "true";

    if (isNaN(fromLng) || isNaN(fromLat) || !toRoomId) {
      return NextResponse.json({ error: "Missing required parameters (fromLng, fromLat, toRoomId)" }, { status: 400 });
    }

    // TRACK A: Snap user GPS coordinate to the nearest Room node using PostGIS
    const startRoom = await getNearestRoom(fromLng, fromLat);
    if (!startRoom) {
      return NextResponse.json({ error: "Could not find a valid starting location nearby." }, { status: 404 });
    }

    // TRACK B: Integration Point
    // Your co-founder will replace this placeholder with their Graphology Dijkstra function:
    // const routeGeoJSON = await findShortestPath(startRoom.id, toRoomId, accessible);
    
    const placeholderResponse = {
      type: "Feature",
      properties: { distance_meters: 0 },
      geometry: { type: "LineString", coordinates: [] }
    };

    return NextResponse.json({ data: placeholderResponse });
  } catch (error) {
    console.error("Failed to calculate route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
