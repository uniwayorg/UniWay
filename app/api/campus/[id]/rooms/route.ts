import { fetchRooms } from "@/lib/spatial/rooms";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, parsePagination, paginatedResponse, badRequest, formatZodError } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RoomsQuerySchema = z.object({
  buildingId: z.string().uuid().optional(),
});

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

    const parsed = RoomsQuerySchema.safeParse({
      buildingId: searchParams.get("buildingId") ?? undefined,
    });

    if (!parsed.success) {
      return badRequest("Invalid buildingId", formatZodError(parsed.error));
    }

    const { rooms, total } = await fetchRooms(campusId, parsed.data.buildingId, pagination.offset, pagination.limit);
    return paginatedResponse(rooms, total, pagination);
  } catch (error) {
    return apiError(error, "Failed to fetch rooms", request);
  }
}
