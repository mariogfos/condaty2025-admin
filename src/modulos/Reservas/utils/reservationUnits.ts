import { getFullName } from "@/mk/utils/string";
import type {
  ReservationResident,
  ReservationUnit,
} from "@/modulos/Reservas/types";

export type ReservationUnitChoice = {
  id: string;
  name: string;
  unit: ReservationUnit;
  resident: ReservationResident | null;
  roleLabel: string;
};

const unitCollator = new Intl.Collator("es", {
  numeric: true,
  sensitivity: "base",
});

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const getResidentIdentity = (resident?: ReservationResident | null) => {
  if (!resident) return "";
  if (resident.id !== undefined && resident.id !== null) return String(resident.id);

  return normalizeText(getReservationResidentFullName(resident));
};

const isSameResident = (
  left?: ReservationResident | null,
  right?: ReservationResident | null,
) => {
  const leftKey = getResidentIdentity(left);
  const rightKey = getResidentIdentity(right);

  return Boolean(leftKey && rightKey && leftKey === rightKey);
};

export const getReservationUnitNumber = (unit?: ReservationUnit | null) =>
  String(unit?.nro ?? "").trim();

export const compareReservationUnits = (
  left?: ReservationUnit | null,
  right?: ReservationUnit | null,
) => {
  const leftNumber = getReservationUnitNumber(left);
  const rightNumber = getReservationUnitNumber(right);
  const byNumber = unitCollator.compare(leftNumber, rightNumber);

  if (byNumber !== 0) return byNumber;

  return unitCollator.compare(String(left?.id ?? ""), String(right?.id ?? ""));
};

export const sortReservationUnits = (units: ReservationUnit[] = []) =>
  [...units].sort(compareReservationUnits);

export const getReservationResidentFullName = (
  resident?: ReservationResident | null,
) =>
  getFullName({
    name: resident?.name || undefined,
    middle_name: resident?.middle_name || undefined,
    last_name: resident?.last_name || undefined,
    mother_last_name: resident?.mother_last_name || undefined,
  });

export const getReservationUnitTitular = (
  unit?: ReservationUnit | null,
): ReservationResident | null => {
  const titular = unit?.titular as
    | (Record<string, any> & { owner?: ReservationResident | null })
    | null
    | undefined;

  if (!titular) return null;
  if (titular.owner) return titular.owner;
  if (titular.name || titular.last_name || titular.middle_name) {
    return titular as ReservationResident;
  }

  return null;
};

export const getReservationUnitOwnerId = (
  unit?: ReservationUnit | null,
): string => {
  const titular = unit?.titular as Record<string, any> | null | undefined;
  const titularOwner = getReservationUnitTitular(unit);

  return String(titularOwner?.id ?? titular?.owner_id ?? titular?.id ?? "");
};

export const getReservationUnitPrimaryChoice = (
  unit?: ReservationUnit | null,
): ReservationUnitChoice => {
  const fallbackUnit = unit as ReservationUnit;
  const choices = unit ? buildReservationUnitChoicesForUnit(unit, false) : [];

  return (
    choices[0] || {
      id: `${fallbackUnit?.id ?? "unit"}:unit`,
      name: `${getReservationUnitDisplayLabel(unit)}: Sin residente`,
      unit: fallbackUnit,
      resident: null,
      roleLabel: "Sin residente",
    }
  );
};

export const getReservationUnitPrimaryResident = (
  unit?: ReservationUnit | null,
) => getReservationUnitPrimaryChoice(unit).resident;

export const getReservationUnitDisplayLabel = (
  unit?: ReservationUnit | null,
) => {
  if (!unit) return "Sin unidad";

  const unitNumber = getReservationUnitNumber(unit);
  return unitNumber ? `Unidad ${unitNumber}` : "Unidad sin número";
};

export const formatReservationUnitChoiceName = (
  unit: ReservationUnit,
  resident?: ReservationResident | null,
  roleLabel = "Sin residente",
) => {
  const residentName = resident ? getReservationResidentFullName(resident) : "";
  const meta = residentName
    ? `${residentName} · ${roleLabel}`
    : roleLabel;

  return `${getReservationUnitDisplayLabel(unit)} - ${meta}`;
};

const buildReservationUnitChoicesForUnit = (
  unit: ReservationUnit,
  includeDependents = true,
): ReservationUnitChoice[] => {
  const choices: ReservationUnitChoice[] = [];
  const seenResidents = new Set<string>();

  const pushChoice = (
    resident: ReservationResident | null | undefined,
    roleLabel: string,
    fallbackKey: string,
  ) => {
    if (!resident) return;

    const residentName = getReservationResidentFullName(resident) || roleLabel;
    const dedupeKey = getResidentIdentity(resident) || `${fallbackKey}:${residentName}`;

    if (seenResidents.has(dedupeKey)) {
      return;
    }

    seenResidents.add(dedupeKey);
    choices.push({
      id: `${unit.id}:${fallbackKey}:${dedupeKey}`,
      name: formatReservationUnitChoiceName(unit, resident, roleLabel),
      unit,
      resident,
      roleLabel,
    });
  };

  const homeowner = unit.homeowner || null;
  const tenant = unit.tenant || null;
  const titular = getReservationUnitTitular(unit);

  if (homeowner && tenant && isSameResident(homeowner, tenant)) {
    pushChoice(homeowner, "Propietario/Residente", "homeowner-resident");
  } else {
    pushChoice(homeowner, "Propietario", "homeowner");
    pushChoice(tenant, "Residente", "tenant");
  }

  if (
    titular &&
    !isSameResident(titular, homeowner) &&
    !isSameResident(titular, tenant)
  ) {
    pushChoice(titular, "Titular", "titular");
  }

  if (includeDependents) {
    const homeownerDependents = Array.isArray(homeowner?.dependientes)
      ? homeowner.dependientes
      : [];
    homeownerDependents.forEach((dependent, index) => {
      pushChoice(
        dependent?.owner,
        "Dependiente de propietario",
        `homeowner-dependent-${dependent?.owner_id || index}`,
      );
    });

    const tenantDependents = Array.isArray(tenant?.dependientes)
      ? tenant.dependientes
      : [];
    tenantDependents.forEach((dependent, index) => {
      pushChoice(
        dependent?.owner,
        "Dependiente de residente",
        `tenant-dependent-${dependent?.owner_id || index}`,
      );
    });
  }

  if (choices.length > 0) {
    return choices;
  }

  return [
    {
      id: `${unit.id}:unit`,
      name: `${getReservationUnitDisplayLabel(unit)} - Sin residente`,
      unit,
      resident: null,
      roleLabel: "Sin residente",
    },
  ];
};

export const buildReservationUnitChoices = (units: ReservationUnit[] = []) =>
  sortReservationUnits(units).flatMap((unit) =>
    buildReservationUnitChoicesForUnit(unit),
  );

export const buildReservationUnitSelectOptions = (
  units: ReservationUnit[] = [],
) =>
  sortReservationUnits(units).map((unit) => {
    const choice = getReservationUnitPrimaryChoice(unit);

    return {
      id: String(unit.id),
      name: formatReservationUnitChoiceName(
        unit,
        choice.resident,
        choice.roleLabel,
      ),
    };
  });
