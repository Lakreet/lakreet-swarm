import { mkdirSync, writeFileSync } from "node:fs";
import { findCli } from "../src/find-cli.js";
import { runRender } from "../src/run-cli.js";

const cli = findCli();
const template = "examples/title2.ectemplate";
mkdirSync("out/bench", { recursive: true });

async function run(concurrency, total) {
  const started = Date.now();
  let next = 0;
  let failed = 0;

  async function worker() {
    while (next < total) {
      const i = next++;
      const values = `out/bench/${concurrency}-${i}.json`;
      writeFileSync(values, JSON.stringify({ "Source Text": `Bench ${i}` }));
      const args = [
        "render",
        "--template",
        template,
        "--values",
        values,
        "--out",
        `out/bench/${concurrency}-${i}.mp4`,
      ];
      const result = await runRender(cli, args, () => {});
      if (!result.ok) failed++;
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`concurrency ${concurrency}: ${total} videos in ${seconds}s, failed ${failed}`);
}

for (const n of [1, 2, 4]) await run(n, 8);
