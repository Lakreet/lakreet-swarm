import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { EXIT, SwarmError } from "../errors.js";
import { prepare } from "../prepare.js";

// Render one frame per selected row to PNG (fast visual check).
/**
 * @param {{template?:string, data?:string, out?:string, cli?:string, config?:string, name?:string, only?:string, limit?:string, 'media-dir'?:string, 'keep-values'?:boolean, 'empty-as-default'?:boolean, row?:string, time?:string, json?:boolean, quiet?:boolean, verbose?:boolean, 'no-color'?:boolean, help?:boolean, version?:boolean, positionals?:string[]}} flags
 */
export async function run(flags) {
  /** @type {{ options: any, cliPath: string, templatePath: string, rows: Array<{index:number, base:string, values:Object, where:string}>, data: any }} */
  const ctx = prepare(flags);
  const { options, cliPath, templatePath, rows } = ctx;

  if (dataHasProblems(ctx.data)) {
    throw new SwarmError("E_DATA_INVALID", ctx.data.problems.join("\n"));
  }
  if (rows.length === 0) {
    console.log("No rows to preview.");
    return EXIT.OK;
  }

  const outDir = join(options.out, "preview");
  mkdirSync(outDir, { recursive: true });
  const time = flags.time != null ? parseFloat(flags.time) : 0;

  // --row N is 1-based; default is all rows.
  const wanted = flags.row != null ? parseInt(flags.row, 10) : null;
  const targets = wanted != null ? rows.filter((r) => r.index === wanted) : rows;
  if (targets.length === 0) {
    throw new SwarmError("E_USAGE", `Row ${wanted} not found (data has ${rows.length} rows).`);
  }

  const valuesDir = join(options.out, ".lakreet", "values");
  mkdirSync(valuesDir, { recursive: true });

  const written = [];
  for (const row of targets) {
    const valuesFile = join(valuesDir, `${row.base}.values.json`);
    writeFileSync(valuesFile, JSON.stringify(row.values));
    const png = join(outDir, `${row.index}-${row.base}.png`);
    execFileSync(
      cliPath,
      [
        "render-frame",
        "--template",
        templatePath,
        "--values",
        valuesFile,
        "--time",
        String(time),
        "--out",
        png,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    written.push({ row, png });
  }

  if (targets.length > 1) {
    writeGallery(join(outDir, "index.html"), written);
  }

  for (const { png } of written) console.log(png);
  if (written.length > 1) console.log(`Gallery: ${join(outDir, "index.html")}`);
  return EXIT.OK;
}

function dataHasProblems(data) {
  return data && data.problems && data.problems.length > 0;
}

function writeGallery(path, items) {
  const cards = items
    .map(
      ({ row, png }) =>
        `<figure><img loading="lazy" src="${escapeHtml(baseName(png))}" alt="row ${row.index}"><figcaption>row ${row.index}: ${escapeHtml(row.base)}</figcaption></figure>`
    )
    .join("\n");
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Preview</title>
<style>
body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:2rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem}
figure{margin:0}img{width:100%;border-radius:8px;background:#000}
figcaption{font-size:.85rem;opacity:.7;margin-top:.35rem}
</style>
<div class="grid">
${cards}
</div>
`;
  writeFileSync(path, html);
}

function baseName(p) {
  return p.split(/[\\/]/).pop();
}
function escapeHtml(s) {
  return String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );
}
