import { describe, it, expect, vi, beforeEach } from "vitest";
import { createObstructionReport } from "@/lib/spatial/reports";
import { sql } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const sqlMock = vi.fn();
  return { sql: sqlMock };
});

describe("Spatial Queries - Reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a report for a room", async () => {
    const mockReport = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      room_id: "123e4567-e89b-12d3-a456-426614174001",
      edge_id: null,
      description: "Door blocked",
      reported_at: new Date("2026-01-01T00:00:00.000Z"),
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockReport]);

    const result = await createObstructionReport({
      roomId: "123e4567-e89b-12d3-a456-426614174001",
      description: "Door blocked",
    });

    expect(result.description).toBe("Door blocked");
    expect(result.room_id).toBe("123e4567-e89b-12d3-a456-426614174001");
  });

  it("creates a report with optional GPS location", async () => {
    const mockReport = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      room_id: null,
      edge_id: "123e4567-e89b-12d3-a456-426614174002",
      description: "Stairs blocked",
      reported_at: new Date("2026-01-01T00:00:00.000Z"),
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockReport]);

    const result = await createObstructionReport({
      edgeId: "123e4567-e89b-12d3-a456-426614174002",
      description: "Stairs blocked",
      lng: -73.985,
      lat: 40.748,
    });

    expect(result.edge_id).toBe("123e4567-e89b-12d3-a456-426614174002");
    const sqlCallStrings = (sql as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string[];
    expect(sqlCallStrings.join("")).toContain("ST_MakePoint");
  });
});
