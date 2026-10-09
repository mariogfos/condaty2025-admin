/**
 * La pantalla de órdenes QR (`/qr-dinamico`), revisión entera del 2026-10-09.
 *
 * 1. 🔴 `dev` había perdido la entrada del menú que producción ofrece
 *    (`origin/prod`, `perm: "payments"`): estaba comentada con un motivo de
 *    OTRA pantalla (el probador del banco). El API pide `payments` en cada
 *    ruta que la pantalla llama.
 * 2. 🔴 «Últimos QR en el banco» pedía `v3/bank-qr/recent-transactions` sin
 *    cuenta: ese endpoint es del probador del equipo de Condaty y exige
 *    `bank_account_id`, así que fallaba SIEMPRE (403 o 422). Se retiró.
 *
 * ⚠️ El pin de fuente lee el archivo SIN comentarios (regla 173): el docblock
 * que explica el retiro nombra la ruta a propósito.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { menuConfig, type MenuConfigItem } from "@/components/MainMenu/mainMenuConfig";

const sinComentarios = (ruta: string): string =>
  fs
    .readFileSync(ruta, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const entradas = (items: MenuConfigItem[]): MenuConfigItem[] =>
  items.flatMap((item) => [item, ...entradas(((item as { items?: MenuConfigItem[] }).items) ?? [])]);

describe("la pantalla de órdenes QR", () => {
  it("el menú la ofrece a quien puede ver ingresos", () => {
    const entrada = entradas(menuConfig).find((item) => (item as { href?: string }).href === "/qr-dinamico");

    expect(entrada, "el menú no ofrece /qr-dinamico").toBeDefined();
    expect((entrada as { perm?: string }).perm).toBe("payments");
  });

  it("no le pide al probador del banco lo cobrado sin cuenta", () => {
    const pantalla = sinComentarios(path.resolve(__dirname, "../QrDinamico.tsx"));

    expect(pantalla).not.toMatch(/bank-qr\/recent-transactions/);
    expect(pantalla).toMatch(/v3\/qr-dynamic\/orders\?/);
  });
});
