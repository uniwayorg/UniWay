import { NextResponse } from "next/server";
import { findCampusByPoint } from "@/lib/spatial/campus";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, badRequest, formatZodError, CoordString } from "@/lib/api-response";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ContainingQuerySchema = z.object({
  lat: CoordString(-90, 90),
  lng: CoordString(-180, 180),
});

export async function GET(request: Request) {
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = ContainingQuerySchema.safeParse({
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
    });

    if (!parsed.success) {
      return badRequest("Invalid coordinates", formatZodError(parsed.error));
    }

    const campus = await findCampusByPoint(parsed.data.lng, parsed.data.lat);
    return NextResponse.json(
      { data: campus },
      { headers: { "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=86400" } }
    );
  } catch (error) {
    return apiError(error, "Failed to find containing campus", request);
  }
}
