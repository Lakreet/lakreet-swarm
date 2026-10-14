# Checkpoint P1-03 — RFC 4180 CSV parser

## Scope

- New module `src/csv.js` implementing a dependency-free RFC 4180 parser.
- Wired into `src/data.js` (replaces the old manual `split(",")`).

## Features

- `parseCsv(text, {delimiter?})` returns `{headers, rows, delimiter}`.
- `rows[i]` is `{lineNumber, cells}` — `lineNumber` is the real file line (for error messages).
- Auto-detects delimiter (`,`, `;`, tab) from the header line; can be overridden.
- Handles quoted fields containing the delimiter, embedded line breaks, and `""` escapes.
- Strips a UTF-8 BOM. Accepts `\r\n` and `\n`. Skips blank lines.
- Unterminated quote throws an error naming the line number.
- Excel-style semicolon CSVs and quoted commas verified end-to-end via `readRows`.

## Bug fixed during implementation

`splitLinesRespectingQuotes` originally consumed `"` characters to track quote state
but never appended them, so quotes were stripped before `parseLine` could interpret them.
Fixed to always append characters verbatim.

## Tests

`test/csv.test.js` (7 cases) + existing `test/safe-name.test.js` (3 cases) = 10 passing.

## Commit suggestion (NOT committed, per your instruction)

`[csv] feat: RFC 4180 parser with delimiter detection`
