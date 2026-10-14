import { existsSync, writeFileSync } from "node:fs";
import { EXIT, SwarmError } from "../errors.js";
import { findCli } from "../find-cli.js";
import { readTemplate } from "../template.js";

// Generate a starter data file (CSV) from a template's controls.
export async function run(flags) {
  const templatePath = flags.template ?? flags.positionals?.[0];
  if (!templatePath) {
    throw new SwarmError(
      "E_USAGE",
      "Usage: lakreet-swarm init --template T.ectemplate [--out data.csv]"
    );
  }

  const cliPath = findCli(flags.cli);
  if (!cliPath) {
    throw new SwarmError("E_CLI_NOT_FOUND", "effectcraft-cli was not found.");
  }

  const { controls, info } = readTemplate(cliPath, templatePath);
  const mediaNames = (info.media ?? []).map((m) => m.name).filter(Boolean);
  const controlNames = Object.keys(controls);
  const headers = [...controlNames, ...mediaNames];
  if (headers.length === 0) {
    throw new SwarmError("E_TEMPLATE_UNREADABLE", "Template has no controls to export.");
  }

  const outPath = flags.out ?? "data.csv";
  if (existsSync(outPath) && !flags.force) {
    throw new SwarmError("E_USAGE", `${outPath} already exists. Use --force to overwrite.`);
  }

  const rows = Math.max(1, flags.rows ? parseInt(flags.rows, 10) : 1);
  const delimiter = flags.delimiter === "tab" ? "\t" : flags.delimiter || ",";

  // Default row: control defaults; media left blank.
  const defaults = controlNames.map((name) => {
    const info2 = (info.controls ?? []).find((c) => c.name === name);
    const v = info2?.value;
    return v == null ? "" : String(v);
  });
  const blankRow = () => controlNames.map(() => "");

  const lines = [headers];
  for (let i = 0; i < rows; i++) {
    lines.push(i === 0 ? defaults : blankRow());
  }
  const csv = toCsv(lines, delimiter, Boolean(flags.bom));
  writeFileSync(outPath, csv);
  console.log(`Wrote ${outPath} (${rows} row(s), delimiter ${JSON.stringify(delimiter)}).`);
  return EXIT.OK;
}

function toCsv(rows, delimiter, bom) {
  const needsQuotes = new RegExp(`[${delimiter}"\r\n]`);
  const escape = (v) => {
    const s = String(v ?? "");
    return needsQuotes.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const text = rows.map((r) => r.map(escape).join(delimiter)).join("\r\n") + "\r\n";
  return (bom ? "\uFEFF" : "") + text;
}
