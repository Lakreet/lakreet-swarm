import { spawn } from "node:child_process";
import { findCli } from "./src/find-cli.js";

const args = [
  "render", "--template", "examples/title2.ectemplate",
  "--values", "out/1-Budi.values.json",
  "--out", "out/demo.mp4",
];

const child = spawn(findCli(), args, { stdio: ["ignore", "pipe", "pipe"] });

child.stdout.on("data", (chunk) => console.log("OUT:", JSON.stringify(chunk.toString())));
child.stderr.on("data", (chunk) => console.log("ERR:", JSON.stringify(chunk.toString())));
child.on("close", (code) => console.log("exit", code));