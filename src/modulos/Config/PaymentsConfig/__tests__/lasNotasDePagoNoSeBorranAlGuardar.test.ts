import { describe, expect, it } from "vitest";
import { createFormState } from "../PaymentsConfig";

/**
 * Las tres notas de pago: lo que el residente lee al elegir cómo pagar.
 *
 * ## Dónde se ven
 *
 * - `payment_office_obs` → rnOwner, "Detalle del pago en oficina" → Indicaciones.
 * - `payment_transfer_obs` → rnOwner, "Datos para la transferencia".
 * - `payment_qr_obs` → viaja como `instructions` en el payload del QR
 *   (`QrDinamicoService:265`).
 *
 * ## 🔴 Por qué este test y no otro
 *
 * `PaymentsConfig` manda al guardar **todo** su `formState`. Un campo que la
 * pantalla no cargue sale en `""` y **borra lo que el condominio tenía
 * escrito**, sin error y sin log. Es la misma forma que en la API dejó a 32 de
 * 37 condominios sin cancelación automática de reservas (PR #313).
 *
 * Con 11, 9 y 11 condominios que hoy tienen estas notas cargadas, el defecto
 * sería visible recién cuando un residente llame preguntando dónde pagar.
 */
describe("las notas de pago sobreviven a guardar la pestaña", () => {
  it("las tres se cargan de lo que mandó el back", () => {
    const estado = createFormState({
      main_account_id: 7,
      payment_office_obs: "Caja de 8 a 16.",
      payment_transfer_obs: "Poné el número de unidad en el concepto.",
      payment_qr_obs: "Escaneá con la app del banco.",
    });

    expect(estado.payment_office_obs).toBe("Caja de 8 a 16.");
    expect(estado.payment_transfer_obs).toBe(
      "Poné el número de unidad en el concepto.",
    );
    expect(estado.payment_qr_obs).toBe("Escaneá con la app del banco.");
  });

  it("guardar sin tocarlas manda exactamente lo que había", () => {
    const delBack = {
      main_account_id: 7,
      reserve_account_id: 8,
      expense_account_id: 9,
      payment_office_obs: "Caja de 8 a 16.",
      payment_transfer_obs: "A nombre de la administración.",
      payment_qr_obs: "Guardá el comprobante.",
    };

    // Lo que se manda al guardar es el formState entero, sin editar nada.
    expect(createFormState(delBack)).toEqual(delBack);
  });

  it("un condominio que no las tiene cargadas no las inventa", () => {
    const estado = createFormState({ main_account_id: 7 });

    expect(estado.payment_office_obs).toBe("");
    expect(estado.payment_transfer_obs).toBe("");
    expect(estado.payment_qr_obs).toBe("");
  });

  it("sin configuración, la pantalla no revienta", () => {
    expect(() => createFormState(null)).not.toThrow();
    expect(createFormState(undefined).payment_qr_obs).toBe("");
  });
});
