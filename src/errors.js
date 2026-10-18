// Central error catalog. Every user-facing failure is a SwarmError carrying a
// stable code, a process exit code, and a human hint.

export const EXIT = {
  OK: 0,
  RENDER_FAILED: 1,
  USAGE: 2,
  DATA_INVALID: 3,
  CLI_NOT_FOUND: 4,
  TEMPLATE_UNREADABLE: 5,
  INTERRUPTED: 130,
};

const CATALOG = {
  E_USAGE: { exitCode: EXIT.USAGE, hint: "Run with --help to see the correct usage." },
  E_DATA_UNREADABLE: {
    exitCode: EXIT.DATA_INVALID,
    hint: "Check the file path and that the file is readable.",
  },
  E_DATA_INVALID: {
    exitCode: EXIT.DATA_INVALID,
    hint: "Fix the reported rows/columns, then run again.",
  },
  E_MEDIA_UNSUPPORTED: {
    exitCode: EXIT.DATA_INVALID,
    hint: "Use text, number or checkbox controls for now, or remove the column.",
  },
  E_MEDIA_MISSING: {
    exitCode: EXIT.DATA_INVALID,
    hint: "Point the media column at an existing file, or set --media-dir.",
  },
  E_CLI_NOT_FOUND: {
    exitCode: EXIT.CLI_NOT_FOUND,
    hint: "Install EffectCraft, or pass --cli <path> / set EFFECTCRAFT_CLI.",
  },
  E_TEMPLATE_UNREADABLE: {
    exitCode: EXIT.TEMPLATE_UNREADABLE,
    hint: "Confirm the .ectemplate exists and exports a manifest.",
  },
  E_RENDER_FAILED: { exitCode: EXIT.RENDER_FAILED, hint: "See the render log above." },
  E_OUT_NOT_WRITABLE: {
    exitCode: EXIT.RENDER_FAILED,
    hint: "Choose an output folder you can write to (--out).",
  },
  E_CONFIG_INVALID: {
    exitCode: EXIT.DATA_INVALID,
    hint: "Fix the config key named in the message.",
  },
  E_INTERRUPTED: {
    exitCode: EXIT.INTERRUPTED,
    hint: "A partial report was written. Re-run with --skip-existing to resume.",
  },
};

export class SwarmError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = "SwarmError";
    this.code = code;
    const entry = CATALOG[code] ?? { exitCode: EXIT.RENDER_FAILED, hint: "" };
    this.exitCode = entry.exitCode;
    this.hint = extra.hint ?? entry.hint;
    if (extra.cause) this.cause = extra.cause;
  }

  // Full multi-line rendering: message, then an indented hint.
  format() {
    let out = this.message;
    if (this.hint) out += `\n  Hint: ${this.hint}`;
    return out;
  }
}

export function isSwarmError(error) {
  return error instanceof SwarmError;
}
