const MAX_TEXT_LENGTH = 2_000_000;

export function assertTextLimit(text, limit = MAX_TEXT_LENGTH) {
  if (String(text).length > limit) {
    const description = limit < 1_000_000 ? `${limit.toLocaleString()} characters` : `${Math.round(limit / 1_000_000)} MB of text`;
    throw new Error(`Keep input below ${description}.`);
  }
}

export function normalizeCampaignValue(value, style = "hyphen") {
  const trimmed = String(value ?? "").trim();
  if (style === "preserve") return trimmed;
  const separator = style === "underscore" ? "_" : "-";
  return trimmed
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, separator)
    .replace(new RegExp(`\\${separator}+`, "g"), separator)
    .replace(new RegExp(`^\\${separator}|\\${separator}$`, "g"), "");
}

export function buildUtmUrl(baseUrl, values, style = "hyphen") {
  let url;
  try {
    url = new URL(String(baseUrl).trim());
  } catch {
    throw new Error("Enter a complete URL starting with http:// or https://.");
  }
  if (!/^https?:$/u.test(url.protocol)) {
    throw new Error("Only http:// and https:// campaign URLs are supported.");
  }

  const required = ["utm_source", "utm_medium", "utm_campaign"];
  const normalized = {};
  for (const [key, rawValue] of Object.entries(values)) {
    const value = normalizeCampaignValue(rawValue, style);
    if (value) {
      normalized[key] = value;
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  }
  const missing = required.filter((key) => !normalized[key]);
  if (missing.length) {
    throw new Error("Source, medium, and campaign are required for reliable attribution.");
  }
  return { url: url.toString(), parameters: normalized };
}

function deepSort(value) {
  if (Array.isArray(value)) return value.map(deepSort);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, deepSort(value[key])]),
    );
  }
  return value;
}

function jsonDepth(value) {
  if (!value || typeof value !== "object") return 0;
  const children = Array.isArray(value) ? value : Object.values(value);
  if (!children.length) return 1;
  return 1 + Math.max(...children.map(jsonDepth));
}

function countJson(value) {
  const stats = { objects: 0, arrays: 0, keys: 0, values: 0 };
  const visit = (node) => {
    stats.values += 1;
    if (Array.isArray(node)) {
      stats.arrays += 1;
      node.forEach(visit);
    } else if (node && typeof node === "object") {
      stats.objects += 1;
      const entries = Object.entries(node);
      stats.keys += entries.length;
      entries.forEach(([, child]) => visit(child));
    }
  };
  visit(value);
  return stats;
}

export function parseJsonDocument(text) {
  assertTextLimit(text);
  try {
    return JSON.parse(String(text));
  } catch (error) {
    const match = /position\s+(\d+)/iu.exec(error.message);
    const position = match ? Number(match[1]) : null;
    if (position === null) throw new Error(error.message);
    const before = String(text).slice(0, position);
    const line = before.split("\n").length;
    const column = position - before.lastIndexOf("\n");
    throw new Error(`Invalid JSON near line ${line}, column ${column}.`);
  }
}

export function formatJsonDocument(text, indent = 2, sortKeys = false) {
  const parsed = parseJsonDocument(text);
  const output = JSON.stringify(sortKeys ? deepSort(parsed) : parsed, null, indent);
  const counts = countJson(parsed);
  return {
    output,
    type: Array.isArray(parsed) ? "Array" : parsed === null ? "Null" : typeof parsed === "object" ? "Object" : typeof parsed,
    depth: jsonDepth(parsed),
    characters: output.length,
    ...counts,
  };
}

export function minifyJsonDocument(text, sortKeys = false) {
  const parsed = parseJsonDocument(text);
  return JSON.stringify(sortKeys ? deepSort(parsed) : parsed);
}

