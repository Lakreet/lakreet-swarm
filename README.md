# lakreet-swarm

Render many videos from one [EffectCraft](https://github.com/storytold/effectcraft) template and a CSV file.

You design a video once in EffectCraft, mark the parts that should change (a title, an opacity, ...), and `lakreet-swarm` renders one video per row of your CSV file. No window, no clicking, no editing each copy by hand.

> **Unofficial.** lakreet-swarm is an independent project. It is not affiliated with, sponsored by, or endorsed by the ArtCraft team or the EffectCraft project. It only calls the `effectcraft-cli` program that ships with EffectCraft.

> **Status: early.** EffectCraft itself is alpha software, and so is this tool. It has only been tested on Windows.

## Requirements

- [EffectCraft](https://github.com/storytold/effectcraft) installed (it includes `effectcraft-cli`)
- [Node.js](https://nodejs.org) 20 or newer

There are no other dependencies, so there is nothing to `npm install`.

## Quick start

```sh
git clone https://github.com/lakreet/lakreet-swarm.git
cd lakreet-swarm
node src/cli.js --template examples/title2.ectemplate --data examples/data.csv
```

You will get one video per CSV row in the `out` folder.

## Usage

```
lakreet-swarm --template <file.ectemplate> --data <file.csv> [--out <folder>] [--cli <path>]
```

| Option         | Description                                               |
| -------------- | --------------------------------------------------------- |
| `--template`   | The EffectCraft template (`.ectemplate`) to render.       |
| `--data`       | The CSV file with one row per video.                      |
| `--out`        | Output folder. Default: `out`.                            |
| `--cli`        | Path to `effectcraft-cli`. Usually not needed, see below. |
| `-h`, `--help` | Show usage.                                               |

### Finding effectcraft-cli

The program is located in this order:

1. the `--cli` option
2. the `EFFECTCRAFT_CLI` environment variable
3. the default Windows install folder (`C:\Program Files\EffectCraft\`)

If you pass `--cli` or set the variable, that exact path must exist; there is no silent fallback.

## The CSV file

The first line holds column names. Each column name must match the name of a control in your template. Every other line becomes one video.

```csv
Source Text,Opacity
Budi,100
Sari,60
Andi,25
```

- Supported control types: **text** and **slider** (numbers). Other types are passed as plain text and are untested.
- The CSV parser is simple: values are split on commas, so quoted values and commas inside values are not supported yet.

Before anything is rendered, every row is checked. All problems are reported together, for example:

```
Found 1 problem(s) in examples/data.csv:
- Line 5, column "Opacity": "abc" is not a number.
```

## Making a template

1. In EffectCraft, build your composition.
2. In the timeline, select the property you want to change per video (for example a text layer's **Source Text**).
3. Choose **Animation ▸ Add Property to Essential Graphics**. Repeat for every property you want to control.
4. Choose **File ▸ Export ▸ Essential Graphics Template...** and save the `.ectemplate` file.

To see the control names (and types) of a template, run this in Command Prompt:

```
"C:\Program Files\EffectCraft\effectcraft-cli.exe" exec essential.templateInfo --params "{\"path\":\"title.ectemplate\"}" --empty --json
```

Look at `name` and `type` for each entry in `controls`. The `name` is the column name to use in your CSV.

## Output

For each row, two files are written to the output folder:

- `<n>-<first column value>.mp4`, the rendered video (characters that are not allowed in file names are replaced by `_`)
- `<n>-<first column value>.values.json`, the values that were used

Rendering keeps going if one video fails. At the end you get a summary, and the exit code is `0` only if everything succeeded (`1` for any validation problem or failed render).

While rendering, a progress bar shows the overall progress. EffectCraft does not report frame progress when its output is captured, so progress inside a single video and the time left are estimates based on the videos already finished.

## Limitations

- Tested on Windows only.
- Simple CSV parsing (see above).
- Videos are rendered one after another, not in parallel.
- Only text and slider controls are validated.

## License

[MIT](LICENSE)
