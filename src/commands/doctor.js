import { accessSync, constants, statfsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { EXIT } from "../errors.js";
import { findCli } from "../find-cli.js";

// Environment diagnostics. Output is plain text, easy to paste into an issue.
export async function run(flags) {
  const checks = [];
  let failed = 0;

  // Node version
  const major = parseInt(process.versions.node.split(".")[0], 10);
  const nodeOk = major >= 20;
  if (!nodeOk) failed++;
  checks.push({
    ok: nodeOk,
    label: `Node.js ${process.versions.node}`,
    detail: nodeOk ? ">= 20" : "needs Node 20+",
  });

  // effectcraft-cli location
  const cliPath = findCli(flags.cli);
  if (!cliPath) {
    failed++;
    checks.push({
      ok: false,
      label: "effectcraft-cli",
      detail: "not found (install EffectCraft or set --cli/EFFECTCRAFT_CLI)",
    });
  } else {
    checks.push({ ok: true, label: "effectcraft-cli", detail: cliPath });
    // EffectCraft version + compatibility (P5-04)
    try {
      const out = execFileSync(cliPath, ["info"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      const m = out.match(/EffectCraft\s+([\d.]+)/);
      const version = m ? m[1] : null;
      const tested = loadTestedVersions();
      if (version && tested && !tested.includes(version)) {
        checks.push({
          ok: false,
          label: "EffectCraft version",
          detail: `${version} — not in compat.json (tested: ${tested.join(", ")}). Run \`npm run smoke\`.`,
        });
        failed++;
      } else {
        checks.push({ ok: true, label: "EffectCraft version", detail: version ?? "unknown" });
      }
    } catch {
      checks.push({ ok: false, label: "EffectCraft version", detail: "could not run `info`" });
      failed++;
    }
  }

  // Output folder writable + free disk
  const outDir = flags.out ?? "out";
  try {
    accessSync(outDir === "out" ? "." : outDir, constants.W_OK);
    checks.push({ ok: true, label: `output folder "${outDir}"`, detail: "writable" });
  } catch {
    checks.push({ ok: false, label: `output folder "${outDir}"`, detail: "not writable" });
    failed++;
  }
  try {
    const st = statfsSync(".");
    const freeGB = (st.bavail * st.bsize) / 1024 ** 3;
    checks.push({ ok: freeGB > 1, label: "free disk", detail: `${freeGB.toFixed(1)} GB` });
  } catch {
    /* statfs unavailable */
  }

  // Print
  for (const c of checks) {
    const mark = c.ok ? "PASS" : "FAIL";
    console.log(`[${mark}] ${c.label}${c.detail ? " — " + c.detail : ""}`);
  }
  console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) failed.`);
  return failed === 0 ? EXIT.OK : EXIT.CLI_NOT_FOUND;
}

// Read compat.json (P5-04): the EffectCraft versions this release was tested on.
function loadTestedVersions() {
  try {
    const raw = readFileSync(fileURLToPath(new URL("../../compat.json", import.meta.url)), "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.testedEffectCraft) ? data.testedEffectCraft : null;
  } catch {
    return null;
  }
}
