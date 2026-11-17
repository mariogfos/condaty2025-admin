"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Plus, LockKeyhole } from "lucide-react";
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

export default function AdvancePaymentFields({ unitId, type, execute, onChange, initialDebtId, disabled = false, revision = 0, paidAt, phase = 1, maintenanceEnabled = false }: {
  unitId: number; type: "E" | "O"; execute: Function; onChange: (draft: AdvanceDraft) => void;
  initialDebtId?: string | number; disabled?: boolean; revision?: number; paidAt?: string; phase?: 1 | 2 | 3; maintenanceEnabled?: boolean;
}) {
  const { userCan } = useAuth();
  const canCreateDebt = userCan("debts_manager", "C") || userCan("debts", "C");
  const canDiscount = userCan("debts_manager", "U") || userCan("debts", "U");
  const run = useRef(execute); run.current = execute;
  const notify = useRef(onChange); notify.current = onChange;
  const requestKey = useRef(crypto.randomUUID());
  const [through, setThrough] = useState(getBusinessDate().slice(0, 7));
  const [maxThrough, setMaxThrough] = useState("");
  const [showMaintenance, setShowMaintenance] = useState(maintenanceEnabled);
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
        setShowMaintenance(response.data.data.maintenance_enabled ?? maintenanceEnabled);
      }).catch(() => { if (active) setLoadError("No se pudieron consultar las deudas."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [unitId, type, through, revision, paidAt, maintenanceEnabled]);

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
  const custom = (row: AdvanceRow, patch: Partial<{ type: "fixed" | "percent"; value: number }>) => {
    setDiscount(old => {
      const previous = old.items?.find(item => item.key === row.key) ?? { key: row.key, type: "fixed" as const, value: 0 };
      return { ...old, items: [...(old.items ?? []).filter(item => item.key !== row.key), { ...previous, ...patch }] };
    });
  };
  const selectedRows = rows.filter(row => selected.includes(row.key));
  const blocked = rows.filter(row => !row.available);
  const selectableRows = rows.filter(row => row.available || selected.includes(row.key));
  const lastVisiblePeriod = [through, ...rows.map(row => row.period)].filter(period => /^\d{4}-\d{2}$/.test(period)).sort().at(-1) ?? through;
  const nextToAdd = nextPeriod(lastVisiblePeriod);
  const concept = (row: AdvanceRow) => type === "E" && /^\d{4}-\d{2}$/.test(row.period)
    ? new Date(row.period + "-01T12:00:00").toLocaleDateString("es-BO", { month: "long", year: "numeric" }) : row.title;
  const debtType = (row: AdvanceRow) => type === "E" ? "Expensa" : row.debt_type === 4 ? "Compartida" : "Individual";
  const changeDistribution = (mode: DiscountInput["mode"]) => setDiscount(mode === "custom"
    ? { mode, items: selectedRows.filter(row => row.can_discount).map(row => ({ key: row.key, type: "fixed", value: (row.existing_discount ?? 0) / 100 })) }
    : { mode, type: "fixed", value: 0 });
  const header = [
    { key: "selected", label: "", responsive: "Seleccionar", width: "44px", className: styles.selectionColumn, onRender: ({ item }: { item: AdvanceRow }) =>
      <button className={styles.choice} type="button" aria-label={`Seleccionar ${item.title}`} aria-pressed={selected.includes(item.key)}
        disabled={disabled || (!item.available && !selected.includes(item.key)) || (!selected.includes(item.key) && selected.length >= 120)} title={item.reason}
        onClick={() => toggle(item.key)}>{selected.includes(item.key) && <Check size={14} strokeWidth={3} />}</button> },
    { key: "debt_type", label: "Tipo", responsive: "Tipo", width: "96px", className: styles.typeColumn,
      onRender: ({ item }: { item: AdvanceRow }) => <span className={styles.typeLabel}>{debtType(item)}</span> },
    { key: "title", label: "Concepto", responsive: "Concepto", width: "100%", className: styles.copyColumn,
      onRender: ({ item }: { item: AdvanceRow }) => <span className={styles.rowContent}>
        <span className={styles.concept}>{concept(item)}</span><small className={styles.caption}>
          {item.future ? "Futura · " : ""}{item.due_at ? `Vence ${item.due_at.split("-").reverse().join("/")}` : ""}
        </small></span> },
    { key: "gross", label: "Monto", responsive: "Monto", width: "124px", className: styles.amountColumn,
      onRender: ({ item }: { item: AdvanceRow }) => formatBs((item.gross ?? 0) / 100) },
    { key: "penalty", label: "Multa", responsive: "Multa", width: "104px", className: styles.feeColumn,
      onRender: ({ item }: { item: AdvanceRow }) => formatBs((item.penalty ?? (item.fees - (item.maintenance ?? 0))) / 100) },
    ...(showMaintenance ? [{ key: "maintenance", label: "Mant. Valor", responsive: "Mant. Valor", width: "124px", className: styles.amountColumn,
      onRender: ({ item }: { item: AdvanceRow }) => formatBs((item.maintenance ?? 0) / 100) }] : []),
  ];

  return <div className={styles.fields}>
    {phase === 1 && <>
      <div className={styles.toolbar}>
        <span>{selected.length ? `${selected.length} ${selected.length === 1 ? "deuda seleccionada" : "deudas seleccionadas"}` : "Selecciona las deudas a incluir"}</span>
        <div className={styles.actions}>
          {type === "E" && canCreateDebt && <Button variant="secondary" small disabled={disabled || loading || Boolean(maxThrough && nextToAdd > maxThrough)}
            onClick={() => setThrough(nextToAdd)}><Plus size={15} /> Añadir próximo período</Button>}
          <Button variant="secondary" small disabled={disabled || loading} onClick={() => setSelected(rows.filter(r => r.available).slice(0, 120).map(r => r.key).sort())}>
            Seleccionar disponibles</Button>
          {selected.length > 0 && <Button variant="terciary" small disabled={disabled} onClick={() => setSelected([])}>Limpiar</Button>}
        </div>
      </div>
      {loading ? <p role="status">Consultando deudas…</p> : loadError ? <p role="alert" className={styles.error}>{loadError}</p>
        : selectableRows.length ? <div className={styles.table} style={{ height: Math.min(340, 48 + selectableRows.length * 58) }}><Table style={{ minWidth: showMaintenance ? 780 : 656 }} id="advance-payment-selection" className={`striped ${styles.selectionTable}`} header={header} data={selectableRows} height="100%" /></div>
          : <p className={styles.note}>No hay deudas disponibles.{type === "E" ? " Añade el próximo período para anticipar su pago." : ""}</p>}
      {blocked.length > 0 && <details className={styles.blocked}>
        <summary><LockKeyhole size={15} />{blocked.length} {blocked.length === 1 ? "deuda no disponible" : "deudas no disponibles"}<span>Ver motivos</span></summary>
        <ul>{blocked.map(row => <li key={row.key}><strong>{concept(row)}</strong><span>{row.reason}</span></li>)}</ul>
      </details>}
      {type === "E" && <p className={styles.note}>Los períodos futuros se crean únicamente al confirmar el ingreso.</p>}
    </>}

    {phase === 2 && <>
      <div className={styles.sectionHeading}><h3>Descuento opcional</h3><p>Se aplica al capital de las deudas seleccionadas.</p></div>
      <div className={styles.controls}>
        <Select name="advance-distribution" label="Distribución del descuento" options={Object.entries(distributionNames).filter(([id]) => canDiscount || id === "none").map(([id, name]) => ({ id, name }))}
          disabled={disabled} value={discount.mode} onChange={event => changeDistribution(event.target.value as DiscountInput["mode"])} />
        {["proportional", "latest"].includes(discount.mode) && <>
          <Input name="advance-discount-value" label="Descuento total" type="number" min={0} disabled={disabled} value={discount.value ?? 0}
            onChange={event => setDiscount(old => ({ ...old, value: Number(event.target.value) }))} />
          <Select name="advance-discount-kind" label="Tipo de descuento" options={kinds} disabled={disabled} value={discount.type}
            onChange={event => setDiscount(old => ({ ...old, type: event.target.value as "fixed" | "percent" }))} />
        </>}
      </div>
      {discount.mode !== "none" && <p className={styles.note}>Multas y mantenimiento conservan su importe.
        {discount.mode === "latest" && " El descuento se consume desde el último período hacia atrás; el porcentaje se calcula sobre el capital elegible seleccionado."}</p>}
      {discount.mode === "custom" && <div className={styles.customList}>
        {selectedRows.filter(row => row.can_discount).map(row => <div className={styles.customRow} key={row.key}>
          <div><strong>{concept(row)}</strong><small className={styles.caption}>Monto {formatBs(row.gross / 100)}</small></div>
          <Input name={`discount-${row.key}`} label={`Descuento ${concept(row)}`} type="number" min={0} disabled={disabled}
            value={discount.items?.find(i => i.key === row.key)?.value ?? ""} onChange={event => custom(row, { value: Number(event.target.value) })} />
          <Select name={`kind-${row.key}`} label={`Tipo ${concept(row)}`} options={kinds} disabled={disabled}
            value={discount.items?.find(i => i.key === row.key)?.type ?? "fixed"} onChange={event => custom(row, { type: event.target.value as "fixed" | "percent" })} />
        </div>)}
      </div>}
      {["latest", "proportional"].includes(discount.mode) && selectedRows.some(row => row.existing_discount > 0) &&
        <CheckField name="advance-replace-discounts" label="Reemplazar descuentos anteriores" value={discount.replace_existing ? "Y" : "N"}
          checked={discount.replace_existing ?? false} disabled={disabled} onChange={event => setDiscount(old => ({ ...old, replace_existing: event.target.checked }))} />}
      {operation && <Input name="advance-reason" label="Motivo de la operación" required disabled={disabled} maxLength={500} value={reason}
        onChange={event => setReason(event.target.value)} />}
    </>}

    {phase === 3 && <>
      <div className={styles.sectionHeading}><h3>Deudas incluidas</h3><p>Comprueba el importe final de cada deuda antes de confirmar.</p></div>
      <ul className={styles.reviewList}>{preview?.items.map(row => <li key={row.key}>
        <div><strong>{concept(row)}</strong><small className={styles.caption}>{debtType(row)}{row.future ? " · Se emitirá al confirmar" : ""}</small>
          {Boolean(row.discount) && <small className={styles.discountText}>Descuento {formatBs((row.discount ?? 0) / 100)} · {row.discount_percent}%</small>}</div>
        <strong>{formatBs((row.net ?? 0) / 100)}</strong>
      </li>)}</ul>
      {preview?.net === 0 && <p className={styles.note}>Las deudas se saldan por descuento. No se creará un ingreso.</p>}
    </>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {selected.length > 0 && !preview && !error && <p role="status" className={styles.note}>Calculando resumen…</p>}
  </div>;
}
