#!/usr/bin/env node

import fs from "node:fs/promises";
import { execSync } from "node:child_process";

const DEFAULT_PORTS = [
  3000,
  3001,
  3002,
  3003,
  4173,
  4200,
  4321,
  5000,
  5001,
  5173,
  5174,
  6006,
  8000,
  8080,
  8081,
  8787,
  9229,
];

const command = process.argv[2];

const log = (message) => {
  process.stdout.write(`${message}\n`);
};

const getPorts = () => {
  const raw = process.env.DEV_PORTS;
  if (!raw) return DEFAULT_PORTS;

  const ports = raw
    .split(",")
    .map((value) => Number(String(value).trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  return ports.length > 0 ? ports : DEFAULT_PORTS;
};

const getListeningPids = (port) => {
  try {
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value));
  } catch (_error) {
    return [];
  }
};

const isPidAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (_error) {
    return false;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cleanNext = async () => {
  await fs.rm(".next", { recursive: true, force: true });
  await fs.rm(".next-build", { recursive: true, force: true });
  log("`.next` y `.next-build` limpiados.");
};

const killDevPorts = async () => {
  const ports = getPorts();
  const pidToPorts = new Map();

  ports.forEach((port) => {
    getListeningPids(port).forEach((pid) => {
      const existing = pidToPorts.get(pid) || [];
      pidToPorts.set(pid, [...existing, port]);
    });
  });

  if (pidToPorts.size === 0) {
    log("No hay puertos de desarrollo activos en la lista configurada.");
    return;
  }

  for (const [pid] of pidToPorts) {
    try {
      process.kill(pid, "SIGTERM");
    } catch (_error) {
      // Ignore processes that exited between lookup and kill.
    }
  }

  await sleep(400);

  for (const [pid] of pidToPorts) {
    if (!isPidAlive(pid)) continue;
    try {
      process.kill(pid, "SIGKILL");
    } catch (_error) {
      // Ignore if it died after SIGTERM.
    }
  }

  for (const [pid, pidPorts] of pidToPorts) {
    log(`Proceso ${pid} detenido en puerto(s): ${pidPorts.join(", ")}`);
  }
};

const printHelp = () => {
  log("Uso:");
  log("  pnpm clean:next        Limpia las carpetas .next y .next-build");
  log("  pnpm kill:dev          Mata puertos de desarrollo comunes");
  log("  pnpm dev:reset         Mata puertos de desarrollo y limpia .next");
  log("");
  log(
    "Opcional: define DEV_PORTS=3000,3001,5173 para personalizar la lista de puertos.",
  );
};

switch (command) {
  case "clean-next":
    await cleanNext();
    break;
  case "kill-dev-ports":
    await killDevPorts();
    break;
  case "reset-dev":
    await killDevPorts();
    await cleanNext();
    break;
  default:
    printHelp();
    process.exit(command ? 1 : 0);
}
