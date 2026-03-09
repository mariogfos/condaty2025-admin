import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const [mode, ...args] = process.argv.slice(2);

if (!mode) {
  console.error("Missing Next.js command");
  process.exit(1);
}

const distDir =
  mode === "dev"
    ? ".next-dev"
    : mode === "build" || mode === "start"
      ? ".next-build"
      : process.env.CONDATY_NEXT_DIST_DIR || ".next";

const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, mode, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    CONDATY_NEXT_DIST_DIR: distDir,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
