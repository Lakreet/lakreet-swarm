import { EXIT, SwarmError } from "../errors.js";
import { findCli } from "../find-cli.js";
import { readTemplate } from "../template.js";

const KNOWN_MANIFEST_VERSION = 1;

// Show a template's controls, media, and composition info.
export async function run(flags) {
  const templatePath = flags.positionals?.[0] ?? flags.template;
  if (!templatePath) {
    throw new SwarmError("E_USAGE", "Usage: lakreet-swarm inspect <template.ectemplate> [--json]");
  }

  const cliPath = findCli(flags.cli);
  if (!cliPath) {
    throw new SwarmError("E_CLI_NOT_FOUND", "effectcraft-cli was not found.");
  }

  const { info } = readTemplate(cliPath, templatePath);

  if (flags.json) {
    console.log(JSON.stringify(info, null, 2));
    return EXIT.OK;
  }

  console.log(`Template: ${templatePath}`);
  console.log(`  name:     ${info.name ?? info.compName ?? "-"}`);
  console.log(`  size:     ${info.width}x${info.height}`);
  console.log(`  duration: ${info.duration}s @ ${round(info.frameRate)} fps`);
  console.log(`  generator:${info.generator ?? "-"}`);
  if (info.version !== KNOWN_MANIFEST_VERSION) {
    console.warn(
      `  WARNING: manifest version ${info.version} is not version ${KNOWN_MANIFEST_VERSION}.`
    );
  }

  const controls = info.controls ?? [];
  if (controls.length) {
    console.log(`\nControls (${controls.length}):`);
    for (const c of controls) {
      const type = c.type ?? c.kind ?? "?";
      const def = c.value !== undefined ? JSON.stringify(c.value) : "";
      const group = c.group ? ` [${c.group}]` : "";
      console.log(`  - ${c.name}  (${type})${group}  default=${def}`);
    }
  } else {
    console.log("\nNo controls.");
  }

  const media = info.media ?? [];
  if (media.length) {
    console.log(`\nMedia (${media.length}):`);
    for (const m of media) {
      console.log(`  - ${m.name ?? m.item}  files=${(m.files ?? []).join(", ")}`);
    }
  }

  return EXIT.OK;
}

function round(n) {
  return n != null ? Math.round(n * 100) / 100 : "-";
}
