import { getResidentName, getUnitLabel } from "@/modulos/Calendar/helpers";
import type {
  ReservationResident,
  ReservationUnit,
} from "@/modulos/Reservas/Type/ReservaType";

/**
 * Las personas a nombre de las que el administrador puede crear una reserva.
 *
 * Decisión del dueño (2026-10-01): el administrador ELIGE al responsable —el
 * propietario de la unidad, su inquilino o un dependiente de cualquiera de los
 * dos— y el API guarda esa persona en `owner_id` después de verificar que
 * pertenece a la unidad y al condominio activo. Antes las dos pantallas
 * mostraban a una persona y mandaban siempre al titular.
 *
 * Lo usan el Calendario y `/create-reservas`: una sola regla para las dos.
 *
 * - Una persona aparece UNA vez por unidad aunque sea propietaria e inquilina,
 *   o dependiente de los dos.
 * - Una unidad sin personas no da opciones: no hay a nombre de quién reservar.
 * - `titular` llega como la persona directa (no `{owner}`) y siempre es el
 *   propietario o el inquilino; sólo se usa para marcarla en la etiqueta.
 */
export type ReservationUnitChoice = {
  id: string;
  name: string;
  unit: ReservationUnit;
  resident: ReservationResident;
  roleLabel: string;
};

export const buildReservationUnitChoices = (
  unit: ReservationUnit,
): ReservationUnitChoice[] => {
  const unitLabel = getUnitLabel(unit);
  const titularId = unit.titular?.id != null ? String(unit.titular.id) : "";
  const seen = new Set<string>();
  const choices: ReservationUnitChoice[] = [];

  const push = (resident: ReservationResident | null | undefined, roleLabel: string) => {
    // Sin id no hay a quién mandar como `owner_id`.
    if (resident?.id == null || resident.id === "") return;
    const personId = String(resident.id);
    if (seen.has(personId)) return;
    seen.add(personId);

    const titularMark = personId === titularId ? " (titular)" : "";
    choices.push({
      id: `${unit.id}:${personId}`,
      name: `${unitLabel}: ${getResidentName(resident)} · ${roleLabel}${titularMark}`,
      unit,
      resident,
      roleLabel,
    });
  };

  push(unit.homeowner, "Propietario");
  push(unit.tenant, "Inquilino");
  (unit.homeowner?.dependientes ?? []).forEach((dependent) =>
    push(dependent?.owner, "Dependiente de propietario"),
  );
  (unit.tenant?.dependientes ?? []).forEach((dependent) =>
    push(dependent?.owner, "Dependiente de inquilino"),
  );

  return choices;
};

export const buildReservationUnitChoicesForUnits = (
  units: ReservationUnit[] = [],
): ReservationUnitChoice[] => units.flatMap(buildReservationUnitChoices);

/** El `owner_id` que viaja al API: la persona elegida, nunca el titular. */
export const getChoiceOwnerId = (choice?: ReservationUnitChoice | null): string =>
  choice?.resident?.id != null ? String(choice.resident.id) : "";
