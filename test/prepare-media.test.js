import { test } from "node:test";
import assert from "node:assert/strict";
import { prepare } from "../src/prepare.js";
import { SwarmError } from "../src/errors.js";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Test that --media-dir flag throws E_MEDIA_UNSUPPORTED
test("prepare rejects --media-dir flag", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-prepare-"));
  const templateFile = join(dir, "template.ectemplate");
  writeFileSync(templateFile, "fake");
  const dataFile = join(dir, "data.csv");
  writeFileSync(dataFile, "col\nval");

  const flags = {
    template: templateFile,
    data: dataFile,
    mediaDir: "some/folder",
    config: undefined,
    allowNoData: false,
    cli: undefined,
  };

  assert.throws(
    () => prepare(flags),
    (err) =>
      err instanceof SwarmError &&
      err.code === "E_MEDIA_UNSUPPORTED" &&
      err.message.includes("--media-dir is not supported yet")
  );
});

// Test that mediaDir in config throws E_MEDIA_UNSUPPORTED
test("prepare rejects mediaDir in config", () => {
  const dir = mkdtempSync(join(tmpdir(), "lakreet-prepare-"));
  const templateFile = join(dir, "template.ectemplate");
  writeFileSync(templateFile, "fake");
  const dataFile = join(dir, "data.csv");
  writeFileSync(dataFile, "col\nval");
  const configFile = join(dir, "lakreet.config.json");
  writeFileSync(configFile, JSON.stringify({ mediaDir: "some/folder" }));

  const flags = {
    template: templateFile,
    data: dataFile,
    mediaDir: undefined,
    config: configFile,
    allowNoData: false,
    cli: undefined,
  };

  assert.throws(
    () => prepare(flags),
    (err) =>
      err instanceof SwarmError &&
      err.code === "E_MEDIA_UNSUPPORTED" &&
      err.message.includes("--media-dir is not supported yet")
  );
});
