import { useEffect, useState } from "react";
import { ReceiptText, ShieldCheck } from "lucide-react";
import { formatBs } from "@/mk/utils/numbers";
import type { AdvanceDraft, AdvancePlan } from "@/features/advance-payments/types";
import styles from "./IncomeWizard.module.css";

export function IncomeSummary({ draft, advanceEnabled, amount, count, unit }: {
  draft: AdvanceDraft | null; advanceEnabled: boolean; amount: number; count: number; unit?: string;
}) {
  const selectedCount = advanceEnabled ? draft?.payload.selected.length ?? 0 : count;
  const pending = advanceEnabled && selectedCount > 0 && !draft?.preview;
  const scope = `${unit ?? ""}:${draft?.payload.unit_id ?? ""}:${draft?.payload.type ?? ""}`;
  const [lastDisplay, setLastDisplay] = useState<{ scope: string; plan: AdvancePlan } | null>(null);
  useEffect(() => {
    if (advanceEnabled && selectedCount > 0 && draft?.preview) setLastDisplay({ scope, plan: draft.preview });
    else if (!advanceEnabled || !selectedCount) setLastDisplay(null);
  }, [advanceEnabled, selectedCount, draft?.preview, scope]);
  // Presentation only: the form continues to require a fresh preview before saving.
  const plan = advanceEnabled && selectedCount > 0
    ? draft?.preview ?? (lastDisplay?.scope === scope ? lastDisplay.plan : null) : null;
  const rows = plan?.items ?? [];
  const maintenance = rows.reduce((sum, row) => sum + (row.maintenance ?? 0), 0);
  const penalties = rows.reduce((sum, row) => sum + (row.penalty ?? (row.fees - (row.maintenance ?? 0))), 0);
  const capital = rows.reduce((sum, row) => sum + (row.gross ?? 0), 0);
  const total = advanceEnabled ? plan?.net : Math.round(amount * 100);
  const money = (value?: number) => value === undefined ? "—" : formatBs(value / 100);
  return <aside className={styles.summary} aria-label="Resumen del ingreso" aria-busy={pending}>
    <div className={styles.summaryHeading}><ReceiptText size={19} /><h3>Resumen</h3></div>
    <p className={styles.summaryUnit}>{unit ? `Unidad ${unit}` : "Selecciona una unidad"}</p>
    {selectedCount > 0 && <p className={styles.summaryCount}>{selectedCount} {selectedCount === 1 ? "deuda seleccionada" : "deudas seleccionadas"}</p>}
    <dl className={styles.amounts}>
      {advanceEnabled ? <>
        <div><dt>Monto</dt><dd>{money(plan ? capital : undefined)}</dd></div>
        <div><dt>Multa</dt><dd>{money(plan ? penalties : undefined)}</dd></div>
        {maintenance > 0 && <div><dt>Mant. Valor</dt><dd>{money(maintenance)}</dd></div>}
        <div className={styles.subtotal}><dt>Subtotal</dt><dd>{money(plan?.original)}</dd></div>
        {Boolean(plan?.discount) && <div className={styles.discount}><dt>Descuento</dt><dd>− {money(plan?.discount)}</dd></div>}
      </> : <div><dt>Subtotal</dt><dd>{money(Math.round(amount * 100))}</dd></div>}
    </dl>
    <div className={styles.total}><span>Total a registrar</span><strong>{money(total)}</strong></div>
    {total === 0 && plan && <p className={styles.note}>Se salda por descuento, sin crear un ingreso.</p>}
    <p className={styles.summaryHint}><ShieldCheck size={15} />Los importes se verifican nuevamente al guardar.</p>
  </aside>;
}
