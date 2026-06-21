import { fetchCampusMetadata } from "@/lib/spatial/campus";
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
    const { id: campusId } = await params;
    const metadata = await fetchCampusMetadata(campusId);

    if (!metadata) {
      return notFound("Campus not found", undefined, request);
    }

    return successResponse(metadata, 200, 300);
  } catch (error) {
    return apiError(error, "Failed to fetch campus metadata", request);
  }
}
