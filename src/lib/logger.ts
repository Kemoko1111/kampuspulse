// Structured server-side logging. Previously every "this failed, but it's a
// best-effort side effect, don't block the main flow" catch block just did
// console.error(message, err) — indistinguishable in log aggregation from an
// actual incident, and Error objects don't serialize their own message/stack
// through JSON.stringify by default. Every entry here is one JSON line with a
// level, so aggregation (Vercel logs, Datadog, etc.) can filter/query on it.
type LogMeta = Record<string, unknown>;

function serializeError(error: unknown): LogMeta {
  if (error instanceof Error) {
    return { errorMessage: error.message, errorStack: error.stack };
  }
  return { errorMessage: String(error) };
}

function write(level: "info" | "warn" | "error", message: string, meta?: LogMeta) {
  const entry = { level, message, timestamp: new Date().toISOString(), ...meta };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write("info", message, meta),
  warn: (message: string, meta?: LogMeta) => write("warn", message, meta),
  error: (message: string, error?: unknown, meta?: LogMeta) =>
    write("error", message, { ...(error !== undefined ? serializeError(error) : {}), ...meta }),
};
