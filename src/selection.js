import { SwarmError } from "./errors.js";

// Parse an --only spec like "1,3,5-8" into a sorted, de-duplicated Set of
// 1-based row indices. Throws E_USAGE on malformed input.
export function parseOnly(spec) {
  const selected = new Set();
  if (!spec) return selected;
  for (const part of String(spec).split(",")) {
    const token = part.trim();
    if (token === "") continue;
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = parseInt(range[1], 10);
      const end = parseInt(range[2], 10);
      if (start < 1 || end < start) {
        throw new SwarmError("E_USAGE", `Invalid --only range "${token}".`);
      }
      for (let i = start; i <= end; i++) selected.add(i);
      continue;
    }
    const single = token.match(/^(\d+)$/);
    if (!single) {
      throw new SwarmError("E_USAGE", `Invalid --only entry "${token}".`);
    }
    const n = parseInt(single[1], 10);
    if (n < 1) {
      throw new SwarmError("E_USAGE", `Invalid --only entry "${token}".`);
    }
    selected.add(n);
  }
  return selected;
}

// Apply --only and --limit to rows that already carry an `index` (1-based).
/**
 * @param {Array<{index: number}>} rows
 * @param {{only?: string, limit?: number|string}} [options]
 */
export function selectRows(rows, { only, limit } = {}) {
  let out = rows;
  const selected = parseOnly(only);
  if (selected.size > 0) {
    out = out.filter((r) => selected.has(r.index));
  }
  if (limit != null && limit !== "") {
    const n = Number(limit);
    if (Number.isFinite(n) && n >= 0) out = out.slice(0, Math.floor(n));
  }
  return out;
}
