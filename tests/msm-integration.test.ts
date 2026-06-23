import { describe, it, expect } from "vitest";

describe("API integration (MSW)", () => {
  it("GET /api/campus returns campuses", async () => {
    const res = await fetch("http://localhost/api/campus");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe("Main Campus");
  });

  it("GET /api/campus/:id returns campus metadata", async () => {
    const res = await fetch("http://localhost/api/campus/123e4567-e89b-12d3-a456-426614174000");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.campus.name).toBe("Main Campus");
  });

  it("GET /api/campus/:id/pois returns POIs", async () => {
    const res = await fetch("http://localhost/api/campus/123e4567-e89b-12d3-a456-426614174000/pois");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].name).toBe("CS Lecture Hall");
  });

  it("GET /api/campus/:id/buildings returns buildings", async () => {
    const res = await fetch("http://localhost/api/campus/123e4567-e89b-12d3-a456-426614174000/buildings");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].name).toBe("Engineering Building");
  });

  it("GET /api/campus/:id/rooms returns rooms", async () => {
    const res = await fetch("http://localhost/api/campus/123e4567-e89b-12d3-a456-426614174000/rooms");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].name).toBe("101");
  });

  it("GET /api/campus/:id/route returns route", async () => {
    const res = await fetch("http://localhost/api/campus/123e4567-e89b-12d3-a456-426614174000/route?fromLng=-73.98&fromLat=40.74&toRoomId=123e4567-e89b-12d3-a456-426614174003");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.type).toBe("Feature");
  });

  it("GET /api/route returns 400 if missing parameters", async () => {
    const res = await fetch("http://localhost/api/route");
    expect(res.status).toBe(400);
  });

  it("GET /api/route returns route with valid params", async () => {
    const res = await fetch("http://localhost/api/route?fromLng=-73.98&fromLat=40.74&toRoomId=123e4567-e89b-12d3-a456-426614174003");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.type).toBe("Feature");
  });

  it("GET /api/search returns 400 if missing params", async () => {
    const res = await fetch("http://localhost/api/search");
    expect(res.status).toBe(400);
  });

  it("GET /api/search returns results with valid params", async () => {
    const res = await fetch("http://localhost/api/search?q=cs&campus=123e4567-e89b-12d3-a456-426614174000");
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].name).toBe("CS Lecture Hall");
  });

  it("POST /api/report creates a report", async () => {
    const res = await fetch("http://localhost/api/report", {
      method: "POST",
      body: JSON.stringify({ description: "Door blocked" }),
    });
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.description).toBe("Door blocked");
  });

  it("POST /api/report returns 400 if invalid body", async () => {
    const res = await fetch("http://localhost/api/report", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
