import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";
import { POISchema } from "@/lib/schemas/db";
import { withRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { id: campusId } = await params;

    const pois = await sql`
      SELECT p.*
      FROM pois p
      JOIN rooms r ON p.room_id = r.id
      JOIN buildings b ON r.building_id = b.id
      WHERE b.campus_id = ${campusId}
      ORDER BY p.name ASC
    `;

    const validated = z.array(POISchema).parse(pois);
    return NextResponse.json({ data: validated });
  } catch (error) {
    console.error("Failed to fetch POIs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
