// Usage: node scripts/ec-exec.js <command-id> <params.json> [extra effectcraft-cli args...]
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { findCli } from "../src/find-cli.js";

const [command, paramsFile, ...extra] = process.argv.slice(2);
if (!command || !paramsFile) {
  console.error("Usage: node scripts/ec-exec.js <command-id> <params.json> [extra args]");
  process.exit(2);
}

const cli = findCli();
if (!cli) {
  console.error("effectcraft-cli not found");
  process.exit(4);
}

const params = JSON.stringify(JSON.parse(readFileSync(paramsFile, "utf8")));
const result = spawnSync(cli, ["exec", command, "--params", params, ...extra], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
