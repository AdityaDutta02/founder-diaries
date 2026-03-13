type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  functionName?: string;
  userId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

function log(
  level: LogLevel,
  message: string,
  extra?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>
) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  const method =
    level === "error"
      ? console.error
      : level === "warn"
      ? console.warn
      : console.log;
  method(JSON.stringify(entry));
}

export const logger = {
  debug: (
    msg: string,
    extra?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>
  ) => log("debug", msg, extra),
  info: (
    msg: string,
    extra?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>
  ) => log("info", msg, extra),
  warn: (
    msg: string,
    extra?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>
  ) => log("warn", msg, extra),
  error: (
    msg: string,
    extra?: Partial<Omit<LogEntry, "level" | "message" | "timestamp">>
  ) => log("error", msg, extra),
};
