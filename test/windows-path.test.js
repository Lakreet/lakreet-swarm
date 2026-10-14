import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { safeName, slugify, buildName } from "../src/naming.js";
import { readRows } from "../src/data.js";
import { findCli } from "../src/find-cli.js";

const CONTROLS = { "Source Text": "text", Opacity: "slider" };

test("safeName keeps spaces (they are valid in file names)", () => {
  assert.equal(safeName("Judul Berita"), "Judul Berita");
});

test("safeName keeps Unicode letters", () => {
  assert.equal(safeName("Ñoño Café"), "Ñoño Café");
});

test("safeName strips characters invalid on Windows", () => {
  assert.ok(!/[<>:"/\\|?*]/.test(safeName('a<b>c"d"e/f\\g|h?i*j')));
});

test("safeName trims trailing dots and spaces (Windows-hostile)", () => {
  assert.equal(safeName("name. "), "name");
  assert.equal(safeName("name..."), "name");
});

test("slugify handles Unicode and spaces", () => {
  assert.equal(slugify("  Cerita Terbaru  "), "cerita-terbaru");
  assert.equal(slugify("Été & Hiver"), "ete-hiver");
});

test("buildName output survives safeName round-trip", () => {
  const name = buildName("{index}-{first}", {
    index: 12,
    values: { Name: "A/B: C?" },
    firstColumn: "Name",
  });
  const safe = safeName(name);
  assert.ok(!/[<>:"/\\|?*]/.test(safe));
});

test("reads a data file from a path containing spaces and Unicode", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet "));
  const sub = join(dir, "Folder Ñoño");
  mkdirSync(sub, { recursive: true });
  const file = join(sub, "data berita.csv");
  writeFileSync(file, "Source Text,Opacity\nBudi,100\n");
  const result = readRows(file, CONTROLS, {});
  assert.equal(result.problems.length, 0);
  assert.equal(result.rows[0].values["Source Text"], "Budi");
});

test("findCli returns null for a nonexistent explicit path (no silent fallback)", () => {
  assert.equal(findCli(join("no", "such", "cli.exe")), null);
});

test("findCli accepts an explicit path containing spaces", () => {
  const dir = mkdtempSync(join(tmpdir(), "cli dir "));
  const file = join(dir, "effectcraft-cli.exe");
  writeFileSync(file, "");
  assert.equal(findCli(file), file);
});
