#!/usr/bin/env node
import { parseArgs } from "node:util";
import { findCli } from "./find-cli.js";
import { readTemplateControls } from "./template.js";
import { readRows } from "./data.js";
import { renderAll } from "./render.js";

const { values } = parseArgs({
  options: {
    template: { type: "string" },
    data: { type: "string" },
    out: { type: "string", default: "out" },
    cli: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help || !values.template || !values.data) {
  console.log(
    "Usage: lakreet-swarm --template <file.ectemplate> --data <file.csv> [--out <folder>]"
  );
  process.exit(values.help ? 0 : 1);
}

const cliPath = findCli(values.cli);
if (!cliPath) {
  console.error("effectcraft-cli was not found.");
  console.error(
    "Install EffectCraft, or point to it with --cli <path> or the EFFECTCRAFT_CLI variable."
  );
  process.exit(1);
}

let controls;
try {
  controls = readTemplateControls(cliPath, values.template);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("cli:", cliPath);
console.log("template:", values.template);
console.log("data:", values.data);
console.log("out:", values.out);

let data;
try {
  data = readRows(values.data, controls);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

if (data.problems.length > 0) {
  console.error(`Found ${data.problems.length} problem(s) in ${values.data}:`);
  for (const problem of data.problems) {
    console.error("- " + problem);
  }
  process.exit(1);
}

console.log(`${data.rows.length} row(s) ready to render.`);

const result = await renderAll({
  cliPath,
  template: values.template,
  rows: data.rows,
  outDir: values.out,
});

console.log(`\nDone: ${result.ok} succeeded, ${result.failed.length} failed.`);
if (result.failed.length > 0) {
  console.error("Failed: " + result.failed.join(", "));
  process.exit(1);
}
