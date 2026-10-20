"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import useAxios from "@/mk/hooks/useAxios";
import useSubmissionGuard from "@/mk/hooks/useSubmissionGuard";
import { ROOT } from "./types";
import styles from "./ApiIntegrations.module.css";

const labels = {
  auto_expenses: "Generar expensas mensuales automáticamente",
  auto_penalties: "Aplicar multas automáticas de expensas",
  auto_maintenance: "Calcular mantenimiento de valor automáticamente",
  auto_delinquency: "Marcar mora desde el cron diario",
};
type Settings = Record<keyof typeof labels, boolean>;

export default function AutomationsPanel({ clientId, canUpdate, refresh }: { clientId: string; canUpdate: boolean; refresh: number }) {
  const { execute } = useAxios();
  const api = useRef(execute);
  useEffect(() => { api.current = execute; }, [execute]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [version, setVersion] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { begin, finish, submitting } = useSubmissionGuard();
  useEffect(() => {
    let cancelled = false;
    setSettings(null); setError(""); setNotice("");
    if (!clientId) return;
    void (async () => {
      const result = await api.current(`${ROOT}/clients/${clientId}/automations`, "GET", {}, false, true);
      if (cancelled) return;
      if (result?.data?.success) { setSettings(result.data.data.settings); setVersion(result.data.data.version); }
      else setError(result?.error?.data?.message || "No se pudieron consultar las automatizaciones.");
    })();
    return () => { cancelled = true; };
  }, [clientId, refresh]);
  const save = async () => {
    if (!settings || !canUpdate || !begin()) return;
    setError(""); setNotice("");
    try {
      if (reason.trim().length < 3) { setError("Escribe el motivo del cambio."); return; }
      const result = await api.current(`${ROOT}/clients/${clientId}/automations`, "PATCH", { ...settings, reason: reason.trim(), version }, false, true);
      if (!result?.data?.success) { setError(result?.error?.data?.message || "No se pudieron guardar los cambios."); return; }
      setSettings(result.data.data.settings); setVersion(result.data.data.version); setReason(""); setNotice("Automatizaciones actualizadas y auditadas.");
    } finally { finish(); }
  };
  return <section className={styles.automationPanel} aria-label="Automatizaciones del condominio">
    <h2>Automatizaciones del condominio</h2>
    <p className={styles.helper}>Se aplican al condominio, no a una credencial específica. Desactivarlas detiene las acciones futuras del cron; no elimina deudas ni multas existentes y nunca desactiva el recálculo contable al registrar o anular pagos.</p>
    {!clientId ? <p>Selecciona un condominio en el filtro superior.</p> : !settings && !error ? <p role="status">Cargando configuración…</p> : null}
    {settings ? <><div className={styles.permissions}>{(Object.keys(labels) as (keyof Settings)[]).map((key) => <label className={styles.check} key={key}>
      <input type="checkbox" checked={settings[key]} disabled={!canUpdate || submitting} onChange={(e) => setSettings((current) => current ? { ...current, [key]: e.target.checked } : current)} />
      <span>{labels[key]}</span></label>)}</div>
      {canUpdate ? <><TextArea label="Motivo del cambio" name="automation_reason" value={reason} maxLength={500}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)} disabled={submitting} />
        <Button onClick={() => void save()} disabled={submitting}>{submitting ? "Guardando…" : "Guardar automatizaciones"}</Button></> : null}</> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}{notice ? <p className={styles.success} role="status">{notice}</p> : null}
  </section>;
}
