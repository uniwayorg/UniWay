import { describe, it, expect } from "vitest";
import { validateCoordinates } from "@/lib/spatial/coords";

describe("Spatial coordinate validation", () => {
  it("accepts valid coordinates", () => {
    expect(() => validateCoordinates(-73.985, 40.748, 50)).not.toThrow();
  });

  it("throws for invalid longitude", () => {
    expect(() => validateCoordinates(999, 40.748, 50)).toThrow("Invalid parameters");
  });

  it("throws for non-positive radius", () => {
    expect(() => validateCoordinates(-73.985, 40.748, 0)).toThrow("Invalid parameters");
  });
});
