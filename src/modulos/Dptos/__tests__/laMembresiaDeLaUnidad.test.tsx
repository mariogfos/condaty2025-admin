/**
 * La membresia de una unidad: el enum, y que la pantalla lo pueda ESCRIBIR.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 SIN ESTO, EL INTERRUPTOR DE AREAS DE admin#794 ESCONDE EL AREA A TODOS
 * ────────────────────────────────────────────────────────────────────────
 *
 * La visibilidad de un area por membresia se decide con DOS columnas:
 *
 * | pregunta | columna | dueno |
 * |---|---|---|
 * | ¿el area pide membresia? | `areas.requires_membership` | Areas |
 * | ¿la unidad la tiene?     | `dptos.has_membership`      | HomeOwner |
 *
 * El interruptor del area entro en admin#794. Este NO EXISTIA: medido el
 * 2026-09-02, `has_membership` aparecia CERO veces en todo `condaty-admin`
 * mientras `HomeOwnerParaOtrosModulosService:138` filtraba con
 * `->where('has_membership', DptoMembership::ACTIVE->value)`.
 *
 * O sea: se podia marcar un area como "solo para socios" y no habia forma de
 * marcar una unidad como socia. El area quedaba invisible para TODOS.
 *
 * Quinta vez en el proyecto que una regla esta completa en el API y no hay
 * pantalla que la escriba.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: vi.fn() }) }));

import RenderForm from "../RenderForm";
import {
  DPTO_CON_MEMBRESIA,
  DPTO_SIN_MEMBRESIA,
  desdeElInterruptorDeMembresia,
  tieneMembresia,
} from "../dptoMembership";

const pintarElFormulario = (item: any = {}) =>
  render(
    <RenderForm
      open
      onClose={vi.fn()}
      item={item}
      setItem={vi.fn()}
      extraData={{ type: [] }}
      user={{ id: "u1" }}
      reLoad={vi.fn()}
      errors={{}}
      setErrors={vi.fn()}
      action="add"
    />,
  );

const interruptorDe = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;

describe("el enum de membresia", () => {
  it("NONE es 1 y ACTIVE es 2", () => {
    expect(DPTO_SIN_MEMBRESIA).toBe(1);
    expect(DPTO_CON_MEMBRESIA).toBe(2);
    expect(tieneMembresia(1)).toBe(false);
    expect(tieneMembresia(2)).toBe(true);
  });

  it("no toma un booleano como si", () => {
    // `Boolean(1)` es true y `1` es NONE: la trampa de los tres hermanos.
    expect(tieneMembresia(true)).toBe(false);
  });

  it("ausente cuenta como SIN membresia", () => {
    // Al reves que `recibeVisitas`: aca la omision tiene que ser la opcion
    // CERRADA, o se le abren las areas de socios a unidades que no lo son.
    expect(tieneMembresia(undefined)).toBe(false);
    expect(tieneMembresia(null)).toBe(false);
  });

  it("acepta el numero en texto", () => {
    expect(tieneMembresia("2")).toBe(true);
  });

  it("el interruptor manda numeros", () => {
    expect(desdeElInterruptorDeMembresia(true)).toBe(DPTO_CON_MEMBRESIA);
    expect(desdeElInterruptorDeMembresia(false)).toBe(DPTO_SIN_MEMBRESIA);
    expect(typeof desdeElInterruptorDeMembresia(false)).toBe("number");
  });
});

describe("el interruptor de membresia", () => {
  it("esta en la pantalla", () => {
    pintarElFormulario();

    expect(screen.getByText("Tiene membresía")).toBeTruthy();
    expect(interruptorDe("has_membership")).not.toBeNull();
  });

  it("una unidad socia lo muestra prendido", () => {
    pintarElFormulario({ has_membership: DPTO_CON_MEMBRESIA });

    expect(interruptorDe("has_membership")!.checked).toBe(true);
  });

  it("sin el dato, arranca apagado", () => {
    pintarElFormulario({});

    expect(interruptorDe("has_membership")!.checked).toBe(false);
  });
});
