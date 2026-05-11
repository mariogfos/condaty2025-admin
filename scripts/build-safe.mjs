#!/usr/bin/env node

import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const run = async () => {
  const tsconfigPath = new URL("../tsconfig.json", import.meta.url);
  const originalTsconfig = await fs.readFile(tsconfigPath, "utf8");
  const workspacePath = fileURLToPath(new URL("..", import.meta.url));

  try {
    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn("pnpm", ["exec", "next", "build"], {
        cwd: workspacePath,
        stdio: "inherit",
        env: {
          ...process.env,
          NEXT_DIST_DIR: ".next-build",
        },
      });

      child.on("error", reject);
      child.on("close", (code) => resolve(code ?? 1));
    });

    if (exitCode !== 0) {
      process.exit(exitCode);
    }
  } finally {
    await fs.writeFile(tsconfigPath, originalTsconfig, "utf8");
  }
};

await run();
