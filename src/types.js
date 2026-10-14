// Control-type registry. Each type knows how to coerce a raw value (from a
// CSV cell or JSON field) into the value EffectCraft expects.
//
// coerce(type, raw, context) -> { value } | { error }
// context: { where, column } used to build error messages.

const TRUE_WORDS = new Set(["true", "yes", "y", "1", "on", "ya"]);
const FALSE_WORDS = new Set(["false", "no", "n", "0", "off", "tidak"]);

const registry = {
  text: {
    coerce(raw, _ctx) {
      return { value: raw == null ? "" : String(raw) };
    },
  },
  slider: {
    coerce(raw, ctx) {
      if (raw === "" || raw == null) {
        return { error: `${where(ctx)}: empty value is not a number.` };
      }
      const n = typeof raw === "number" ? raw : Number(String(raw).trim());
      if (!Number.isFinite(n)) {
        return {
          error: `${where(ctx)}: ${JSON.stringify(String(raw))} is not a number.`,
        };
      }
      return { value: n };
    },
  },
  checkbox: {
    coerce(raw, ctx) {
      if (typeof raw === "boolean") return { value: raw };
      const s = String(raw).trim().toLowerCase();
      if (TRUE_WORDS.has(s)) return { value: true };
      if (FALSE_WORDS.has(s)) return { value: false };
      return {
        error: `${where(ctx)}: ${JSON.stringify(String(raw))} is not a boolean.`,
      };
    },
  },
};

function where(ctx) {
  if (!ctx) return "value";
  const parts = [];
  if (ctx.where) parts.push(ctx.where);
  if (ctx.column) parts.push(`column "${ctx.column}"`);
  return parts.length ? parts.join(", ") : "value";
}

// Coerce `raw` for control `type`. Unknown types fall back to text so that
// newer EffectCraft control types do not hard-fail.
export function coerce(type, raw, context) {
  const entry = registry[type];
  if (!entry) return registry.text.coerce(raw, context);
  return entry.coerce(raw, context);
}

// Exposed for tests / docs.
export function knownTypes() {
  return Object.keys(registry);
}
