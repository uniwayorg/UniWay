import { getNearestRoom } from "@/lib/spatial/knn";
import { findShortestPath } from "@/lib/routing/graph";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, badRequest, notFound, successResponse, CoordString, formatZodError } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const RouteQuerySchema = z.object({
  fromLng: CoordString(-180, 180),
  fromLat: CoordString(-90, 90),
  toRoomId: z.string().uuid(),
  accessible: z.coerce.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = withRateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id: campusId } = await params;
    const { searchParams } = new URL(request.url);

    const parsed = RouteQuerySchema.safeParse({
      fromLng: searchParams.get("fromLng") ?? "",
      fromLat: searchParams.get("fromLat") ?? "",
      toRoomId: searchParams.get("toRoomId") ?? "",
      accessible: searchParams.get("accessible") || searchParams.get("accessibility"),
    });

    if (!parsed.success) {
      return badRequest("Validation failed", formatZodError(parsed.error));
    }

    const startRoom = await getNearestRoom(parsed.data.fromLng, parsed.data.fromLat, campusId);
    if (!startRoom) {
      return notFound("Could not find a valid starting location nearby");
    }

    const routeGeoJSON = await findShortestPath(startRoom.id, parsed.data.toRoomId, parsed.data.accessible ?? false);
    if (!routeGeoJSON) {
      return notFound("Could not find a valid route to the destination");
    }

    return successResponse(routeGeoJSON);
  } catch (error) {
    return apiError(error, "Failed to calculate route", request);
  }
}
