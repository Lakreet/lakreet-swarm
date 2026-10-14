import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SwarmError } from "./errors.js";

// lakreet.config.json loader. Value precedence:
//   CLI flags > config file > environment > defaults.
// `columns` maps CSV header -> template control name.

const VALID_KEYS = new Set([
  "template",
  "data",
  "out",
  "name",
  "columns",
  "render",
  "jobs",
  "mediaDir",
  "delimiter",
  "keepValues",
  "emptyAsDefault",
]);

/**
 * Baseline options every command starts from. `template` and `data` default to
 * null so callers must supply them (via flag or config) before rendering.
 *
 * @type {{
 *   template: string|null,
 *   data: string|null,
 *   out: string,
 *   name: string,
 *   columns: Record<string, string>,
 *   render: Record<string, any>,
 *   jobs: number,
 *   mediaDir: string|null,
 *   delimiter: string|null,
 *   keepValues: boolean,
 *   emptyAsDefault: boolean
 * }}
 */
export const DEFAULT_CONFIG = {
  template: null,
  data: null,
  out: "out",
  name: "{index}-{first}",
  columns: {},
  render: {},
  jobs: 1,
  mediaDir: null,
  delimiter: null,
  keepValues: false,
  emptyAsDefault: false,
};

// Find and load a config file. Returns {} when none is present.
// explicitPath: value of --config, if any.
export function loadConfig(explicitPath, cwd = process.cwd()) {
  let path = explicitPath;
  if (!path) {
    const candidate = join(cwd, "lakreet.config.json");
    if (existsSync(candidate)) path = candidate;
  }
  if (!path) return {};
  if (!existsSync(path)) {
    throw new SwarmError("E_CONFIG_INVALID", `Config file not found: ${path}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new SwarmError("E_CONFIG_INVALID", `Config file is not valid JSON: ${error.message}`);
  }
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SwarmError("E_CONFIG_INVALID", `Config file must contain a JSON object.`);
  }

  for (const key of Object.keys(parsed)) {
    if (!VALID_KEYS.has(key)) {
      throw new SwarmError("E_CONFIG_INVALID", `Unknown config key "${key}" in ${path}.`);
    }
  }
  return parsed;
}

// Merge sources by precedence. Later arguments win.
export function mergeOptions(sources) {
  const merged = { ...DEFAULT_CONFIG };
  for (const src of sources) {
    if (!src) continue;
    for (const [key, value] of Object.entries(src)) {
      if (value === undefined) continue;
      if (key === "columns" || key === "render") {
        merged[key] = { ...(merged[key] ?? {}), ...value };
      } else {
        merged[key] = value;
      }
    }
  }
  return merged;
}
