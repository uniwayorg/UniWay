import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPois } from "@/lib/spatial/search";
import { sql } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const sqlMock = vi.fn();
  return { sql: sqlMock };
});

describe("Spatial Queries - Search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for blank query", async () => {
    const result = await searchPois("123e4567-e89b-12d3-a456-426614174000", "   ");
    expect(result).toEqual([]);
    expect(sql).not.toHaveBeenCalled();
  });

  it("returns ranked POI matches", async () => {
    const mockResult = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      room_id: "123e4567-e89b-12d3-a456-426614174002",
      name: "CS Lab",
      category: "lab",
      tags: ["computers"],
      rank: 0.12,
    };

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockResult]);

    const result = await searchPois(
      "123e4567-e89b-12d3-a456-426614174000",
      "cs lab"
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("CS Lab");
    expect(result[0]?.rank).toBe(0.12);
  });

  it("caps the search limit at 50", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]);

    await searchPois("123e4567-e89b-12d3-a456-426614174000", "lab", 999);

    const sqlCall = (sql as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(sqlCall).toContain(50);
  });
});
