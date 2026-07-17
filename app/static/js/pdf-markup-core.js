const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export function parsePageSelection(value, pageCount) {
  const maximum = Math.max(1, Number(pageCount) || 1);
  const source = String(value ?? "").trim();
  if (!source) return Array.from({ length: maximum }, (_, index) => index);
  const pages = [];
  for (const token of source.split(",")) {
    const part = token.trim();
    if (!part) continue;
    const range = part.match(/^(\d+)\s*-\s*(\d+)$/u);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end < 1 || start > maximum || end > maximum || start > end) {
        throw new Error(`Page range ${part} is outside 1-${maximum}.`);
      }
      for (let page = start; page <= end; page += 1) pages.push(page - 1);
      continue;
    }
    if (!/^\d+$/u.test(part)) throw new Error(`Invalid page selection: ${part}.`);
    const page = Number(part);
    if (page < 1 || page > maximum) throw new Error(`Page ${page} is outside 1-${maximum}.`);
    pages.push(page - 1);
  }
  return [...new Set(pages)];
}

export function hexToRgb(value) {
  const match = String(value ?? "").trim().match(/^#?([\da-f]{6})$/iu);
  if (!match) throw new Error("Use a six-digit hex color.");
  const number = Number.parseInt(match[1], 16);
  return {
    r: ((number >> 16) & 255) / 255,
    g: ((number >> 8) & 255) / 255,
    b: (number & 255) / 255,
  };
}

export function placementFromPercent({ pageWidth, pageHeight, xPercent, yPercent, widthPercent, itemHeight = 0 }) {
  const width = Math.max(1, Number(pageWidth) || 1);
  const height = Math.max(1, Number(pageHeight) || 1);
  const xRatio = clamp(Number(xPercent) || 0, 0, 100) / 100;
  const yRatio = clamp(Number(yPercent) || 0, 0, 100) / 100;
  const targetWidth = width * clamp(Number(widthPercent) || 0, 1, 100) / 100;
  return {
    x: width * xRatio,
    y: clamp(height - height * yRatio - Math.max(0, Number(itemHeight) || 0), 0, height),
    width: targetWidth,
  };
}

export function stampPlacement(pageWidth, pageHeight, boxWidth, boxHeight, position, margin = 36) {
  const width = Number(pageWidth) || 1;
  const height = Number(pageHeight) || 1;
  const stampWidth = Math.max(0, Number(boxWidth) || 0);
  const stampHeight = Math.max(0, Number(boxHeight) || 0);
  const safeMargin = Math.max(0, Number(margin) || 0);
  const positions = {
    center: [(width - stampWidth) / 2, (height - stampHeight) / 2],
    "top-left": [safeMargin, height - safeMargin - stampHeight],
    "top-right": [width - safeMargin - stampWidth, height - safeMargin - stampHeight],
    "bottom-left": [safeMargin, safeMargin],
    "bottom-right": [width - safeMargin - stampWidth, safeMargin],
  };
  const [x, y] = positions[position] || positions.center;
  return { x: Math.max(0, x), y: Math.max(0, y) };
}

export function textItemsToLines(items, tolerance = 3) {
  const rows = [];
  for (const item of items || []) {
    const text = String(item?.str ?? "").trim();
    if (!text) continue;
    const x = Number(item?.transform?.[4]) || 0;
    const y = Number(item?.transform?.[5]) || 0;
    let row = rows.find((candidate) => Math.abs(candidate.y - y) <= tolerance);
    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }
    row.parts.push({ x, text });
  }
  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) => row.parts.sort((a, b) => a.x - b.x).map((part) => part.text).join(" "));
}

export function compareLines(originalLines, revisedLines, limit = 800) {
  const left = (originalLines || []).slice(0, limit);
  const right = (revisedLines || []).slice(0, limit);
  const table = Array.from({ length: left.length + 1 }, () => new Uint16Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i -= 1) {
    for (let j = right.length - 1; j >= 0; j -= 1) {
      table[i][j] = left[i] === right[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const changes = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] === right[j]) {
      changes.push({ type: "same", text: left[i] });
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      changes.push({ type: "remove", text: left[i] });
      i += 1;
    } else {
      changes.push({ type: "add", text: right[j] });
      j += 1;
    }
  }
  while (i < left.length) changes.push({ type: "remove", text: left[i++] });
  while (j < right.length) changes.push({ type: "add", text: right[j++] });
  return changes;
}

export function summarizeDiff(changes) {
  return (changes || []).reduce(
    (summary, change) => {
      if (change.type === "add") summary.added += 1;
      else if (change.type === "remove") summary.removed += 1;
      else summary.unchanged += 1;
      return summary;
    },
    { added: 0, removed: 0, unchanged: 0 },
  );
}
