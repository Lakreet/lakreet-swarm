import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOnly, selectRows } from "../src/selection.js";

test("parseOnly handles singles and ranges", () => {
  const s = parseOnly("1,3,5-7");
  assert.deepEqual(
    [...s].sort((a, b) => a - b),
    [1, 3, 5, 6, 7]
  );
});

test("parseOnly rejects invalid input", () => {
  assert.throws(() => parseOnly("abc"), /Invalid --only/);
  assert.throws(() => parseOnly("5-2"), /Invalid --only/);
});

test("selectRows applies only and limit", () => {
  const rows = [1, 2, 3, 4].map((i) => ({ index: i }));
  assert.equal(selectRows(rows, { only: "2,4" }).length, 2);
  assert.equal(selectRows(rows, { limit: 2 }).length, 2);
  assert.equal(selectRows(rows, {})[0].index, 1);
});
