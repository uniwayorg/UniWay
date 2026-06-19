import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

// Ensure a single connection pool in development
const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

export const sql =
  globalForPostgres.sql ??
  postgres(connectionString, {
    // Neon Serverless specific settings
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.sql = sql;
}
