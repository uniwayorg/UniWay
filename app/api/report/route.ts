import { NextResponse } from "next/server";
import { CreateObstructionReportSchema } from "@/lib/schemas/db";
import { createObstructionReport } from "@/lib/spatial/reports";
import { withRateLimit } from "@/lib/rate-limit";
import { apiError, badRequest, formatZodError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rateLimitResponse = withRateLimit(request, { maxRequests: 30, windowMs: 60_000 });
  if (rateLimitResponse) return rateLimitResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body", undefined, undefined, request);
  }

  try {
    const parsed = CreateObstructionReportSchema.safeParse(body);

    if (!parsed.success) {
      return badRequest("Invalid request body", formatZodError(parsed.error), undefined, request);
    }

    const report = await createObstructionReport(parsed.data);
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    return apiError(error, "Failed to create obstruction report", request);
  }
}
