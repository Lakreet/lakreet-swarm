import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { runBatch } from "../src/render.js";

function tempDir() {
  return mkdtempSync(join(tmpdir(), "lakreet-batch-"));
}

// A fake runner: succeeds unless the row's values carry { fail: true }.
function makeRunner() {
  const calls = [];
  const runner = async (cliPath, args) => {
    calls.push({ cliPath, args });
    const valuesFile = args[args.indexOf("--values") + 1];
    const values = JSON.parse(readFileSync(valuesFile, "utf8"));
    if (values.Fail) return { ok: false, message: "boom" };
    return { ok: true, code: 0 };
  };
  return { runner, calls };
}

function row(index, base, values) {
  return { index, where: `line ${index + 1}`, base, values };
}

test("runBatch renders every row and reports success", async () => {
  const outDir = tempDir();
  const { runner, calls } = makeRunner();
  const rows = [row(1, "a", { Name: "A" }), row(2, "b", { Name: "B" })];

  const result = await runBatch({
    cliPath: "fake",
    template: "t.ectemplate",
    rows,
    outDir,
    runner,
  });

  assert.equal(result.summary.succeeded, 2);
  assert.equal(result.summary.failed, 0);
  assert.equal(calls.length, 2);
  assert.ok(existsSync(join(outDir, "a.mp4")) === false); // fake runner does not create files
});

test("runBatch records failures and does not retry by default", async () => {
  const outDir = tempDir();
  const { runner, calls } = makeRunner();
  const rows = [row(1, "bad", { Fail: true })];

  const result = await runBatch({
    cliPath: "fake",
    template: "t",
    rows,
    outDir,
    runner,
  });

  assert.equal(result.summary.failed, 1);
  assert.equal(calls.length, 1);
  assert.equal(result.reportRows[0].status, "failed");
  assert.equal(result.reportRows[0].error, "boom");
});

test("runBatch retries a failed render", async () => {
  const outDir = tempDir();
  const { runner, calls } = makeRunner();
  const rows = [row(1, "bad", { Fail: true })];

  await runBatch({
    cliPath: "fake",
    template: "t",
    rows,
    outDir,
    retries: 3,
    runner,
  });

  assert.equal(calls.length, 4); // 1 initial + 3 retries
});

test("runBatch fail-fast stops the batch", async () => {
  const outDir = tempDir();
  const { runner, calls } = makeRunner();
  const rows = [row(1, "bad", { Fail: true }), row(2, "ok", {}), row(3, "ok2", {})];

  const result = await runBatch({
    cliPath: "fake",
    template: "t",
    rows,
    outDir,
    failFast: true,
    runner,
  });

  assert.equal(calls.length, 1);
  assert.equal(result.summary.failed, 1);
  assert.ok(result.summary.total < 3);
});

test("runBatch skips rows whose output already exists", async () => {
  const outDir = tempDir();
  const { runner, calls } = makeRunner();
  // Pre-create the output file for row 1.
  const { writeFileSync } = await import("node:fs");
  writeFileSync(join(outDir, "a.mp4"), "x");

  const rows = [row(1, "a", {}), row(2, "b", {})];
  const result = await runBatch({
    cliPath: "fake",
    template: "t",
    rows,
    outDir,
    skipExisting: true,
    runner,
  });

  assert.equal(result.summary.skipped, 1);
  assert.equal(result.summary.succeeded, 1);
  assert.equal(calls.length, 1);
});

test("runBatch emits lifecycle events", async () => {
  const outDir = tempDir();
  const { runner } = makeRunner();
  const rows = [row(1, "a", {})];
  const events = [];

  await runBatch({
    cliPath: "fake",
    template: "t",
    rows,
    outDir,
    runner,
    events: {
      onStart: (total) => events.push(["start", total]),
      onRowStart: (r) => events.push(["rowStart", r.index]),
      onRowDone: (r) => events.push(["rowDone", r.status]),
      onDone: (s) => events.push(["done", s.succeeded]),
    },
  });

  assert.deepEqual(events, [
    ["start", 1],
    ["rowStart", 1],
    ["rowDone", "ok"],
    ["done", 1],
  ]);
});
