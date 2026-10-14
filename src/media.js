import { existsSync, statSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { SwarmError } from "./errors.js";

// Media replacement is supported by EffectCraft via `essential.set` (pipeline
// mode), not via `--values`. See docs/decisions/0001-data-model.md. This module
// validates media *paths* up-front so problems surface before the first render.

export const SUPPORTED_MEDIA = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".mp4",
  ".mov",
  ".webm",
  ".avi",
  ".mkv",
];

const LARGE_FILE_BYTES = 200 * 1024 * 1024; // warn above 200 MB

// Resolve a media cell value to an absolute path.
// baseDir: folder of the data file, or --media-dir when provided.
export function resolveMediaPath(value, baseDir) {
  const raw = String(value).trim();
  if (isAbsolute(raw)) return raw;
  return resolve(baseDir ?? process.cwd(), raw);
}

// Validate a single media value. Returns { path } or { error }.
export function validateMediaValue(value, { where, column, baseDir }) {
  if (value == null || String(value).trim() === "") {
    return { error: `${prefix(where, column)}: empty media path.` };
  }
  const path = resolveMediaPath(value, baseDir);
  if (!existsSync(path)) {
    return { error: `${prefix(where, column)}: file not found: ${path}` };
  }
  let stat;
  try {
    stat = statSync(path);
  } catch {
    return { error: `${prefix(where, column)}: cannot read file: ${path}` };
  }
  if (!stat.isFile()) {
    return { error: `${prefix(where, column)}: not a file: ${path}` };
  }
  const warnings = [];
  if (stat.size > LARGE_FILE_BYTES) {
    warnings.push(
      `${prefix(where, column)}: large media file (${(stat.size / 1024 / 1024).toFixed(0)} MB): ${path}`
    );
  }
  return { path, warnings };
}

function prefix(where, column) {
  const parts = [];
  if (where) parts.push(where);
  if (column) parts.push(`column "${column}"`);
  return parts.length ? parts.join(", ") : "media";
}

// Throw if any media problems exist.
export function assertNoMediaProblems(problems) {
  if (problems.length > 0) {
    throw new SwarmError("E_MEDIA_MISSING", problems.join("\n"));
  }
}
