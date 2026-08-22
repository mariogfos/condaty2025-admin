import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import React from "react";

/**
 * Elegir unidades a mano NO le cobra al condominio entero.
 *
 * ## 🔴🔴 Qué se rompía
 *
 * El formulario decidía si mandar `dpto_id` así:
 *
 * ```tsx
 * const dataToSave =
 *   _formState.asignar === "S" ? { ...baseData, dpto_id } : baseData;
 * ```
 *
 * `"S"` es la letra vieja. Desde el 2026-08-22 el Select manda el número de
 * `DebtSegmentation` —`LISTA` es `4`—, así que esa comparación es **falsa
 * siempre** y `dpto_id` no viajaba nunca.
 *
 * 🔴 Del otro lado, `SharedDebtService::resolveDptos` entra en la rama LISTA
 * sólo `if ($asignar === LISTA && $request->has('dpto_id'))`. Sin la llave, cae
 * al `return` de abajo: **todas las unidades activas del condominio**. Elegir
 * tres unidades le cobraba a las 120, con un 200 y sin un solo error.
 *
 * La misma letra vieja estaba en `validar()`, así que tampoco exigía elegir
 * alguna.
 *
 * ## Cómo mide
 *
 * 🔴 Sobre el objeto que recibe `onSave` —lo que efectivamente viaja—, no sobre
 * el texto del archivo. Y con **las dos puntas**: con LISTA tiene que ir, y con
 * TODOS no tiene que ir, o el test pasaría igual mandando `dpto_id` siempre.
 *
 * ## Reinyección, medida el 2026-08-22
 *
 * Con el `=== "S"` de vuelta: **2 rojos** (el de LISTA y el de la validación).
 */

const showToast = vi.fn();

vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) mocked[key] = () => null;
  return mocked;
});

import RenderForm from "../RenderForm/RenderForm";
import { AmountType, DebtSegmentation } from "@/types/PaymentType";

const onSave = vi.fn();

const extraData = {
  categories: [{ id: 1, name: "Servicios", hijos: [{ id: 55, name: "Agua" }] }],
  dptos: [
    { id: 7, nro: "A-101" },
    { id: 9, nro: "A-102" },
  ],
};

/** Una compartida válida: pasa `validar()` sin tocar la pantalla. */
const compartidaValida = {
  begin_at: "2026-08-01",
  due_at: "2026-09-01",
  amount: "300",
  category_id: 1,
  subcategory_id: 55,
  amount_type: AmountType.FIJO,
  description: "Pintura fachada",
};

const montar = (item: Record<string, any>) =>
  render(
    <RenderForm
      open
      onClose={() => {}}
      item={item as any}
      extraData={extraData}
      execute={vi.fn()}
      showToast={showToast}
      reLoad={vi.fn()}
      onSave={onSave}
      user={{ id: 1, client_id: 9, clients: [{ id: 9 }] }}
    />
  );

const apretarCrear = async () => {
  const boton = await screen.findByText("Crear deuda compartida", {
    selector: "button, button *",
  });
  await act(async () => {
    fireEvent.click(boton);
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
};

/** El objeto que efectivamente salió a guardar. */
const loQueSeGuarda = () => onSave.mock.calls.at(-1)?.[0];

describe("Deuda compartida: a quién se le cobra", () => {
  beforeEach(() => {
    onSave.mockReset();
    showToast.mockReset();
  });

  afterEach(() => cleanup());

  it("con unidades elegidas, las unidades VIAJAN en el cuerpo", async () => {
    montar({
      ...compartidaValida,
      asignar: DebtSegmentation.LISTA,
      dpto_id: [7, 9],
    });
    await apretarCrear();

    const cuerpo = loQueSeGuarda();
    expect(cuerpo, "el alta tiene que llamar a onSave").toBeDefined();
    expect(
      cuerpo.dpto_id,
      "sin dpto_id el API le cobra a TODAS las unidades del condominio"
    ).toEqual([7, 9]);
  });

  /**
   * ⚠️ La otra punta. Sin este caso, mandar `dpto_id` siempre dejaría el de
   * arriba verde — y le estaría cobrando a una lista cuando el operador eligió
   * «todas».
   */
  it("con «todas las unidades», NO viaja ninguna lista", async () => {
    montar({
      ...compartidaValida,
      asignar: DebtSegmentation.TODOS,
      dpto_id: [7, 9],
    });
    await apretarCrear();

    expect(loQueSeGuarda()).not.toHaveProperty("dpto_id");
  });

  /**
   * 🔴 La misma letra vieja estaba en `validar()`: elegir «Seleccionar
   * Unidades» y no marcar ninguna salía igual, y el API lo leía como «todas».
   */
  it("elegir unidades sin marcar ninguna NO despacha el alta", async () => {
    montar({
      ...compartidaValida,
      asignar: DebtSegmentation.LISTA,
      dpto_id: [],
    });
    await apretarCrear();

    expect(onSave).not.toHaveBeenCalled();
  });

  /**
   * El estado del formulario es booleano —son checkboxes— pero lo que viaja es
   * el case del enum. Con `has_pp` en el caso BAJO tiene que salir el BAJO.
   */
  it("las banderas viajan como el case del enum que el operador dejó", async () => {
    montar({
      ...compartidaValida,
      asignar: DebtSegmentation.TODOS,
      has_mv: 1,
      is_forgivable: 1,
      has_pp: 1,
      is_blocking: 1,
    });
    await apretarCrear();

    const cuerpo = loQueSeGuarda();
    expect(cuerpo.has_mv).toBe(1);
    expect(cuerpo.is_forgivable).toBe(1);
    expect(cuerpo.has_pp).toBe(1);
    expect(cuerpo.is_blocking).toBe(1);
  });
});
