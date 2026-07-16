import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeText,
  calculatePercentage,
  convertCase,
  generatePassword,
  passwordStrength,
} from "../../app/static/js/utility-tools.js";

test("analyzeText counts writing statistics", () => {
  const result = analyzeText("Hello world.\n\nThis is a second paragraph!");
  assert.equal(result.words, 7);
  assert.equal(result.sentences, 2);
  assert.equal(result.paragraphs, 2);
  assert.equal(result.charactersNoSpaces, 34);
});

test("convertCase supports common transformations", () => {
  assert.equal(convertCase("hello WORLD", "lower"), "hello world");
  assert.equal(convertCase("hello WORLD", "upper"), "HELLO WORLD");
  assert.equal(convertCase("hello WORLD", "title"), "Hello World");
  assert.equal(
    convertCase("hELLO world. tHIS is fine!", "sentence"),
    "Hello world. This is fine!",
  );
});

test("calculatePercentage covers all three modes", () => {
  assert.equal(calculatePercentage("of", 20, 150), 30);
  assert.equal(calculatePercentage("what", 30, 150), 20);
  assert.equal(calculatePercentage("change", 100, 125), 25);
  assert.equal(calculatePercentage("what", 10, 0), null);
  assert.equal(calculatePercentage("change", 0, 10), null);
});

test("generatePassword includes every enabled character group", () => {
  let cursor = 0;
  const randomValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const deterministicRandom = (maximum) => {
    const value = randomValues[cursor % randomValues.length] % maximum;
    cursor += 1;
    return value;
  };
  const password = generatePassword(
    { length: 16, lowercase: true, uppercase: true, numbers: true, symbols: true },
    deterministicRandom,
  );
  assert.equal(password.length, 16);
  assert.match(password, /[a-z]/);
  assert.match(password, /[A-Z]/);
  assert.match(password, /\d/);
  assert.match(password, /[^A-Za-z0-9]/);
});

test("password strength rewards length and variety", () => {
  assert.equal(passwordStrength("abc").label, "Weak");
  assert.equal(passwordStrength("Abcd1234!Abcd1234!").label, "Very strong");
});
