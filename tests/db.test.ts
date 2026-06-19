import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Database Connection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws an error if DATABASE_URL is not set", async () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    await expect(async () => {
      await import("@/lib/db");
    }).rejects.toThrow("DATABASE_URL environment variable is not set.");

    process.env.DATABASE_URL = originalEnv;
  });

  it("initializes the postgres client if DATABASE_URL is set", async () => {
    process.env.DATABASE_URL = "postgres://fake:fake@fake/fake";
    
    const { sql } = await import("@/lib/db");
    expect(sql).toBeDefined();
  });
});
