/**
 * El área "sólo para socios" tiene que poder ACTIVARSE desde el formulario.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 LA REGLA ESTABA COMPLETA EN EL API Y NINGUNA PANTALLA LA ESCRIBÍA
 * ────────────────────────────────────────────────────────────────────────
 *
 * Medido el 2026-09-02, `requires_membership` en el API de `dev`:
 *
 * - `VisibilidadDeAreasPorMembresia` recorta el listado del residente que no
 *   es socio (`whereNull(...)->orWhere(..., AreaMembership::OPEN)`)
 * - `AreaWriteRequest:148` acepta el campo con `Rule::enum(AreaMembership)`
 * - la migración del 2026-08-14 dejó la columna en `OPEN`
 * - cuatro archivos de tests y su documentación
 *
 * Y en el admin el enum existía en `AreaEnums.ts` con un test que afirmaba sus
 * valores… **y nada más**. El formulario no lo leía ni lo mandaba, así que
 * `requires_membership` se quedaba en `OPEN` para siempre: el servicio corría
 * sin recortar nunca nada.
 *
 * Una feature entera, completa en el API e inalcanzable. Es la tercera vez en
 * este proyecto, así que lo que se pinea acá no es el enum —eso ya lo mide
 * `areaEnums.test.ts`— sino **que la pantalla lo escriba**.
 *
 * ⚠️ El parche de producción mandaba un BOOLEANO (`Boolean(e.target.checked)`).
 * No se copió: en `dev` la bandera es un enum numérico y el Request valida
 * contra él. Se trae la intención, no el parche.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import ThirdPart from "../RenderForm/Partes/ThirdPart";
import { AreaMembership } from "../Type/AreaEnums";

const pintarLaTercerParte = (formState: any = {}) => {
  const handleChange = vi.fn();
  render(
    <ThirdPart handleChange={handleChange} errors={{}} formState={formState} />,
  );
  return { handleChange };
};

/** El `Switch` del campo, buscado por su `name` como lo hace el DOM real. */
const interruptorDe = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;

describe("el interruptor de membresía", () => {
  it("esta en la pantalla", () => {
    pintarLaTercerParte({ requires_membership: AreaMembership.OPEN });

    expect(screen.getByText("¿Requiere membresía?")).toBeTruthy();
    expect(interruptorDe("requires_membership")).not.toBeNull();
  });

  it("al activarlo manda el enum REQUIRED, no un booleano", () => {
    const { handleChange } = pintarLaTercerParte({
      requires_membership: AreaMembership.OPEN,
    });

    const interruptor = interruptorDe("requires_membership")!;
    fireEvent.click(interruptor);

    expect(handleChange).toHaveBeenCalledWith({
      target: { name: "requires_membership", value: AreaMembership.REQUIRED },
    });
    // El API valida con `Rule::enum(AreaMembership)`: un booleano lo rechaza.
    const [[llamada]] = handleChange.mock.calls;
    expect(typeof llamada.target.value).toBe("number");
  });

  it("al desactivarlo vuelve a OPEN", () => {
    const { handleChange } = pintarLaTercerParte({
      requires_membership: AreaMembership.REQUIRED,
    });

    fireEvent.click(interruptorDe("requires_membership")!);

    expect(handleChange).toHaveBeenCalledWith({
      target: { name: "requires_membership", value: AreaMembership.OPEN },
    });
  });

  it("no toca el interruptor hermano de aprobacion", () => {
    const { handleChange } = pintarLaTercerParte({
      requires_membership: AreaMembership.OPEN,
    });

    fireEvent.click(interruptorDe("requires_membership")!);

    const nombres = handleChange.mock.calls.map((c: any[]) => c[0].target.name);
    expect(nombres).toEqual(["requires_membership"]);
  });
});
