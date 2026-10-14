import { test } from "node:test";
import assert from "node:assert/strict";
import { coerce } from "../src/types.js";

const ctx = { where: "line 5", column: "Opacity" };

test("slider accepts numbers and numeric strings", () => {
  assert.deepEqual(coerce("slider", 100, ctx), { value: 100 });
  assert.deepEqual(coerce("slider", "60", ctx), { value: 60 });
  assert.deepEqual(coerce("slider", "0.5", ctx), { value: 0.5 });
  assert.deepEqual(coerce("slider", "-3", ctx), { value: -3 });
});

test("slider rejects NaN, empty and Infinity", () => {
  assert.ok(coerce("slider", "abc", ctx).error);
  assert.ok(coerce("slider", "", ctx).error);
  assert.ok(coerce("slider", "Infinity", ctx).error);
});

test("text passes strings through", () => {
  assert.deepEqual(coerce("text", "hello", ctx), { value: "hello" });
});

test("checkbox parses common truthy/falsy words", () => {
  for (const t of ["true", "yes", "1", "ya", "TRUE"]) {
    assert.deepEqual(coerce("checkbox", t, ctx), { value: true }, t);
  }
  for (const f of ["false", "no", "0", "tidak", "FALSE"]) {
    assert.deepEqual(coerce("checkbox", f, ctx), { value: false }, f);
  }
});

test("unknown type is passed as text", () => {
  assert.deepEqual(coerce("mystery", "abc", ctx), { value: "abc" });
});

test("slider error message names where and column", () => {
  const { error } = coerce("slider", "abc", ctx);
  assert.match(error, /line 5/);
  assert.match(error, /Opacity/);
});
