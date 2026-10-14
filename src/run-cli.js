import { spawn } from "node:child_process";

function lineReader(onLine) {
  let buffer = "";
  return (chunk) => {
    buffer += chunk.toString();
    const cut = Math.max(buffer.lastIndexOf("\n"), buffer.lastIndexOf("\r"));
    if (cut < 0) return;
    const complete = buffer.slice(0, cut + 1);
    buffer = buffer.slice(cut + 1);
    for (const line of complete.split(/[\r\n]+/)) {
      if (line.trim() !== "") onLine(line.trim());
    }
  };
}

export function runRender(cliPath, args, onProgress) {
  return new Promise((resolve) => {
    const child = spawn(cliPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let lastLine = "";

    const onLine = (line) => {
      const frame = line.match(/frame (\d+)\/(\d+)/);
      if (!frame) {
        lastLine = line;
        return;
      }
      const eta = line.match(/~([\d.]+)s left/);
      onProgress({
        done: Number(frame[1]),
        total: Number(frame[2]),
        eta: eta ? Number(eta[1]) : null,
      });
    };

    child.stdout.on("data", lineReader(onLine));
    child.stderr.on("data", lineReader(onLine));
    child.on("error", (error) => resolve({ ok: false, message: error.message }));
    child.on("close", (code) => resolve({ ok: code === 0, message: code === 0 ? "" : lastLine }));
  });
}
