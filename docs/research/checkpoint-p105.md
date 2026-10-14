# Checkpoint P1-05 — control type registry

## Scope

- New module `src/types.js` with a per-type coercion registry.

## Features

- `coerce(type, raw, {where, column})` → `{ value }` or `{ error }`.
- Registered types:
  - `text` — string passthrough (null → "").
  - `slider` — accepts numbers/numeric strings; rejects empty, NaN, Infinity.
  - `checkbox` — parses `true/yes/y/1/on/ya` and `false/no/n/0/off/tidak` (case-insensitive).
- Unknown types fall back to `text` (so new EffectCraft types don't hard-fail).
- Error messages follow `line N, column "X": ... is not a number.`

## Tests

`test/types.test.js` — 6 cases added; 16/16 total passing.

## Note

Per S0-3 research, only `text` and `slider` are confirmed in templates so far. `checkbox`
and `color` are implemented per the document's proposal; color/point/media finalized
after S0-3 GUI findings (media uses pipeline mode, see ADR-0001).

## Commit suggestion (NOT committed, per your instruction)

`[types] feat: control type registry with per-type coercion`
