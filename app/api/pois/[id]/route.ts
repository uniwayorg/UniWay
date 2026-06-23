import { fetchPoiById } from "@/lib/spatial/pois";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, notFound, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id: poiId } = await params;
    const poi = await fetchPoiById(poiId);

    if (!poi) {
      return notFound("POI not found", undefined, request);
    }

    return successResponse(poi, 200, 300);
  } catch (error) {
    return apiError(error, "Failed to fetch POI details", request);
  }
}
