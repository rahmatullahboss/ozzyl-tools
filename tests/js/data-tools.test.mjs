import test from "node:test";
import assert from "node:assert/strict";

import {
  buildUtmUrl,
  dateToTimestamps,
  decodeBase64,
  delimitedToJson,
  describeRelativeDate,
  encodeBase64,
  formatJsonDocument,
  formatUuid,
  jsonToDelimited,
  normalizeCampaignValue,
  parseDelimited,
  regexMatches,
  timestampToDate,
  uuidFromBytes,
} from "../../app/static/js/data-tools-core.js";

test("campaign values normalize consistently", () => {
  assert.equal(normalizeCampaignValue(" Summer  Launch!! "), "summer-launch");
  assert.equal(normalizeCampaignValue("Summer Launch", "underscore"), "summer_launch");
  assert.equal(normalizeCampaignValue(" Summer Launch ", "preserve"), "Summer Launch");
});

test("UTM builder preserves existing query values and replaces UTM keys", () => {
  const result = buildUtmUrl(
    "https://example.com/page?ref=partner&utm_source=old",
    { utm_source: "Newsletter", utm_medium: "Email", utm_campaign: "Summer Sale" },
  );
  const url = new URL(result.url);
  assert.equal(url.searchParams.get("ref"), "partner");
  assert.equal(url.searchParams.get("utm_source"), "newsletter");
  assert.equal(url.searchParams.get("utm_campaign"), "summer-sale");
});

test("UTM builder requires source medium and campaign", () => {
  assert.throws(
    () => buildUtmUrl("https://example.com", { utm_source: "email" }),
    /Source, medium, and campaign/u,
  );
});

test("JSON formatter sorts keys and reports structure", () => {
  const result = formatJsonDocument('{"z":1,"a":{"d":2,"c":3}}', 2, true);
  assert.equal(result.output.indexOf('"a"') < result.output.indexOf('"z"'), true);
  assert.equal(result.keys, 4);
  assert.equal(result.depth, 2);
  assert.equal(result.type, "Object");
});

test("JSON formatter reports line and column for invalid JSON", () => {
  assert.throws(() => formatJsonDocument('{\n  "a": 1,\n}', 2), /line 3/u);
});

test("CSV parser handles quoted delimiters and embedded newlines", () => {
  const parsed = parseDelimited('name,note\nAmina,"hello, world"\nRahim,"line 1\nline 2"');
  assert.deepEqual(parsed.rows[1], ["Amina", "hello, world"]);
  assert.equal(parsed.rows[2][1], "line 1\nline 2");
});

test("CSV to JSON deduplicates blank and repeated headers", () => {
  const result = delimitedToJson("name,name,\nA,B,C");
  assert.deepEqual(JSON.parse(result.output), [{ name: "A", name_2: "B", column_3: "C" }]);
  assert.equal(result.columns, 3);
});

test("JSON objects convert to escaped CSV", () => {
  const result = jsonToDelimited('[{"name":"Amina","note":"hello, world"}]');
  assert.equal(result.output, 'name,note\nAmina,"hello, world"');
  assert.equal(result.rows, 1);
});

test("Base64 encoding and decoding preserves Unicode", () => {
  const original = "বাংলা 👋 Ozzyl";
  const encoded = encodeBase64(original);
  assert.equal(decodeBase64(encoded), original);
});

test("URL-safe Base64 can omit and restore padding", () => {
  const encoded = encodeBase64("hello?", true, true);
  assert.equal(encoded.includes("="), false);
  assert.equal(decodeBase64(encoded, true), "hello?");
});

test("UUID helper sets version 4 and RFC variant bits", () => {
  const uuid = uuidFromBytes(new Uint8Array(16));
  assert.equal(uuid, "00000000-0000-4000-8000-000000000000");
  assert.equal(formatUuid(uuid, { uppercase: true, hyphens: false, braces: true }), "{00000000000040008000000000000000}");
});

test("timestamp auto detection supports seconds and milliseconds", () => {
  assert.equal(timestampToDate("1767225600").toISOString(), "2026-01-01T00:00:00.000Z");
  assert.equal(timestampToDate("1767225600000").toISOString(), "2026-01-01T00:00:00.000Z");
  assert.deepEqual(dateToTimestamps(new Date("2026-01-01T00:00:00Z")), {
    seconds: 1767225600,
    milliseconds: 1767225600000,
  });
});

test("relative date descriptions use the strongest suitable unit", () => {
  const now = new Date("2026-01-01T00:00:00Z");
  assert.match(describeRelativeDate(new Date("2026-01-03T00:00:00Z"), now), /2 days/u);
});

test("regex matcher records groups and safely advances empty matches", () => {
  const emails = regexMatches("a@example.com b@example.org", "(\\w+)@(\\w+\\.\\w+)", "g");
  assert.equal(emails.length, 2);
  assert.deepEqual(emails[0].groups, ["a", "example.com"]);
  assert.equal(regexMatches("ab", "(?=.)", "g").length, 2);
});
