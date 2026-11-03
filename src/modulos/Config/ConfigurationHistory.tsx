"use client";

import { useMemo, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import styles from "./Config.module.css";

type Change = { from: unknown; to: unknown };
type AuditEntry = {
  id: number;
  subject_type: string;
  subject_id: string;
  subject_label: string | null;
  event: string;
  actor_name: string | null;
  actor_type: string | null;
  changes: Record<string, Change>;
  created_at: string;
};

const labels: Record<string, string> = {
  name: "Nombre", address: "Dirección", description: "Descripción", type: "Tipo",
  status: "Estado", privacy: "Privacidad", type_dpto: "Tipo de unidad",
  has_reservation_advance_limit: "Respetar anticipación mínima por área",
  min_reservation_advance_hours: "Anticipación mínima (horas)",
  has_soft_reservation: "Reservas sujetas a aprobación",
  payment_time_limit: "Tiempo límite de pago", soft_limit: "Límite preventivo",
  hard_limit: "Límite máximo", penalty_type: "Tipo de multa", penalty_data: "Datos de multa",
  operational_permissions_config: "Permisos operativos",
  type_id: "Tipo de unidad", placeholder: "Texto de ayuda", options: "Opciones",
  default_value: "Valor predeterminado", validation: "Validación",
  is_visible: "Visible", is_editable: "Editable", is_required: "Obligatorio",
  fields: "Campos adicionales", is_fixed: "Tipo protegido",
};

const booleanFields = new Set([
  "has_reservation_advance_limit", "has_soft_reservation", "has_financial_data",
  "has_financial_debt", "has_maintenance_value", "has_image_l", "has_image_lp",
  "has_image_c", "has_image_q", "owner_can_invite_without_residence",
  "owner_can_approve_visits_without_residence", "owner_can_reserve_without_residence",
  "owner_can_alert_without_residence", "has_tasks_visible", "check_mora", "button_mora",
  "is_fixed", "is_visible", "is_editable", "is_required",
]);

const humanize = (field: string) => labels[field] || field.replaceAll("_", " ");

const formatValue = (value: unknown, field: string) => {
  if (value === null || value === undefined || value === "") return "Vacío";
  if (booleanFields.has(field) && (value === true || value === 1 || value === "1")) return "Sí";
  if (booleanFields.has(field) && (value === false || value === 0 || value === "0")) return "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatDate = (value: string) => {
  const date = new Date(value.replace(" ", "T") + (/(Z|[+-]\d{2}:\d{2})$/.test(value) ? "" : "Z"));
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz", day: "numeric", month: "long", year: "numeric",
  }).format(date);
};

const formatTime = (value: string) => {
  const date = new Date(value.replace(" ", "T") + (/(Z|[+-]\d{2}:\d{2})$/.test(value) ? "" : "Z"));
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: "America/La_Paz", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(date);
};

const ConfigurationHistory = () => {
  const { data, loaded, execute, error } = useAxios("/client-config-history", "GET", { per_page: 30 });
  const [page, setPage] = useState(1);
  const result = data?.data;
  const entries: AuditEntry[] = useMemo(() => result?.items || [], [result?.items]);
  const grouped = useMemo(() => entries.reduce<Record<string, AuditEntry[]>>((acc, entry) => {
    const day = formatDate(entry.created_at);
    (acc[day] ||= []).push(entry);
    return acc;
  }, {}), [entries]);

  const loadPage = async (nextPage: number) => {
    const response = await execute("/client-config-history", "GET", { per_page: 30, page: nextPage }, true);
    if (response?.data?.success) setPage(nextPage);
  };

  return (
    <section className={styles.historyPanel} aria-label="Historial de configuración">
      <header className={styles.historyHeader}>
        <div>
          <h2>Historial</h2>
          <p>Quién cambió la configuración, cuándo y qué valores se modificaron.</p>
        </div>
        <span>{result?.total ?? 0} cambios</span>
      </header>
      {error?.message ? (
        <div className={styles.historyEmpty} role="alert">No se pudo cargar el historial. {error.message}</div>
      ) : !entries.length && loaded ? (
        <div className={styles.historyEmpty}>Aún no hay cambios registrados.</div>
      ) : (
        <div className={styles.historyTimeline}>
          {Object.entries(grouped).map(([day, dayEntries]) => (
            <div className={styles.historyDay} key={day}>
              <div className={styles.historyDayLabel}>{day}</div>
              {dayEntries.map((entry) => (
                <article className={styles.historyEntry} key={entry.id}>
                  <div className={styles.historyMarker} aria-hidden="true" />
                  <div className={styles.historyEntryHeader}>
                    <strong>{entry.actor_name || "Usuario desconocido"}</strong>
                    <span>{entry.event === "created" ? "creó" : entry.event === "deleted" ? "eliminó" : "modificó"} {entry.subject_label || (entry.subject_type === "Type" ? "un tipo de unidad" : entry.subject_type === "TypeField" ? "un campo de unidad" : "la configuración")}</span>
                    <time>{formatTime(entry.created_at)}</time>
                  </div>
                  <ul className={styles.historyChanges}>
                    {Object.entries(entry.changes || {}).map(([field, change]) => (
                      <li key={field}>
                        <span>{humanize(field)}</span>
                        <span className={styles.historyValues}>
                          {formatValue(change.from, field)} <b>→</b> {formatValue(change.to, field)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
      {result?.last_page > 1 && (
        <footer className={styles.historyPagination}>
          <button disabled={page <= 1} onClick={() => loadPage(page - 1)}>Anterior</button>
          <span>Página {page} de {result.last_page}</span>
          <button disabled={page >= result.last_page} onClick={() => loadPage(page + 1)}>Siguiente</button>
        </footer>
      )}
    </section>
  );
};

export default ConfigurationHistory;
