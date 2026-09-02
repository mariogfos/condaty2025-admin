/**
 * Lo que faltaba no era el enum: era QUE LA PANTALLA LO ESCRIBIERA.
 *
 * `can_receive_visits` aparecia CERO veces en todo el admin (medido
 * 2026-09-02) mientras el API lo aplicaba entero. Este archivo pinea el
 * interruptor y el valor que manda, que es lo que no existia.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute: vi.fn() }) }));

import RenderForm from "../RenderForm";
import {
  DPTO_NO_RECIBE_VISITAS,
  DPTO_RECIBE_VISITAS,
} from "../dptoVisitReception";

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

describe("el interruptor de recepcion de visitas", () => {
  it("esta en la pantalla", () => {
    pintarElFormulario();

    expect(screen.getByText("Puede recibir visitas")).toBeTruthy();
    expect(interruptorDe("can_receive_visits")).not.toBeNull();
  });

  it("una unidad bloqueada lo muestra apagado", () => {
    pintarElFormulario({ can_receive_visits: DPTO_NO_RECIBE_VISITAS });

    expect(interruptorDe("can_receive_visits")!.checked).toBe(false);
  });

  it("una unidad que recibe visitas lo muestra prendido", () => {
    pintarElFormulario({ can_receive_visits: DPTO_RECIBE_VISITAS });

    expect(interruptorDe("can_receive_visits")!.checked).toBe(true);
  });

  it("sin el dato, arranca prendido y no bloquea la puerta por omision", () => {
    pintarElFormulario({});

    expect(interruptorDe("can_receive_visits")!.checked).toBe(true);
  });
});
