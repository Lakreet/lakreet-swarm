import { readFileSync } from "node:fs";

export function readRows(csvPath, controls) {
  let text;
  try {
    text = readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  } catch {
    throw new Error(`Could not read data file "${csvPath}".`);
  }
  if (text.trim() === "") {
    throw new Error(`Data file "${csvPath}" is empty.`);
  }

  const lines = text.split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const problems = [];

  for (const header of headers) {
    if (!Object.hasOwn(controls, header)) {
      problems.push(`Column "${header}" is not a control of the template. Available: ${Object.keys(controls).join(", ")}`);
    }
  }
  if (problems.length > 0) return { rows: [], problems };

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue;
    const lineNumber = i + 1;
    const cells = lines[i].split(",").map((c) => c.trim());

    if (cells.length !== headers.length) {
      problems.push(`Line ${lineNumber}: expected ${headers.length} columns, found ${cells.length}.`);
      continue;
    }

    const values = {};
    headers.forEach((header, col) => {
      if (controls[header] === "slider") {
        const number = Number(cells[col]);
        if (cells[col] === "" || Number.isNaN(number)) {
          problems.push(`Line ${lineNumber}, column "${header}": "${cells[col]}" is not a number.`);
        } else {
          values[header] = number;
        }
      } else {
        values[header] = cells[col];
      }
    });
    rows.push({ lineNumber, values });
  }

  return { rows, problems };
}