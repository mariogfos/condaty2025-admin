type AdminRole = { id: number; code?: string; name?: string; status?: string };

type AdminActor = {
  id?: string | number;
  fosrole_id?: number | null;
  role?: { code?: string };
};

type AdminTarget = {
  id?: string | number;
  fosrole_id?: number | null;
  client_users?: Array<{ role?: AdminRole }>;
};

export const canChangeAdminRole = (
  actor: AdminActor | null | undefined,
  target: AdminTarget | undefined,
  canUpdateUsers: boolean,
) => {
  const currentRole = target?.client_users?.[0]?.role;
  if (!actor || !currentRole || target?.fosrole_id || String(actor.id) === String(target?.id)) {
    return false;
  }
  if (actor.fosrole_id) return true;
  return canUpdateUsers && actor.role?.code?.toLowerCase() === "adm" &&
    currentRole.code?.toLowerCase() !== "adm";
};

export const assignableAdminRoles = (roles: AdminRole[], actor: AdminActor | null | undefined) =>
  roles.filter((role) => (role.status === undefined || role.status === "A") &&
    (actor?.fosrole_id || role.code?.toLowerCase() !== "adm"));
