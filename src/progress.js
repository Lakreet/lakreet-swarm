const WIDTH = 30;

export function pacmanBar(fraction, tick = 0) {
  const clamped = Math.min(1, Math.max(0, fraction));
  if (clamped >= 1) return "[" + "-".repeat(WIDTH) + "]";

  const position = Math.floor(clamped * WIDTH);
  const head = tick % 2 === 0 ? "C" : "c";

  let rest = "";
  for (let i = 1; i < WIDTH - position; i++) {
    rest += i % 2 === 1 ? " " : "o";
  }
  return "[" + "-".repeat(position) + head + rest + "]";
}

export function formatEta(seconds) {
  if (seconds == null) return "";
  const s = Math.round(seconds);
  return s >= 60 ? `~${Math.floor(s / 60)}m ${s % 60}s left` : `~${s}s left`;
}

export function drawStatus(text) {
  const width = (process.stdout.columns ?? 80) - 1;
  process.stdout.write("\r" + text.slice(0, width).padEnd(width));
}

export function clearStatus() {
  const width = (process.stdout.columns ?? 80) - 1;
  process.stdout.write("\r" + " ".repeat(width) + "\r");
}