import { NextResponse } from "next/server";
import { fetchCampusMetadata } from "@/lib/spatial/campus";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campusId } = await params;
    const metadata = await fetchCampusMetadata(campusId);

    if (!metadata) {
      return NextResponse.json({ error: "Campus not found" }, { status: 404 });
    }

    return NextResponse.json({ data: metadata });
  } catch (error) {
    console.error("Failed to fetch campus metadata:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
