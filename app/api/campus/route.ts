import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";
import { CampusSchema } from "@/lib/schemas/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const campuses = await sql`SELECT * FROM campuses ORDER BY name ASC`;
    const validated = z.array(CampusSchema).parse(campuses);
    return NextResponse.json({ data: validated });
  } catch (error) {
    console.error("Failed to fetch campuses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
