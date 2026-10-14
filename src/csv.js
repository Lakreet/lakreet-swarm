// RFC 4180 style CSV parser with delimiter detection
export function parseCsv(text, options = {}) {
  if (text == null) return { headers: [], rows: [], delimiter: options.delimiter || "," };

  let s = text;
  // Strip UTF-8 BOM
  if (s.startsWith("\uFEFF")) {
    s = s.slice(1);
  }

  // Detect delimiter from header line if not specified
  let delimiter = options.delimiter;
  if (!delimiter) {
    const headerLine = s.split(/\r?\n/, 1)[0] || s;
    const candidates = [",", ";", "\t"];
    let best = ",";
    let bestCount = -1;
    for (const c of candidates) {
      let count = 0;
      let inQuotes = false;
      for (let i = 0; i < headerLine.length; i++) {
        const ch = headerLine[i];
        if (ch === '"') {
          inQuotes = !inQuotes;
          continue;
        }
        if (!inQuotes && ch === c) count++;
      }
      if (count > bestCount) {
        bestCount = count;
        best = c;
      }
    }
    delimiter = bestCount > 0 ? best : ",";
  }

  const lines = splitLinesRespectingQuotes(s);
  if (lines.length === 0) {
    return { headers: [], rows: [], delimiter };
  }

  const headers = parseLine(lines[0].text, delimiter);

  const rows = [];
  for (let ln = 1; ln < lines.length; ln++) {
    const line = lines[ln];
    if (line.text.trim() === "") continue;
    const cells = parseLine(line.text, delimiter);
    rows.push({ lineNumber: line.lineNumber, cells });
  }
  return { headers, rows, delimiter };
}

function splitLinesRespectingQuotes(s) {
  const lines = [];
  let current = "";
  let inQuotes = false;
  let lineNumber = 1;
  let i = 0;
  const len = s.length;

  while (i < len) {
    const ch = s[i];
    // Track quote state but always keep the character verbatim;
    // parseLine() re-interprets the quotes.
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
      i++;
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      lines.push({ text: current, lineNumber });
      current = "";
      if (ch === "\r" && s[i + 1] === "\n") {
        i += 2;
      } else {
        i++;
      }
      lineNumber++;
      continue;
    }
    current += ch;
    i++;
  }
  if (inQuotes) {
    throw new Error(`Unterminated quoted field near line ${lineNumber}`);
  }
  lines.push({ text: current, lineNumber });
  return lines;
}

function parseLine(line, delimiter) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  let i = 0;
  const len = line.length;
  while (i < len) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (ch === delimiter) {
        cells.push(current);
        current = "";
        i++;
        continue;
      }
      current += ch;
      i++;
      continue;
    }
  }
  if (inQuotes) {
    throw new Error(`Unterminated quoted field`);
  }
  cells.push(current);
  return cells;
}
