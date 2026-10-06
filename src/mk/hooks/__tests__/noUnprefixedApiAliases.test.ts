/**
 * 🔴 Cutover decision A4 (2026-10-06): when the `dev` API replaces production,
 * the fronts call ONLY `v3` routes, and the API adds no unprefixed aliases.
 *
 * The API in `dev` still answers these paths WITHOUT `v3` because each one is a
 * backwards-compatibility alias of a `v3` route (`routes/api.php`, "Alias de
 * BC"). They are the ones that disappear. Measured with `route:list --json` of
 * condaty-api `dev` on 2026-10-06: every segment below has its `v3` twin.
 *
 * ⚠️ `accesses` maps to `v3/access` (singular), and `activeRegister` to
 * `v3/active-register`: the twin is not always the same word.
 *
 * ⚠️ `assemblies` is a retired alias too, but it is NOT listed: the Assemblies
 * and Surveys folders are being moved to `v3` in a parallel change. Add it here
 * once that lands.
 *
 * Paths that exist ONLY without `v3` (`app-version`, `masivexls`, `chatbot`,
 * `content-like`, `presence/*`, `backoffice/presence-monitoring/*`,
 * `reports/{reportKey}/*`) are canonical, not aliases, and are not checked.
 *
 * It reads the source, not a rendered screen: the calls live in a dozen big
 * screens, and what has to hold is that NO literal anywhere goes to an alias.
 * A navigation (`href`, `router.push`, `pathname`) to a front page with the same
 * name is not an API call and is skipped.
 */
import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";

const SRC = path.join(process.cwd(), "src");

const RETIRED_ALIASES = [
  "tasks",
  "task-categories",
  "accesses",
  "dashboard",
  "activeRegister",
  "restriction-status",
  "upload-file",
  "client-config",
  "client-config-actualizar",
  "debt-groups",
  "contents",
  "categories",
  "balances",
  "financial-summary",
  "notifications",
];

const NAVIGATION = /href|router\.(push|replace)|pathname/;

const sourceFiles = (dir: string, out: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__" || entry.name === "node_modules") continue;
      sourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
};

/** `"/tasks"`, `` `/tasks/${id}` ``, `"/debt-groups?x"`, or `modulo: "accesses"`. */
const aliasCall = new RegExp(
  String.raw`["'\`]/(${RETIRED_ALIASES.join("|")})(?=["'\`/?$])` +
    String.raw`|modulo:\s*["'\`](${RETIRED_ALIASES.join("|")})["'\`]`,
);

const findAliasCalls = (files: string[]) =>
  files.flatMap((file) =>
    fs
      .readFileSync(file, "utf8")
      .split("\n")
      .map((line, i) => ({ line, at: `${path.relative(SRC, file)}:${i + 1}` }))
      .filter(({ line }) => {
        const code = line.trim();
        if (code.startsWith("//") || code.startsWith("*")) return false;
        return aliasCall.test(line) && !NAVIGATION.test(line);
      })
      .map(({ at, line }) => `${at}  ${line.trim()}`),
  );

describe("API calls go through v3, never through a retired alias", () => {
  const files = sourceFiles(SRC);

  it("walks the source (an empty walk would pass for nothing)", () => {
    expect(files.length).toBeGreaterThan(300);
  });

  it("the detector catches every call shape it has to catch", () => {
    const shapes = [
      `execute("/tasks", "GET")`,
      "execute(`/task-categories/${id}`, \"DELETE\")",
      `modulo: "accesses",`,
      `useAxios("/dashboard", "GET", {})`,
    ];
    for (const shape of shapes) expect(aliasCall.test(shape), shape).toBe(true);
    expect(aliasCall.test(`execute("/v3/tasks", "GET")`)).toBe(false);
    expect(aliasCall.test(`execute("/v3/access", "GET")`)).toBe(false);
    expect(aliasCall.test(`useAxios("/contents-x")`)).toBe(false);
  });

  it("no source file calls a retired alias", () => {
    expect(findAliasCalls(files)).toEqual([]);
  });

  /**
   * 🔴 `setParamsCrud(modulo, …)` writes `localStorage[modulo + "Params"]`, and
   * `useCrud` reads it back with `mod.modulo + "Params"`. A literal there does
   * not follow the module to `v3`: DashDptos wrote `"reservationsParams"`
   * while Reservas read `"v3/reservationsParams"`, so "Historial de reservas"
   * opened the list without the unit filter. The key must come from the
   * module's own constant.
   */
  it("setParamsCrud takes the module constant, never a literal", () => {
    const literalKeys = files.flatMap((file) =>
      (fs.readFileSync(file, "utf8").match(/setParamsCrud\(\s*["'`][^"'`]*["'`]/g) ?? []).map(
        (call) => `${path.relative(SRC, file)}  ${call}`,
      ),
    );
    expect(literalKeys).toEqual([]);
  });
});
