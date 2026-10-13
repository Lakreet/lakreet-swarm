import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export function safeName(text) {
  const cleaned = text.replace(/[<>:"\/\\|?*]/g, "_").trim();
  return cleaned.slice(0, 60) || "untitled";
}

export function renderAll({ cliPath, template, rows, outDir }) {
  mkdirSync(outDir, { recursive: true });
  let ok = 0;
  const failed = [];

  for (const [index, row] of rows.entries()) {
    const first = Object.values(row.values)[0];
    const label = `${index + 1}-${safeName(String(first ?? ""))}`;
    const valuesFile = join(outDir, `${label}.values.json`);
    const videoFile = join(outDir, `${label}.mp4`);
    writeFileSync(valuesFile, JSON.stringify(row.values));

    try {
      execFileSync(
        cliPath,
        ["render", "--template", template, "--values", valuesFile, "--out", videoFile],
        { stdio: "inherit" }
      );
      ok++;
    } catch {
      failed.push(label);
      console.error(`FAILED: ${label} (line ${row.lineNumber})`);
    }
  }

  return { ok, failed };
}