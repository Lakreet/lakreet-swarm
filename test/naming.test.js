import { test } from "node:test";
import assert from "node:assert/strict";
import { buildName, assignNames, slugify, safeName } from "../src/naming.js";

test("buildName substitutes index and first column", () => {
  const name = buildName("{index}-{first}", {
    index: 3,
    values: { Name: "Budi" },
    firstColumn: "Name",
  });
  assert.equal(name, "3-Budi");
});

test("buildName zero-pads index to N digits", () => {
  assert.equal(buildName("{index:3}", { index: 7, values: {} }), "007");
});

test("buildName substitutes a named column", () => {
  assert.equal(
    buildName("{Name}-{Opacity}", { index: 1, values: { Name: "A", Opacity: 50 } }),
    "A-50"
  );
});

test("buildName slugifies", () => {
  assert.equal(buildName("{slug:Name}", { index: 1, values: { Name: "Ñoño Café" } }), "nono-cafe");
});

test("assignNames de-duplicates collisions", () => {
  const rows = [{ values: { Name: "Same" } }, { values: { Name: "Same" } }];
  const named = assignNames("{first}", rows, "Name");
  assert.equal(named[0].base, "Same");
  assert.equal(named[1].base, "Same-2");
});

test("safeName guards Windows reserved names", () => {
  assert.equal(safeName("CON"), "_CON");
  assert.equal(safeName("com1"), "_com1");
});

test("slugify removes accents and lowercases", () => {
  assert.equal(slugify("Ábc Def"), "abc-def");
});
