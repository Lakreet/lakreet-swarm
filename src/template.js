import { execFileSync } from "node:child_process";
import { SwarmError } from "./errors.js";

// Read a template's manifest via effectcraft-cli.
// Returns { controls: {name: type}, info } where info is the full manifest.
export function readTemplate(cliPath, templatePath) {
  let output;
  try {
    output = execFileSync(
      cliPath,
      [
        "exec",
        "essential.templateInfo",
        "--params",
        JSON.stringify({ path: templatePath }),
        "--empty",
        "--json",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch (error) {
    const reason = error.stderr?.toString().trim() || error.message;
    throw new SwarmError(
      "E_TEMPLATE_UNREADABLE",
      `Could not read template "${templatePath}": ${reason}`
    );
  }

  let info;
  try {
    info = JSON.parse(output);
  } catch (error) {
    throw new SwarmError(
      "E_TEMPLATE_UNREADABLE",
      `Template "${templatePath}" did not return valid JSON: ${error.message}`
    );
  }

  // controls: name -> type (property controls only; media listed separately).
  const controls = {};
  for (const control of info.controls ?? []) {
    if (control.missing) continue;
    controls[control.name] = control.type;
  }
  return { controls, info };
}

// Backwards-compatible helper used by older call sites.
export function readTemplateControls(cliPath, templatePath) {
  return readTemplate(cliPath, templatePath).controls;
}
