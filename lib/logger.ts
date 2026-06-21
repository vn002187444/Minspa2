import * as Sentry from "@sentry/nextjs";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: { name: string; message: string; stack?: string };
}

function createLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error: error ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined } : undefined,
  };
}

function formatLog(entry: LogEntry): string {
  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }
  const tag = `[${entry.level.toUpperCase()}]`;
  const time = entry.timestamp.slice(11, 19);
  const err = entry.error ? ` (${entry.error.name}: ${entry.error.message})` : '';
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
  return `${tag} ${time} ${entry.message}${err}${ctx}`;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
  const entry = createLogEntry(level, message, context, error);
  const formatted = formatLog(entry);

  switch (level) {
    case 'debug': console.debug(formatted); break;
    case 'info': console.info(formatted); break;
    case 'warn': console.warn(formatted); break;
    case 'error': console.error(formatted); break;
  }

  if (process.env.NODE_ENV === 'production' && level === 'error') {
    try {
      Sentry.captureException(error || new Error(message), { extra: context });
      fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry), signal: AbortSignal.timeout(2000) }).catch(() => {});
    } catch {}
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => log('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) => log('error', message, context, error),
};
