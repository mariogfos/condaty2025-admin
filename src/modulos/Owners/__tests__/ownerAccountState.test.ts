import { describe, expect, it } from "vitest";
import { ClientOwnerStatus, OwnerStatus } from "@/modulos/Payments/Type/PaymentType";
import {
  getOwnerOperationalStatus,
  isPendingOwner,
  isRecoverablePendingAccount,
} from "../ownerAccountState";

describe("el estado que manda en la pantalla de residentes", () => {
  it("con la cuenta activa, manda el vínculo: el prerregistrado de un segundo condominio queda pendiente", () => {
    const fila = { status: OwnerStatus.ACTIVE, membership_status: ClientOwnerStatus.WAITING };

    expect(getOwnerOperationalStatus(fila)).toBe(ClientOwnerStatus.WAITING);
    expect(isPendingOwner(fila)).toBe(true);
  });

  it("con la cuenta en espera o deshabilitada, manda la cuenta", () => {
    expect(getOwnerOperationalStatus({ account_status: OwnerStatus.DISABLED, membership_status: ClientOwnerStatus.ACTIVE })).toBe(OwnerStatus.DISABLED);
    expect(isPendingOwner({ account_status: OwnerStatus.WAITING, membership_status: ClientOwnerStatus.ACTIVE })).toBe(true);
  });

  it("el que manda el API gana", () => {
    expect(getOwnerOperationalStatus({ status: OwnerStatus.ACTIVE, operational_status: OwnerStatus.WAITING })).toBe(OwnerStatus.WAITING);
  });

  it("«Activar cuenta» es sólo para la cuenta en espera con el vínculo activo", () => {
    expect(isRecoverablePendingAccount({ account_status: OwnerStatus.WAITING, membership_status: ClientOwnerStatus.ACTIVE })).toBe(true);
    expect(isRecoverablePendingAccount({ account_status: OwnerStatus.WAITING, membership_status: ClientOwnerStatus.WAITING })).toBe(false);
    expect(isRecoverablePendingAccount({ account_status: OwnerStatus.ACTIVE, membership_status: ClientOwnerStatus.ACTIVE })).toBe(false);
  });
});
