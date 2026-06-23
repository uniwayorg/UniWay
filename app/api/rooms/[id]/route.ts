import { fetchRoomById } from "@/lib/spatial/rooms";
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
    const { id: roomId } = await params;
    const room = await fetchRoomById(roomId);

    if (!room) {
      return notFound("Room not found", undefined, request);
    }

    return successResponse(room, 200, 300);
  } catch (error) {
    return apiError(error, "Failed to fetch room details", request);
  }
}
