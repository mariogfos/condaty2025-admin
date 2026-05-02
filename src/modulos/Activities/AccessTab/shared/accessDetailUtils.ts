import { getFullName } from "@/mk/utils/string";

type AnyRecord = Record<string, any>;

const URL_KEYS = [
  "secureUrl",
  "secure_url",
  "url",
  "src",
  "path",
  "file",
  "download_url",
  "original_url",
];

export const cleanUrl = (value: any): string => {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";

  const withoutQuotes = raw.replace(/[`'"]/g, "").trim();
  if (!withoutQuotes || withoutQuotes.includes("undefined")) return "";
  return withoutQuotes;
};

const parseMaybeJson = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (
    (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
    (trimmed.startsWith("{") && trimmed.endsWith("}"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
};

export const extractImageUrls = (input: any): string[] => {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.flatMap(extractImageUrls);
  }

  if (typeof input === "string") {
    const parsed = parseMaybeJson(input);
    if (parsed !== input) {
      return extractImageUrls(parsed);
    }
    const cleaned = cleanUrl(parsed);
    return cleaned ? [cleaned] : [];
  }

  if (typeof input === "object") {
    const direct = URL_KEYS.flatMap((key) => extractImageUrls(input?.[key]));
    if (direct.length > 0) return direct;
  }

  return [];
};

export const collectUniqueImages = (...sources: any[]): string[] => {
  return Array.from(new Set(sources.flatMap(extractImageUrls)));
};

export const getEntityName = (entity: AnyRecord | null | undefined): string => {
  if (!entity) return "";
  return (
    getFullName(entity) ||
    entity?.full_name ||
    entity?.name ||
    entity?.title ||
    ""
  );
};

export const getEntityAvatar = (entity: AnyRecord | null | undefined) => {
  return (
    cleanUrl(entity?.url_avatar) ||
    collectUniqueImages(
      entity?.url_image_a,
      entity?.url_image_r,
      entity?.url_image,
    )[0] ||
    ""
  );
};

export const getEntityGallery = (entity: AnyRecord | null | undefined) => {
  return collectUniqueImages(
    entity?.url_image_a,
    entity?.url_image_r,
    entity?.url_image,
  );
};

export const getPrimaryUnit = (owner: AnyRecord | null | undefined) => {
  if (!owner?.dpto) return null;
  return Array.isArray(owner.dpto) ? owner.dpto[0] : owner.dpto;
};

export const getUnitLabel = (owner: AnyRecord | null | undefined) => {
  const unit = getPrimaryUnit(owner);
  if (!unit) return "-/-";

  const prefix = unit?.type?.name || "Unidad";
  const identifier = unit?.nro || unit?.description || "-/-";
  return `${prefix} ${identifier}`.trim();
};

export const getAccessTypeLabel = (type: string, detail: AnyRecord) => {
  const typeMap: Record<string, string> = {
    C: "Sin QR",
    I: "QR Individual",
    G: "QR Grupal",
    F: "QR Frecuente",
    P: "Pedido",
    O: "Llave QR",
  };

  if (type === "P") {
    return `Pedido/${detail?.other?.other_type?.name || "-/-"}`;
  }

  return typeMap[type] || "-/-";
};

export const getAccessStatusInfo = (detail: AnyRecord) => {
  if (detail?.out_at) {
    return { label: "Completado", tone: "success" as const };
  }

  if (detail?.in_at) {
    return { label: "Por salir", tone: "info" as const };
  }

  if (detail?.confirm === "N" || detail?.rejected_guard_id != null) {
    return { label: "Rechazado", tone: "danger" as const };
  }

  if (!detail?.confirm_at) {
    return { label: "Por confirmar", tone: "warning" as const };
  }

  return { label: "Por entrar", tone: "accent" as const };
};

export const getMovementMode = (detail: AnyRecord) => {
  const related = Array.isArray(detail?.accesses) ? detail.accesses : [];
  const hasTaxiRelation = related.some(
    (entry: AnyRecord) => entry?.taxi === "C" || entry?.plate,
  );
  return detail?.plate || detail?.taxi === "C" || hasTaxiRelation
    ? "Vehicular"
    : "Peatonal";
};

export const getRequestActorInfo = (detail: AnyRecord) => {
  const approvedByGuard =
    detail?.confirm === "G" || detail?.rejected_guard_id != null;
  const actor = approvedByGuard ? detail?.guardia : detail?.owner;
  const actorName = getEntityName(actor);

  if (!actorName) {
    return {
      label: detail?.confirm === "N" ? "Rechazado por" : "Aprobado por",
      actor,
      actorName: "",
      roleText: "",
    };
  }

  return {
    label: detail?.confirm === "N" ? "Rechazado por" : "Aprobado por",
    actor,
    actorName,
    roleText: approvedByGuard ? "Guardia" : "Residente",
  };
};

export const getAccessHeadline = (detail: AnyRecord) => {
  const subject = detail?.type === "O" ? detail?.owner : detail?.visit;
  const subjectName = getEntityName(subject) || "Sin nombre";
  const ownerName = getEntityName(detail?.owner) || "Residente";
  const unit = getUnitLabel(detail?.owner);

  if (detail?.type === "O") {
    return `${subjectName} registro su acceso a ${unit}`;
  }

  if (detail?.type === "P") {
    return `${subjectName} entrego a ${ownerName}`;
  }

  return `${subjectName} visito a ${ownerName}`;
};

export const splitRelatedAccesses = (detail: AnyRecord) => {
  const related = Array.isArray(detail?.accesses) ? detail.accesses : [];
  return {
    companions: related.filter((entry: AnyRecord) => entry?.taxi !== "C"),
    taxis: related.filter((entry: AnyRecord) => entry?.taxi === "C"),
  };
};

export const flattenAccessDevices = (groups: AnyRecord[] = []) => {
  const devicesMap = new Map<string, AnyRecord>();
  const actions: AnyRecord[] = [];

  groups.forEach((group, groupIndex) => {
    const deviceList = Array.isArray(group?.devices) ? group.devices : [];

    deviceList.forEach((device: AnyRecord, deviceIndex: number) => {
      const key =
        device?.device_id ||
        device?.installation_id ||
        device?.uuid ||
        [
          group?.guard_id || groupIndex,
          device?.device_name || "device",
          device?.brand || "brand",
          device?.model || deviceIndex,
        ].join("|");

      const previous = devicesMap.get(key);
      if (previous) {
        const guardNames = new Set([
          ...(previous.guardNames || []),
          ...(group?.guard_name ? [group.guard_name] : []),
        ]);
        devicesMap.set(key, {
          ...previous,
          ...device,
          guardNames: Array.from(guardNames),
        });
        return;
      }

      devicesMap.set(key, {
        ...device,
        guardNames: group?.guard_name ? [group.guard_name] : [],
      });
    });

    (Array.isArray(group?.actions) ? group.actions : []).forEach(
      (action: AnyRecord, actionIndex: number) => {
        actions.push({
          ...action,
          _sortKey: action?.date_at || "",
          _key: `${group?.guard_id || groupIndex}-${actionIndex}`,
          guardName: group?.guard_name || "",
          deviceName:
            deviceList.length === 1 ? deviceList[0]?.device_name || "" : "",
        });
      },
    );
  });

  actions.sort((a, b) => String(b._sortKey).localeCompare(String(a._sortKey)));

  return {
    devices: Array.from(devicesMap.values()),
    actions,
  };
};
