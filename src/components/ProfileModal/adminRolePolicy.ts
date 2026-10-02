/**
 * Who gives or changes an administrator's role — the production rule
 * (`136ded88`, 2026-09-30), mirrored from the API (`UserController::roleChangeVeto()`).
 *
 * | who | can |
 * |---|---|
 * | FOS (`fosrole_id`) | everything, including the `adm` role |
 * | the condominium's `adm` with `users:U` | change another admin's role, never to or from `adm` |
 * | anyone else | nothing |
 *
 * The API enforces it; this only decides what the screen offers. `adm` is
 * exact and case-insensitive, like the API (`Role::isMainAdministrator()`).
 */
export const MAIN_ADMINISTRATOR_CODE = "adm";

type AdminRole = { id: number | string; code?: string | null; name?: string };

type AdminActor = {
  id?: string | number;
  fosrole_id?: number | string | null;
  role?: { code?: string | null } | null;
};

type AdminTarget = {
  id?: string | number;
  fosrole_id?: number | string | null;
  /** `GET v3/users?fullType=DET`: the role of THIS condominium, as a list. */
  role?: AdminRole[];
};

const isPlatform = (actor?: AdminActor | null) => Number(actor?.fosrole_id) > 0;

export const isMainAdministratorRole = (role?: { code?: string | null } | null) =>
  String(role?.code ?? "").trim().toLowerCase() === MAIN_ADMINISTRATOR_CODE;

export const canChangeAdminRole = (
  actor: AdminActor | null | undefined,
  target: AdminTarget | undefined,
  canUpdateUsers: boolean,
) => {
  const currentRole = target?.role?.[0];
  if (!actor || !currentRole || Number(target?.fosrole_id) > 0 || String(actor.id) === String(target?.id)) {
    return false;
  }
  if (isPlatform(actor)) return true;
  return canUpdateUsers && isMainAdministratorRole(actor.role) && !isMainAdministratorRole(currentRole);
};

/**
 * Creating or linking an administrator (Mario, 2026-10-02): FOS, or the
 * condominium's `adm` with `users:C`. Anyone else with `users:C` no longer can.
 */
export const canAddAdministrators = (actor: AdminActor | null | undefined, canCreateUsers: boolean) =>
  isPlatform(actor) || (canCreateUsers && isMainAdministratorRole(actor?.role));

/** The roles an actor may give: everything for FOS, everything but `adm` for anyone else. */
export const assignableAdminRoles = <T extends AdminRole>(roles: T[], actor: AdminActor | null | undefined): T[] =>
  roles.filter((role) => isPlatform(actor) || !isMainAdministratorRole(role));
