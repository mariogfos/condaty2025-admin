/**
 * 🔴 La lista de invitaciones existía y NO LA IMPORTABA NADIE.
 *
 * Lo preguntó Mario el 2026-08-08 —"dónde está la lista de invitaciones, no la
 * veo"— y no la veía porque `Activities` montaba sólo `AccessesTab`. `QrTab`
 * estaba entero y sano por dentro: su `paramsInitial`, su `RenderView`, su
 * filtro por período y su botón de exportar. Le faltaba alguien que lo
 * renderizara.
 *
 * ⚠️ Es la segunda vez en la Fase 6 (la otra fue Presupuestos) y la tercera
 * contando el módulo `homeowners`: **si un componente está muerto lo dice el
 * LLAMADOR, no el componente.**
 *
 * Este test es el llamador puesto por escrito: si alguien vuelve a dejar una
 * sola pestaña, se cae acá.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import Activities from "../Activities";

// Las dos pestañas montan un `useCrud` completo —axios, auth, store—, y este
// test no mide eso: mide QUÉ se monta. Cada tab se reemplaza por su nombre.
vi.mock("../AccessTab/AccessTab", () => ({
  default: () => <div>lista de accesos</div>,
}));

vi.mock("../QrTab/QrTab", () => ({
  default: () => <div>lista de invitaciones</div>,
}));

describe("Actividades", () => {
  beforeEach(() => {
    cleanup();
  });

  it("ofrece las pestañas de Accesos e Invitaciones", () => {
    render(<Activities />);

    expect(screen.getByText("Accesos")).toBeTruthy();
    expect(screen.getByText("Invitaciones")).toBeTruthy();
  });

  it("arranca en Accesos", () => {
    render(<Activities />);

    expect(screen.getByText("lista de accesos")).toBeTruthy();
    expect(screen.queryByText("lista de invitaciones")).toBeNull();
  });

  /** 🔴 El pin: la lista de invitaciones TIENE que poder verse. */
  it("muestra la lista de invitaciones al elegir su pestaña", () => {
    render(<Activities />);

    fireEvent.click(screen.getByText("Invitaciones"));

    expect(screen.getByText("lista de invitaciones")).toBeTruthy();
    expect(screen.queryByText("lista de accesos")).toBeNull();
  });
});
