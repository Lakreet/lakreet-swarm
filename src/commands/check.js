import { EXIT } from "../errors.js";
import { prepare } from "../prepare.js";

// Validate template + data + types + media without rendering.
export async function run(flags) {
  const ctx = prepare(flags);
  const { options, rows, controls, media, data } = ctx;

  const problems = [...data.problems];
  if (problems.length > 0) {
    console.error(`Found ${problems.length} problem(s) in ${options.data}:`);
    for (const p of problems) console.error("- " + p);
    return EXIT.DATA_INVALID;
  }

  for (const w of data.warnings ?? []) console.error("Warning: " + w);

  console.log("OK");
  console.log(`  template:  ${ctx.templatePath}`);
  console.log(
    `  controls:  ${Object.keys(controls).length} (${Object.keys(controls).join(", ") || "-"})`
  );
  if (media.length) console.log(`  media:     ${media.join(", ")}`);
  console.log(`  data:      ${options.data}`);
  console.log(`  rows:      ${rows.length} valid`);
  return EXIT.OK;
}
