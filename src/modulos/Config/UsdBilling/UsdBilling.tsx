"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Banknote, LockKeyhole } from "lucide-react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import Switch from "@/mk/components/forms/Switch/Switch";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import shared from "../DptoConfig/DptoConfig.module.css";
import styles from "./UsdBilling.module.css";

export type UsdSettings = {
  expense_currency: "BOB" | "USD";
  penalty_currency: "BOB" | "USD";
  rate_mode: "fixed" | "daily";
  fixed_rate: string;
  expense_valuation: "issue" | "daily";
  expense_base_rate?: string | null;
  readonly daily_indicator: number;
  effective_from: string | null;
  penalty_type: number;
  penalty_delay_months: number;
  first_amount: string;
  second_amount: string;
};
type Adoption = {
  id: number;
  status: "queued" | "running" | "completed" | "paused";
  total: number;
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  attempts: number;
};
type SettingsData = { settings: UsdSettings; version: string; can_edit: boolean; rate: { value: string; date: string; source: string } | null; rate_notice: string | null; adoption?: Adoption | null };
const currencies = [{ id: "BOB", name: "Bolivianos (Bs)" }, { id: "USD", name: "Dólares (USD)" }];
const rateFormat = new Intl.NumberFormat("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
const isRunning = (adoption?: Adoption | null) => adoption?.status === "queued" || adoption?.status === "running";
const message = (data: any, error: any) => {
  const errors = error?.data?.errors || data?.errors;
  return errors ? Object.values(errors).flat().join(" ") : error?.data?.message || data?.message || "No se pudo guardar. Intenta nuevamente.";
};

export default function UsdBilling() {
  const { userCan, showToast } = useAuth();
  const { data, error, execute, reLoad } = useAxios("/finance/usd/settings", "GET");
  const result = data?.data as SettingsData | undefined;
  const [form, setForm] = useState<UsdSettings | null>(null);
  const [edit, setEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [applyToOpen, setApplyToOpen] = useState(false);
  const [failure, setFailure] = useState("");
  const [adoption, setAdoption] = useState<Adoption | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [resuming, setResuming] = useState(false);
  const inFlight = useRef(false);
  const requestKey = useRef<{ signature: string; id: string } | null>(null);
  const executeRef = useRef(execute);
  const canEdit = Boolean(result?.can_edit && userCan("settings", "U"));

  useEffect(() => {
    if (!result?.settings) return;
    setForm(result.settings);
    setEdit(false);
    setReason("");
    setApplyToOpen(false);
    if (result.adoption) {
      setAdoption(result.adoption);
      if (isRunning(result.adoption) || result.adoption.status === "paused") setProgressOpen(true);
    }
  }, [result]);

  useEffect(() => { executeRef.current = execute; }, [execute]);
  const processing = isRunning(adoption);
  const adoptionId = adoption?.id;
  useEffect(() => {
    if (!processing || !adoptionId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const response = await executeRef.current(`/finance/usd/adoptions/${adoptionId}`, "GET", {}, false, true);
        if (stopped) return;
        if (response.data?.success) {
          setAdoption(response.data.data);
          setTrackingError("");
          if (!isRunning(response.data.data)) return;
        } else {
          setTrackingError("No se pudo consultar el avance. Se volverá a intentar.");
        }
      } catch {
        if (stopped) return;
        setTrackingError("No se pudo consultar el avance. Se volverá a intentar.");
      }
      timer = setTimeout(poll, 3000);
    };
    timer = setTimeout(poll, 3000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [adoptionId, processing]);

  const change = ({ target: { name, value } }: any) => {
    setForm(current => {
      if (!current) return current;
      if (name === "expense_currency" && value === "USD") {
        return { ...current, expense_currency: "USD", expense_base_rate: current.expense_base_rate ?? current.fixed_rate };
      }
      return { ...current, [name]: ["penalty_type", "penalty_delay_months"].includes(name) ? Number(value) : value };
    });
  };
  const enabled = form?.expense_currency === "USD" || form?.penalty_currency === "USD";
  const submittingAdoption = busy && enabled && applyToOpen;
  useEffect(() => {
    if (!submittingAdoption) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submittingAdoption]);

  const save = async () => {
    if (!form || !result || !canEdit || inFlight.current || processing || adoption?.status === "paused") return;
    if (form.expense_currency === "USD" &&
      (!/^\d{1,6}(\.\d{1,6})?$/.test(form.expense_base_rate ?? "") || Number(form.expense_base_rate) <= 0 || Number(form.expense_base_rate) > 999999)) {
      setFailure("Indica una tasa base positiva para las expensas.");
      return;
    }
    if (reason.trim().length < 3) { setFailure("Indica el motivo del cambio."); return; }
    const apply = enabled && applyToOpen;
    inFlight.current = true; setBusy(true); setFailure("");
    try {
      const payload = { settings: form, version: result.version, reason: reason.trim() };
      if (apply) {
        const signature = JSON.stringify(payload);
        if (requestKey.current?.signature !== signature) requestKey.current = { signature, id: crypto.randomUUID() };
        setTrackingError("");
      }
      const response = await execute("/finance/usd/settings", "PUT", {
        ...payload, ...(apply && { apply_to_open_expenses: true, adoption_key: requestKey.current?.id }),
      }, false, true);
      if (response.data?.success) {
        const operation: Adoption | undefined = response.data.data?.adoption;
        if (operation) {
          setAdoption(operation);
          setProgressOpen(true);
        } else {
          const count = response.data.data?.updated_open_expenses ?? 0;
          showToast(apply ? `Configuración guardada. Expensas anteriores actualizadas: ${count}.` : "Configuración guardada", "success");
        }
        requestKey.current = null;
        setApplyToOpen(false);
        setEdit(false);
        await reLoad(null, true);
      } else if (apply && (!response.error?.status || response.error.status >= 500)) {
        setFailure("No se pudo confirmar el inicio. Comprueba el último recálculo o reintenta este mismo guardado.");
        const current = await execute("/finance/usd/settings", "GET", {}, false, true);
        if (current.data?.data?.adoption && isRunning(current.data.data.adoption)) {
          setAdoption(current.data.data.adoption);
          setProgressOpen(true);
        }
      } else {
        setFailure(message(response.data, response.error));
      }
    } catch { setFailure("No se pudo confirmar el guardado. Actualiza la configuración antes de reintentar."); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const resume = async () => {
    if (!adoption || resuming) return;
    setResuming(true);
    try {
      const response = await execute(`/finance/usd/adoptions/${adoption.id}/resume`, "POST", {}, false, true);
      if (response.data?.success) {
        setAdoption(response.data.data);
        setTrackingError("");
      } else setTrackingError(message(response.data, response.error));
    } catch { setTrackingError("No se pudo reanudar el recálculo. Intenta nuevamente."); }
    finally { setResuming(false); }
  };
  if (error && !result) return <p role="alert" className={styles.notice}>No se pudo cargar la configuración de moneda.</p>;
  if (!form || !result) return <p aria-live="polite">Cargando configuración de moneda…</p>;
  const adoptionOpen = processing || adoption?.status === "paused";
  const disabled = !edit || busy || !canEdit || adoptionOpen;
  const hasSavedTco = result.settings.rate_mode === "daily" && result.settings.daily_indicator === 1000;
  const dailyRate = hasSavedTco ? result.rate : null;
  return <div className={`${shared.Config} ${shared.compactMode}`}>
    <div className={shared.headerRow}>
      <div className={shared.headerContent}>
        <h1 className={shared.mainTitle}>Moneda y tipo de cambio</h1>
        <p className={shared.mainSubtitle}>Configura la moneda de las obligaciones. Los pagos y la contabilidad conservan sus importes en bolivianos.</p>
      </div>
      {canEdit && <div className={shared.headerAction}>
        <div className={shared.headerButtons}>
          {!edit ? <Button variant="secondary" className={shared.editButton} disabled={adoptionOpen} onClick={() => {
            if (form.expense_currency === "USD" && form.expense_base_rate == null) {
              setForm({ ...form, expense_base_rate: form.fixed_rate });
            }
            setEdit(true);
          }}>Editar</Button> : <>
            <Button variant="secondary" className={shared.editButton} disabled={busy} onClick={() => {
              setForm(result.settings);
              setEdit(false);
              setFailure("");
              setReason("");
              setApplyToOpen(false);
            }}>Descartar cambios</Button>
            <Button className={shared.saveButton} disabled={disabled || (!(enabled && applyToOpen) && JSON.stringify(form) === JSON.stringify(result.settings))} onClick={save}>
              {busy ? "Guardando…" : "Guardar cambios"}
            </Button>
          </>}
        </div>
      </div>}
    </div>
    {!canEdit && <p className={styles.readOnly}><LockKeyhole size={16} /> Configuración de solo lectura. La edición está reservada a FOS.</p>}
    {failure && <p role="alert" className={styles.error}>{failure}</p>}
    <div className={shared.rulesGrid}>
      <section className={shared.formCard}>
        <div className={styles.cardTitle}><Banknote size={20} /><h2>Expensas</h2></div>
        <Select label="Moneda de las expensas" name="expense_currency" value={form.expense_currency} options={currencies} onChange={change} disabled={disabled} />
        {form.expense_currency === "USD" && <>
          <Select label="Conversión de las expensas" name="expense_valuation" value={form.expense_valuation} disabled={disabled} onChange={change} options={[
            { id: "issue", name: "Fijar en Bs al emitir la expensa" }, { id: "daily", name: "Actualizar diariamente el saldo pendiente" },
          ]} />
          <Input name="expense_base_rate" label="Tasa base de las expensas (Bs por USD)" type="text"
            value={form.expense_base_rate ?? ""} onChange={change} disabled={disabled} required />
          <p className={styles.hint}>La tasa base convierte la cuota vigente de cada unidad a USD. El tipo de cambio de abajo calcula su equivalente en bolivianos.</p>
          {!edit && form.expense_base_rate == null && <p className={styles.hint}>La configuración anterior sigue vigente. Guarda una tasa base para usarla en las próximas expensas.</p>}
        </>}
      </section>
      <section className={shared.formCard}>
        <div className={styles.cardTitle}><Banknote size={20} /><h2>Multas por mora</h2></div>
        <Select label="Moneda de las multas" name="penalty_currency" value={form.penalty_currency} options={currencies} onChange={change} disabled={disabled} />
        {form.penalty_currency === "USD" && <>
          <Select label="Regla de multa USD" name="penalty_type" value={form.penalty_type} disabled={disabled} onChange={change} options={[
            { id: 2, name: "Monto único después del vencimiento" }, { id: 3, name: "Dos tramos: día 11 y mes siguiente" },
          ]} />
          <Input label={form.penalty_type === 3 ? "Multa desde el día 11 (USD)" : "Monto de la multa (USD)"} name="first_amount" value={form.first_amount} onChange={change} disabled={disabled} type="currency" />
          {form.penalty_type === 2 && <Input label="Meses de gracia después del vencimiento" name="penalty_delay_months" type="number" min={0} max={36} value={form.penalty_delay_months} onChange={change} disabled={disabled} />}
          {form.penalty_type === 3 && <Input label="Multa total desde el mes siguiente (USD)" name="second_amount" value={form.second_amount} onChange={change} disabled={disabled} type="currency" />}
          <p className={styles.hint}>El segundo tramo reemplaza al primero. El tramo deja de escalar al cubrirse el capital; el saldo USD sigue la cotización aplicable.</p>
        </>}
      </section>
      <section className={shared.formCard}>
        <div className={styles.cardTitle}><ArrowLeftRight size={20} /><h2>Tipo de cambio</h2></div>
        <Select label="Modalidad de cambio" name="rate_mode" value={form.rate_mode} onChange={change} disabled={disabled} options={[
          { id: "fixed", name: "Cambio fijo" }, { id: "daily", name: "Cambio diario del BCB" },
        ]} />
        {form.rate_mode === "fixed" ? (
          <Input name="fixed_rate" label="Bolivianos por USD" value={form.fixed_rate} onChange={change} disabled={disabled} type="text" />
        ) : <>
          <p className={styles.hint}>Tipo de cambio oficial (TCO) publicado por el BCB.</p>
          <p className={styles.hint}>{dailyRate
            ? `Cotización vigente: Bs ${rateFormat.format(Number(dailyRate.value))} por USD · ${dailyRate.date}`
            : (hasSavedTco ? result.rate_notice || "Sin cotización disponible" : "La cotización vigente se mostrará al guardar.")}</p>
        </>}
      </section>
      <section className={shared.formCard}>
        <h2 className={styles.sectionTitle}>Vigencia</h2>
        <Input name="effective_from" label="Aplicar a nuevas expensas desde" type="date" value={form.effective_from || ""} onChange={change} disabled={disabled} required={enabled} />
        {enabled && <>
          <Switch name="apply_to_open_expenses" label="Aplicar también a expensas anteriores"
            value={applyToOpen ? "Y" : "N"} onChange={e => setApplyToOpen(e.target.checked)} disabled={disabled} />
          <p className={styles.hint}>Al guardar se programa el recálculo de expensas en Bs por cobrar o en mora, sin pagos activos ni QR protegido. Si activas multas en USD, se usa la cotización vigente al iniciar.</p>
        </>}
        {adoption && <Button variant="secondary" onClick={() => setProgressOpen(true)}>Ver último recálculo</Button>}
        {edit && <Input label="Motivo del cambio" name="reason" value={reason} onChange={(e: any) => setReason(e.target.value)} disabled={busy} maxLength={500} />}
      </section>
    </div>
    <DetailModal
      open={submittingAdoption || progressOpen}
      title="Recálculo de expensas anteriores"
      maxWidth={520}
      iconClose={!submittingAdoption}
      onClose={() => setProgressOpen(false)}
      buttonText={adoption?.status === "paused" && canEdit && !submittingAdoption ? "Reanudar" : ""}
      onSave={resume}
      disabled={resuming}
    >
      {submittingAdoption ? <div className={styles.progressContent} role="status">
        <p>Preparando el recálculo. Mantén abierta esta pestaña hasta confirmar el inicio.</p>
        <progress className={styles.progress} aria-label="Preparando recálculo" />
      </div> : adoption && <div className={styles.progressContent}>
        <p role="status">
          {adoption.status === "queued" && "En cola. El servidor comenzará el recálculo en breve."}
          {adoption.status === "running" && (adoption.attempts ? "El servidor reintentará desde el último avance." : "El servidor está recalculando las expensas.")}
          {adoption.status === "paused" && "Recálculo pausado tras varios intentos. Puedes reanudar desde el último avance."}
          {adoption.status === "completed" && (adoption.failed ? "Recálculo terminado con incidencias." : "Recálculo terminado.")}
        </p>
        <progress className={styles.progress} max={adoption.total || 1} value={adoption.total ? adoption.processed : 1} aria-label="Avance del recálculo" />
        <p>{adoption.processed} de {adoption.total} revisadas · {adoption.updated} actualizadas · {adoption.skipped} omitidas{adoption.failed > 0 && ` · ${adoption.failed} con incidencias`}</p>
        {processing && <p className={styles.hint}>Deja esta pestaña abierta para seguir el avance. Si la cierras, el servidor continúa y puedes consultar el resultado al volver.</p>}
        {trackingError && <p role="alert" className={styles.error}>{trackingError}</p>}
      </div>}
    </DetailModal>
  </div>;
}