export function detectDelimiter(text) {
  const sample = String(text).split(/\r?\n/u).slice(0, 5).join("\n");
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestScore = -1;
  for (const candidate of candidates) {
    let score = 0;
    let quoted = false;
    for (let index = 0; index < sample.length; index += 1) {
      const char = sample[index];
      if (char === '"') {
        if (quoted && sample[index + 1] === '"') index += 1;
        else quoted = !quoted;
      } else if (!quoted && char === candidate) score += 1;
    }
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

export function parseDelimited(text, delimiter = "auto") {
  assertTextLimit(text);
  const source = String(text).replace(/^\uFEFF/u, "");
  const resolved = delimiter === "auto" ? detectDelimiter(source) : delimiter;
  if (!resolved || resolved.length !== 1) throw new Error("Choose a valid one-character delimiter.");

  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === resolved) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/u, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("The delimited text contains an unclosed quoted field.");
  if (field || row.length) {
    row.push(field.replace(/\r$/u, ""));
    rows.push(row);
  }
  while (rows.length && rows.at(-1).every((value) => value === "")) rows.pop();
  return { rows, delimiter: resolved };
}

function uniqueHeaders(headers) {
  const seen = new Map();
  return headers.map((header, index) => {
    const base = String(header).trim() || `column_${index + 1}`;
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base}_${count + 1}` : base;
  });
}

export function delimitedToJson(text, options = {}) {
  const { delimiter = "auto", header = true } = options;
  const parsed = parseDelimited(text, delimiter);
  if (!parsed.rows.length) return { output: "[]", rows: 0, columns: 0, delimiter: parsed.delimiter };
  const width = Math.max(...parsed.rows.map((row) => row.length));
  let data;
  if (header) {
    const headers = uniqueHeaders(parsed.rows[0]);
    data = parsed.rows.slice(1).map((row) =>
      Object.fromEntries(headers.map((key, index) => [key, row[index] ?? ""])),
    );
  } else {
    data = parsed.rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ""));
  }
  return {
    output: JSON.stringify(data, null, 2),
    rows: data.length,
    columns: width,
    delimiter: parsed.delimiter,
  };
}

function csvCell(value, delimiter) {
  let text;
  if (value === null || value === undefined) text = "";
  else if (typeof value === "object") text = JSON.stringify(value);
  else text = String(value);
  return /["\r\n]/u.test(text) || text.includes(delimiter)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

export function jsonToDelimited(text, delimiter = ",") {
  const parsed = parseJsonDocument(text);
  if (!Array.isArray(parsed)) throw new Error("JSON-to-CSV input must be an array.");
  if (!parsed.length) return { output: "", rows: 0, columns: 0 };

  let matrix;
  let hasHeader = false;
  if (parsed.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
    const headers = [...new Set(parsed.flatMap((item) => Object.keys(item)))];
    matrix = [headers, ...parsed.map((item) => headers.map((header) => item[header] ?? ""))];
    hasHeader = true;
  } else if (parsed.every(Array.isArray)) {
    matrix = parsed;
  } else {
    matrix = [["value"], ...parsed.map((value) => [value])];
  }
  const width = Math.max(...matrix.map((row) => row.length));
  return {
    output: matrix.map((row) => row.map((value) => csvCell(value, delimiter)).join(delimiter)).join("\n"),
    rows: hasHeader ? Math.max(0, matrix.length - 1) : matrix.length,
    columns: width,
  };
}

export function encodeBase64(text, urlSafe = false, omitPadding = false) {
  assertTextLimit(text);
  const bytes = new TextEncoder().encode(String(text));
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  let encoded = btoa(binary);
  if (urlSafe) encoded = encoded.replaceAll("+", "-").replaceAll("/", "_");
  if (omitPadding) encoded = encoded.replace(/=+$/u, "");
  return encoded;
}

export function decodeBase64(text, urlSafe = false) {
  assertTextLimit(text);
  let normalized = String(text).trim().replace(/\s+/gu, "");
  if (urlSafe) normalized = normalized.replaceAll("-", "+").replaceAll("_", "/");
  const remainder = normalized.length % 4;
  if (remainder) normalized += "=".repeat(4 - remainder);
  let binary;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error("Enter valid Base64 text.");
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("The decoded bytes are not valid UTF-8 text.");
  }
}

export function uuidFromBytes(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length !== 16) {
    throw new Error("UUID generation requires exactly 16 random bytes.");
  }
  const value = new Uint8Array(bytes);
  value[6] = (value[6] & 0x0f) | 0x40;
  value[8] = (value[8] & 0x3f) | 0x80;
  const hex = [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function formatUuid(uuid, options = {}) {
  const { uppercase = false, hyphens = true, braces = false } = options;
  let value = hyphens ? uuid : uuid.replaceAll("-", "");
  if (uppercase) value = value.toUpperCase();
  return braces ? `{${value}}` : value;
}

export function timestampToDate(value, unit = "auto") {
  const numeric = Number(String(value).trim());
  if (!Number.isFinite(numeric)) throw new Error("Enter a valid Unix timestamp.");
  let milliseconds;
  if (unit === "seconds") milliseconds = numeric * 1000;
  else if (unit === "milliseconds") milliseconds = numeric;
  else milliseconds = Math.abs(numeric) < 100_000_000_000 ? numeric * 1000 : numeric;
  const date = new Date(milliseconds);
  if (Number.isNaN(date.getTime())) throw new Error("That timestamp is outside the supported date range.");
  return date;
}

export function dateToTimestamps(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid date and time.");
  return { seconds: Math.floor(date.getTime() / 1000), milliseconds: date.getTime() };
}

export function describeRelativeDate(date, now = new Date()) {
  const difference = date.getTime() - now.getTime();
  const absolute = Math.abs(difference);
  const units = [
    [86_400_000, "day"],
    [3_600_000, "hour"],
    [60_000, "minute"],
    [1000, "second"],
  ];
  const [size, label] = units.find(([threshold]) => absolute >= threshold) || units.at(-1);
  const amount = Math.round(difference / size);
  return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(amount, label);
}

export function regexMatches(text, pattern, flags = "g", limit = 500) {
  assertTextLimit(text, 200_000);
  let regex;
  try {
    regex = new RegExp(pattern, flags);
  } catch (error) {
    throw new Error(error.message);
  }
  const source = String(text);
  const matches = [];
  if (!regex.global) {
    const match = regex.exec(source);
    if (match) matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
    return matches;
  }
  let match;
  while ((match = regex.exec(source)) && matches.length < limit) {
    matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
    if (match[0] === "") regex.lastIndex += 1;
  }
  return matches;
}

export function safeFilename(value, fallback = "ozzyl-data") {
  const cleaned = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "");
  return cleaned || fallback;
}
