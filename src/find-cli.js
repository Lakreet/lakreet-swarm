import { existsSync } from "node:fs";
import { join } from "node:path";

const WINDOWS_DEFAULT = join(
  process.env.ProgramFiles ?? "C:\\Program Files",
  "EffectCraft",
  "effectcraft-cli.exe"
);

export function findCli(explicitPath) {
  const requested = explicitPath ?? process.env.EFFECTCRAFT_CLI;

  if (requested) {
    return existsSync(requested) ? requested : null;
  }

  if (process.platform === "win32" && existsSync(WINDOWS_DEFAULT)) {
    return WINDOWS_DEFAULT;
  }
  return null;
}
