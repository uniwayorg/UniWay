import { fetchCampusReports } from "@/lib/spatial/reports";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, parsePagination, paginatedResponse } from "@/lib/api-response";

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
    const status = searchParams.get("status") ?? "open";

    const { reports, total } = await fetchCampusReports(campusId, status, pagination.offset, pagination.limit);
    return paginatedResponse(reports, total, pagination);
  } catch (error) {
    return apiError(error, "Failed to fetch campus reports", request);
  }
}
