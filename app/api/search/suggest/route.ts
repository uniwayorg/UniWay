import { z } from "zod";
import { suggestPois } from "@/lib/spatial/search";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, badRequest, successResponse, formatZodError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

const SuggestQuerySchema = z.object({
  q: z.string().min(1),
  campus: z.string().uuid(),
});

export async function GET(request: Request) {
  const rateLimitResponse = withRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = SuggestQuerySchema.safeParse({
      q: searchParams.get("q") ?? "",
      campus: searchParams.get("campus") ?? "",
    });

    if (!parsed.success) {
      return badRequest("Validation failed", formatZodError(parsed.error));
    }

    const results = await suggestPois(parsed.data.campus, parsed.data.q);
    return successResponse(results, 200, 60);
  } catch (error) {
    return apiError(error, "Failed to fetch suggestions", request);
  }
}
