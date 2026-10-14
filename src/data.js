import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { parseCsv } from "./csv.js";

// Read a data file and return { rows, problems }.
// The parser is chosen by extension: .csv/.tsv, .json, .jsonl/.ndjson.
export function readRows(dataPath, controls) {
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
  let entries; // [{ where, values }]
  if (ext === ".json") {
    entries = parseJsonData(text);
  } else if (ext === ".jsonl" || ext === ".ndjson") {
    entries = parseJsonlData(text);
  } else {
    entries = parseDelimitedData(text);
  }

  return validateEntries(entries, controls);
}

function parseDelimitedData(text) {
  const { headers, rows } = parseCsv(text);
  return rows.map(({ lineNumber, cells }) => ({
    where: `line ${lineNumber}`,
    lineNumber,
    headers,
    cells,
  }));
}

function parseJsonData(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
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
      throw new Error(`Invalid JSON on line ${i + 1}: ${error.message}`);
    }
    out.push({ where: `line ${i + 1}`, object: obj });
  }
  return out;
}

function validateEntries(entries, controls) {
  const problems = [];
  const known = Object.keys(controls);

  // For delimited data, validate headers once up-front.
  const first = entries[0];
  if (first && first.headers) {
    for (const header of first.headers) {
      if (!Object.hasOwn(controls, header)) {
        problems.push(
          `Column "${header}" is not a control of the template. Available: ${known.join(", ")}`
        );
      }
    }
    if (problems.length > 0) return { rows: [], problems };
  }

  const rows = [];
  for (const entry of entries) {
    let values = {};
    if (entry.headers) {
      // Delimited row: cells line up with headers.
      if (entry.cells.length !== entry.headers.length) {
        problems.push(
          `${entry.where}: expected ${entry.headers.length} columns, found ${entry.cells.length}.`
        );
        continue;
      }
      entry.headers.forEach((header, col) => {
        values[header] = entry.cells[col];
      });
    } else {
      // JSON / JSONL object.
      values = entry.object;
      for (const key of Object.keys(values)) {
        if (key.startsWith("#")) continue; // comment column
        if (!Object.hasOwn(controls, key)) {
          problems.push(
            `${entry.where}, column "${key}": not a control of the template. Available: ${known.join(", ")}`
          );
        }
      }
    }

    // Coerce values by control type.
    for (const [key, raw] of Object.entries(values)) {
      if (key.startsWith("#")) continue;
      const type = controls[key];
      if (type === "slider") {
        const number = typeof raw === "number" ? raw : Number(String(raw).trim());
        if (raw === "" || raw == null || Number.isNaN(number)) {
          problems.push(`${entry.where}, column "${key}": "${raw}" is not a number.`);
        } else {
          values[key] = number;
        }
      } else {
        values[key] = raw == null ? "" : typeof raw === "string" ? raw : String(raw);
      }
    }
    rows.push({ where: entry.where, lineNumber: entry.lineNumber, values });
  }

  return { rows, problems };
}
