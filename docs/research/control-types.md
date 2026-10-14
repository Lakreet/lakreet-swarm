# Control types and value shapes (S0-3, in progress)

Date: 2026-10-14
EffectCraft version: 0.8.0

## Known from existing template

From `examples/title2.ectemplate` manifest:

- `Source Text` (layer 2, Test): `type: "text"`, `value: "Test"`, `kind: "property"`, `path: "text/sourceText"`
- `Opacity` (layer 2, Test): `type: "slider"`, `value: 100.0`, `kind: "property"`, `path: "transform/opacity"`

## Media control (from S0-2)

- `type: "media"`, `kind: "media"`

## Findings so far

Template rendering via `--values` accepts scalar values for scalar controls. For text, pass string. For slider, pass number. Media cannot be passed via `--values` (see S0-2). Other control types (color, checkbox, point, dropdown) require examining template manifests with those controls.

## Table

| path example        | type   | shape in `--values` | CSV format     | notes                                  |
| ------------------- | ------ | ------------------- | -------------- | -------------------------------------- |
| `text/sourceText`   | text   | string              | raw text       | empty cell → empty string by default   |
| `transform/opacity` | slider | number              | numeric string | validated as number                    |
| (media)             | media  | N/A via `--values`  | file path      | requires pipeline mode (essential.set) |

Further investigation needed: build templates with color, checkbox, point controls (requires GUI in EffectCraft) or find examples. Also need to understand how `essential.canAdd` behaves for different property types and what the actual `type` strings are.

## Methodology for S0-3 (remaining)

1. Create test templates with various control types in EffectCraft GUI if possible.
2. For each, read manifest via `essential.templateInfo`.
3. Try setting values via `--values` and record what works.
4. Document in this file.

_This file will be updated as research progresses._
