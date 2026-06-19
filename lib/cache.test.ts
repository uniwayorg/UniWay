import { describe, it, expect, beforeEach, vi } from "vitest";
import { RouteCache } from "./cache";

describe("RouteCache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("should set and get values correctly", () => {
    const cache = new RouteCache<string>(10);
    cache.set("key1", "val1");
    expect(cache.get("key1")).toBe("val1");
  });

  it("should return null for non-existent keys", () => {
    const cache = new RouteCache<string>(10);
    expect(cache.get("key_missing")).toBeNull();
  });

  it("should evict items when exceeding capacity (LRU order)", () => {
    // Capacity = 3
    const cache = new RouteCache<string>(3);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    // Access "a" to refresh its usage
    cache.get("a");

    // Adding "d" should evict "b" (since "a" was accessed and "b" is the oldest unused)
    cache.set("d", "4");

    expect(cache.get("a")).toBe("1");
    expect(cache.get("b")).toBeNull(); // evicted
    expect(cache.get("c")).toBe("3");
    expect(cache.get("d")).toBe("4");
  });

  it("should respect TTL expiry", () => {
    const ttl = 1000; // 1 second
    const cache = new RouteCache<string>(10, ttl);
    cache.set("key1", "val1");

    // Move time forward by 500ms
    vi.advanceTimersByTime(500);
    expect(cache.get("key1")).toBe("val1");

    // Move time forward past TTL (another 600ms, total 1100ms)
    vi.advanceTimersByTime(600);
    expect(cache.get("key1")).toBeNull(); // expired
  });

  it("should clear all values correctly", () => {
    const cache = new RouteCache<string>(10);
    cache.set("a", "1");
    cache.set("b", "2");
    expect(cache.size()).toBe(2);

    cache.clear();
    expect(cache.size()).toBe(0);
    expect(cache.get("a")).toBeNull();
  });

  it("should overwrite existing key and refresh its position", () => {
    const cache = new RouteCache<string>(2);
    cache.set("a", "1");
    cache.set("b", "2");

    // Set "a" again (overwriting and making it MRU)
    cache.set("a", "new1");

    // Add "c", which should evict "b"
    cache.set("c", "3");

    expect(cache.get("a")).toBe("new1");
    expect(cache.get("b")).toBeNull(); // evicted
    expect(cache.get("c")).toBe("3");
  });
});
