# lakreet-swarm

Render many videos from one [EffectCraft](https://github.com/storytold/effectcraft) template and a CSV/JSON file.

**Documentation:** https://lakreet.github.io/swarm/

You design a video once in EffectCraft, mark the parts that should change (a title, an opacity, a checkbox, ...), and `lakreet-swarm` renders one video per row of your data file. No window, no clicking, no editing each copy by hand.

> **Unofficial.** lakreet-swarm is an independent project. It is not affiliated with, sponsored by, or endorsed by the Storytold team or the EffectCraft project. It only calls the `effectcraft-cli` program that ships with EffectCraft.

> **Status: v0.2.0 — early.** EffectCraft itself is alpha software, and so is this tool. It has been tested on Windows (primary), Linux, and macOS with EffectCraft 0.8.0.

[![CI](https://github.com/Lakreet/lakreet-swarm/actions/workflows/ci.yml/badge.svg)](https://github.com/Lakreet/lakreet-swarm/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/lakreet-swarm)](https://www.npmjs.com/package/lakreet-swarm)
[![license](https://img.shields.io/npm/l/lakreet-swarm)](LICENSE)

## Requirements

- [EffectCraft](https://github.com/storytold/effectcraft) installed (it includes `effectcraft-cli`)
- [Node.js](https://nodejs.org) 20 or newer

## Install

```sh
npm install -g lakreet-swarm
# or run locally without installing:
npx lakreet-swarm ...
```

## Quick start

```sh
git clone https://github.com/Lakreet/lakreet-swarm.git
cd lakreet-swarm
npx lakreet-swarm render --template examples/title2.ectemplate --data examples/data.csv
```

You will get one video per data row in the `out` folder.

## Usage

### Commands

```
lakreet-swarm render   --template T.ectemplate --data D.csv [options]   # render batch
lakreet-swarm check    --template T.ectemplate --data D.csv             # validate only
lakreet-swarm init     --template T.ectemplate [--out D.csv]            # generate starter CSV
lakreet-swarm inspect  <template.ectemplate> [--json]                   # show template controls
lakreet-swarm preview  --template T --data D [--row N] [--time S]       # quick PNG frame per row
lakreet-swarm doctor   [--render-test]                                  # environment diagnostics
```

### Render options

| Option                  | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `--template`            | EffectCraft template (`.ectemplate`)                 |
| `--data`                | Data file: `.csv` `.tsv` `.json` `.jsonl` `.ndjson`  |
| `--out`                 | Output folder (default: `out`)                       |
| `--cli`                 | Path to `effectcraft-cli` (or set `EFFECTCRAFT_CLI`) |
| `--config`              | Config file (default: `lakreet.config.json`)         |
| `--name`                | Output name pattern (default: `{index}-{first}`)     |
| `--only`                | Select rows: `1,3,5-8`                               |
| `--limit`               | Process only first N rows                            |
| `--skip-existing`       | Skip rows whose output file already exists           |
| `--retries`             | Extra attempts for a failed render                   |
| `--fail-fast`           | Stop at first failure                                |
| `--timeout`             | Per-render timeout in seconds                        |
| `--format`              | Output format: `h264`, `webm`, `png`, `jpeg`, `gif`  |
| `--resolution`          | `full`, `half`, `third`, `quarter`                   |
| `--quality`             | `best`, `draft`                                      |
| `--fps`                 | Frame rate                                           |
| `--bitrate`             | Video bitrate (kbps)                                 |
| `--audio`               | `auto`, `on`, `off`                                  |
| `--keep-values`         | Keep per-row `.values.json` files                    |
| `--empty-as-default`    | Empty text cells → use template default              |
| `--dry-run`             | Validate without rendering                           |
| `--json`                | NDJSON streaming output                              |
| `--quiet` / `--verbose` | Output verbosity                                     |
| `--no-color`            | Disable colour                                       |
| `-h, --help`            | Show help                                            |
| `-v, --version`         | Show version                                         |

### Finding effectcraft-cli

The program is located in this order:

1. the `--cli` option
2. the `EFFECTCRAFT_CLI` environment variable
3. `effectcraft-cli` on `PATH`
4. the default Windows install folder (`C:\Program Files\EffectCraft\`)

If you pass `--cli` or set the variable, that exact path must exist; there is no silent fallback.

## The data file

The first line holds column names. Each column name must match the name of a control in your template. Every other line becomes one video.

```csv
Source Text,Opacity
Budi,100
Sari,60
Andi,25
```

### Supported formats

| Extension          | Description                                                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `.csv` `.tsv`      | RFC 4180 CSV — auto-detects delimiter (`,`, `;`, tab), handles quoted fields with embedded commas/line breaks/`""` escapes, strips BOM |
| `.json`            | Array of objects, or `{ "rows": [...] }`                                                                                               |
| `.jsonl` `.ndjson` | One JSON object per line                                                                                                               |

### Supported control types

| Type        | Accepted values                                                      |
| ----------- | -------------------------------------------------------------------- |
| `text`      | Any string                                                           |
| `slider`    | Numbers (rejects empty, `NaN`, `Infinity`)                           |
| `checkbox`  | `true`/`yes`/`y`/`1`/`on`/`ya` vs `false`/`no`/`n`/`0`/`off`/`tidak` |
| _(unknown)_ | Fallback to `text`                                                   |

### Column mapping

If your CSV headers don't match the template control names, map them in `lakreet.config.json`:

```json
{
  "columns": { "Judul": "Source Text", "Ketebalan": "Opacity" }
}
```

### Media columns

Replacing images, GIFs and footage is **not supported yet**. EffectCraft's `--values` cannot replace media. If a data column maps to a media control, `check` and `render` stop before rendering with error `E_MEDIA_UNSUPPORTED` (exit code 3). A media control that is not present as a column keeps the template's default media. Use text, number and checkbox controls for now.

### Comment columns

Any column whose header starts with `#` is ignored (e.g., `#notes`, `#internal_id`).

### Validation

Before anything is rendered, every row is checked. All problems are reported together:

```
Found 2 problem(s) in data.csv:
- Line 5, column "Opacity": "abc" is not a number.
- Line 8, column "Logo": file not found: /path/to/missing.png
```

## Config file

Create `lakreet.config.json` in your project root:

```json
{
  "template": "template.ectemplate",
  "data": "data.csv",
  "out": "dist",
  "name": "{index:3}-{slug:Title}",
  "columns": { "Judul": "Source Text" },
  "render": { "format": "webm", "quality": "best" },
  "delimiter": ",",
  "keepValues": false,
  "emptyAsDefault": false
}
```

CLI flags override config file values.

## Output naming

The `--name` pattern supports tokens:

| Token           | Example                                   |
| --------------- | ----------------------------------------- |
| `{index}`       | `1`                                       |
| `{index:3}`     | `001` (zero-padded)                       |
| `{first}`       | first column's value, sanitized           |
| `{ColumnName}`  | any column's value, sanitized             |
| `{slug:Column}` | lowercased, accents removed, spaces → `-` |

Collisions get `-2`, `-3`, … appended automatically.

Windows-reserved names (`CON`, `PRN`, `AUX`, `NUL`, `COM1`…`COM9`, `LPT1`…`LPT9`) are prefixed with `_`.

## Reports

After a render batch, two reports are written to the output folder:

- `report.json` — full machine-readable record (tool version, EffectCraft version, template, data, started/finished timestamps, per-row status, timings, errors, summary)
- `report.csv` — spreadsheet-friendly summary (`index,where,status,output,seconds,error`)

With `--json`, NDJSON events stream to stdout:

```jsonl
{"event":"start","total":100}
{"event":"row","index":1,"where":"line 2","status":"ok","output":"...","seconds":12.3}
{"event":"done","total":100,"succeeded":99,"failed":1,"skipped":0}
```

## Progress & interruption

- TTY: Pac-Man progress bar with ETA
- Non-TTY: Time-based estimate only
- `Ctrl+C`: Finishes the current render, writes a partial report, exits with code `130`. Re-run with `--skip-existing` to resume.

## Exit codes

| Code  | Meaning                     |
| ----- | --------------------------- |
| `0`   | OK                          |
| `1`   | Render failed               |
| `2`   | Usage error                 |
| `3`   | Invalid data                |
| `4`   | `effectcraft-cli` not found |
| `5`   | Template unreadable         |
| `130` | Interrupted (Ctrl+C)        |

## Compatibility matrix

`compat.json` lists tested versions. `doctor` warns if your EffectCraft version isn't listed:

```
[FAIL] EffectCraft version — 0.9.0 — not in compat.json (tested: 0.8.0). Run `npm run smoke`.
```

Tested combinations (as of v0.2.0):

| lakreet-swarm | EffectCraft | Node       | OS                   |
| ------------- | ----------- | ---------- | -------------------- |
| 0.2.0         | 0.8.0       | 20, 22, 24 | win32, linux, darwin |

## Security

- Data values are never placed on a command line, and output names are sanitized before they become file names.
- `eslint` rule forbids shell-string commands in source

## License

[MIT](LICENSE)
