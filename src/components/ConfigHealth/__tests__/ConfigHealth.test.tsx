/**
 * El aviso de configuración faltante del dashboard.
 *
 * Mide las dos cosas que importan y que un vistazo no garantiza:
 *
 *  1. **Que NO aparezca cuando está todo bien.** Un aviso que se muestra sin
 *     problema enseña a ignorarlo, y entonces tampoco se ve el día que importa.
 *  2. **Que cuando aparece, sea accionable**: el título en castellano, la
 *     consecuencia y el link a la pantalla donde se resuelve.
 *
 * El componente no decide qué es obligatorio: todo eso viene del catálogo del
 * back. Acá se verifica que lo PINTE, no que lo invente.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AxiosContext } from "@/mk/contexts/AxiosInstanceProvider";
import ConfigHealth from "../ConfigHealth";

const renderCon = (data: any) => {
  const contextInstance = {
    request: vi.fn(async () => ({ data: { success: true, data } })),
  };

  return render(
    <AxiosContext.Provider
      value={{ contextInstance, waiting: 0, setWaiting: vi.fn() }}
    >
      <ConfigHealth />
    </AxiosContext.Provider>,
  );
};

const SANO = { ok: true, criticas: 0, importantes: 0, opcionales: 0, faltantes: [] };

const ROTO = {
  ok: false,
  criticas: 1,
  importantes: 1,
  opcionales: 0,
  faltantes: [
    {
      clave: "cat_penalty_reservation",
      titulo: "Categoría de multa por reserva",
      porque: "Sin ella, cancelar tarde una reserva falla y el residente no puede cancelar.",
      donde: "/categories",
      severidad: 1,
      severidad_label: "Crítico",
      consecuencia: "Hay operaciones que van a fallar hasta que se configure.",
    },
    {
      clave: "payment_methods_config",
      titulo: "Métodos de pago habilitados",
      porque: "Define con qué puede pagar el residente.",
      donde: "/configs",
      severidad: 2,
      severidad_label: "Importante",
      consecuencia: "El sistema opera, pero algo va a quedar mal registrado.",
    },
  ],
};

describe("El aviso de configuración faltante", () => {
  it("no pinta NADA cuando el condominio está bien configurado", async () => {
    const { container } = renderCon(SANO);

    await waitFor(() => {
      expect(
        container.querySelector("[role='alert']"),
        "apareció el aviso sin que falte nada: eso enseña a ignorarlo",
      ).toBeNull();
    });
  });

  it("muestra cada faltante con su gravedad y su consecuencia", async () => {
    renderCon(ROTO);

    await screen.findByText("Categoría de multa por reserva");

    expect(screen.getByText("Crítico")).toBeInTheDocument();
    expect(screen.getByText("Importante")).toBeInTheDocument();
    expect(
      screen.getByText(/cancelar tarde una reserva falla/i),
      "no explica QUÉ se rompe: 'falta cat_penalty_reservation' no le dice nada a un administrador",
    ).toBeInTheDocument();
  });

  /**
   * 🔴 El aviso NO manda al administrador a arreglarlo a mano: no puede. Las
   * categorías fijas las crea el sistema, no se eligen en ninguna pantalla y no
   * se editan ni se borran. Por eso hay un botón que repara — un link a
   * `/categories` sería mandarlo a mirar una pared.
   */
  it("ofrece un botón que corrige, y no un link a una pantalla donde no puede hacer nada", async () => {
    renderCon(ROTO);

    const boton = await screen.findByRole("button", { name: /corregir configuración/i });

    expect(boton).toBeInTheDocument();
    expect(
      screen.queryByText("Configurar"),
      "quedó el link viejo a una pantalla donde el admin no puede crear una categoría fija",
    ).toBeNull();
  });

  it("avisa fuerte cuando hay algo crítico", async () => {
    renderCon(ROTO);

    expect(
      await screen.findByText(/hay operaciones que van a fallar/i),
      "el encabezado no distingue un faltante crítico de uno cosmético",
    ).toBeInTheDocument();
  });
});
