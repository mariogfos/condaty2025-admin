import { describe, it, expect } from "vitest";
import { ORDER_STATUS, esEstadoDePedido } from "../types/orderStatus";

/**
 * 🔴 `others.status` pasó de `char(1)` a enum numérico (api#…).
 *
 * `RenderView` comparaba contra `"X"` y `"A"` en tres lugares. Con la columna
 * numérica ninguna matcheaba:
 *
 * - un pedido **anulado** no decía "Anulado";
 * - uno **vencido** no decía "Vencido";
 * - y el botón **"Registrar Entrada" aparecía también en los anulados** — la
 *   tercera es la que deja hacer algo, no sólo la que muestra mal.
 */
describe("el estado del pedido es un número", () => {
  it("reconoce los cuatro estados", () => {
    expect(ORDER_STATUS.ESPERANDO).toBe(1);
    expect(ORDER_STATUS.INGRESO).toBe(2);
    expect(ORDER_STATUS.SALIO).toBe(3);
    expect(ORDER_STATUS.CANCELADO).toBe(4);
  });

  it("matchea el estado numérico", () => {
    expect(esEstadoDePedido(4, ORDER_STATUS.CANCELADO)).toBe(true);
    expect(esEstadoDePedido(1, ORDER_STATUS.CANCELADO)).toBe(false);
  });

  // ⚠️ El sobre puede traer el número como string, y `4 === "4"` es `false`.
  it("matchea aunque el número venga como string", () => {
    expect(esEstadoDePedido("4", ORDER_STATUS.CANCELADO)).toBe(true);
  });

  // La letra vieja ya no significa nada: no puede pasar por cancelado.
  it("la letra vieja ya no matchea", () => {
    expect(esEstadoDePedido("X", ORDER_STATUS.CANCELADO)).toBe(false);
    expect(esEstadoDePedido("A", ORDER_STATUS.ESPERANDO)).toBe(false);
  });

  // 🔴 La pantalla no compara contra las letras en ninguna parte.
  it("RenderView no compara el estado contra una letra", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");

    const texto = readFileSync(
      join(process.cwd(), "src/modulos/Activities/PedidosTab/RenderView/RenderView.tsx"),
      "utf8",
    );

    expect(texto).not.toMatch(/status\s*[!=]==\s*["'][AIOX]["']/);
    expect(texto).toContain("ORDER_STATUS");
  });
});
