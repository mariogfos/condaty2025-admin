"use client";

import { useEffect, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatBs } from "@/mk/utils/numbers";
import styles from "./Cheques.module.css";

export const chequeStatus: Record<string, string> = {
  free: "Libre", filled: "Rellenado", in_transit: "En tránsito", cashed: "Cobrado", void: "Anulado",
};

const nextStatuses: Record<string, string[]> = {
  free: ["void"], filled: ["in_transit", "cashed", "void"], in_transit: ["cashed", "void"], cashed: [], void: [],
};

export default function ChequeView({ open, onClose, item, execute, reLoad, showToast, setItem }: any) {
  const { userCan } = useAuth();
  const [cheque, setCheque] = useState<any>(item);
  const [transitionOpen, setTransitionOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => setCheque(item), [item]);

  const available = (nextStatuses[cheque?.status] || []).filter((next) => next !== "void" || !cheque.expense_id || cheque.expense?.status === "X");
  const save = async () => {
    if (!status || (status === "void" && !reason.trim()) || saving) return;
    setSaving(true);
    try {
      const { data, error } = await execute(`/cheques/${cheque.id}/status`, "PATCH", { status, reason: reason.trim() || null }, false, true);
      if (!data?.success) {
        showToast(data?.message || error?.data?.message || "No se pudo actualizar el cheque", "error");
        return;
      }
      const detail = await execute(`/cheques/${cheque.id}`, "GET", {}, false, true);
      const updated = detail.data?.data || { ...cheque, ...data.data };
      setCheque(updated);
      setItem?.(updated);
      reLoad?.();
      setTransitionOpen(false);
      showToast("Estado del cheque actualizado", "success");
    } catch {
      showToast("No se pudo actualizar el cheque", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!cheque) return null;
  const fields = [
    ["Número", cheque.number],
    ["Estado", chequeStatus[cheque.status] || cheque.status],
    ["Talonario", cheque.book?.name || `${cheque.book?.first_number || ""} – ${cheque.book?.last_number || ""}`],
    ["Cuenta", [cheque.bank_account?.alias_holder, cheque.bank_account?.account_number].filter(Boolean).join(" · ")],
    ["Beneficiario", cheque.payee],
    ["Monto", cheque.amount !== null ? formatBs(cheque.amount) : null],
    ["Fecha de emisión", cheque.issued_at],
    ["Egreso asociado", cheque.expense_id ? `#${cheque.expense_id} · ${cheque.expense?.description || ""}` : null],
    ["Fecha de tránsito", cheque.transit_at],
    ["Fecha de cobro", cheque.cashed_at],
    ["Motivo de anulación", cheque.void_reason],
  ] as const;

  return (
    <>
      <DataModal open={open} onClose={onClose} title="Detalle del cheque" buttonText="" buttonCancel="Cerrar" maxWidth={720}
        buttonExtra={userCan("outlays", "U") && available.length ? <Button variant="secondary" onClick={() => { setStatus(available[0]); setReason(""); setTransitionOpen(true); }}>Cambiar estado</Button> : null}>
        <div className={styles.detail}>
          <div className={styles.grid}>
            {fields.map(([label, value]) => value ? <div className={styles.field} key={label}><p className={styles.label}>{label}</p><p className={styles.value}>{value}</p></div> : null)}
          </div>
          {Array.isArray(cheque.events) && cheque.events.length ? <div>
            <p className={styles.label}>Historial de estados</p>
            <ul className={styles.history}>{cheque.events.map((event: any) => <li className={styles.historyItem} key={event.id}>
              {chequeStatus[event.from_status] || "Inicio"} → {chequeStatus[event.to_status] || event.to_status}
              <span className={styles.historyMeta}>{[event.actor?.name, event.actor?.last_name].filter(Boolean).join(" ")} · {event.created_at}</span>
              {event.reason ? <span className={styles.historyMeta}>{event.reason}</span> : null}
            </li>)}</ul>
          </div> : null}
        </div>
      </DataModal>
      <DataModal open={transitionOpen} onClose={() => setTransitionOpen(false)} onSave={save} title="Cambiar estado del cheque" buttonText={saving ? "Guardando…" : "Guardar estado"} disabled={saving} variant="mini">
        <div className={styles.form}>
          <Select name="status" label="Nuevo estado" value={status} onChange={({ target }: any) => setStatus(target.value)}
            options={available.map((id) => ({ id, name: chequeStatus[id] }))} required />
          {status === "void" ? <TextArea name="reason" label="Motivo de anulación" value={reason} onChange={({ target }: any) => setReason(target.value)} maxLength={500} required /> : null}
          {status === "void" ? <p className={styles.helper}>El cheque anulado no vuelve a estar libre. Si tenía egreso, éste debe anularse primero.</p> : null}
        </div>
      </DataModal>
    </>
  );
}
