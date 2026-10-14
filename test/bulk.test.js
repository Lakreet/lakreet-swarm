import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readRows } from "../src/data.js";
import { assignNames, buildName } from "../src/naming.js";
import { selectRows, parseOnly } from "../src/selection.js";

const CONTROLS = { "Source Text": "text", Opacity: "slider" };

function makeCsv(n) {
  const lines = ["Source Text,Opacity"];
  for (let i = 1; i <= n; i++) lines.push(`Berita ke-${i},${(i % 100) + 1}`);
  return lines.join("\n") + "\n";
}

test("validates 500 rows quickly and correctly", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-bulk-"));
  const file = join(dir, "bulk.csv");
  writeFileSync(file, makeCsv(500));

  const started = Date.now();
  const result = readRows(file, CONTROLS, {});
  const elapsed = Date.now() - started;

  assert.equal(result.problems.length, 0);
  assert.equal(result.rows.length, 500);
  assert.equal(result.rows[0].values["Source Text"], "Berita ke-1");
  assert.equal(result.rows[499].values.Opacity, 1); // (500 % 100) + 1 = 1
  // Generous budget: validation must not be quadratic.
  assert.ok(elapsed < 3000, `validation took ${elapsed}ms`);
});

test("assigns 500 unique output names", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-names-"));
  const file = join(dir, "bulk.csv");
  writeFileSync(file, makeCsv(500));
  const { rows } = readRows(file, CONTROLS, {});

  const named = assignNames("{index}-{first}", rows, "Source Text");
  assert.equal(named.length, 500);
  const bases = new Set(named.map((r) => r.base));
  assert.equal(bases.size, 500, "output names must be unique");
});

test("selects a slice of a large batch", () => {
  const rows = Array.from({ length: 500 }, (_, i) => ({ index: i + 1 }));
  assert.equal(selectRows(rows, { only: "1-10" }).length, 10);
  assert.equal(selectRows(rows, { limit: 25 }).length, 25);
  assert.equal(parseOnly("495-500").size, 6);
});

test("buildName is fast across 500 rows", () => {
  const values = { "Source Text": "Judul", Opacity: 50 };
  const started = Date.now();
  for (let i = 1; i <= 500; i++)
    buildName("{index:3}-{Source Text}", { index: i, values, firstColumn: "Source Text" });
  assert.ok(Date.now() - started < 1000);
});
