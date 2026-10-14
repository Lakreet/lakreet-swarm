import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// P3-06 security guard: no source file may spawn a shell or pass user data
// through a command string. EffectCraft CLI arguments must always be passed as
// an array to spawn/execFile (no shell interpolation).

function collectSources(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules") continue;
      out.push(...collectSources(full));
    } else if (entry.endsWith(".js")) {
      out.push(full);
    }
  }
  return out;
}

const SRC = join(import.meta.dirname, "..", "src");

test("no source file uses shell: true", () => {
  for (const file of collectSources(SRC)) {
    const text = readFileSync(file, "utf8");
    assert.ok(!/shell\s*:\s*true/.test(text), `${file} must not set shell: true`);
  }
});

test("no source file imports execSync/exec (string command)", () => {
  const banned =
    /require\(["']node:child_process["']\)\.(execSync|exec)\b|\bexecSync\s*\(|(?<!\.)\bexec\s*\(/;
  for (const file of collectSources(SRC)) {
    const text = readFileSync(file, "utf8");
    const match = text.match(banned);
    assert.ok(!match, `${file} must not use shell-string execution (found ${match?.[0]})`);
  }
});

test("no source file builds a command string with template literals", () => {
  for (const file of collectSources(SRC)) {
    const text = readFileSync(file, "utf8");
    assert.ok(!/spawn\s*\(\s*[`'"]/.test(text), `${file} must not pass a string command to spawn`);
  }
});
