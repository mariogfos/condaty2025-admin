/**
 * El botón "Anular egreso" no aparece en un egreso que YA está anulado.
 *
 * 🔴 La condición era `currentItem.status !== "X"`. `expenses.status` es
 * numérico desde S140 (0 = anulado, 1 = pagado), así que el back manda 0 y
 * `0 !== "X"` es SIEMPRE verdadero: el botón se ofrecía sobre egresos ya
 * anulados.
 *
 * ⚠️ El LISTADO (`Outlays.tsx`) se arregló en ese mismo sprint por esta misma
 * causa —"todo caía en Desconocido"— y el detalle quedó afuera. Un módulo
 * migrado pantalla por pantalla necesita un test por pantalla.
 *
 * Este test RENDERIZA y mira el botón. Un pin que leyera el código fuente
 * buscando `ExpenseStatus.CANCELLED` habría pasado en verde mientras la
 * comparación siguiera mal en otra línea del mismo archivo — de hecho el
 * archivo ya usaba el enum bien en otros cuatro lugares.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RenderView from "../RenderView";

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: vi.fn(), showToast: vi.fn() }),
}));
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "1" }, showToast: vi.fn() }),
}));

const EGRESO = {
  id: 1,
  amount: 500,
  date_at: "2026-08-01",
  description: "Mantenimiento de ascensor",
  category: { id: 1, name: "Servicios" },
};

const renderDetalle = (status: number, onDel = vi.fn()) =>
  render(
    <RenderView
      open
      onClose={vi.fn()}
      item={{ ...EGRESO, status }}
      onDel={onDel}
    />,
  );

const botonAnular = () => screen.queryByText(/Anular egreso/i);

describe("Outlays RenderView — botón Anular", () => {
  it("se ofrece en un egreso activo (status 1)", () => {
    renderDetalle(1);
    expect(botonAnular()).toBeTruthy();
  });

  /** El caso que estaba roto. */
  it("NO se ofrece en un egreso ya anulado (status 0)", () => {
    renderDetalle(0);
    expect(botonAnular()).toBeNull();
  });

  /**
   * El JSON a veces manda el número como string. Con `!== "X"` esto también
   * pasaba de largo, así que el pin cubre las dos formas.
   */
  it("NO se ofrece cuando el back manda el 0 como string", () => {
    renderDetalle("0" as unknown as number);
    expect(botonAnular()).toBeNull();
  });

  it("sin permiso de borrado no se ofrece, aunque este activo", () => {
    render(
      <RenderView
        open
        onClose={vi.fn()}
        item={{ ...EGRESO, status: 1 }}
      />,
    );
    expect(botonAnular()).toBeNull();
  });
});
