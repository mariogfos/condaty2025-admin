export type Change = { from: unknown; to: unknown };
export type AuditEntry = {
  id: number;
  subject_type: string;
  subject_id: string;
  subject_label: string | null;
  event: string;
  actor_name: string | null;
  actor_type: string | null;
  changes: Record<string, Change>;
  reason?: string | null;
  created_at: string;
};
export type PresentedChange = { field: string; label: string; before: string; after: string; protected: boolean };

const labels: Record<string, string> = {
  name: "Nombre", address: "Dirección", description: "Descripción", type: "Tipo",
  status: "Estado", privacy: "Privacidad", type_dpto: "Tipo de unidad",
  has_reservation_advance_limit: "Respetar anticipación mínima por área",
  has_soft_reservation: "Reservas sujetas a aprobación", payment_time_limit: "Tiempo límite de pago",
  soft_limit: "Límite preventivo", hard_limit: "Límite máximo", penalty_type: "Tipo de multa",
  penalty_data: "Datos de multa", financial_mode: "Visualización de finanzas",
  has_financial_data: "Resumen financiero", has_financial_debt: "Deudas en el resumen financiero",
  has_tasks_visible: "Tareas para residentes", has_marketplace_visible: "Marketplace para residentes",
  has_maintenance_value: "Mantenimiento de valor", check_mora: "Control de mora", button_mora: "Aviso de mora",
  operational_permissions_config: "Permisos operativos", payment_methods_config: "Métodos de pago",
  integration_automations: "Automatizaciones", type_id: "Tipo de unidad", placeholder: "Texto de ayuda",
  reservation_guarantees: "Garantías de reservas",
  usd_billing: "Moneda y cambio", expense_currency: "Moneda de expensas", penalty_currency: "Moneda de multas",
  rate_mode: "Modalidad de cambio", fixed_rate: "Cambio fijo (Bs/USD)", expense_valuation: "Conversión de expensas",
  expense_base_rate: "Tasa base de las expensas",
  expense_amount_usd_override: "Cuota USD de la unidad",
  daily_indicator: "Indicador BCB", effective_from: "Vigencia desde", expense_amount_usd: "Expensa por unidad (USD)",
  penalty_delay_months: "Meses de gracia de multa USD",
  options: "Opciones", default_value: "Valor predeterminado", validation: "Validación",
  is_visible: "Visible", is_editable: "Editable", is_required: "Obligatorio", is_fixed: "Tipo protegido",
  fields: "Campos adicionales", month: "Mes", year: "Año", ndependents: "Dependientes",
  nguards: "Guardias", nadmins: "Administradores", ndepends: "Dependientes",
  homeowner_resident: "Propietario residente", homeowner_resident_dependent: "Dependiente de propietario residente",
  homeowner_non_resident: "Propietario no residente", homeowner_non_resident_dependent: "Dependiente de propietario no residente",
  tenant: "Inquilino", tenant_dependent: "Dependiente de inquilino", invitation: "Crear invitaciones",
  visit_approval: "Aprobar visitas", reservation: "Reservar áreas", alert: "Enviar alertas",
  expenses: "Expensas", reservations: "Reservas", fines: "Multas", others: "Otras deudas",
  percent: "Porcentaje", amount: "Monto", first_amount: "Primer mes", second_amount: "Meses siguientes",
  owner_can_invite_without_residence: "Invitaciones de propietarios no residentes",
  owner_can_approve_visits_without_residence: "Aprobación de visitas de propietarios no residentes",
  owner_can_reserve_without_residence: "Reservas de propietarios no residentes",
  owner_can_alert_without_residence: "Alertas de propietarios no residentes",
};
const booleans = new Set([
  "invitation", "visit_approval", "reservation", "alert",
  "has_reservation_advance_limit", "has_soft_reservation", "has_financial_data", "has_financial_debt",
  "has_maintenance_value", "has_tasks_visible", "has_marketplace_visible", "check_mora", "button_mora",
  "has_image_l", "has_image_lp", "has_image_c", "has_image_q", "is_fixed", "is_visible", "is_editable", "is_required",
  "owner_can_invite_without_residence", "owner_can_approve_visits_without_residence",
  "owner_can_reserve_without_residence", "owner_can_alert_without_residence",
]);
const numbers = new Set(["month", "year", "soft_limit", "hard_limit", "penalty_limit", "penalty_percent", "payment_time_limit", "financial_mode", "ndepends", "nguards", "nadmins", "qr_dynamic_mode"]);
const paymentMethods: Record<string, string> = { Q: "QR", T: "Transferencia", O: "Oficina", W: "WhatsApp" };
const humanize = (field: string) => labels[field] || field.replaceAll("_", " ").replace(/^./, char => char.toUpperCase());
const objectValue = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
function equivalent(field: string, a: unknown, b: unknown): boolean {
  if ((a == null || a === "") && (b == null || b === "")) return true;
  if (booleans.has(field) && a != null && b != null) return enabled(a) === enabled(b);
  if (numbers.has(field) && a !== null && b !== null && a !== "" && b !== "") return Number(a) === Number(b);
  if (objectValue(a) && objectValue(b)) {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    return keys.every(key => equivalent(key, a[key], b[key]));
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
const enabled = (value: unknown) => value === true || value === 1 || value === "1" || value === "Y";
function formatValue(value: unknown, field: string): string {
  if (value === null || value === undefined || value === "") return "Sin registrar";
  if (value === "[oculto]") return "Valor protegido";
  if (booleans.has(field) || typeof value === "boolean") return enabled(value) ? "Sí" : "No";
  if (field === "financial_mode") return ({ 0: "Sin resumen de deudas", 1: "Solo expensas", 2: "Expensas y multas separados", 3: "Expensas y multas juntos" } as Record<string, string>)[String(value)] || String(value);
  if (field === "penalty_type") return ({ 0: "Sin multas", 1: "Porcentaje", 2: "Monto fijo", 3: "Personalizada" } as Record<string, string>)[String(value)] || String(value);
  if (field === "expense_currency" || field === "penalty_currency") return value === "USD" ? "Dólares (USD)" : "Bolivianos (Bs)";
  if (field === "rate_mode") return value === "fixed" ? "Cambio fijo" : "Cambio diario BCB";
  if (field === "expense_valuation") return value === "issue" ? "Fijar al emitir" : "Actualizar saldo diariamente";
  if (field === "daily_indicator") return ({ 1000: "TCO diario BCB", 34: "Compra BCB", 35: "Venta BCB", 340: "Referencial compra BCB", 350: "Referencial venta BCB" } as Record<string, string>)[String(value)] || String(value);
  if (field === "limit_type") return ({ C: "Por cantidad", D: "Por días", M: "Por fin de mes" } as Record<string, string>)[String(value)] || String(value);
  if (Array.isArray(value)) return value.map(item => typeof item === "string" ? (["expenses", "reservations", "fines", "others"].includes(field) ? paymentMethods[item] : undefined) || item : JSON.stringify(item)).join(", ") || "Ninguno";
  if (objectValue(value)) return Object.entries(value).map(([key, item]) => `${humanize(key)}: ${formatValue(item, key)}`).join(" · ");
  return String(value);
}

export function changesFor(entry: AuditEntry): PresentedChange[] {
  const rows: PresentedChange[] = [];
  const walk = (path: string[], before: unknown, after: unknown) => {
    const field = path.at(-1)!;
    const protectedValue = before === "[oculto]" || after === "[oculto]";
    if (!protectedValue && equivalent(field, before, after)) return;
    if (!protectedValue && (objectValue(before) || objectValue(after))) {
      const a = objectValue(before) ? before : {}, b = objectValue(after) ? after : {};
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) walk([...path, key], a[key], b[key]);
      return;
    }
    rows.push({ field: path.join("."), label: path.map(humanize).join(" · "), before: formatValue(before, field), after: formatValue(after, field), protected: protectedValue });
  };
  Object.entries(entry.changes || {}).forEach(([field, change]) => walk([field], change.from, change.to));
  return rows;
}

export function historyDate(value: string): Date | null {
  const date = new Date(value.replace(" ", "T") + (/(Z|[+-]\d{2}:\d{2})$/i.test(value) ? "" : "Z"));
  return Number.isNaN(date.getTime()) ? null : date;
}
export const historyDay = (value: string) => {
  const date = historyDate(value);
  return date ? new Intl.DateTimeFormat("es-BO", { dateStyle: "long", timeZone: "America/La_Paz" }).format(date) : "Fecha no disponible";
};
export const historyTime = (value: string) => {
  const date = historyDate(value);
  return date ? new Intl.DateTimeFormat("es-BO", { timeStyle: "short", timeZone: "America/La_Paz" }).format(date) : "";
};
