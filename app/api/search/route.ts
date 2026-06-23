import { z } from "zod";
import { searchPois } from "@/lib/spatial/search";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, badRequest, parsePagination, paginatedResponse, formatZodError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  campus: z.string().uuid(),
  category: z.string().optional(),
});

export async function GET(request: Request) {
  const rateLimitResponse = withRateLimit(request, { maxRequests: 60, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = SearchQuerySchema.safeParse({
      q: searchParams.get("q") ?? "",
      campus: searchParams.get("campus") ?? "",
      category: searchParams.get("category") ?? undefined,
    });

    if (!parsed.success) {
      return badRequest("Validation failed", formatZodError(parsed.error));
    }

    const pagination = parsePagination(searchParams, 20, 50);
    const { results, total } = await searchPois(
      parsed.data.campus,
      parsed.data.q,
      pagination.limit,
      pagination.offset,
      parsed.data.category
    );

    return paginatedResponse(results, total, pagination);
  } catch (error) {
    return apiError(error, "Failed to search POIs", request);
  }
}
