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

// Spawn effectcraft-cli. Options: { timeout (ms), onProgress, onLine, runner }.
// `runner` allows tests to inject a fake implementation.
export function runRender(cliPath, args, onProgress, options = {}) {
  if (options.runner) return options.runner(cliPath, args, options);

  return new Promise((resolve) => {
    const child = spawn(cliPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    let lastLine = "";
    let timedOut = false;
    let timer = null;

    if (options.timeout && options.timeout > 0) {
      timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, options.timeout);
    }

    const onLine = (line) => {
      if (options.onLine) options.onLine(line);
      const frame = line.match(/frame (\d+)\/(\d+)/);
      if (!frame) {
        lastLine = line;
        return;
      }
      const eta = line.match(/~([\d.]+)s left/);
      if (onProgress) {
        onProgress({
          done: Number(frame[1]),
          total: Number(frame[2]),
          eta: eta ? Number(eta[1]) : null,
        });
      }
    };

    child.stdout.on("data", lineReader(onLine));
    child.stderr.on("data", lineReader(onLine));
    child.on("error", (error) => {
      if (timer) clearTimeout(timer);
      resolve({ ok: false, message: error.message, code: "ENOENT" });
    });
    child.on("close", (code) => {
      if (timer) clearTimeout(timer);
      if (timedOut) {
        resolve({ ok: false, message: "timeout", timedOut: true });
      } else {
        resolve({ ok: code === 0, message: code === 0 ? "" : lastLine, code });
      }
    });
  });
}
