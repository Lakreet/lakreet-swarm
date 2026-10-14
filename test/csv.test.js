import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv } from "../src/csv.js";

test("parses a simple file", () => {
  const { headers, rows } = parseCsv("a,b\n1,2\n3,4\n");
  assert.deepEqual(headers, ["a", "b"]);
  assert.deepEqual(
    rows.map((r) => r.cells),
    [
      ["1", "2"],
      ["3", "4"],
    ]
  );
});

test("keeps commas and quotes inside quoted values", () => {
  const { rows } = parseCsv('a,b\n"x, y","say ""hi"""\n');
  assert.deepEqual(rows[0].cells, ["x, y", 'say "hi"']);
});

test("allows line breaks inside quoted values", () => {
  const { rows } = parseCsv('a\n"line1\nline2"\n');
  assert.deepEqual(rows[0].cells, ["line1\nline2"]);
});

test("detects the semicolon delimiter", () => {
  const { headers, delimiter } = parseCsv("a;b\n1;2\n");
  assert.equal(delimiter, ";");
  assert.deepEqual(headers, ["a", "b"]);
});

test("strips a UTF-8 BOM", () => {
  const { headers } = parseCsv("\uFEFFa,b\n1,2\n");
  assert.deepEqual(headers, ["a", "b"]);
});

test("reports the line number of each row and skips blank lines", () => {
  const { rows } = parseCsv("a\n1\n\n2\n");
  assert.deepEqual(
    rows.map((r) => r.lineNumber),
    [2, 4]
  );
});

test("throws on an unterminated quote and names the line", () => {
  assert.throws(() => parseCsv('a\n"oops\n'), /line 2/i);
});
