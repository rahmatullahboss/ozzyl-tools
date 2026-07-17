import assert from "node:assert/strict";
import test from "node:test";
import {
  compareLines,
  hexToRgb,
  parsePageSelection,
  placementFromPercent,
  stampPlacement,
  summarizeDiff,
  textItemsToLines,
} from "../../app/static/js/pdf-markup-core.js";

test("page selection expands and deduplicates", () => {
  assert.deepEqual(parsePageSelection("1-3, 2, 5", 5), [0, 1, 2, 4]);
});

test("blank selection means every page", () => {
  assert.deepEqual(parsePageSelection("", 3), [0, 1, 2]);
});

test("invalid pages are rejected", () => {
  assert.throws(() => parsePageSelection("3-2", 4), /outside/);
  assert.throws(() => parsePageSelection("7", 4), /outside/);
});

test("hex colors convert to pdf-lib ratios", () => {
  assert.deepEqual(hexToRgb("#ff8000"), { r: 1, g: 128 / 255, b: 0 });
});

test("percent placement converts top-origin input to PDF coordinates", () => {
  const result = placementFromPercent({ pageWidth: 600, pageHeight: 800, xPercent: 10, yPercent: 25, widthPercent: 30, itemHeight: 40 });
  assert.deepEqual(result, { x: 60, y: 560, width: 180 });
});

test("stamp placement supports corners and center", () => {
  assert.deepEqual(stampPlacement(600, 800, 100, 40, "top-right", 20), { x: 480, y: 740 });
  assert.deepEqual(stampPlacement(600, 800, 100, 40, "center"), { x: 250, y: 380 });
});

test("PDF text items become reading-order lines", () => {
  const lines = textItemsToLines([
    { str: "World", transform: [1, 0, 0, 1, 60, 700] },
    { str: "Hello", transform: [1, 0, 0, 1, 10, 700] },
    { str: "Second", transform: [1, 0, 0, 1, 10, 680] },
  ]);
  assert.deepEqual(lines, ["Hello World", "Second"]);
});

test("line comparison reports additions and removals", () => {
  const changes = compareLines(["A", "B", "C"], ["A", "X", "C"]);
  assert.deepEqual(summarizeDiff(changes), { added: 1, removed: 1, unchanged: 2 });
  assert.ok(changes.some((change) => change.type === "add" && change.text === "X"));
  assert.ok(changes.some((change) => change.type === "remove" && change.text === "B"));
});
