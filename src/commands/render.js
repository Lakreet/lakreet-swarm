import { EXIT, SwarmError } from "../errors.js";
import { prepare } from "../prepare.js";
import { runBatch } from "../render.js";
import { buildReport, writeReport, ndjsonStart, ndjsonRow, ndjsonDone } from "../report.js";
import { pacmanBar, formatEta, drawStatus, clearStatus } from "../progress.js";

export async function run(flags) {
  const ctx = prepare(flags);
  const { options, cliPath, templatePath, data, rows } = ctx;

  if (data.problems.length > 0) {
    throw new SwarmError(
      "E_DATA_INVALID",
      `Found ${data.problems.length} problem(s) in ${options.data}:\n` +
        data.problems.map((p) => "- " + p).join("\n")
    );
  }
  for (const w of data.warnings ?? []) console.error("Warning: " + w);

  if (flags.dryRun) {
    console.log(`${rows.length} row(s) valid. Dry run: nothing rendered.`);
    return EXIT.OK;
  }
  if (rows.length === 0) {
    console.log("No rows to render.");
    return EXIT.OK;
  }

  const json = Boolean(flags.json);
  const quiet = Boolean(flags.quiet);
  const animate = !json && !quiet && Boolean(process.stdout.isTTY);
  const startedAt = new Date();
  const durations = [];

  let current = null; // { index, total, base, started, tick }

  const events = {
    onStart(total) {
      if (json) process.stdout.write(ndjsonStart(total) + "\n");
      else if (!quiet) console.log(`Rendering ${total} row(s) with ${cliPath}`);
    },
    onRowStart(row) {
      current = { ...row, started: Date.now(), tick: 0 };
      if (json) return;
      if (animate) draw();
      else if (!quiet) console.log(`[${row.index}/${row.total}] ${row.base} ...`);
    },
    onRowDone(row) {
      if (json) {
        process.stdout.write(ndjsonRow(row) + "\n");
        return;
      }
      const took = row.seconds != null ? row.seconds.toFixed(1) + "s" : "";
      if (row.status === "ok") {
        durations.push(row.seconds);
        if (!quiet) console.log(`[${row.index}/${row.total}] ${row.base}  done in ${took}`);
      } else if (row.status === "failed") {
        if (!quiet) console.log(`[${row.index}/${row.total}] ${row.base}  FAILED`);
        console.error(`  ${row.where}: ${row.error}`);
      }
      current = null;
      if (animate) clearStatus();
    },
    onDone(summary) {
      if (json) process.stdout.write(ndjsonDone(summary) + "\n");
      else if (animate) {
        console.log(`${pacmanBar(1)} 100%`);
      }
    },
  };

  function draw() {
    if (!current) return;
    const elapsed = (Date.now() - current.started) / 1000;
    const average = durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : null;
    const frac = average ? Math.min(0.95, elapsed / average) : 0;
    const overall = (current.index - 1 + frac) / current.total;
    const eta = average ? Math.max(0, (current.total - current.index + 1 - frac) * average) : null;
    const percent = String(Math.floor(overall * 100)).padStart(3, " ");
    drawStatus(
      `${pacmanBar(overall, current.tick++)} ${percent}%  [${current.index}/${current.total}] ${current.base}  ${formatEta(eta)}`
    );
  }
  const timer = animate ? setInterval(draw, 100) : null;

  // Ctrl+C: finish the current render, then stop and write a partial report.
  const state = { interrupted: false };
  const onSigint = () => {
    state.interrupted = true;
    if (animate) clearStatus();
    console.error("\nInterrupted — finishing the current render, then stopping...");
  };
  process.on("SIGINT", onSigint);

  const result = await runBatch({
    cliPath,
    template: templatePath,
    rows,
    outDir: options.out,
    format: options.render?.format ?? flags.format ?? "h264",
    extraArgs: collectRaw(),
    retries: flags.retries ? parseInt(flags.retries, 10) : 0,
    failFast: Boolean(flags.failFast),
    timeout: flags.timeout ? parseFloat(flags.timeout) : 0,
    skipExisting: Boolean(flags.skipExisting),
    keepValues: Boolean(options.keepValues),
    state,
    events,
  });
  process.removeListener("SIGINT", onSigint);
  if (timer) clearInterval(timer);

  // Write reports.
  const report = buildReport({
    version: await pkgVersion(),
    effectcraft: null,
    template: templatePath,
    data: options.data,
    startedAt,
    rows: result.reportRows,
    summary: result.summary,
  });
  writeReport(options.out, report);

  if (!json) {
    const { succeeded, failed, skipped } = result.summary;
    console.log(`\nDone: ${succeeded} succeeded, ${failed} failed, ${skipped} skipped.`);
    if (failed > 0) console.error(`Report: ${options.out}/report.json`);
  }

  if (result.interrupted) return EXIT.INTERRUPTED;
  return result.summary.failed > 0 ? EXIT.RENDER_FAILED : EXIT.OK;
}

function collectRaw() {
  // Arguments after `--` are passed through verbatim.
  const idx = process.argv.indexOf("--");
  return idx >= 0 ? process.argv.slice(idx + 1) : [];
}

async function pkgVersion() {
  const { readFileSync } = await import("node:fs");
  return JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")).version;
}
