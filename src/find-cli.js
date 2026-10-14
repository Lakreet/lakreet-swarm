import { statSync } from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";

const BINARY = process.platform === "win32" ? "effectcraft-cli.exe" : "effectcraft-cli";

// Default install location on Windows.
const WINDOWS_DEFAULT = join(
  process.env.ProgramFiles ?? "C:\\Program Files",
  "EffectCraft",
  "effectcraft-cli.exe"
);

function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

// Look for the binary in PATH (honouring PATHEXT on Windows).
function searchPath() {
  const pathEnv = process.env.PATH ?? process.env.Path ?? "";
  const dirs = pathEnv.split(delimiter).filter(Boolean);
  const exts =
    process.platform === "win32"
      ? (process.env.PATHEXT ?? ".EXE;.CMD;.BAT;.COM").split(";").filter(Boolean)
      : [""];

  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = join(dir, BINARY.replace(/\.exe$/i, "") + ext.toLowerCase());
      if (isFile(candidate)) return candidate;
      const upper = join(dir, BINARY.replace(/\.exe$/i, "") + ext.toUpperCase());
      if (isFile(upper)) return upper;
    }
    const plain = join(dir, BINARY);
    if (isFile(plain)) return plain;
  }
  return null;
}

// Resolve the effectcraft-cli binary.
// explicitPath: --cli value. An explicit path must exist (no silent fallback).
export function findCli(explicitPath) {
  const requested = explicitPath ?? process.env.EFFECTCRAFT_CLI;

  if (requested) {
    const resolved = isAbsolute(requested) ? requested : resolve(requested);
    return isFile(resolved) ? resolved : null;
  }

  const fromPath = searchPath();
  if (fromPath) return fromPath;

  if (process.platform === "win32" && isFile(WINDOWS_DEFAULT)) {
    return WINDOWS_DEFAULT;
  }
  return null;
}
