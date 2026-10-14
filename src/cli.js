#!/usr/bin/env node
import { EXIT, SwarmError } from "./errors.js";

const RENDER_OPTIONS = {
  template: { type: "string" },
  data: { type: "string" },
  out: { type: "string" },
  cli: { type: "string" },
  config: { type: "string" },
  name: { type: "string" },
  only: { type: "string" },
  limit: { type: "string" },
  "skip-existing": { type: "boolean" },
  retries: { type: "string" },
  "fail-fast": { type: "boolean" },
  timeout: { type: "string" },
  format: { type: "string" },
  resolution: { type: "string" },
  quality: { type: "string" },
  fps: { type: "string" },
  bitrate: { type: "string" },
  audio: { type: "string" },
  "media-dir": { type: "string" },
  "keep-values": { type: "boolean" },
  "empty-as-default": { type: "boolean" },
  "dry-run": { type: "boolean" },
  json: { type: "boolean" },
  quiet: { type: "boolean" },
  verbose: { type: "boolean" },
  "no-color": { type: "boolean" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
};

function toFlags(parsed) {
  const f = {};
  for (const [key, value] of Object.entries(parsed)) {
    f[key.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
  }
  return f;
}

async function main() {
  const argv = process.argv.slice(2);
  const first = argv[0];

  // Backward compatible: no subcommand, or first token starts with "-", -> render.
  let command = "render";
  let rest = argv;
  if (first && !first.startsWith("-")) {
    command = first;
    rest = argv.slice(1);
  }

  if (command === "help" || rest.includes("--help") || rest.includes("-h")) {
    printHelp();
    process.exit(EXIT.OK);
  }
  if (
    command === "--version" ||
    command === "-v" ||
    rest.includes("--version") ||
    rest.includes("-v")
  ) {
    const { readFileSync } = await import("node:fs");
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
    console.log(pkg.version);
    process.exit(EXIT.OK);
  }

  let flags;
  try {
    const { parseArgs } = await import("node:util");
    const config =
      command === "render" || command === "check" || command === "preview" || command === "init"
        ? RENDER_OPTIONS
        : {};
    const parsed = parseArgs({
      args: rest,
      options: config,
      allowPositionals: true,
      strict: false,
    });
    flags = toFlags(parsed.values);
    flags.positionals = parsed.positionals;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(EXIT.USAGE);
  }

  try {
    switch (command) {
      case "render": {
        const mod = await import("./commands/render.js");
        const code = await mod.run(flags);
        if (typeof code === "number") process.exitCode = code;
        return;
      }
      case "check": {
        const mod = await import("./commands/check.js");
        const code = await mod.run(flags);
        if (typeof code === "number") process.exitCode = code;
        return;
      }
      case "inspect": {
        const mod = await import("./commands/inspect.js");
        const code = await mod.run(flags);
        if (typeof code === "number") process.exitCode = code;
        return;
      }
      case "init": {
        const mod = await import("./commands/init.js");
        const code = await mod.run(flags);
        if (typeof code === "number") process.exitCode = code;
        return;
      }
      case "preview": {
        const mod = await import("./commands/preview.js");
        const code = await mod.run(flags);
        if (typeof code === "number") process.exitCode = code;
        return;
      }
      case "doctor": {
        const mod = await import("./commands/doctor.js");
        const code = await mod.run(flags);
        if (typeof code === "number") process.exitCode = code;
        return;
      }
      default:
        console.error(`Unknown command "${command}".`);
        printHelp();
        process.exit(EXIT.USAGE);
    }
  } catch (error) {
    if (error instanceof SwarmError) {
      console.error(error.format());
      process.exit(error.exitCode);
    }
    console.error(error?.message ?? String(error));
    process.exit(EXIT.RENDER_FAILED);
  }
}

function printHelp() {
  const help = `lakreet-swarm — render many videos from one EffectCraft template + a data file

Usage:
  lakreet-swarm render --template T.ectemplate --data D.csv [options]
  lakreet-swarm check  --template T.ectemplate --data D.csv   (validate only)
  lakreet-swarm init   --template T.ectemplate [--out data.csv]
  lakreet-swarm inspect <template.ectemplate> [--json]
  lakreet-swarm preview --template T --data D [--row N | --all] [--time S]
  lakreet-swarm doctor [--render-test]

Render options:
  --template FILE     EffectCraft template (.ectemplate)
  --data FILE         Data file (.csv/.tsv/.json/.jsonl)
  --out DIR           Output folder (default: out)
  --cli PATH          Path to effectcraft-cli
  --config FILE       Config file (default: lakreet.config.json)
  --name PATTERN      Output name pattern (default: {index}-{first})
  --only LIST         Select rows, e.g. 1,3,5-8
  --limit N           Process only the first N rows
  --skip-existing     Skip rows whose output already exists
  --retries N         Extra attempts for a failed render
  --fail-fast         Stop at the first failure
  --timeout SEC       Per-render timeout
  --format F          h264|webm|png|jpeg|gif|...
  --resolution R      full|half|third|quarter
  --quality Q         best|draft
  --fps N             Frame rate
  --bitrate KBPS      Video bitrate
  --audio MODE        auto|on|off
  --media-dir DIR     Base folder for relative media paths
  --keep-values       Keep per-row values JSON files
  --empty-as-default  Treat empty text cells as template default
  --dry-run           Validate without rendering
  --json              Machine-readable NDJSON output
  --quiet, --verbose  Output verbosity
  --no-color          Disable colour
  -h, --help          Show help
  -v, --version       Show version

Exit codes:
  0 ok · 1 render failed · 2 usage · 3 invalid data · 4 cli not found · 5 template unreadable · 130 interrupted
`;
  console.log(help);
}

// Handle Ctrl+C gracefully: let the running render finish its report, exit 130.
process.on("SIGINT", () => {
  process.exitCode = EXIT.INTERRUPTED;
});

main();
