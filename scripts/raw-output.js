// Usage: node scripts/raw-output.js <effectcraft-cli args...>
import { spawn } from "node:child_process";
import { findCli } from "../src/find-cli.js";

const child = spawn(findCli(), process.argv.slice(2), { stdio: ["ignore", "pipe", "pipe"] });
child.stdout.on("data", (c) => console.log("OUT:", JSON.stringify(c.toString())));
child.stderr.on("data", (c) => console.log("ERR:", JSON.stringify(c.toString())));
child.on("close", (code) => console.log("exit", code));
