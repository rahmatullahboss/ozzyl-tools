import test from "node:test";
import assert from "node:assert/strict";

import {
  fitPageContent,
  parsePageSelection,
  pointsFromMillimetres,
  resolvePageSize,
  safeBaseName,
  textItemsToString,
} from "../../app/static/js/pdf-convert-core.js";

test("page selection expands ranges and removes duplicates", () => {
  assert.deepEqual(parsePageSelection("1, 3-5, 5", 6), [1, 3, 4, 5]);
  assert.deepEqual(parsePageSelection("", 3), [1, 2, 3]);
});

test("page selection rejects reversed and out-of-range values", () => {
  assert.throws(() => parsePageSelection("4-2", 5), /reversed/);
  assert.throws(() => parsePageSelection("1, 6", 5), /between 1 and 5/);
});

test("millimetres convert to PDF points", () => {
  assert.ok(Math.abs(pointsFromMillimetres(25.4) - 72) < 1e-9);
  assert.deepEqual(resolvePageSize("letter-portrait"), [612, 792]);
});

test("fit mode preserves aspect ratio and centers content", () => {
  assert.deepEqual(fitPageContent(100, 200, 400, 400, "fit"), { scaleX: 2, scaleY: 2, x: 100, y: 0 });
  assert.deepEqual(fitPageContent(100, 200, 400, 400, "stretch"), { scaleX: 4, scaleY: 2, x: 0, y: 0 });
});

test("text extraction respects end-of-line markers", () => {
  assert.equal(textItemsToString([{ str: "Hello" }, { str: "world", hasEOL: true }, { str: "Next", hasEOL: true }]), "Hello world\nNext");
});

test("safe base name removes a PDF extension", () => {
  assert.equal(safeBaseName("Quarterly Report.PDF"), "Quarterly Report");
  assert.equal(safeBaseName(""), "document");
});
