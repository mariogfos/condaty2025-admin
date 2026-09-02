import { describe, expect, it, vi } from "vitest";

import { surveyNotifications } from "../notifications";
import { estadoDelAviso, subtituloDelCambioDeEstado } from "../estadoDeLaEncuesta";
import { SurveyStatus } from "../types/surveys.types";

/**
 * 🔴🔴 EL AVISO DE «PAUSADA / CERRADA / REANUDADA» NO SALÍA NUNCA.
 *
 * El handler decidía con `["A", "P", "C"].includes(payload?.status)`, y el
 * `payload.status` lo pone el propio admin al emitir: `SurveyStatusActions`
 * manda `status: targetStatus` y `AssemblyDetail` manda `status: status`, los
 * dos valores de `SurveyStatus`, que es numérico desde 1 —`surveys.status` es
 * `tinyint`—. Un `includes` de letras contra un `4`, `5` o `6` es siempre
 * falso: el `if` entero no entraba.
 *
 * ⚠️ El `dispatch` está FUERA del `if`, así que el listado sí refrescaba. Por
 * eso el defecto no se veía mirando la pantalla: los datos llegan y lo único
 * que falta es el aviso que explica por qué cambiaron.
 *
 * Se mide llamando al HANDLER, no sólo al helper: el defecto no estaba en
 * traducir el estado sino en el `if` que decidía si se mostraba algo.
 */
const correrElHandler = (payload: any) => {
  const showToast = vi.fn();
  const dispatch = vi.fn();

  surveyNotifications.events["survey-status-change"]({
    payload,
    showToast,
    dispatch,
  } as any);

  return { showToast, dispatch };
};

describe("el aviso de que otro admin cambió el estado", () => {
  it.each([
    [SurveyStatus.Paused, "📢 Encuesta pausada: Cuotas 2026"],
    [SurveyStatus.Closed, "📢 Encuesta cerrada: Cuotas 2026"],
    [SurveyStatus.Active, "📢 Encuesta reanudada: Cuotas 2026"],
  ])("estado %s → %s", (status, esperado) => {
    const { showToast } = correrElHandler({ status, title: "Cuotas 2026" });

    expect(showToast).toHaveBeenCalledWith(esperado, "info");
  });

  it("una votación de asamblea no lleva el título pegado", () => {
    const { showToast } = correrElHandler({
      status: SurveyStatus.Closed,
      title: "Cuotas 2026",
      source: "assembly",
    });

    expect(showToast).toHaveBeenCalledWith("📢 Votación cerrada", "info");
  });

  /**
   * La contraprueba. Sin esto, un handler que avisara SIEMPRE —cualquier
   * estado, cualquier basura— pasaría los casos de arriba igual.
   */
  it.each([
    SurveyStatus.Draft,
    SurveyStatus.Visible,
    SurveyStatus.Scheduled,
    SurveyStatus.Disabled,
  ])("el estado %s no anuncia nada", (status) => {
    const { showToast } = correrElHandler({ status, title: "Cuotas 2026" });

    expect(showToast).not.toHaveBeenCalled();
  });

  it.each([null, undefined, "", 0, 99, "ZZ", {}])(
    "%p tampoco inventa un aviso",
    (status) => {
      const { showToast } = correrElHandler({ status, title: "Cuotas 2026" });

      expect(showToast).not.toHaveBeenCalled();
    },
  );

  /** El refresco del listado nunca dependió del aviso, y sigue sin depender. */
  it("el listado se entera aunque no haya aviso", () => {
    const { dispatch } = correrElHandler({ status: SurveyStatus.Draft });

    expect(dispatch).toHaveBeenCalledWith(
      "survey:status",
      expect.objectContaining({ status: SurveyStatus.Draft }),
    );
  });
});

describe("estadoDelAviso: el payload entra sin tipo", () => {
  it("acepta el número y el número como texto", () => {
    expect(estadoDelAviso(SurveyStatus.Paused)).toBe(SurveyStatus.Paused);
    expect(estadoDelAviso("5")).toBe(SurveyStatus.Paused);
  });

  /**
   * ⚠️ La letra vieja se sigue aceptando a propósito: el aviso lo emite OTRO
   * admin y nada garantiza que las dos pestañas tengan el mismo build.
   */
  it("acepta la letra vieja de un admin sin actualizar", () => {
    expect(subtituloDelCambioDeEstado("Encuesta", "P")).toBe(
      "Encuesta pausada",
    );
    expect(subtituloDelCambioDeEstado("Encuesta", "c")).toBe(
      "Encuesta cerrada",
    );
  });

  it("lo que no sabe traducir es null, no un estado inventado", () => {
    [null, undefined, "", "ZZ", 0, 99, {}].forEach((valor) => {
      expect(estadoDelAviso(valor)).toBeNull();
    });
  });
});
