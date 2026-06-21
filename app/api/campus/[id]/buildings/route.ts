import { fetchBuildings } from "@/lib/spatial/campus";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, successResponse } from "@/lib/api-response";

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
    return successResponse(buildings, 200, 300);
  } catch (error) {
    return apiError(error, "Failed to fetch buildings", request);
  }
}
