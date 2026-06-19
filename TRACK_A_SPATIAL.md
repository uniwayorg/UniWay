# Track A: Data & Spatial Layer

> **Agent Instruction:** You are acting as the AI pair programmer for Track A. Read this document to understand your specific domain, architectural constraints, and deliverables. Do not touch files related to Track B.

## Domain Objective
Your goal is to build the foundational database layer for UniWay. You are responsible for the Neon PostGIS schema, the raw SQL queries, and the Zod validation boundaries.

## Architecture Constraints
1. **Driver:** Use `postgres` (`postgres.js`).
2. **Migrations:** Use `ley` to manage raw SQL migrations.
3. **ORM:** Do NOT use Prisma or any other heavy ORM.
4. **Validation:** Use Zod for all data schemas.

## Deliverables

### 1. Database Connection (`lib/db.ts`)
- Initialize the `postgres` client using the `DATABASE_URL` environment variable.
- Ensure it handles Neon's serverless pooling correctly.

### 2. Migrations (`migrations/00000-init.js`)
- Write a `ley` migration to enable PostGIS (`CREATE EXTENSION IF NOT EXISTS postgis;`).
- Create the 5 core tables:
  - `campuses`
  - `buildings`
  - `rooms` (must include `ST_Centroid` generated columns)
  - `routing_edges` (foreign keys to rooms, includes `is_accessible`, `distance_meters`, `floor_id`)
  - `pois` (Points of Interest)

### 3. Spatial Queries (`lib/spatial/*.ts`)
- Implement a K-Nearest Neighbors (KNN) lookup to snap GPS coordinates to the nearest routing node.
- Implement proximity searches using `ST_DWithin` (ellipsoidal distance via `::geography` cast).

### 4. The Data Contract
You must implement a function `fetchEdgesFromCampus(campusId: string)` that returns an array of objects matching this exact interface. Track B relies on this.

```typescript
export interface RoutingEdge {
  id: string;
  source_node_id: string; 
  target_node_id: string; 
  distance_meters: number; 
  is_accessible: boolean; 
  floor_id: string;
}
```

## Workflow Rules
- Write Vitest tests for your queries (`db.test.ts`). Minimum 80% coverage is required by CI.
- Adhere to conventional commits for your PRs (`feat:`, `fix:`, `chore:`).
