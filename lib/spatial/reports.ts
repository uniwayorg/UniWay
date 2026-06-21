import { sql } from "@/lib/db";
import {
  CreateObstructionReportInput,
  ObstructionReportSchema,
  type ObstructionReport,
} from "@/lib/schemas/db";

export async function createObstructionReport(
  input: CreateObstructionReportInput
): Promise<ObstructionReport> {
  if (input.lng !== undefined && input.lat !== undefined) {
    const { lng, lat } = input;
    const result = await sql`
      INSERT INTO obstruction_reports (room_id, edge_id, description, geom)
      VALUES (
        ${input.roomId ?? null},
        ${input.edgeId ?? null},
        ${input.description},
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
      RETURNING id, room_id, edge_id, description, reported_at
    `;

    return ObstructionReportSchema.parse(result[0]);
  }

  const result = await sql`
    INSERT INTO obstruction_reports (room_id, edge_id, description)
    VALUES (
      ${input.roomId ?? null},
      ${input.edgeId ?? null},
      ${input.description}
    )
    RETURNING id, room_id, edge_id, description, reported_at
  `;

  return ObstructionReportSchema.parse(result[0]);
}
