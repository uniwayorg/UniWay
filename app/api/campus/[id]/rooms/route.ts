import { NextResponse } from "next/server";
import { fetchRooms } from "@/lib/spatial/rooms";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id: campusId } = await params;
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get("buildingId") ?? undefined;

    const rooms = await fetchRooms(campusId, buildingId);
    return NextResponse.json({ data: rooms });
  } catch (error) {
    console.error("Failed to fetch rooms:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
