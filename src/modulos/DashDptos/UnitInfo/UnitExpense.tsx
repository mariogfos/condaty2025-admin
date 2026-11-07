"use client";

import { useRef, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { formatBs, formatNumber } from "@/mk/utils/numbers";
import styles from "../DashDptos.module.css";

type UnitUsdExpense = {
  amount_usd: string | null;
  amount_bob: string | null;
  rate: { value: string; date: string } | null;
  rate_notice: string | null;
  can_edit: boolean;
  version: string;
};

const validUsdAmount = /^\d{1,7}(\.\d{1,2})?$/;

export default function UnitExpense({ unitId, amountBob }: {
  unitId?: string | number;
  amountBob: string | number;
}) {
  const endpoint = unitId ? `/finance/usd/units/${unitId}/expense` : null;
  const { data, execute, reLoad } = useAxios(endpoint, "GET", {}, true);
  const { showToast } = useAuth();
  const expense = data?.data as UnitUsdExpense | null | undefined;
  const [draft, setDraft] = useState<{ amount: string; reason: string; version: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const inFlight = useRef(false);

  const save = async () => {
    if (!draft || !expense?.can_edit || draft.version !== expense.version || inFlight.current) return;
    if (!validUsdAmount.test(draft.amount) || draft.reason.trim().length < 3) {
      setFailure("Ingresa un monto válido en USD y el motivo del cambio.");
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setFailure("");
    try {
      const response = await execute(endpoint, "PUT", { ...draft, reason: draft.reason.trim() }, true, true);
      if (response.data?.success) {
        setDraft(null);
        showToast("Cuota USD guardada", "success");
      } else {
        setFailure(response.error?.data?.errors?.amount?.[0] || response.error?.data?.message || "No se pudo guardar la cuota.");
        if (response.error?.status === 409) await reLoad(null, true);
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className={styles.infoItem}>
      <span className={styles.infoLabel}>Monto expensa</span>
      <span className={styles.infoValue}>
        {expense ? (expense.amount_usd === null ? "Sin cuota USD" : `USD ${formatNumber(expense.amount_usd)}`) : formatBs(amountBob)}
      </span>
      {expense && (
        <>
          {expense.amount_bob !== null && <span className={styles.infoLabel}>Equivalente: {formatBs(expense.amount_bob)}</span>}
          {expense.rate_notice && <span className={styles.infoLabel}>{expense.rate_notice}</span>}
          {expense.can_edit && (
            <Button variant="secondary" small style={{ width: "fit-content" }} onClick={() => {
              setFailure("");
              setDraft({ amount: expense.amount_usd === null ? "" : Number(expense.amount_usd).toFixed(2), reason: "", version: expense.version });
            }}>
              Editar cuota USD
            </Button>
          )}
        </>
      )}
      {draft && (
        <DataModal
          open
          variant="mini"
          title="Editar cuota USD"
          onClose={() => { if (!inFlight.current) setDraft(null); }}
          onSave={save}
          disabled={busy || !expense?.can_edit || draft.version !== expense.version}
          buttonText={busy ? "Guardando…" : "Guardar"}
        >
          <Input label="Cuota de expensa (USD)" name="amount" type="currency" value={draft.amount}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, amount: event.target.value })} disabled={busy} />
          {expense?.rate && validUsdAmount.test(draft.amount) && (
            <p className={styles.infoLabel}>
              Equivalente estimado: {formatBs(Number(draft.amount) * Number(expense.rate.value))}
            </p>
          )}
          <Input label="Motivo del cambio" name="reason" value={draft.reason} maxLength={500}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, reason: event.target.value })} disabled={busy} />
          <p className={styles.infoLabel}>El importe se usará en las próximas expensas USD. Con una cuota de USD 0, la unidad queda exenta.</p>
          {failure && <p role="alert">{failure}</p>}
        </DataModal>
      )}
    </div>
  );
}
