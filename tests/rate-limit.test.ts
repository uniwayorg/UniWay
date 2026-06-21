import { describe, it, expect, vi, beforeEach } from "vitest";

// Import the module fresh each time to reset the internal Map
describe("rate limiter", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("allows requests under the limit", async () => {
    const { withRateLimit } = await import("@/lib/rate-limit");
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const response = withRateLimit(request, { maxRequests: 5, windowMs: 60_000 });
    expect(response).toBeNull();
  });

  it("blocks requests over the limit", async () => {
    const { withRateLimit } = await import("@/lib/rate-limit");
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.5" },
    });

    const config = { maxRequests: 2, windowMs: 60_000 };

    expect(withRateLimit(request, config)).toBeNull();
    expect(withRateLimit(request, config)).toBeNull();

    const blocked = withRateLimit(request, config);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    const json = await blocked!.json();
    expect(json.error).toBe("Too many requests");
  });

  it("uses separate buckets per IP", async () => {
    const { withRateLimit } = await import("@/lib/rate-limit");
    const config = { maxRequests: 1, windowMs: 60_000 };

    const ip1 = new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.6" } });
    const ip2 = new Request("http://localhost", { headers: { "x-forwarded-for": "1.2.3.7" } });

    expect(withRateLimit(ip1, config)).toBeNull();
    expect(withRateLimit(ip1, config)).not.toBeNull();

    expect(withRateLimit(ip2, config)).toBeNull();
  });

  it("returns Retry-After header on block", async () => {
    const { withRateLimit } = await import("@/lib/rate-limit");
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.8" },
    });

    const config = { maxRequests: 1, windowMs: 60_000 };

    expect(withRateLimit(request, config)).toBeNull();

    const blocked = withRateLimit(request, config);
    expect(blocked!.headers.get("Retry-After")).toBeTruthy();
    expect(blocked!.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
