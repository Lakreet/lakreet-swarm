// Output file naming. Supports --name patterns like "{index:3}-{first}".
//
// Tokens:
//   {index}       1-based row number
//   {index:N}     zero-padded to N digits
//   {first}       value of the first data column
//   {<Column>}    value of a named column
//   {slug:<Col>}  slugified value (lowercase, no accents, spaces -> "-")

const RESERVED_WINDOWS = new Set([
  "CON",
  "PRN",
  "AUX",
  "NUL",
  ...Array.from({ length: 9 }, (_, i) => `COM${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `LPT${i + 1}`),
]);

// eslint-disable-next-line no-control-regex
const UNSAFE = /[<>:"/\\|?*\u0000-\u001f]/g;

// Replace characters that are invalid in Windows file names, guard reserved
// names, trim trailing dots/spaces, and cap the length.
export function safeName(text) {
  let cleaned = String(text ?? "")
    .replace(UNSAFE, "_")
    .trim();
  cleaned = cleaned.replace(/[. ]+$/g, "");
  cleaned = cleaned.slice(0, 60);
  if (cleaned === "") return "untitled";
  if (RESERVED_WINDOWS.has(cleaned.toUpperCase())) cleaned = "_" + cleaned;
  return cleaned;
}

export function slugify(text) {
  return String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function padIndex(n, width) {
  const s = String(n);
  return s.length >= width ? s : "0".repeat(width - s.length) + s;
}

// Build one row's file base name (no extension) from a pattern.
export function buildName(pattern, { index, values, firstColumn }) {
  const first = firstColumn != null ? values[firstColumn] : Object.values(values)[0];
  return pattern.replace(/\{([^}]+)\}/g, (_, token) => {
    const [name, arg] = token.split(":");
    if (name === "index") {
      return padIndex(index, arg ? parseInt(arg, 10) : 1);
    }
    if (name === "first") {
      return safeName(String(first ?? ""));
    }
    if (name === "slug") {
      return slugify(values[arg] ?? "");
    }
    return safeName(String(values[name] ?? ""));
  });
}

// Assign unique names across a batch. Collisions get -2, -3, ...
export function assignNames(pattern, rows, firstColumn) {
  const used = new Map();
  return rows.map((row, i) => {
    const index = i + 1;
    let base = buildName(pattern, { index, values: row.values, firstColumn });
    base = safeName(base);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    if (count > 0) base = safeName(`${base}-${count + 1}`);
    return { ...row, index, base };
  });
}
