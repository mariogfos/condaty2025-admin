const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[:]/g, "")
    .replace(/\s+/g, " ");

const EXACT_LABELS = new Set([
  "nombre",
  "descripcion",
  "observacion",
  "observaciones",
  "comentario",
  "comentarios",
  "indicacion",
  "indicaciones",
  "propietario",
  "propietarios",
  "residente",
  "residentes",
  "dependiente",
  "dependientes",
  "guardia",
  "guardias",
  "titular",
  "visitante",
  "visitantes",
  "usuario",
  "usuarios",
  "unidad",
  "unidades",
  "pagado por",
  "creado por",
  "aprobado por",
  "anulado por",
  "informador",
  "informado por",
]);

const LABEL_FRAGMENTS = [
  "nombre",
  "descripcion",
  "observacion",
  "comentario",
  "indicacion",
  "propiet",
  "resident",
  "dependient",
  "guard",
  "titular",
  "visit",
  "usuario",
  "unidad",
  "pagado por",
  "creado por",
  "aprobado por",
  "anulado por",
  "informador",
];

const KEY_FRAGMENTS = [
  "name",
  "full_name",
  "description",
  "descrip",
  "comment",
  "obs",
  "owner",
  "homeowner",
  "tenant",
  "resident",
  "guard",
  "guardia",
  "titular",
  "dependent",
  "dependiente",
  "visit",
  "visitor",
  "user",
  "dpto",
  "unit",
];

export const shouldIgnoreValueTranslationContext = ({
  label,
  key,
}: {
  label?: unknown;
  key?: unknown;
}) => {
  const normalizedLabel =
    typeof label === "string" ? normalize(label) : "";

  if (
    normalizedLabel &&
    (EXACT_LABELS.has(normalizedLabel) ||
      LABEL_FRAGMENTS.some((fragment) => normalizedLabel.includes(fragment)))
  ) {
    return true;
  }

  const normalizedKey =
    typeof key === "string" ? normalize(key).replace(/\s+/g, "_") : "";

  if (
    normalizedKey &&
    KEY_FRAGMENTS.some((fragment) => normalizedKey.includes(fragment))
  ) {
    return true;
  }

  return false;
};
