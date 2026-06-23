import { describe, it, expect } from "vitest";
import {
  campus, buildings, rooms, pois,
  CAMPUS_ID, ENG_BLDG_ID, SCI_BLDG_ID,
  ENG_101_ID, ENG_102_ID, ENG_103_ID, ENG_201_ID, ENG_202_ID,
  SCI_101_ID, SCI_102_ID, SCI_201_ID,
  POI_CS_LECTURE_ID, POI_PHYSICS_LAB_ID, POI_CAFETERIA_ID,
  POI_FACULTY_OFFICE_ID, POI_CHEM_LAB_ID, POI_RESTROOM_ID,
} from "./sample-campus";

describe("sample campus fixture", () => {
  it("exports a valid campus", () => {
    expect(campus.id).toBe(CAMPUS_ID);
    expect(campus.name).toBe("Main Campus");
    expect(campus.bounds.type).toBe("Polygon");
  });

  it("exports 2 buildings", () => {
    expect(buildings).toHaveLength(2);
    expect(buildings[0].name).toBe("Engineering Building");
    expect(buildings[1].name).toBe("Science Hall");
  });

  it("has buildings referencing the campus", () => {
    for (const b of buildings) {
      expect(b.campus_id).toBe(CAMPUS_ID);
    }
  });

  it("exports 8 rooms", () => {
    expect(rooms).toHaveLength(8);
  });

  it("has Engineering Building rooms on floor 1 and 2", () => {
    const engRooms = rooms.filter((r) => r.building_id === ENG_BLDG_ID);
    expect(engRooms).toHaveLength(5);
    expect(engRooms.filter((r) => r.floor === "1")).toHaveLength(3);
    expect(engRooms.filter((r) => r.floor === "2")).toHaveLength(2);
  });

  it("has Science Hall rooms on floor 1 and 2", () => {
    const sciRooms = rooms.filter((r) => r.building_id === SCI_BLDG_ID);
    expect(sciRooms).toHaveLength(3);
    expect(sciRooms.filter((r) => r.floor === "1")).toHaveLength(2);
    expect(sciRooms.filter((r) => r.floor === "2")).toHaveLength(1);
  });

  it("has rooms referencing valid buildings", () => {
    const buildingIds = new Set(buildings.map((b) => b.id));
    for (const r of rooms) {
      expect(buildingIds.has(r.building_id)).toBe(true);
    }
  });

  it("exports 6 POIs", () => {
    expect(pois).toHaveLength(6);
  });

  it("has POIs across expected categories", () => {
    const categories = pois.map((p) => p.category);
    expect(categories).toContain("lecture_hall");
    expect(categories).toContain("lab");
    expect(categories).toContain("cafeteria");
    expect(categories).toContain("office");
    expect(categories).toContain("restroom");
  });

  it("has POIs referencing valid rooms", () => {
    const roomIds = new Set(rooms.map((r) => r.id));
    for (const p of pois) {
      expect(roomIds.has(p.room_id)).toBe(true);
    }
  });

  it("has POIs with tags", () => {
    for (const p of pois) {
      expect(Array.isArray(p.tags)).toBe(true);
      expect(p.tags.length).toBeGreaterThan(0);
    }
  });

  it("has unique IDs across all entities", () => {
    const allIds = [CAMPUS_ID, ENG_BLDG_ID, SCI_BLDG_ID,
      ENG_101_ID, ENG_102_ID, ENG_103_ID, ENG_201_ID, ENG_202_ID,
      SCI_101_ID, SCI_102_ID, SCI_201_ID,
      POI_CS_LECTURE_ID, POI_PHYSICS_LAB_ID, POI_CAFETERIA_ID,
      POI_FACULTY_OFFICE_ID, POI_CHEM_LAB_ID, POI_RESTROOM_ID];
    expect(new Set(allIds).size).toBe(allIds.length);
  });
});
