import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getSuggestions } from "@/app/api/search/suggest/route";
import { sql } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  sql: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  withRateLimit: vi.fn().mockReturnValue(null),
}));

const mockSql = sql as unknown as ReturnType<typeof vi.fn>;
const req = (url = "http://localhost") => new Request(url);

describe("GET /api/search/suggest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if q is missing", async () => {
    const response = await getSuggestions(req("http://localhost/api/search/suggest?campus=123e4567-e89b-12d3-a456-426614174000"));
    expect(response.status).toBe(400);
  });

  it("returns 400 if campus is missing", async () => {
    const response = await getSuggestions(req("http://localhost/api/search/suggest?q=cs"));
    expect(response.status).toBe(400);
  });

  it("returns suggestions for prefix match", async () => {
    const mockResults = [
      { id: "123e4567-e89b-12d3-a456-426614174001", name: "CS Lab", category: "lab" },
      { id: "223e4567-e89b-12d3-a456-426614174001", name: "CS Lecture Hall", category: "lecture_hall" },
    ];
    mockSql.mockResolvedValueOnce(mockResults);

    const response = await getSuggestions(req("http://localhost/api/search/suggest?q=cs&campus=123e4567-e89b-12d3-a456-426614174000"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].name).toBe("CS Lab");
  });

  it("handles empty suggestions gracefully", async () => {
    mockSql.mockResolvedValueOnce([]);

    const response = await getSuggestions(req("http://localhost/api/search/suggest?q=zzz&campus=123e4567-e89b-12d3-a456-426614174000"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toHaveLength(0);
  });

  it("handles errors gracefully", async () => {
    mockSql.mockRejectedValueOnce(new Error("DB Error"));

    const response = await getSuggestions(req("http://localhost/api/search/suggest?q=cs&campus=123e4567-e89b-12d3-a456-426614174000"));
    expect(response.status).toBe(500);
  });
});
