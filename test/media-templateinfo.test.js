// Regression test for media-control detection, driven by the REAL
// `essential.templateInfo` output of examples/media-test.ectemplate, saved as
// test/fixtures/media-test.templateinfo.json. The fixture was captured with:
//
//   effectcraft-cli exec essential.templateInfo \
//     --params '{"path":"examples/media-test.ectemplate"}' --empty --json
//
// In that output the single control is `Logo` (type "media"), and media[] holds
// { files, item } entries with NO `name`. prepare() derives
//   media = (info.media ?? []).map((m) => m.name).filter(Boolean)
// which is therefore `[]`, so the previous `mediaSet = new Set(media)` was
// empty: a data column mapping to a media control slipped through validation
// and only failed later at render time. The fix derives the media set from
// controls[].type === "media" instead.
//
// `check` and `render` both start with prepare() -> readRows(), so these tests
// drive those entry points directly. readTemplate() spawns effectcraft-cli, so
// a tiny shim — run through process.execPath from a temporary working
// directory — replays the saved fixture without needing EffectCraft installed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { prepare } from "../src/prepare.js";
import { readRows } from "../src/data.js";
import { run as runCheck } from "../src/commands/check.js";
import { run as runRender } from "../src/commands/render.js";
import { SwarmError } from "../src/errors.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const FIXTURE = join(root, "test", "fixtures", "media-test.templateinfo.json");
const TEMPLATE = join(root, "examples", "media-test.ectemplate");
const MEDIA_CSV = join(root, "examples", "media-column.csv");

// Fake effectcraft-cli: replays the saved real templateInfo output. readTemplate()
// spawns `<cli> exec essential.templateInfo --params <json> ...` and resolves the
// command from the current working directory, so the shim is a file literally
// named `exec` in a temp dir that tests chdir() into.
const fakeCliDir = mkdtempSync(join(tmpdir(), "lakreet-fakecli-"));
writeFileSync(
  join(fakeCliDir, "exec"),
  [
    'const { readFileSync } = require("node:fs");',
    "const argv = process.argv.slice(2);",
    'const params = JSON.parse(argv[argv.indexOf("--params") + 1]);',
    'if (!params.path.endsWith("media-test.ectemplate")) {',
    '  console.error("fake effectcraft-cli: unexpected template " + params.path);',
    "  process.exit(1);",
    "}",
    `process.stdout.write(readFileSync(${JSON.stringify(FIXTURE)}, "utf8"));`,
  ].join("\n")
);

// Run fn with cwd switched to the shim folder (readTemplate resolves `exec` from
// cwd), restoring it afterwards — also for promises.
function withFakeCli(fn) {
  const previous = process.cwd();
  process.chdir(fakeCliDir);
  let result;
  try {
    result = fn();
  } catch (error) {
    process.chdir(previous);
    throw error;
  }
  if (result && typeof result.then === "function") {
    return result.finally(() => process.chdir(previous));
  }
  process.chdir(previous);
  return result;
}

// Flags as src/cli.js hands them to check/render. `cli` is node itself: with the
// temp cwd in place, readTemplate() runs `node exec essential.templateInfo ...`.
function flagsFor(dataFile, extra = {}) {
  return { template: TEMPLATE, data: dataFile, cli: process.execPath, ...extra };
}

function writeData(name, content) {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-media-"));
  const file = join(dir, name);
  writeFileSync(file, content);
  return file;
}

// Load the template through prepare() itself (the entry check/render use) with a
// data file whose only column is commented out, then reuse its controls/media.
function templateContext() {
  return withFakeCli(() => prepare(flagsFor(writeData("commented.csv", "#Logo\nlogo.png\n"))));
}

function isMediaUnsupported(error) {
  return (
    error instanceof SwarmError &&
    error.code === "E_MEDIA_UNSUPPORTED" &&
    error.message.includes('Column "Logo" maps to a media control')
  );
}

test("fixture: real templateInfo output has a media control and nameless media entries", () => {
  const info = JSON.parse(readFileSync(FIXTURE, "utf8"));
  assert.equal(info.format, "effectcraft-template");
  const logo = info.controls.find((control) => control.name === "Logo");
  assert.equal(logo?.type, "media");
  // prepare() maps media entries by `name`, which the real output does not carry —
  // so the previous `new Set(media)` was empty for this template.
  assert.deepEqual(Object.keys(info.media[0]).sort(), ["files", "item"]);
});

test("prepare (shared by check and render) fails fast on a media column", () => {
  assert.throws(
    () => withFakeCli(() => prepare(flagsFor(MEDIA_CSV))),
    isMediaUnsupported,
    "a media column must fail with E_MEDIA_UNSUPPORTED"
  );
});

test("check entry point fails fast on a media column", async () => {
  await assert.rejects(() => withFakeCli(() => runCheck(flagsFor(MEDIA_CSV))), isMediaUnsupported);
});

test("render entry point fails fast on a media column", async () => {
  await assert.rejects(
    () => withFakeCli(() => runRender(flagsFor(MEDIA_CSV, { dryRun: true }))),
    isMediaUnsupported
  );
});

test("readRows rejects a CSV media column using the real templateInfo controls", () => {
  const ctx = templateContext();
  assert.throws(
    () => readRows(MEDIA_CSV, ctx.controls, { media: ctx.media, baseDir: dirname(MEDIA_CSV) }),
    isMediaUnsupported
  );
});

test("readRows rejects a JSON media key using the real templateInfo controls", () => {
  const ctx = templateContext();
  const file = writeData("media.json", JSON.stringify([{ Logo: "logo.png" }]));
  assert.throws(
    () => readRows(file, ctx.controls, { media: ctx.media, baseDir: dirname(file) }),
    isMediaUnsupported
  );
});

test("prepare validates a data file that does not touch the media control", () => {
  const ctx = templateContext();
  assert.deepEqual(ctx.controls, { Logo: "media" });
  assert.deepEqual(ctx.media, []); // real media[] entries have no `name`
  assert.equal(ctx.data.problems.length, 0);
  assert.equal(ctx.data.rows.length, 1);
  assert.equal(ctx.rows.length, 1);
});
