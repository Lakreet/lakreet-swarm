import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Build the run report object (schema from the jobdesk, P2-10).
export function buildReport({ version, effectcraft, template, data, startedAt, rows, summary }) {
  return {
    tool: "lakreet-swarm",
    version,
    effectcraft: effectcraft ?? null,
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    template,
    data,
    summary,
    rows,
  };
}

// Write report.json and report.csv into the output folder.
export function writeReport(outDir, report) {
  writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n");

  const header = ["index", "where", "status", "output", "seconds", "error"];
  const lines = [header.join(",")];
  for (const row of report.rows) {
    lines.push(
      [
        row.index,
        row.where,
        row.status,
        csvEscape(row.output ?? ""),
        row.seconds ?? "",
        csvEscape(row.error ?? ""),
      ].join(",")
    );
  }
  writeFileSync(join(outDir, "report.csv"), lines.join("\n") + "\n");
}

function csvEscape(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// NDJSON event emitters used by --json mode.
export function ndjsonStart(total) {
  return JSON.stringify({ event: "start", total });
}
export function ndjsonRow(row) {
  return JSON.stringify({ event: "row", ...row });
}
export function ndjsonDone(summary) {
  return JSON.stringify({ event: "done", ...summary });
}
