import { describe, it, expect } from "vitest";
import { assembleRoute } from "./route-assembly";

describe("assembleRoute", () => {
  const coordMap = new Map<string, [number, number]>([
    ["node1", [-73.985, 40.748]],
    ["node2", [-73.984, 40.749]],
    ["node3", [-73.983, 40.750]],
  ]);

  it("should assemble a valid multi-node route", () => {
    const path = ["node1", "node2", "node3"];
    const distance = 25.5;

    const result = assembleRoute(path, coordMap, distance);

    expect(result).not.toBeNull();
    expect(result?.type).toBe("Feature");
    expect(result?.properties.distance_meters).toBe(25.5);
    expect(result?.geometry.type).toBe("LineString");
    expect(result?.geometry.coordinates).toEqual([
      [-73.985, 40.748],
      [-73.984, 40.749],
      [-73.983, 40.750],
    ]);
  });

  it("should handle single-node routes (same start and target) by duplicating coordinates", () => {
    const path = ["node1"];
    const distance = 0;

    const result = assembleRoute(path, coordMap, distance);

    expect(result).not.toBeNull();
    expect(result?.properties.distance_meters).toBe(0);
    expect(result?.geometry.coordinates).toEqual([
      [-73.985, 40.748],
      [-73.985, 40.748],
    ]);
  });

  it("should return null for empty path arrays", () => {
    const result = assembleRoute([], coordMap, 0);
    expect(result).toBeNull();
  });

  it("should return null if there are fewer than 2 coordinate points resolved and cannot duplicate", () => {
    // Empty coordMap, so no coordinates will resolve
    const emptyMap = new Map<string, [number, number]>();
    const result = assembleRoute(["node1", "node2"], emptyMap, 10);
    expect(result).toBeNull();
  });

  it("should skip nodes that are missing from coordinate map", () => {
    const path = ["node1", "missingNode", "node3"];
    const result = assembleRoute(path, coordMap, 12);

    expect(result).not.toBeNull();
    expect(result?.geometry.coordinates).toEqual([
      [-73.985, 40.748],
      [-73.983, 40.750],
    ]);
  });
});
