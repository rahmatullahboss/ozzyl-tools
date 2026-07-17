export function parsePageSelection(value, pageCount, defaultAll = false) {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new RangeError("The PDF must contain at least one page.");
  const input = String(value ?? "").trim();
  if (!input) {
    if (defaultAll) return Array.from({ length: pageCount }, (_, index) => index);
    throw new Error("Enter at least one page number or range.");
  }
  const pages = [];
  const seen = new Set();
  for (const rawToken of input.split(",")) {
    const token = rawToken.trim();
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/u);
    if (!match) throw new Error(`Invalid page selection: ${token || "empty value"}.`);
    const start = Number(match[1]);
    const end = Number(match[2] ?? match[1]);
    if (start < 1 || end < 1 || start > pageCount || end > pageCount) {
      throw new RangeError(`Pages must be between 1 and ${pageCount}.`);
    }
    if (start > end) throw new RangeError(`Page range ${start}-${end} is reversed.`);
    for (let page = start; page <= end; page += 1) {
      const index = page - 1;
      if (!seen.has(index)) {
        seen.add(index);
        pages.push(index);
      }
    }
  }
  return pages;
}

export function cropBoxFromPercentages(width, height, margins) {
  const pageWidth = Number(width);
  const pageHeight = Number(height);
  if (!(pageWidth > 0 && pageHeight > 0)) throw new RangeError("Page dimensions must be positive.");
  const values = Object.fromEntries(
    ["top", "right", "bottom", "left"].map((side) => [side, Number(margins?.[side]) || 0]),
  );
  if (Object.values(values).some((value) => value < 0 || value >= 50)) {
    throw new RangeError("Each crop margin must be between 0% and 49%.");
  }
  if (values.left + values.right >= 95 || values.top + values.bottom >= 95) {
    throw new RangeError("The combined crop margins leave too little visible page area.");
  }
  const x = pageWidth * (values.left / 100);
  const y = pageHeight * (values.bottom / 100);
  const croppedWidth = pageWidth * (1 - (values.left + values.right) / 100);
  const croppedHeight = pageHeight * (1 - (values.top + values.bottom) / 100);
  return { x, y, width: croppedWidth, height: croppedHeight };
}

export function buildDuplicateOrder(pageCount, selectedPages, copies = 1, placement = "after_each") {
  const count = Math.max(1, Math.min(10, Math.round(Number(copies) || 1)));
  const selected = new Set(selectedPages);
  const originals = Array.from({ length: pageCount }, (_, index) => index);
  if (placement === "append") {
    const appended = [];
    for (let copy = 0; copy < count; copy += 1) appended.push(...selectedPages);
    return [...originals, ...appended];
  }
  const order = [];
  for (const index of originals) {
    order.push(index);
    if (selected.has(index)) {
      for (let copy = 0; copy < count; copy += 1) order.push(index);
    }
  }
  return order;
}

export function buildBlankInsertionOrder(pageCount, blankCount, position = "end", anchorPage = pageCount) {
  const count = Math.max(1, Math.min(50, Math.round(Number(blankCount) || 1)));
  const anchorIndex = Math.max(0, Math.min(pageCount - 1, Math.round(Number(anchorPage) || 1) - 1));
  const order = [];
  if (position === "end") return [...Array.from({ length: pageCount }, (_, index) => index), ...Array(count).fill(null)];
  for (let index = 0; index < pageCount; index += 1) {
    if (position === "before" && index === anchorIndex) order.push(...Array(count).fill(null));
    order.push(index);
    if (position === "after" && index === anchorIndex) order.push(...Array(count).fill(null));
  }
  return order;
}

export function parseKeywords(value) {
  return [...new Set(String(value ?? "").split(/[,;\n]+/u).map((item) => item.trim()).filter(Boolean))];
}

export function outputFilename(filename, suffix) {
  const base = String(filename || "document.pdf").replace(/\.pdf$/iu, "") || "document";
  return `${base}-${suffix}.pdf`;
}
