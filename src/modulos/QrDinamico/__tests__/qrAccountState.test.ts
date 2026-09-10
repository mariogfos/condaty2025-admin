import { describe, expect, it } from "vitest";
import { qrAccountState, apiMessage } from "../shared";
import { PAYMENT_TYPE_LABEL, PaymentType, QR_STATE_LABEL, QrOrderState } from "../types";
import { BankAccountStatus } from "../../BankAccounts/Type/BankType";

const unaCuenta = (extra: Record<string, unknown> = {}) => ({
  qr_dynamic_status: BankAccountStatus.ACTIVE,
  qr_dynamic_bank_id: 3,
  qr_dynamic_account_reference: "CTA-001",
  qr_dynamic_has_credentials: true,
  ...extra,
});

describe("El estado del QR de una cuenta bancaria", () => {
  it("una cuenta completa esta activa", () => {
    expect(qrAccountState(unaCuenta())).toBe("active");
  });

  /**
   * 🔴 «Incompleta» no es cosmético: es una cuenta que se ve encendida y NO
   * puede cobrar. Sin este estado se pinta igual que una lista para cobrar, y
   * el problema aparece recién el día del primer pago.
   */
  it.each([
    ["sin banco", { qr_dynamic_bank_id: null }],
    ["sin referencia", { qr_dynamic_account_reference: null }],
    ["sin credenciales", { qr_dynamic_has_credentials: false }],
  ])("encendida pero %s esta incompleta", (_caso, falta) => {
    expect(qrAccountState(unaCuenta(falta))).toBe("incomplete");
  });

  it("apagada esta deshabilitada aunque tenga todo cargado", () => {
    expect(
      qrAccountState(unaCuenta({ qr_dynamic_status: BankAccountStatus.INACTIVE })),
    ).toBe("disabled");
  });

  /**
   * 🔴🔴 El estado es el ENUM NUMÉRICO de la cuenta, no un booleano.
   *
   * En la rama `test` la columna era `qr_dynamic_enabled`, un booleano. Leerla
   * acá daría `undefined` en TODA cuenta: cada una se pintaría deshabilitada,
   * incluidas las que están cobrando.
   */
  it("lee qr_dynamic_status y no un booleano qr_dynamic_enabled", () => {
    const conElNombreViejo = {
      qr_dynamic_enabled: true,
      qr_dynamic_bank_id: 3,
      qr_dynamic_account_reference: "CTA-001",
      qr_dynamic_has_credentials: true,
    };

    expect(qrAccountState(conElNombreViejo)).toBe("disabled");
    expect(qrAccountState(unaCuenta())).toBe("active");
  });

  it("una cuenta sin datos no revienta", () => {
    expect(qrAccountState(undefined)).toBe("disabled");
    expect(qrAccountState({})).toBe("disabled");
  });
});

describe("El mensaje que ve el usuario", () => {
  it("sale de data.message en un 2xx", () => {
    expect(apiMessage({ data: { message: "guardado" } })).toBe("guardado");
  });

  /**
   * 🔴 En un no-2xx axios lanza y `useAxios` devuelve `data: null`: el cuerpo
   * del backend queda en `error.data`. Leer sólo `data.message` deja al usuario
   * sin explicación justo cuando hay algo que explicar.
   */
  it("sale de error.data.message cuando axios tiro", () => {
    expect(
      apiMessage({ data: null, error: { data: { message: "falta el banco" } } }),
    ).toBe("falta el banco");
  });

  it("sin nada que decir devuelve null", () => {
    expect(apiMessage({ data: null })).toBeNull();
  });
});

describe("Las etiquetas de las ordenes", () => {
  /**
   * 🔴🔴 `payment_type` lleva DOS alfabetos en la misma columna: el flujo viejo
   * guarda letras y el de deudas guarda el número del backend como texto.
   *
   * Sin los dos, una orden del flujo nuevo cae en `undefined` y React lo dibuja
   * como celda VACÍA: no se ve un error, se ve una orden sin tipo.
   */
  it.each([
    [PaymentType.EXPENSE, "Expensas"],
    [PaymentType.RESERVATION, "Reservas"],
    [PaymentType.DEBT_EXPENSES, "Expensas"],
    [PaymentType.DEBT_RESERVATIONS, "Reservas"],
    [PaymentType.DEBT_OTHER, "Otras deudas"],
  ])("el tipo %s tiene etiqueta", (tipo, esperada) => {
    expect(PAYMENT_TYPE_LABEL[tipo]).toBe(esperada);
  });

  /** Los dos estados del flujo de deudas también se nombran. */
  it.each([
    [QrOrderState.REPLACED, "Reemplazado"],
    [QrOrderState.EXPIRED, "Expirado"],
  ])("el estado %s tiene etiqueta", (estado, esperada) => {
    expect(QR_STATE_LABEL[estado]).toBe(esperada);
  });

  /**
   * ⚠️ Y el 3 sigue siendo ANULADO. En la rama `test` significa REEMPLAZADO:
   * si alguien copiara aquella numeración, toda orden anulada de esta base
   * pasaría a leerse como reemplazada.
   */
  it("el 3 sigue siendo anulado", () => {
    expect(QrOrderState.CANCELLED).toBe(3);
    expect(QR_STATE_LABEL[3 as QrOrderState]).toBe("Anulado");
  });
});
