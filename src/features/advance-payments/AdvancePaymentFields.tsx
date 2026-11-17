"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import CheckField from "@/mk/components/forms/Check/Check";
import Table from "@/mk/components/ui/Table/Table";
import { getBusinessDate } from "@/mk/utils/date";
import { formatBs } from "@/mk/utils/numbers";
import { getRequestErrorMessage } from "@/mk/utils/axiosError";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { advanceApi, distributionNames, type AdvanceDraft, type AdvancePlan, type AdvanceRow, type DiscountInput } from "./types";
import styles from "./AdvancePaymentFields.module.css";

const kinds = [{ id: "fixed", name: "Bs" }, { id: "percent", name: "%" }];
export function nextPeriod(period: string) {
  const [year, month] = period.split("-").map(Number);
  return `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, "0")}`;
}

export default function AdvancePaymentFields({ unitId, type, execute, onChange, initialDebtId, disabled = false, revision = 0, paidAt }: {
  unitId: number; type: "E" | "O"; execute: Function; onChange: (draft: AdvanceDraft) => void;
  initialDebtId?: string | number; disabled?: boolean; revision?: number; paidAt?: string;
}) {
  const { userCan } = useAuth();
  const canCreateDebt = userCan("debts_manager", "C") || userCan("debts", "C");
  const canDiscount = userCan("debts_manager", "U") || userCan("debts", "U");
  const run = useRef(execute); run.current = execute;
  const notify = useRef(onChange); notify.current = onChange;
  const requestKey = useRef(crypto.randomUUID());
  const [through, setThrough] = useState(getBusinessDate().slice(0, 7));
  const [maxThrough, setMaxThrough] = useState("");
  const [rows, setRows] = useState<AdvanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState<string[]>(initialDebtId ? [`debt:${initialDebtId}`] : []);
  const [discount, setDiscount] = useState<DiscountInput>({ mode: "none" });
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<AdvancePlan | null>(null);
  const [error, setError] = useState("");
  const payload = useMemo(() => ({ unit_id: unitId, type, selected,
    discount: discount.mode === "custom" ? { ...discount, items: discount.items?.filter(item => selected.includes(item.key)) ?? [] } : discount,
    ...(paidAt ? { paid_at: paidAt } : {}) }), [unitId, type, selected, discount, paidAt]);
  const operation = selected.some(key => key.startsWith("period:")) || discount.mode !== "none";

  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError("");
    void run.current(advanceApi + "/candidates", "GET", { unit_id: unitId, type, through, ...(paidAt ? { paid_at: paidAt } : {}) }, false, true)
      .then((response: any) => {
        if (!active) return;
        if (!response.data?.success) { setLoadError(response.data?.message || getRequestErrorMessage(response.error)); return; }
        setRows(response.data.data.rows); setMaxThrough(response.data.data.max_through);
      }).catch(() => { if (active) setLoadError("No se pudieron consultar las deudas."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [unitId, type, through, revision, paidAt]);

  useEffect(() => {
    let active = true;
    setPreview(null); setError("");
    if (!selected.length) return;
    const timer = setTimeout(() => {
      void run.current(advanceApi + "/preview", "POST", payload, false, true).then((response: any) => {
        if (!active) return;
        if (response.data?.success) setPreview(response.data.data);
        else setError(response.data?.message || getRequestErrorMessage(response.error));
      }).catch(() => { if (active) setError("No se pudo calcular el resumen."); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [payload, selected.length, revision]);

  useEffect(() => {
    notify.current({ payload, preview, operation, requestKey: requestKey.current, reason,
      ready: Boolean(preview && (!operation || reason.trim().length >= 3)) });
  }, [payload, preview, operation, reason]);

  const toggle = (key: string) => setSelected(old => old.includes(key) ? old.filter(item => item !== key) : [...old, key].sort());
  const details = new Map(preview?.items.map(row => [row.key, row]));
  const custom = (row: AdvanceRow, patch: Partial<{ type: "fixed" | "percent"; value: number }>) => {
    setDiscount(old => {
      const previous = old.items?.find(item => item.key === row.key) ?? { key: row.key, type: "fixed" as const, value: 0 };
      return { ...old, items: [...(old.items ?? []).filter(item => item.key !== row.key), { ...previous, ...patch }] };
    });
  };
  const header = [
    { key: "selected", label: "", responsive: "Seleccionar", width: "46px", onRender: ({ item }: { item: AdvanceRow }) =>
      <button className={styles.choice} type="button" aria-label={`Seleccionar ${item.title}`} aria-pressed={selected.includes(item.key)}
        disabled={disabled || (!item.available && !selected.includes(item.key)) || (!selected.includes(item.key) && selected.length >= 120)} title={item.reason}
        onClick={() => toggle(item.key)}>{selected.includes(item.key) && <Check size={18} />}</button> },
    { key: "title", label: "Concepto / período", responsive: "Concepto", width: "100%", onRender: ({ item }: { item: AdvanceRow }) =>
      <span>{item.title}<small className={styles.caption}>{item.future ? "Por emitir · " : ""}Vence: {item.due_at}{item.reason ? ` · ${item.reason}` : ""}</small>
        {item.principal_currency === "USD" && <small className={styles.caption}>Cuota en USD · Equivalente de pago en Bs</small>}</span> },
    { key: "gross", label: "Capital", responsive: "Capital", width: "110px", onRender: ({ item }: { item: AdvanceRow }) => formatBs((item.gross ?? 0) / 100) },
    { key: "discount", label: "Descuento", responsive: "Descuento", width: discount.mode === "custom" ? "205px" : "125px",
      onRender: ({ item }: { item: AdvanceRow }) => discount.mode === "custom" && selected.includes(item.key) && item.can_discount
        ? <div className={styles.custom}>
          <Input name={`discount-${item.key}`} label="Valor" type="number" min={0} disabled={disabled}
            value={discount.items?.find(i => i.key === item.key)?.value ?? ""} onChange={event => custom(item, { value: Number(event.target.value) })} />
          <Select name={`kind-${item.key}`} label="Tipo" options={kinds} disabled={disabled}
            value={discount.items?.find(i => i.key === item.key)?.type ?? "fixed"}
            onChange={event => custom(item, { type: event.target.value as "fixed" | "percent" })} />
        </div> : <span>{formatBs((details.get(item.key)?.discount ?? item.existing_discount ?? 0) / 100)}
          {details.get(item.key) && <small className={styles.caption}>{details.get(item.key)?.discount_percent}%</small>}</span> },
    { key: "net", label: "A pagar", responsive: "A pagar", width: "115px", onRender: ({ item }: { item: AdvanceRow }) =>
      <span>{formatBs((details.get(item.key)?.net ?? ((item.gross ?? 0) - (item.existing_discount ?? 0) + (item.fees ?? 0))) / 100)}
        {Boolean(item.fees) && <small className={styles.caption}>Incluye cargos: {formatBs(item.fees / 100)}</small>}</span> },
  ];

  return <div className={styles.fields}>
    <div className={styles.toolbar}>
      {type === "E" && canCreateDebt && <Button variant="secondary" small disabled={disabled || loading || Boolean(maxThrough && through >= maxThrough)}
        onClick={() => setThrough(nextPeriod(through))}><Plus size={16} /> Añadir próximo período</Button>}
      <Button variant="secondary" small disabled={disabled || loading} onClick={() => setSelected(rows.filter(r => r.available).slice(0, 120).map(r => r.key).sort())}>
        Seleccionar disponibles</Button>
      {selected.length > 0 && <Button variant="secondary" small disabled={disabled} onClick={() => setSelected([])}>Limpiar selección</Button>}
    </div>
    {type === "E" && <p className={styles.note}>Los períodos futuros se emitirán al guardar, con la cuota actual de la unidad y vencimiento al final de su mes.</p>}
    <div className={styles.controls}>
      <Select name="advance-distribution" label="Aplicar descuento" options={Object.entries(distributionNames).filter(([id]) => canDiscount || id === "none").map(([id, name]) => ({ id, name }))}
        disabled={disabled} value={discount.mode} onChange={event => setDiscount({ mode: event.target.value as DiscountInput["mode"], type: "fixed", value: 0 })} />
      {["proportional", "latest"].includes(discount.mode) && <>
        <Input name="advance-discount-value" label="Descuento total" type="number" min={0} disabled={disabled} value={discount.value ?? 0}
          onChange={event => setDiscount(old => ({ ...old, value: Number(event.target.value) }))} />
        <Select name="advance-discount-kind" label="Tipo de descuento" options={kinds} disabled={disabled} value={discount.type}
          onChange={event => setDiscount(old => ({ ...old, type: event.target.value as "fixed" | "percent" }))} />
      </>}
    </div>
    {discount.mode !== "none" && <p className={styles.note}>El descuento afecta solo al capital en Bs. Se conservan multas y mantenimiento. Los descuentos existentes se mantienen salvo que decidas reemplazarlos.
      {discount.mode === "latest" && " Se aplica desde el último período hacia atrás; el porcentaje se calcula sobre el capital elegible seleccionado."}</p>}
    {["latest", "proportional"].includes(discount.mode) && rows.some(row => selected.includes(row.key) && row.existing_discount > 0) &&
      <CheckField name="advance-replace-discounts" label="Reemplazar descuentos anteriores" value={discount.replace_existing ? "Y" : "N"}
        checked={discount.replace_existing ?? false} disabled={disabled}
        onChange={event => setDiscount(old => ({ ...old, replace_existing: event.target.checked }))} />}
    {loading ? <p role="status">Consultando períodos…</p> : loadError ? <p role="alert" className={styles.error}>{loadError}</p>
      : rows.length ? <div className={styles.table}><Table id="advance-payment-selection" className="striped" header={header} data={rows} height="100%" /></div>
        : <p>No hay deudas pendientes.{type === "E" ? " Puedes añadir el próximo período para anticipar su pago." : ""}</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {selected.length > 0 && !preview && !error && <p role="status">Calculando resumen…</p>}
    {preview && <div className={styles.summary}>
      <span>Total original: <strong>{formatBs(preview.original / 100)}</strong></span>
      <span>Descuento: <strong>{formatBs(preview.discount / 100)}</strong></span>
      <span>Dinero a registrar: <strong>{formatBs(preview.net / 100)}</strong></span>
    </div>}
    {preview?.net === 0 && <p className={styles.note}>Las deudas quedarán saldadas por descuento. No se creará un ingreso.</p>}
    {operation && <Input name="advance-reason" label="Motivo de la operación" required disabled={disabled} maxLength={500} value={reason}
      onChange={event => setReason(event.target.value)} />}
  </div>;
}
