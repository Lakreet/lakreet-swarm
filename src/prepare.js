import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { findCli } from "./find-cli.js";
import { readTemplate } from "./template.js";
import { readRows } from "./data.js";
import { loadConfig, mergeOptions } from "./config.js";
import { assignNames } from "./naming.js";
import { selectRows } from "./selection.js";
import { SwarmError } from "./errors.js";

// Shared setup used by render / check / preview / init.
// Combines CLI flags, config file, and env into resolved options, then loads
// the template and data. Returns everything a command needs.
export function prepare(flags) {
  const config = loadConfig(flags.config);

  // --media-dir is not supported yet (media replacement via essential.set is not implemented).
  if (flags.mediaDir || config.mediaDir) {
    throw new SwarmError(
      "E_MEDIA_UNSUPPORTED",
      "--media-dir is not supported yet; media replacement is not implemented.",
      {
        hint: "Remove --media-dir / mediaDir from config, or use text/number/checkbox controls only.",
      }
    );
  }

  // Column mapping: config.columns may map header -> control.
  const options = mergeOptions([
    {
      out: flags.out,
      name: flags.name,
      jobs: flags.jobs,
      mediaDir: flags.mediaDir,
      delimiter: flags.delimiter,
      keepValues: flags.keepValues,
      emptyAsDefault: flags.emptyAsDefault,
      template: flags.template,
      data: flags.data,
    },
    config,
  ]);

  if (!options.template) {
    throw new SwarmError("E_USAGE", 'Missing --template (or "template" in config).');
  }
  if (!options.data && !flags.allowNoData) {
    throw new SwarmError("E_USAGE", 'Missing --data (or "data" in config).');
  }

  const cliPath = findCli(flags.cli);
  if (!cliPath) {
    throw new SwarmError("E_CLI_NOT_FOUND", "effectcraft-cli was not found.", {
      hint: "Install EffectCraft, or pass --cli <path> or set EFFECTCRAFT_CLI.",
    });
  }

  const templatePath = options.template;
  if (!exists(templatePath)) {
    throw new SwarmError("E_TEMPLATE_UNREADABLE", `Template not found: ${templatePath}`);
  }

  const { controls, info } = readTemplate(cliPath, templatePath);
  const media = (info.media ?? []).map((m) => m.name).filter(Boolean);

  let data = { rows: [], problems: [], warnings: [] };
  if (options.data) {
    const dataPath = options.data;
    if (!exists(dataPath)) {
      throw new SwarmError("E_DATA_UNREADABLE", `Data file not found: ${dataPath}`);
    }
    // Base dir for relative media paths: --media-dir, else the data file's folder.
    const baseDir = options.mediaDir ? resolve(options.mediaDir) : dirname(resolve(dataPath));
    data = readRows(dataPath, controls, {
      media,
      columns: options.columns ?? {},
      baseDir,
      emptyAsDefault: options.emptyAsDefault,
    });
  }

  // Assign unique output names, then apply selection.
  const firstColumn = data.rows[0] ? Object.keys(data.rows[0].values)[0] : null;
  const named = assignNames(options.name, data.rows, firstColumn);
  const selected = selectRows(named, { only: flags.only, limit: flags.limit });

  return { options, cliPath, templatePath, controls, media, info, data, rows: selected };
}

function exists(p) {
  try {
    readFileSync(p);
    return true;
  } catch {
    return false;
  }
}
