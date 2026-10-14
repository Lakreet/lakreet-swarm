#!/usr/bin/env node
// Smoke test: exercise the CLI end-to-end without a full render.
// Usage: node scripts/smoke.js
import { spawnSync } from "node:child_process";
import { mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const cli = join(root, "src", "cli.js");
const template = join(root, "examples", "title2.ectemplate");
const data = join(root, "examples", "data.csv");

let failures = 0;

function step(name, args, expected = 0) {
  const r = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", cwd: root });
  const code = r.status;
  const ok = code === expected;
  if (ok) {
    console.log(`PASS  ${name} (exit ${code})`);
  } else {
    failures++;
    console.error(`FAIL  ${name} (exit ${code}, expected ${expected})`);
    console.error(`      stdout: ${(r.stdout || "").trim().split("\n").slice(0, 3).join(" | ")}`);
    console.error(`      stderr: ${(r.stderr || "").trim().split("\n").slice(0, 3).join(" | ")}`);
  }
  return r;
}

step("--version prints a version", ["--version"]);
step("help exits 0", ["help"]);
step("unknown command exits 2", ["no-such-command"], 2);
step("doctor reports the environment", ["doctor"]);
step("inspect reads the example template", ["inspect", template]);
step("check validates the example CSV", ["check", "--template", template, "--data", data]);
step(
  "check rejects a missing data file",
  ["check", "--template", template, "--data", "nope.csv"],
  3
);

// Dry run must not create output.
const out = mkdtempSync(join(tmpdir(), "lakreet-smoke-"));
step("render --dry-run exits 0", [
  "render",
  "--template",
  template,
  "--data",
  data,
  "--out",
  out,
  "--dry-run",
]);
if (existsSync(join(out, "report.json"))) {
  failures++;
  console.error("FAIL  dry run must not write a report");
} else {
  console.log("PASS  dry run wrote nothing");
}

// init generates a starter CSV.
const initOut = join(mkdtempSync(join(tmpdir(), "lakreet-init-")), "starter.csv");
step("init writes a starter CSV", ["init", "--template", template, "--out", initOut]);

console.log(failures === 0 ? "\nSmoke test passed." : `\nSmoke test: ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
