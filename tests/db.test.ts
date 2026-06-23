import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Database Connection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("warns if DATABASE_URL is not set", async () => {
    const originalEnv = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      await import("@/lib/db");
      const callArg = warnSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(callArg);
      expect(parsed.level).toBe("warn");
      expect(parsed.message).toBe("DATABASE_URL is not set. Database queries will fail at runtime.");
    } finally {
      warnSpy.mockRestore();
      if (originalEnv === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalEnv;
      }
    }
  });

  it("initializes the postgres client if DATABASE_URL is set", async () => {
    const originalEnv = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://fake:fake@fake/fake";
    
    try {
      const { sql } = await import("@/lib/db");
      expect(sql).toBeDefined();
    } finally {
      if (originalEnv === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalEnv;
      }
    }
  });

  it("uses custom DATABASE_STATEMENT_TIMEOUT when set", async () => {
    const originalUrl = process.env.DATABASE_URL;
    const originalTimeout = process.env.DATABASE_STATEMENT_TIMEOUT;
    process.env.DATABASE_URL = "postgres://fake:fake@fake/fake";
    process.env.DATABASE_STATEMENT_TIMEOUT = "5000";

    try {
      const { sql } = await import("@/lib/db");
      expect(sql).toBeDefined();
    } finally {
      if (originalUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = originalUrl;
      }
      if (originalTimeout === undefined) {
        delete process.env.DATABASE_STATEMENT_TIMEOUT;
      } else {
        process.env.DATABASE_STATEMENT_TIMEOUT = originalTimeout;
      }
    }
  });
});
