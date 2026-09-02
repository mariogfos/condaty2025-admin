/**
 * El boton «Responder encuesta» no aparecia NUNCA.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 `=== "A"` CONTRA UNA COLUMNA `tinyint`
 * ────────────────────────────────────────────────────────────────────────
 *
 * `SurveyDetailModal` decidia asi:
 *
 *     const canAnswer =
 *       surveyDetail?.can_respond &&
 *       !initialSurvey.has_responded &&
 *       initialSurvey.status === "A";
 *
 *     buttonText={canAnswer ? "Responder encuesta" : ""}
 *
 * `surveys.status` es `tinyint` —medido con `SHOW COLUMNS`— y el enum del API
 * documenta el mapeo: `'A' → 4`. La comparacion era siempre falsa, `buttonText`
 * quedaba vacio y **desde este modal no se podia votar una encuesta ni una
 * votacion de asamblea**.
 *
 * La hermana de al lado hacia lo mismo: `isClosed` comparaba contra `"C"` y
 * `"X"` (`'C' → 6`, `'X' → 7`), asi que una encuesta cerrada nunca traia sus
 * resultados.
 *
 * ⚠️ Y `SurveyStatus` YA ESTABA IMPORTADO en ese archivo —lo usa como tipo para
 * indexar `SURVEY_STATUSES`—. El enum estaba a mano, en el mismo archivo.
 *
 * Las dos decisiones viven en `estadoDeLaEncuesta.ts` y el modal las llama: asi
 * este test mide la funcion REAL y no una copia parecida —una foto contra otra
 * foto no mide nada—. El modal arrastra `useMySurveys` y media docena de
 * componentes de pregunta, y lo que se rompio no fue el render: fue la
 * comparacion.
 */
import { describe, it, expect } from "vitest";
import { SurveyStatus } from "../types/surveys.types";
// Las funciones REALES que llama `SurveyDetailModal`, no una copia parecida.
import { estaCerrada, sePuedeResponder } from "../estadoDeLaEncuesta";

describe("el mapeo de los chars viejos", () => {
  it("es el que documenta el enum del API", () => {
    // 'D' → 1  'V' → 2  'S' → 3  'A' → 4  'P' → 5  'C' → 6  'X' → 7
    expect(SurveyStatus.Active).toBe(4);
    expect(SurveyStatus.Closed).toBe(6);
    expect(SurveyStatus.Disabled).toBe(7);
  });
});

describe("se puede responder", () => {
  it("con la encuesta ACTIVA y permiso, si", () => {
    expect(sePuedeResponder(SurveyStatus.Active, true, false)).toBe(true);
  });

  it("el char viejo NO alcanza: era lo que apagaba el boton", () => {
    expect(sePuedeResponder("A", true, false)).toBe(false);
  });

  it("sin permiso o ya respondida, no", () => {
    expect(sePuedeResponder(SurveyStatus.Active, false, false)).toBe(false);
    expect(sePuedeResponder(SurveyStatus.Active, true, true)).toBe(false);
  });

  it("una pausada o una cerrada tampoco", () => {
    expect(sePuedeResponder(SurveyStatus.Paused, true, false)).toBe(false);
    expect(sePuedeResponder(SurveyStatus.Closed, true, false)).toBe(false);
  });
});

describe("esta cerrada", () => {
  it("cerrada y deshabilitada, si", () => {
    expect(estaCerrada(SurveyStatus.Closed)).toBe(true);
    expect(estaCerrada(SurveyStatus.Disabled)).toBe(true);
  });

  it("los chars viejos no", () => {
    expect(estaCerrada("C")).toBe(false);
    expect(estaCerrada("X")).toBe(false);
  });

  it("una activa no esta cerrada", () => {
    expect(estaCerrada(SurveyStatus.Active)).toBe(false);
  });
});
