import { isMainAdministratorRole, isPlatform } from "@/components/ProfileModal/adminRolePolicy";

/**
 * Who may tick a permission letter in the role editor — mirrored from the API
 * (`RoleWriteRequest::rejectLettersTheActorDoesNotHave()`, 2026-10-08).
 *
 * | who | may grant |
 * |---|---|
 * | FOS (`fosrole_id > 0`) | everything |
 * | the condominium's `adm` | everything |
 * | anyone else | only the letters their own role has, module by module |
 *
 * What the role ALREADY had is never blocked: the API compares only what is
 * added, and removing a letter grants nothing. The API enforces it; this only
 * decides what the screen offers.
 *
 * ⚠️ The module is compared EXACTLY, like the API (`tieneLaHabilidad()`): the
 * admin's `userCan()` matches by prefix (`debts` opens `debts_manager:`), and
 * using it here would offer letters the API then rejects.
 */
type GrantActor = {
  fosrole_id?: number | string | null;
  role?: { code?: string | null; abilities?: string | null } | null;
};

export const lettersOf = (abilities: string | null | undefined, module: string): string =>
  String(abilities ?? "")
    .split("|")
    .filter((entry) => entry.split(":")[0] === module)
    .map((entry) => entry.split(":")[1] ?? "")
    .join("");

export const canGrantLetter = (
  actor: GrantActor | null | undefined,
  module: string,
  letter: string,
): boolean =>
  isPlatform(actor) ||
  isMainAdministratorRole(actor?.role) ||
  lettersOf(actor?.role?.abilities, module).includes(letter);
