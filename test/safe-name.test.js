import { test } from "node:test";
import assert from "node:assert/strict";
import { safeName } from "../src/render.js";

test("safeName replaces characters that are invalid in Windows file names", () => {
  assert.equal(safeName('A/B:C*D?"E"<F>|G\\H'), "A_B_C_D__E__F__G_H");
});

test("safeName falls back to 'untitled' for empty input", () => {
  assert.equal(safeName("   "), "untitled");
});

test("safeName limits the length to 60 characters", () => {
  assert.equal(safeName("x".repeat(100)).length, 60);
});
