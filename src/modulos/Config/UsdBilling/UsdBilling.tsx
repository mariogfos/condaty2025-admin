"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Banknote, LockKeyhole } from "lucide-react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import shared from "../DptoConfig/DptoConfig.module.css";
import styles from "./UsdBilling.module.css";

export type UsdSettings = {
  expense_currency: "BOB" | "USD";
  penalty_currency: "BOB" | "USD";
  rate_mode: "fixed" | "daily";
  fixed_rate: string;
  expense_valuation: "issue" | "daily";
  expense_base_rate?: string | null;
  daily_indicator: number;
  effective_from: string | null;
  penalty_type: number;
  penalty_delay_months: number;
  first_amount: string;
  second_amount: string;
};
type SettingsData = { settings: UsdSettings; version: string; can_edit: boolean; rate: { value: string; date: string; source: string } | null; rate_notice: string | null };
const currencies = [{ id: "BOB", name: "Bolivianos (Bs)" }, { id: "USD", name: "Dólares (USD)" }];
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
  const [failure, setFailure] = useState("");
  const inFlight = useRef(false);
  const canEdit = Boolean(result?.can_edit && userCan("settings", "U"));

  useEffect(() => {
    if (result?.settings) { setForm(result.settings); setEdit(false); setReason(""); }
  }, [result]);

  const change = ({ target: { name, value } }: any) => {
    setForm(current => {
      if (!current) return current;
      if (name === "expense_currency" && value === "USD") {
        return { ...current, expense_currency: "USD", expense_base_rate: current.expense_base_rate ?? current.fixed_rate };
      }
      return { ...current, [name]: ["daily_indicator", "penalty_type", "penalty_delay_months"].includes(name) ? Number(value) : value };
    });
  };
  const save = async () => {
    if (!form || !result || !canEdit || inFlight.current) return;
    if (form.expense_currency === "USD" &&
      (!/^\d{1,6}(\.\d{1,6})?$/.test(form.expense_base_rate ?? "") || Number(form.expense_base_rate) <= 0 || Number(form.expense_base_rate) > 999999)) {
      setFailure("Indica una tasa base positiva para las expensas.");
      return;
    }
    if (reason.trim().length < 3) { setFailure("Indica el motivo del cambio."); return; }
    inFlight.current = true; setBusy(true); setFailure("");
    try {
      const response = await execute("/finance/usd/settings", "PUT", { settings: form, version: result.version, reason: reason.trim() }, false, true);
      if (response.data?.success) { showToast("Configuración guardada", "success"); await reLoad(); }
      else setFailure(message(response.data, response.error));
    } catch { setFailure("No se pudo confirmar el guardado. Actualiza la configuración antes de reintentar."); }
    finally { inFlight.current = false; setBusy(false); }
  };
  if (error && !result) return <p role="alert" className={styles.notice}>No se pudo cargar la configuración de moneda.</p>;
  if (!form || !result) return <p aria-live="polite">Cargando configuración de moneda…</p>;
  const disabled = !edit || busy || !canEdit;
  const enabled = form.expense_currency === "USD" || form.penalty_currency === "USD";
  return <div className={`${shared.Config} ${shared.compactMode}`}>
    <div className={shared.headerRow}>
      <div className={shared.headerContent}>
        <h1 className={shared.mainTitle}>Moneda y tipo de cambio</h1>
        <p className={shared.mainSubtitle}>Configura la moneda de las obligaciones. Los pagos y la contabilidad conservan sus importes en bolivianos.</p>
      </div>
      {canEdit && <div className={shared.headerAction}>
        <div className={shared.headerButtons}>
          {!edit ? <Button variant="secondary" className={shared.editButton} onClick={() => {
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
            }}>Descartar cambios</Button>
            <Button className={shared.saveButton} disabled={busy || JSON.stringify(form) === JSON.stringify(result.settings)} onClick={save}>
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
        {form.rate_mode === "fixed" ? <Input name="fixed_rate" label="Bolivianos por USD" value={form.fixed_rate} onChange={change} disabled={disabled} type="text" /> : <Select
          name="daily_indicator" label="Cotización del BCB" value={form.daily_indicator} onChange={change} disabled={disabled} options={[
            { id: 1000, name: "Tipo de cambio oficial diario (TCO)" },
            { id: 350, name: "Referencial de venta" }, { id: 340, name: "Referencial de compra" },
            { id: 35, name: "Cotización de venta" }, { id: 34, name: "Cotización de compra" },
          ]} />}
        <p className={styles.hint}>{result.rate ? `Cotización guardada: Bs ${result.rate.value} por USD · ${result.rate.date}` : result.rate_notice || "Sin cotización disponible"}</p>
      </section>
      <section className={shared.formCard}>
        <h2 className={styles.sectionTitle}>Vigencia</h2>
        <Input name="effective_from" label="Aplicar a nuevas expensas desde" type="date" value={form.effective_from || ""} onChange={change} disabled={disabled} required={enabled} />
        <p className={styles.hint}>Cada deuda conserva su política. Este cambio no convierte deudas anteriores ni modifica ingresos y recibos existentes.</p>
        {edit && <Input label="Motivo del cambio" name="reason" value={reason} onChange={(e: any) => setReason(e.target.value)} disabled={busy} maxLength={500} />}
      </section>
    </div>
  </div>;
}
