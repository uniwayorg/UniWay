import postgres from "postgres";
import singletonLogger from "@/lib/logger";

const connectionString = process.env.DATABASE_URL;
const SLOW_QUERY_MS = parseInt(process.env.SLOW_QUERY_MS || "", 10) || 100;
const STATEMENT_TIMEOUT_MS = parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || "", 10) || 30_000;

if (!connectionString) {
  singletonLogger.warn("DATABASE_URL is not set. Database queries will fail at runtime.");
}

const ssl = connectionString
  ? (new URL(connectionString).searchParams.get("sslmode") === "require" ? "require" as const : false)
  : "require" as const;

// Ensure a single connection pool in development
const globalForPostgres = globalThis as unknown as {
  sql: postgres.Sql | undefined;
};

const raw: postgres.Sql =
  globalForPostgres.sql ??
  postgres(connectionString || "postgres://dummy:dummy@localhost/dummy", {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    ssl,
    statement_timeout: STATEMENT_TIMEOUT_MS,
  } as Record<string, unknown>);

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.sql = raw;
}

// Wrap the sql tagged template to log slow queries
function extractQueryIdentity(strings: TemplateStringsArray): string {
  const first = strings[0];
  if (!first) return "unknown";
  const trimmed = first.replace(/\s+/g, " ").trim();
  return trimmed.length > 80 ? trimmed.slice(0, 80) + "..." : trimmed;
}

const timedSql = new Proxy(raw, {
  apply(target, thisArg, args: Parameters<typeof raw>) {
    const start = performance.now();
    const result = Reflect.apply(target, thisArg, args);
    if (result instanceof Promise) {
      return result.finally(() => {
        const elapsed = performance.now() - start;
        if (elapsed > SLOW_QUERY_MS) {
          const identity = extractQueryIdentity(args[0]);
          singletonLogger.warn("slow query", {
            identity,
            elapsedMs: Math.round(elapsed * 100) / 100,
          });
        }
      });
    }
    return result;
  },
}) as unknown as typeof raw;

// Preserve the `sql` tagged template literal type
type SqlTag = typeof raw;

export const sql: SqlTag = timedSql;

// Graceful shutdown — close DB connections on process exit
/* v8 ignore start */
const SHUTDOWN_TIMEOUT_MS = 5_000;

function shutdown(signal: string) {
  singletonLogger.info("shutting down database connections", { signal });
  const timeout = setTimeout(() => {
    singletonLogger.warn("database shutdown timed out, forcing exit");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  timeout.unref();

  raw.end().then(() => {
    clearTimeout(timeout);
    singletonLogger.info("database connections closed", { signal });
  });
}

if (typeof process !== "undefined" && !process.env.VITEST) {
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
/* v8 ignore stop */
