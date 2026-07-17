import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateTextPosition,
  fitImageToPage,
  normalizeRotation,
  outputFilename,
  pageNumberText,
  parsePageOrder,
  parsePageSelection,
  remainingPageIndices,
} from "../../app/static/js/pdf-tools.js";

test("parsePageSelection expands ranges and removes duplicates", () => {
  assert.deepEqual(parsePageSelection("1, 3-5, 5, 7", 8), [0, 2, 3, 4, 6]);
});

test("parsePageSelection selects every page when blank is allowed", () => {
  assert.deepEqual(parsePageSelection("", 4, true), [0, 1, 2, 3]);
});

test("parsePageSelection rejects invalid and out-of-range input", () => {
  assert.throws(() => parsePageSelection("3-1", 4), /reversed/);
  assert.throws(() => parsePageSelection("1, 5", 4), /between 1 and 4/);
  assert.throws(() => parsePageSelection("one", 4), /Invalid page selection/);
});

test("parsePageOrder supports ranges and reverse ranges", () => {
  assert.deepEqual(parsePageOrder("3, 1-2, 4", 4), [2, 0, 1, 3]);
  assert.deepEqual(parsePageOrder("4-1", 4), [3, 2, 1, 0]);
});

test("parsePageOrder requires every page exactly once", () => {
  assert.throws(() => parsePageOrder("1, 1, 2, 3", 4), /exactly once/);
  assert.throws(() => parsePageOrder("1-3", 4), /exactly once/);
});

test("remainingPageIndices keeps at least one page", () => {
  assert.deepEqual(remainingPageIndices(5, [1, 3]), [0, 2, 4]);
  assert.throws(() => remainingPageIndices(2, [0, 1]), /at least one page/);
});

test("normalizeRotation wraps clockwise and counterclockwise angles", () => {
  assert.equal(normalizeRotation(270, 90), 0);
  assert.equal(normalizeRotation(0, -90), 270);
  assert.equal(normalizeRotation(90, 180), 270);
});

test("fitImageToPage preserves aspect ratio and centers the image", () => {
  assert.deepEqual(fitImageToPage(1000, 500, 600, 600, 50), {
    width: 500,
    height: 250,
    x: 50,
    y: 175,
  });
});

test("page number labels and positions are deterministic", () => {
  assert.equal(pageNumberText(3, 10, "number"), "3");
  assert.equal(pageNumberText(3, 10, "page"), "Page 3");
  assert.equal(pageNumberText(3, 10, "total"), "3 / 10");
  assert.deepEqual(calculateTextPosition(600, 800, 60, 12, "bottom-right", 24), {
    x: 516,
    y: 24,
  });
});

test("outputFilename removes the existing PDF extension", () => {
  assert.equal(
    outputFilename("Quarterly Report.PDF", "rotated"),
    "Quarterly Report-rotated.pdf",
  );
  assert.equal(outputFilename("", "pages"), "document-pages.pdf");
});
