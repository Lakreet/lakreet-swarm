import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig, mergeOptions, DEFAULT_CONFIG } from "../src/config.js";

test("loadConfig returns {} when no file exists", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-"));
  assert.deepEqual(loadConfig(undefined, dir), {});
});

test("loadConfig loads and validates a config file", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-"));
  const file = join(dir, "lakreet.config.json");
  writeFileSync(file, JSON.stringify({ out: "dist", columns: { Judul: "Title" } }));
  const cfg = loadConfig(file, dir);
  assert.equal(cfg.out, "dist");
  assert.deepEqual(cfg.columns, { Judul: "Title" });
});

test("loadConfig rejects unknown keys", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-"));
  const file = join(dir, "c.json");
  writeFileSync(file, JSON.stringify({ nope: 1 }));
  assert.throws(() => loadConfig(file, dir), /Unknown config key/);
});

test("loadConfig rejects invalid JSON", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-"));
  const file = join(dir, "c.json");
  writeFileSync(file, "{ nope");
  assert.throws(() => loadConfig(file, dir), /not valid JSON/);
});

test("mergeOptions applies precedence: later sources win", () => {
  const merged = mergeOptions([{ out: "a" }, { out: "b", name: "{index}" }]);
  assert.equal(merged.out, "b");
  assert.equal(merged.name, "{index}");
});

test("mergeOptions merges columns and render objects", () => {
  const merged = mergeOptions([
    { columns: { A: "X" }, render: { fps: 30 } },
    { columns: { B: "Y" }, render: { quality: "best" } },
  ]);
  assert.deepEqual(merged.columns, { A: "X", B: "Y" });
  assert.deepEqual(merged.render, { fps: 30, quality: "best" });
});

test("defaults are present", () => {
  const merged = mergeOptions([{}]);
  assert.equal(merged.out, DEFAULT_CONFIG.out);
  assert.equal(merged.name, DEFAULT_CONFIG.name);
});
