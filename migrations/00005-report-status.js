export async function up(sql) {
  await sql`
    ALTER TABLE obstruction_reports
      ADD COLUMN status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'resolved', 'dismissed')),
      ADD COLUMN resolved_at TIMESTAMPTZ
  `;

  await sql`CREATE INDEX IF NOT EXISTS obstruction_reports_status_idx ON obstruction_reports (status)`;
}

export async function down(sql) {
  await sql`DROP INDEX IF EXISTS obstruction_reports_status_idx`;
  await sql`ALTER TABLE obstruction_reports DROP COLUMN IF EXISTS status`;
  await sql`ALTER TABLE obstruction_reports DROP COLUMN IF EXISTS resolved_at`;
}
