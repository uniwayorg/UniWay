import { NextResponse } from "next/server";
import { fetchCampuses } from "@/lib/spatial/campus";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const campuses = await fetchCampuses();
    return NextResponse.json({ data: campuses });
  } catch (error) {
    console.error("Failed to fetch campuses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
