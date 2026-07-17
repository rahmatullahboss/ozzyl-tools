export const PAGE_SIZES = {
  "a4-portrait": [595.28, 841.89],
  "a4-landscape": [841.89, 595.28],
  "letter-portrait": [612, 792],
  "letter-landscape": [792, 612],
};

export function parsePageSelection(value, pageCount, allowBlank = true) {
  const count = Math.max(0, Math.floor(Number(pageCount) || 0));
  const text = String(value ?? "").trim();
  if (!text) {
    if (allowBlank) return Array.from({ length: count }, (_, index) => index + 1);
    throw new Error("Enter at least one page number.");
  }
  const selected = [];
  for (const token of text.split(",").map((item) => item.trim()).filter(Boolean)) {
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/u);
    if (!match) throw new Error(`Invalid page selection: ${token}`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start > end) throw new Error(`Page range ${token} is reversed.`);
    if (start < 1 || end > count) throw new Error(`Pages must be between 1 and ${count}.`);
    for (let page = start; page <= end; page += 1) {
      if (!selected.includes(page)) selected.push(page);
    }
  }
  return selected;
}

export function pointsFromMillimetres(value) {
  return (Math.max(0, Number(value) || 0) / 25.4) * 72;
}

export function resolvePageSize(mode, customWidthMm, customHeightMm) {
  if (PAGE_SIZES[mode]) return PAGE_SIZES[mode];
  const width = pointsFromMillimetres(customWidthMm);
  const height = pointsFromMillimetres(customHeightMm);
  if (width < 72 || height < 72) throw new Error("Custom page dimensions must be at least 25.4 mm.");
  return [width, height];
}

export function fitPageContent(sourceWidth, sourceHeight, targetWidth, targetHeight, mode = "fit") {
  const sourceW = Math.max(0.01, Number(sourceWidth) || 0.01);
  const sourceH = Math.max(0.01, Number(sourceHeight) || 0.01);
  const targetW = Math.max(0.01, Number(targetWidth) || 0.01);
  const targetH = Math.max(0.01, Number(targetHeight) || 0.01);
  if (mode === "stretch") return { scaleX: targetW / sourceW, scaleY: targetH / sourceH, x: 0, y: 0 };
  const scale = mode === "center" ? 1 : Math.min(targetW / sourceW, targetH / sourceH);
  return { scaleX: scale, scaleY: scale, x: (targetW - sourceW * scale) / 2, y: (targetH - sourceH * scale) / 2 };
}

export function textItemsToString(items) {
  const output = [];
  let line = "";
  for (const item of items ?? []) {
    const text = String(item?.str ?? "").trim();
    if (text) line += `${line ? " " : ""}${text}`;
    if (item?.hasEOL) {
      if (line) output.push(line);
      line = "";
    }
  }
  if (line) output.push(line);
  return output.join("\n");
}

export function safeBaseName(filename) {
  const name = String(filename || "document").replace(/\.pdf$/iu, "").trim();
  return name || "document";
}
