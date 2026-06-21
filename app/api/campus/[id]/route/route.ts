import { NextResponse } from "next/server";
import { getNearestRoom } from "@/lib/spatial/knn";
import { findShortestPath } from "@/lib/routing/graph";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = withRateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id: campusId } = await params;
    const { searchParams } = new URL(request.url);
    const fromLng = parseFloat(searchParams.get("fromLng") || "");
    const fromLat = parseFloat(searchParams.get("fromLat") || "");
    const toRoomId = searchParams.get("toRoomId");
    const accessible = searchParams.get("accessible") === "true" || searchParams.get("accessibility") === "true";

    if (isNaN(fromLng) || isNaN(fromLat) || !toRoomId) {
      return NextResponse.json({ error: "Missing required parameters (fromLng, fromLat, toRoomId)" }, { status: 400 });
    }

    if (fromLng < -180 || fromLng > 180 || fromLat < -90 || fromLat > 90) {
      return NextResponse.json({ error: "Coordinates out of bounds" }, { status: 400 });
    }

    const startRoom = await getNearestRoom(fromLng, fromLat, campusId);
    if (!startRoom) {
      return NextResponse.json({ error: "Could not find a valid starting location nearby." }, { status: 404 });
    }

    const routeGeoJSON = await findShortestPath(startRoom.id, toRoomId, accessible);

    if (!routeGeoJSON) {
      return NextResponse.json({ error: "Could not find a valid route to the destination." }, { status: 404 });
    }

    return NextResponse.json({ data: routeGeoJSON });
  } catch (error) {
    console.error("Failed to calculate route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
