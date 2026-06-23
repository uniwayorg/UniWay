type LogLevel = "error" | "warn" | "info" | "debug";

interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  requestId: string;
  message: string;
  [key: string]: unknown;
}

function writeLog(entry: StructuredLog): void {
  const output = JSON.stringify(entry);
  if (entry.level === "error") {
    console.error(output);
  } else if (entry.level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export interface Logger {
  error: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  debug: (message: string, data?: Record<string, unknown>) => void;
  child: (extra: Record<string, unknown>) => Logger;
}

export function createLogger(requestId: string, defaults: Record<string, unknown> = {}): Logger {
  const log = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    writeLog({ timestamp: new Date().toISOString(), level, requestId, message, ...defaults, ...data });
  };

  return {
    error: (message: string, data?: Record<string, unknown>) => log("error", message, data),
    warn: (message: string, data?: Record<string, unknown>) => log("warn", message, data),
    info: (message: string, data?: Record<string, unknown>) => log("info", message, data),
    debug: (message: string, data?: Record<string, unknown>) => log("debug", message, data),
    child: (extra: Record<string, unknown>) => createLogger(requestId, { ...defaults, ...extra }),
  };
}

const singletonLogger = createLogger("system");

export default singletonLogger;
