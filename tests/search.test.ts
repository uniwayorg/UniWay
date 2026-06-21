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

  it("returns empty result for blank query", async () => {
    const result = await searchPois("123e4567-e89b-12d3-a456-426614174000", "   ");
    expect(result).toEqual({ results: [], total: 0 });
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

    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ total: 1 }]); // COUNT
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([mockResult]); // DATA

    const { results, total } = await searchPois(
      "123e4567-e89b-12d3-a456-426614174000",
      "cs lab"
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe("CS Lab");
    expect(results[0]?.rank).toBe(0.12);
    expect(total).toBe(1);
  });

  it("caps the search limit at 50", async () => {
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{ total: 1 }]); // COUNT
    (sql as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce([]); // DATA

    const { results } = await searchPois("123e4567-e89b-12d3-a456-426614174000", "lab", 999);

    expect(results).toEqual([]);
    const sqlCall = (sql as unknown as ReturnType<typeof vi.fn>).mock.calls[1];
    expect(sqlCall).toContain(50);
  });
});
