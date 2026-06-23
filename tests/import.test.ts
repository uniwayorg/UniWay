import { describe, it, expect } from "vitest";
import { ImportFeatureCollectionSchema } from "@/lib/spatial/import-schemas";
import { validateImportData } from "@/lib/spatial/validate";
import sampleImport from "./fixtures/sample-import.json";

describe("ImportFeatureCollectionSchema", () => {
  it("parses a valid import file", () => {
    const result = ImportFeatureCollectionSchema.parse(sampleImport);
    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toHaveLength(6);
  });

  it("parses empty features (validator handles the empty check)", () => {
    const result = ImportFeatureCollectionSchema.parse({ type: "FeatureCollection", features: [] });
    expect(result.features).toHaveLength(0);
  });

  it("rejects an unrecognized feature type", () => {
    const bad = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { type: "unknown" }, geometry: { type: "Point", coordinates: [0, 0] } }],
    };
    expect(() => ImportFeatureCollectionSchema.parse(bad)).toThrow();
  });

  it("rejects a building without a name", () => {
    const bad = {
      type: "FeatureCollection",
      features: [{ type: "Feature", properties: { type: "building" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } }],
    };
    expect(() => ImportFeatureCollectionSchema.parse(bad)).toThrow();
  });
});

describe("validateImportData", () => {
  it("returns no errors for valid data", () => {
    const fc = ImportFeatureCollectionSchema.parse(sampleImport);
    const errors = validateImportData(fc);
    expect(errors.filter((e) => e.type === "error")).toHaveLength(0);
  });

  it("returns error for empty collection", () => {
    const fc = ImportFeatureCollectionSchema.parse({ type: "FeatureCollection", features: [] });
    const errors = validateImportData(fc);
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns error for missing buildings", () => {
    const fc = ImportFeatureCollectionSchema.parse({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { type: "room", name: "101", floor: "1", building: "Ghost" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
      ],
    });
    const errors = validateImportData(fc);
    expect(errors.map((e) => e.message)).toContain("At least one building feature is required");
  });

  it("returns error for duplicate building names", () => {
    const fc = ImportFeatureCollectionSchema.parse({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { type: "building", name: "Same" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
        { type: "Feature", properties: { type: "building", name: "Same" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
      ],
    });
    const errors = validateImportData(fc);
    expect(errors.map((e) => e.message)).toContain('Duplicate building name: "Same"');
  });

  it("returns error for room referencing unknown building", () => {
    const fc = ImportFeatureCollectionSchema.parse({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { type: "building", name: "Existing" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
        { type: "Feature", properties: { type: "room", name: "101", floor: "1", building: "Ghost" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
      ],
    });
    const errors = validateImportData(fc);
    expect(errors.map((e) => e.message)).toContain('Room "101" references unknown building "Ghost"');
  });

  it("warns on duplicate room name per building/floor", () => {
    const fc = ImportFeatureCollectionSchema.parse({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { type: "building", name: "B1" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
        { type: "Feature", properties: { type: "room", name: "101", floor: "1", building: "B1" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
        { type: "Feature", properties: { type: "room", name: "101", floor: "1", building: "B1" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
      ],
    });
    const errors = validateImportData(fc);
    expect(errors.filter((e) => e.type === "warning").map((e) => e.message)).toContain('Duplicate room name "101" in B1 floor 1');
  });

  it("returns error for corridor referencing unknown rooms", () => {
    const fc = ImportFeatureCollectionSchema.parse({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { type: "building", name: "B1" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
        { type: "Feature", properties: { type: "corridor", from: "Ghost", to: "AlsoGhost", floor: "1" }, geometry: { type: "LineString", coordinates: [[0, 0], [1, 1]] } },
      ],
    });
    const errors = validateImportData(fc);
    expect(errors.map((e) => e.message)).toContain('Corridor references unknown room "Ghost"');
    expect(errors.map((e) => e.message)).toContain('Corridor references unknown room "AlsoGhost"');
  });

  it("returns error for POI referencing unknown room", () => {
    const fc = ImportFeatureCollectionSchema.parse({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { type: "building", name: "B1" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] } },
        { type: "Feature", properties: { type: "poi", name: "Ghost POI", category: "lab", room: "GhostRoom", tags: [] }, geometry: { type: "Point", coordinates: [0, 0] } },
      ],
    });
    const errors = validateImportData(fc);
    expect(errors.map((e) => e.message)).toContain('POI references unknown room "GhostRoom"');
  });

  it("returns error for out-of-bounds coordinates", () => {
    const fc = ImportFeatureCollectionSchema.parse({
      type: "FeatureCollection",
      features: [
        { type: "Feature", properties: { type: "building", name: "B1" }, geometry: { type: "Polygon", coordinates: [[[0, 0], [0, 200], [1, 1], [1, 0], [0, 0]]] } },
      ],
    });
    const errors = validateImportData(fc);
    expect(errors.some((e) => e.message.includes("out of range"))).toBe(true);
  });
});
