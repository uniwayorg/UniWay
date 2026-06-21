import { NextResponse } from "next/server";
import { fetchCampuses } from "@/lib/spatial/campus";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const campuses = await fetchCampuses();
    return NextResponse.json(
      { data: campuses },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    return apiError(error, "Failed to fetch campuses", request);
  }
}
