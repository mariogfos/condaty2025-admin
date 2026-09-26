import { ClientOwnerStatus, OwnerStatus } from "@/modulos/Payments/Type/PaymentType";

/**
 * Los dos estados de un residente, y cuál manda en la pantalla.
 *
 * 🔴 `status` de la fila es el de la CUENTA, global a todos los condominios.
 * El del vínculo con ESTE condominio es otro. Un prerregistrado en un segundo
 * condominio tiene la cuenta activa y el vínculo en espera: mirando sólo
 * `status` salía «Activo» y no se ofrecía aprobarlo.
 *
 * El API manda los tres en el padrón (`fullType=L`) y los dos primeros en la
 * búsqueda por CI (`account_status`, `current_membership`). Viene de
 * `ownerAccountState.ts` de producción, con los enums numéricos de `dev`.
 */
export const getOwnerAccountStatus = (owner: any): number | undefined =>
  owner?.account_status ?? owner?.status;

export const getOwnerMembershipStatus = (owner: any): number | undefined =>
  owner?.current_membership?.status ?? owner?.membership_status;

export const getOwnerOperationalStatus = (owner: any): number | undefined => {
  if (owner?.operational_status != null) return owner.operational_status;

  const account = getOwnerAccountStatus(owner);
  const membership = getOwnerMembershipStatus(owner);
  const accountIsUsable =
    account === OwnerStatus.ACTIVE ||
    account === OwnerStatus.PASSWORD_CHANGE_REQUIRED;

  return accountIsUsable ? (membership ?? account) : account;
};

export const isPendingOwner = (owner: any): boolean =>
  getOwnerOperationalStatus(owner) === OwnerStatus.WAITING;

/**
 * La cuenta quedó en espera pero el vínculo ya está activo: eso lo resuelve el
 * botón «Activar cuenta». Un vínculo en espera es una solicitud y va por
 * «Aprobar solicitud».
 */
export const isRecoverablePendingAccount = (owner: any): boolean =>
  getOwnerAccountStatus(owner) === OwnerStatus.WAITING &&
  getOwnerMembershipStatus(owner) === ClientOwnerStatus.ACTIVE;
