import { fetchPois } from "@/lib/spatial/pois";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, badRequest, parsePagination, paginatedResponse } from "@/lib/api-response";

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
    const pagination = parsePagination(searchParams, 20, 100);
    const rawCategory = searchParams.get("category");
    if (rawCategory !== null && rawCategory.length > 50) {
      return badRequest("category must be at most 50 characters");
    }
    const category = rawCategory ?? undefined;

    const { pois, total } = await fetchPois(campusId, pagination.offset, pagination.limit, category);
    return paginatedResponse(pois, total, pagination);
  } catch (error) {
    return apiError(error, "Failed to fetch POIs", request);
  }
}
