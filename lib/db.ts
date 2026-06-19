import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set. Database queries will fail at runtime.");
}

// Ensure a single connection pool in development
const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

export const sql =
  globalForPostgres.sql ??
  postgres(connectionString || "postgres://dummy:dummy@localhost/dummy", {
    // Neon Serverless specific settings
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.sql = sql;
}
