import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBlankInsertionOrder,
  buildDuplicateOrder,
  cropBoxFromPercentages,
  outputFilename,
  parseKeywords,
  parsePageSelection,
} from "../../app/static/js/pdf-lab.js";

test("page selection expands ranges and rejects reversed input", () => {
  assert.deepEqual(parsePageSelection("1, 3-5, 5", 6), [0, 2, 3, 4]);
  assert.throws(() => parsePageSelection("5-2", 6), /reversed/);
});

test("crop percentages map to a valid PDF crop box", () => {
  assert.deepEqual(cropBoxFromPercentages(1000, 800, { top: 10, right: 5, bottom: 20, left: 15 }), {
    x: 150,
    y: 160,
    width: 800,
    height: 560,
  });
  assert.throws(() => cropBoxFromPercentages(100, 100, { left: 50 }), /between 0% and 49%/);
});

test("duplicate order supports after-each and append placement", () => {
  assert.deepEqual(buildDuplicateOrder(4, [1], 2, "after_each"), [0, 1, 1, 1, 2, 3]);
  assert.deepEqual(buildDuplicateOrder(4, [1, 3], 1, "append"), [0, 1, 2, 3, 1, 3]);
});

test("blank insertion order uses null markers", () => {
  assert.deepEqual(buildBlankInsertionOrder(3, 2, "before", 2), [0, null, null, 1, 2]);
  assert.deepEqual(buildBlankInsertionOrder(2, 1, "end", 2), [0, 1, null]);
});

test("metadata keywords are trimmed and deduplicated", () => {
  assert.deepEqual(parseKeywords("invoice, client; invoice\npaid"), ["invoice", "client", "paid"]);
});

test("PDF Lab output filename is predictable", () => {
  assert.equal(outputFilename("Report.PDF", "cropped"), "Report-cropped.pdf");
});
