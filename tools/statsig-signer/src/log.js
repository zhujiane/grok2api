function stamp() {
  return new Date().toISOString();
}

function write(level, message, fields = {}) {
  const extra = Object.keys(fields).length ? ` ${JSON.stringify(redact(fields))}` : "";
  process.stderr.write(`${stamp()} ${level} ${message}${extra}\n`);
}

function redact(value) {
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (/sso|token|cookie|authorization|password|secret/iu.test(key)) {
        out[key] = "[redacted]";
      } else {
        out[key] = redact(item);
      }
    }
    return out;
  }
  if (typeof value === "string" && value.length > 180) {
    return `${value.slice(0, 80)}…(${value.length})`;
  }
  return value;
}

export const log = {
  info: (message, fields) => write("INFO", message, fields),
  warn: (message, fields) => write("WARN", message, fields),
  error: (message, fields) => write("ERROR", message, fields),
};
