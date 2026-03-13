type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    return `${base} ${JSON.stringify(entry.metadata)}`;
  }
  return base;
}

function createEntry(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata,
  };
}

function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, unknown>,
): void {
  if (!__DEV__) {
    return;
  }

  const entry = createEntry(level, message, metadata);
  const formatted = formatEntry(entry);

  switch (level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, metadata?: Record<string, unknown>): void =>
    log('debug', message, metadata),
  info: (message: string, metadata?: Record<string, unknown>): void =>
    log('info', message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>): void =>
    log('warn', message, metadata),
  error: (message: string, metadata?: Record<string, unknown>): void =>
    log('error', message, metadata),
};
