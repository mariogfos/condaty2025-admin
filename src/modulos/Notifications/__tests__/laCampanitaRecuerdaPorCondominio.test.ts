/**
 * 🔴 The bell's memory («last seen» id, «already read» ids) is per
 * administrator AND per condominium. `notifId` grows across the whole table,
 * so a global key let condominium A hide the new notifications of B.
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { notifStorageKey } from "../notifStorageKey";

describe("the bell remembers per administrator and condominium", () => {
  it("the same administrator in two condominiums gets two keys", () => {
    expect(notifStorageKey("notifId", { id: "u1", client_id: "A" })).not.toBe(
      notifStorageKey("notifId", { id: "u1", client_id: "B" }),
    );
  });

  it("two administrators of the same condominium get two keys", () => {
    expect(notifStorageKey("notifId", { id: "u1", client_id: "A" })).not.toBe(
      notifStorageKey("notifId", { id: "u2", client_id: "A" }),
    );
  });

  // Source pin, read WITHOUT comments (rule 173): nobody reads the global key again.
  it("no screen reads the bell keys without the scope", () => {
    for (const file of [
      "src/modulos/Notifications/Notifications.tsx",
      "src/components/Header/Header.tsx",
    ]) {
      const code = fs
        .readFileSync(path.join(process.cwd(), file), "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect({ file, global: /localStorage\.(get|set)Item\(\s*"(notifId|notificationsView)"/.test(code) }).toEqual({
        file,
        global: false,
      });
    }
  });
});
