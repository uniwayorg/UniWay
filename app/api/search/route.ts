import { NextResponse } from "next/server";
import { z } from "zod";
import { searchPois } from "@/lib/spatial/search";

export const dynamic = "force-dynamic";

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  campus: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = SearchQuerySchema.safeParse({
      q: searchParams.get("q") ?? "",
      campus: searchParams.get("campus") ?? "",
      limit: searchParams.get("limit") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid parameters (q, campus)" }, { status: 400 });
    }

    const results = await searchPois(parsed.data.campus, parsed.data.q, parsed.data.limit);
    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("Failed to search POIs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
