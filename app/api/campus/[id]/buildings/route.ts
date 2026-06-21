import { NextResponse } from "next/server";
import { fetchBuildings } from "@/lib/spatial/campus";
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
    const buildings = await fetchBuildings(campusId);
    return NextResponse.json({ data: buildings });
  } catch (error) {
    console.error("Failed to fetch buildings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
