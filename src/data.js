import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { parseCsv } from "./csv.js";
import { coerce } from "./types.js";
import { validateMediaValue } from "./media.js";

// Read a data file and validate every row against the template controls.
//
// Options:
//   controls    { name: type } from the template (property controls)
//   media       [ names ] of media controls (validated as file paths)
//   columns     { csvHeader: controlName } mapping from config
//   baseDir     folder to resolve relative media paths against
//   emptyAsDefault  treat empty text cells as "use template default"
//
// Returns { rows, problems, warnings }.
export function readRows(dataPath, controls, options = {}) {
  const { media = [], columns = {}, baseDir, emptyAsDefault = false } = options;

  let text;
  try {
    text = readFileSync(dataPath, "utf8").replace(/^\uFEFF/, "");
  } catch {
    throw new Error(`Could not read data file "${dataPath}".`);
  }
  if (text.trim() === "") {
    throw new Error(`Data file "${dataPath}" is empty.`);
  }

  const ext = extname(dataPath).toLowerCase();
  let entries;
  let headers = null;
  if (ext === ".json") {
    entries = parseJsonData(text);
  } else if (ext === ".jsonl" || ext === ".ndjson") {
    entries = parseJsonlData(text);
  } else {
    const parsed = parseDelimitedData(text);
    headers = parsed.headers;
    entries = parsed.entries;
  }

  return validateEntries(entries, {
    controls,
    media,
    columns,
    baseDir,
    emptyAsDefault,
    dataPath,
    headers,
  });
}

function parseDelimitedData(text) {
  const { headers, rows } = parseCsv(text);
  const entries = rows.map(({ lineNumber, cells }) => ({
    where: `line ${lineNumber}`,
    lineNumber,
    cells,
  }));
  return { headers, entries };
}

function parseJsonData(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`, { cause: error });
  }
  const list = Array.isArray(data) ? data : Array.isArray(data.rows) ? data.rows : null;
  if (!list) {
    throw new Error(`JSON data must be an array of objects, or { "rows": [...] }.`);
  }
  return list.map((obj, i) => ({ where: `item ${i + 1}`, object: obj }));
}

function parseJsonlData(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "") continue;
    let obj;
    try {
      obj = JSON.parse(line);
    } catch (error) {
      throw new Error(`Invalid JSON on line ${i + 1}: ${error.message}`, { cause: error });
    }
    out.push({ where: `line ${i + 1}`, object: obj });
  }
  return out;
}

function validateEntries(entries, ctx) {
  const { controls, media, columns, baseDir, emptyAsDefault, headers } = ctx;
  const problems = [];
  const warnings = [];
  const allKnown = new Set([...Object.keys(controls), ...media]);
  const mediaSet = new Set(media);

  // Map a CSV header to a control name (honouring config `columns`).
  const mapHeader = (header) => columns[header] ?? header;

  // Validate headers once (delimited data only), even when there are no rows.
  if (headers) {
    for (const header of headers) {
      if (header.startsWith("#")) continue; // comment column
      const target = mapHeader(header);
      if (!allKnown.has(target)) {
        problems.push(
          `Column "${header}" is not a control of the template. Available: ${[...allKnown].join(", ")}`
        );
      }
    }
    if (problems.length > 0) return { rows: [], problems, warnings };
  }

  const rows = [];
  for (const entry of entries) {
    // Normalize to { controlName: rawValue }.
    const byControl = {};
    if (entry.cells) {
      if (headers && entry.cells.length !== headers.length) {
        problems.push(
          `${entry.where}: expected ${headers.length} columns, found ${entry.cells.length}.`
        );
        continue;
      }
      headers.forEach((header, col) => {
        if (header.startsWith("#")) return;
        byControl[mapHeader(header)] = entry.cells[col];
      });
    } else {
      for (const [key, raw] of Object.entries(entry.object)) {
        if (key.startsWith("#")) continue;
        byControl[mapHeader(key)] = raw;
      }
    }

    const values = {};
    for (const [name, raw] of Object.entries(byControl)) {
      const where = entry.where;
      if (mediaSet.has(name)) {
        const result = validateMediaValue(raw, { where, column: name, baseDir });
        if (result.error) {
          problems.push(result.error);
        } else {
          if (result.warnings) warnings.push(...result.warnings);
          values[name] = result.path;
        }
        continue;
      }
      const type = controls[name];
      if (raw === "" && emptyAsDefault) continue; // leave as template default
      const result = coerce(type, raw, { where, column: name });
      if (result.error) {
        problems.push(result.error);
      } else {
        values[name] = result.value;
      }
    }
    rows.push({ where: entry.where, lineNumber: entry.lineNumber, values });
  }

  return { rows, problems, warnings };
}
