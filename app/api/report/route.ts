import { NextResponse } from "next/server";
import { CreateObstructionReportSchema } from "@/lib/schemas/db";
import { createObstructionReport } from "@/lib/spatial/reports";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = CreateObstructionReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const report = await createObstructionReport(parsed.data);
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error("Failed to create obstruction report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
