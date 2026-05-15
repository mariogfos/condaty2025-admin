#!/usr/bin/env node

import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const resolveDistDir = () => {
  // Vercel and most CI providers expect the default Next.js output directory.
  if (process.env.VERCEL || process.env.CI) {
    return ".next";
  }

  if (process.env.NEXT_DIST_DIR) {
    return process.env.NEXT_DIST_DIR;
  }

  return ".next-build";
};

const run = async () => {
  const tsconfigPath = new URL("../tsconfig.json", import.meta.url);
  const originalTsconfig = await fs.readFile(tsconfigPath, "utf8");
  const workspacePath = fileURLToPath(new URL("..", import.meta.url));
  const distDir = resolveDistDir();

  try {
    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn("pnpm", ["exec", "next", "build"], {
        cwd: workspacePath,
        stdio: "inherit",
        env: {
          ...process.env,
          NEXT_DIST_DIR: distDir,
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
