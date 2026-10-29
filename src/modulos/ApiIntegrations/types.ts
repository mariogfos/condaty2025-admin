export type Integration = {
  id: string;
  client_id: string;
  name: string;
  scopes: string[];
  is_active: boolean;
  expires_at: string | null;
  token_hint: string;
  version: string;
  webhook_url: string | null;
  webhook_status: number | null;
  webhook_delivered_at: string | null;
};
export type RequestLog = {
  id: string;
  integration_id: string | null;
  integration_name?: string;
  client_id: string | null;
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  replayed: boolean;
  created_at: string;
  query?: unknown;
  payload?: unknown;
  response?: unknown;
};
export type AuditEntry = {
  id: number;
  client_id: string;
  record_type: string;
  record_id: string;
  action: string;
  actor_name: string;
  reason: string | null;
  before_state: unknown;
  after_state: unknown;
  metadata: unknown;
  created_at: string;
};
export type Catalogs = {
  clients: { id: string; name: string }[];
  integrations: { id: string; name: string; client_id: string }[];
  scopes: string[];
  notice: string;
};
export type Tab = "connections" | "logs" | "events" | "automations";
export type Row = Integration | RequestLog | AuditEntry;
export type PaginationData = { page: number; total: number; last_page: number };
export type Filters = { client_id: string; integration_id: string; query: string; outcome: string; method: string; status: string; from: string; to: string };
export const ROOT = "/backoffice/integrations";
export const scopeLabels: Record<string, string> = {
  "units:read": "Consultar unidades", "units:create": "Crear unidades", "units:update": "Editar unidades",
  "people:read": "Consultar personas", "people:write": "Crear y editar personas", "people:identity": "Corregir CI",
  "relationships:write": "Vincular y desvincular personas", "debts:read": "Consultar expensas", "debts:adjust": "Corregir capital y multa",
  "payments:read": "Consultar ingresos", "payments:create": "Registrar ingresos", "payments:update": "Corregir ingresos",
  "payments:confirm": "Confirmar o rechazar ingresos", "payments:void": "Anular ingresos",
  "automation:read": "Consultar automatizaciones", "automation:update": "Cambiar automatizaciones", "changes:read": "Consultar cambios",
};
export const actionLabels: Record<string, string> = {
  integration_created: "Integración creada", integration_configured: "Integración configurada", integration_token_rotated: "Credencial rotada",
  integration_unit_created: "Unidad creada", integration_unit_updated: "Unidad editada",
  integration_person_linked: "Persona vinculada", integration_person_unlinked: "Persona desvinculada",
  integration_person_updated: "Persona editada", integration_ci_corrected: "CI corregido",
  debt_components_updated: "Capital y multa corregidos", integration_payment_created: "Ingreso registrado",
  integration_payment_applied: "Ingreso aplicado a deuda", integration_payment_changed: "Ingreso actualizado",
  payment_amount_updated: "Monto de ingreso corregido", payment_date_updated: "Fecha de ingreso corregida",
  integration_automations_updated: "Automatizaciones modificadas",
};
export const dateLabel = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/La_Paz",
  }).format(date);
};
