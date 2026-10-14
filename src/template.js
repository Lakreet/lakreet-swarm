import { execFileSync } from "node:child_process";

export function readTemplateControls(cliPath, templatePath) {
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
    throw new Error(`Could not read template "${templatePath}": ${reason}`);
  }

  const info = JSON.parse(output);
  const controls = {};
  for (const control of info.controls) {
    controls[control.name] = control.type;
  }
  return controls;
}
