import { mkdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runRender } from "./run-cli.js";
import { safeName } from "./naming.js";

// Core batch engine. Renders one video per row.
//
// ctx:
//   cliPath, template, rows (each with .index/.base/.values), outDir
//   format        EffectCraft --format value (h264 default)
//   extraArgs     raw args after `--`
//   retries       number of extra attempts on failure
//   failFast      stop at first failure
//   timeout       per-render timeout in seconds (0 = none)
//   skipExisting  skip rows whose output file already exists and is non-empty
//   keepValues    keep the per-row values JSON files
//   runner        injectable runner for tests
//   events        { onStart, onRowStart, onRowDone, onDone }
//
// Returns { report, exitCode }.
export async function runBatch(ctx) {
  const {
    cliPath,
    template,
    rows,
    outDir,
    format = "h264",
    extraArgs = [],
    retries = 0,
    failFast = false,
    timeout = 0,
    skipExisting = false,
    keepValues = false,
    runner,
    state = {},
    events = {},
  } = ctx;

  mkdirSync(outDir, { recursive: true });
  const valuesDir = join(outDir, ".lakreet", "values");
  mkdirSync(valuesDir, { recursive: true });

  const total = rows.length;
  if (events.onStart) events.onStart(total);

  const durations = [];
  const reportRows = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    if (state.interrupted) break;

    const videoFile = join(outDir, `${row.base}.${extensionFor(format)}`);
    const valuesFile = join(valuesDir, `${row.base}.values.json`);

    // --skip-existing
    if (skipExisting && existsNonEmpty(videoFile)) {
      skipped++;
      reportRows.push({
        index: row.index,
        where: row.where,
        status: "skipped",
        output: videoFile,
        seconds: 0,
        error: null,
      });
      if (events.onRowDone) {
        events.onRowDone({
          index: row.index,
          total,
          where: row.where,
          base: row.base,
          status: "skipped",
          output: videoFile,
        });
      }
      continue;
    }

    writeFileSync(valuesFile, JSON.stringify(row.values));

    if (events.onRowStart) {
      events.onRowStart({ index: row.index, where: row.where, total, base: row.base });
    }

    const start = Date.now();
    const result = await attemptRender({
      cliPath,
      template,
      valuesFile,
      videoFile,
      format,
      extraArgs,
      retries,
      timeout,
      runner,
    });
    const seconds = (Date.now() - start) / 1000;

    if (!keepValues && result.ok) {
      try {
        unlinkSync(valuesFile);
      } catch {
        /* best-effort */
      }
    }

    if (result.ok) {
      succeeded++;
      durations.push(seconds);
      reportRows.push({
        index: row.index,
        where: row.where,
        status: "ok",
        output: videoFile,
        seconds: round(seconds),
        error: null,
      });
      if (events.onRowDone) {
        events.onRowDone({
          index: row.index,
          total,
          where: row.where,
          base: row.base,
          status: "ok",
          output: videoFile,
          seconds,
        });
      }
    } else {
      failed++;
      reportRows.push({
        index: row.index,
        where: row.where,
        status: "failed",
        output: videoFile,
        seconds: round(seconds),
        error: result.message || "render failed",
      });
      if (events.onRowDone) {
        events.onRowDone({
          index: row.index,
          total,
          where: row.where,
          base: row.base,
          status: "failed",
          output: videoFile,
          seconds,
          error: result.message,
        });
      }
      if (failFast) break;
    }
  }

  const summary = { total: succeeded + failed + skipped, succeeded, failed, skipped };
  if (events.onDone) events.onDone(summary);

  return {
    reportRows,
    summary,
    interrupted: Boolean(state.interrupted),
    durationAvg: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
  };
}

async function attemptRender({
  cliPath,
  template,
  valuesFile,
  videoFile,
  format,
  extraArgs,
  retries,
  timeout,
  runner,
}) {
  const args = [
    "render",
    "--template",
    template,
    "--values",
    valuesFile,
    "--out",
    videoFile,
    "--format",
    format,
    ...extraArgs,
  ];
  let last = { ok: false, message: "render failed" };
  for (let attempt = 0; attempt <= retries; attempt++) {
    last = await runRender(cliPath, args, null, { timeout: timeout * 1000, runner });
    if (last.ok) return last;
  }
  return last;
}

function extensionFor(format) {
  switch (format) {
    case "webm":
      return "webm";
    case "png":
      return "png";
    case "jpeg":
      return "jpg";
    case "gif":
      return "gif";
    default:
      return "mp4";
  }
}

function existsNonEmpty(path) {
  try {
    return statSync(path).size > 0;
  } catch {
    return false;
  }
}

function round(n) {
  return Math.round(n * 10) / 10;
}

export { safeName };
