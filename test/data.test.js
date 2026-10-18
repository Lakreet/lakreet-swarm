import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readRows } from "../src/data.js";

const CONTROLS = { "Source Text": "text", Opacity: "slider" };

function writeData(name, content) {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-data-"));
  const file = join(dir, name);
  writeFileSync(file, content);
  return file;
}

test("flags an unknown column even when there are no data rows", () => {
  const file = writeData("h.csv", "Source Text,Nope");
  const result = readRows(file, CONTROLS, {});
  assert.equal(result.rows.length, 0);
  assert.equal(result.problems.length, 1);
  assert.match(result.problems[0], /Column "Nope" is not a control/);
});

test("accepts a valid header with data rows", () => {
  const file = writeData("ok.csv", "Source Text,Opacity\nBudi,100\n");
  const result = readRows(file, CONTROLS, {});
  assert.equal(result.problems.length, 0);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0].values, { "Source Text": "Budi", Opacity: 100 });
});

test("reports column-count mismatch", () => {
  const file = writeData("mismatch.csv", "Source Text,Opacity\nBudi\n");
  const result = readRows(file, CONTROLS, {});
  assert.ok(result.problems.some((p) => /expected 2 columns/.test(p)));
});

test("honours a column mapping from config", () => {
  const file = writeData("map.csv", "Judul,Opacity\nHi,50\n");
  const result = readRows(file, CONTROLS, { columns: { Judul: "Source Text" } });
  assert.equal(result.problems.length, 0);
  assert.deepEqual(result.rows[0].values, { "Source Text": "Hi", Opacity: 50 });
});

test("skips comment columns prefixed with #", () => {
  const file = writeData("comment.csv", "Source Text,#note,Opacity\nHi,ignore-me,50\n");
  const result = readRows(file, CONTROLS, {});
  assert.equal(result.problems.length, 0);
  assert.deepEqual(result.rows[0].values, { "Source Text": "Hi", Opacity: 50 });
});

test("empty text cell with emptyAsDefault leaves the control unset", () => {
  const file = writeData("empty.csv", "Source Text,Opacity\n,50\n");
  const result = readRows(file, CONTROLS, { emptyAsDefault: true });
  assert.equal(result.problems.length, 0);
  assert.deepEqual(result.rows[0].values, { Opacity: 50 });
});

test("reads JSON arrays", () => {
  const file = writeData("d.json", JSON.stringify([{ "Source Text": "A", Opacity: 10 }]));
  const result = readRows(file, CONTROLS, {});
  assert.equal(result.problems.length, 0);
  assert.deepEqual(result.rows[0].values, { "Source Text": "A", Opacity: 10 });
});

test("reads JSONL", () => {
  const file = writeData(
    "d.jsonl",
    '{"Source Text":"A","Opacity":10}\n{"Source Text":"B","Opacity":20}\n'
  );
  const result = readRows(file, CONTROLS, {});
  assert.equal(result.rows.length, 2);
  assert.equal(result.problems.length, 0);
});

const MEDIA_CONTROLS = { "Source Text": "text", Logo: "media" };

test("rejects CSV column that maps to a media control", () => {
  const file = writeData("media-col.csv", "Source Text,Logo\nHi,logo.png\n");
  assert.throws(
    () => readRows(file, MEDIA_CONTROLS, { media: ["Logo"] }),
    (err) =>
      err.code === "E_MEDIA_UNSUPPORTED" &&
      err.message.includes('Column "Logo" maps to a media control')
  );
});

test("rejects CSV column mapped via config to a media control", () => {
  const file = writeData("media-map.csv", "Source Text,MyLogo\nHi,logo.png\n");
  assert.throws(
    () => readRows(file, MEDIA_CONTROLS, { media: ["Logo"], columns: { MyLogo: "Logo" } }),
    (err) =>
      err.code === "E_MEDIA_UNSUPPORTED" &&
      err.message.includes('Column "MyLogo" maps to a media control')
  );
});

test("rejects JSON key that maps to a media control", () => {
  const file = writeData("media.json", JSON.stringify([{ "Source Text": "A", Logo: "logo.png" }]));
  assert.throws(
    () => readRows(file, MEDIA_CONTROLS, { media: ["Logo"] }),
    (err) =>
      err.code === "E_MEDIA_UNSUPPORTED" &&
      err.message.includes('Column "Logo" maps to a media control')
  );
});

test("rejects JSONL key that maps to a media control", () => {
  const file = writeData(
    "media.jsonl",
    '{"Source Text":"A","Logo":"logo.png"}\n{"Source Text":"B","Logo":"logo2.png"}\n'
  );
  assert.throws(
    () => readRows(file, MEDIA_CONTROLS, { media: ["Logo"] }),
    (err) =>
      err.code === "E_MEDIA_UNSUPPORTED" &&
      err.message.includes('Column "Logo" maps to a media control')
  );
});

test("allows media control when NOT present as a column (uses template default)", () => {
  const file = writeData("no-media-col.csv", "Source Text\nHi\n");
  const result = readRows(file, MEDIA_CONTROLS, { media: ["Logo"] });
  assert.equal(result.problems.length, 0);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0].values, { "Source Text": "Hi" });
});

test("allows non-media columns alongside media controls in template", () => {
  const file = writeData("mixed.csv", "Source Text,Opacity\nHi,50\n");
  const controls = { "Source Text": "text", Opacity: "slider", Logo: "media" };
  const result = readRows(file, controls, { media: ["Logo"] });
  assert.equal(result.problems.length, 0);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0].values, { "Source Text": "Hi", Opacity: 50 });
});
