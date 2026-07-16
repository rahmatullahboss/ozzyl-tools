import test from "node:test";
import assert from "node:assert/strict";
import {
  canBuildWord,
  findWords,
  normalizeLetters,
  parseDictionary,
} from "../../app/static/js/word-unscrambler.js";

test("normalizes input to lowercase English letters", () => {
  assert.equal(normalizeLetters(" Li-sten! 123 "), "listen");
  assert.equal(normalizeLetters("abcdefghijklmnop"), "abcdefghijklmno");
});

test("respects repeated letter counts", () => {
  assert.equal(canBuildWord("letter", "letter"), true);
  assert.equal(canBuildWord("letter", "teller"), false);
  assert.equal(canBuildWord("letter", "later"), false);
  assert.equal(canBuildWord("silent", "listen", true), true);
  assert.equal(canBuildWord("list", "listen", true), false);
});

test("finds exact anagrams and sorts longer words first", () => {
  const dictionary = parseDictionary("listen silent enlist inlets tinsel list line ten net");
  assert.deepEqual(findWords(dictionary, "listen", { exact: true }), [
    "enlist",
    "inlets",
    "listen",
    "silent",
    "tinsel",
  ]);

  const allWords = findWords(dictionary, "listen", { minimumLength: 3 });
  assert.equal(allWords[0].length, 6);
  assert.ok(allWords.includes("list"));
  assert.ok(allWords.includes("ten"));
});
