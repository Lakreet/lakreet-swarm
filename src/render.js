import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pacmanBar, formatEta, drawStatus, clearStatus } from "./progress.js";
import { runRender } from "./run-cli.js";

export function safeName(text) {
  const cleaned = text.replace(/[<>:"\/\\|?*]/g, "_").trim();
  return cleaned.slice(0, 60) || "untitled";
}

export async function renderAll({ cliPath, template, rows, outDir }) {
  mkdirSync(outDir, { recursive: true });
  const total = rows.length;
  const animate = Boolean(process.stdout.isTTY);
  const durations = [];
  const failed = [];
  let ok = 0;

  for (const [index, row] of rows.entries()) {
    const first = Object.values(row.values)[0];
    const label = `${index + 1}-${safeName(String(first ?? ""))}`;
    const valuesFile = join(outDir, `${label}.values.json`);
    const videoFile = join(outDir, `${label}.mp4`);
    writeFileSync(valuesFile, JSON.stringify(row.values));

    const prefix = `[${index + 1}/${total}] ${label}`;
    const started = Date.now();
    const average = durations.length
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : null;
    let reported = null;
    let tick = 0;

    const draw = () => {
      const elapsed = (Date.now() - started) / 1000;
      const current = reported ?? (average ? Math.min(0.95, elapsed / average) : 0);
      const overall = (index + current) / total;
      const eta = average ? Math.max(0, (total - index - current) * average) : null;
      const percent = String(Math.floor(overall * 100)).padStart(3, " ");
      drawStatus(`${pacmanBar(overall, tick++)} ${percent}%  ${prefix}  ${formatEta(eta)}`);
    };

    const timer = animate ? setInterval(draw, 100) : null;
    const args = ["render", "--template", template, "--values", valuesFile, "--out", videoFile];
    const result = await runRender(cliPath, args, (p) => {
      reported = p.done / p.total;
    });
    if (timer) {
      clearInterval(timer);
      clearStatus();
    }

    const took = (Date.now() - started) / 1000;
    if (result.ok) {
      durations.push(took);
      ok++;
      console.log(`${prefix}  done in ${took.toFixed(1)}s`);
    } else {
      failed.push(label);
      console.log(`${prefix}  FAILED`);
      console.error(`  line ${row.lineNumber}: ${result.message}`);
    }
  }

  if (animate) console.log(`${pacmanBar(1)} 100%`);
  return { ok, failed };
}
