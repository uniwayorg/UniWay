import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Database Connection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("warns if DATABASE_URL is not set", async () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await import("@/lib/db");

    expect(warnSpy).toHaveBeenCalledWith("⚠️ DATABASE_URL is not set. Database queries will fail at runtime.");

    warnSpy.mockRestore();
    process.env.DATABASE_URL = originalEnv;
  });

  it("initializes the postgres client if DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgres://fake:fake@fake/fake";
    
    const { sql } = await import("@/lib/db");
    expect(sql).toBeDefined();
  });
});
