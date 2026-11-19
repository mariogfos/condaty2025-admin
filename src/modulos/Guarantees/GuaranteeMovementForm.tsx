"use client";

import { useRef, useState } from "react";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { getRequestErrorMessage } from "@/mk/utils/axiosError";
import { formatCents, guaranteePath, type Guarantee, type GuaranteeOption, type GuaranteeUnit } from "./guaranteeData";
import styles from "./Guarantees.module.css";

export default function GuaranteeMovementForm({ refund, onClose, onSaved }: {
  refund?: Guarantee; onClose: () => void; onSaved: () => void;
}) {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const [search, setSearch] = useState("");
  const [matches, setMatches] = useState<GuaranteeOption[]>([]);
  const [unitId, setUnitId] = useState("");
  const [unit, setUnit] = useState<GuaranteeUnit | null>(null);
  const [owner, setOwner] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState<"read" | "save" | null>(null);
  const [failure, setFailure] = useState("");
  const inFlight = useRef(false);
  const intent = useRef<{ signature: string; key: string } | null>(null);

  const run = async (mode: "read" | "save", operation: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(mode);
    setFailure("");
    try {
      await operation();
    } catch (error) {
      setFailure(error instanceof Error ? error.message : "No se pudo completar la solicitud.");
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  };

  const findUnits = (value: string) => run("read", async () => {
    setSearch(value);
    setMatches([]);
    setUnitId("");
    setUnit(null);
    setOwner("");
    if (!value.trim()) return;
    if (value.length > 80) throw new Error("La búsqueda admite hasta 80 caracteres.");
    const response = await execute(guaranteePath + "/units", "GET", { search: value }, false, true);
    if (!response.data?.success) {
      setSearch("");
      throw new Error(getRequestErrorMessage(response.error, "No se pudieron buscar unidades."));
    }
    const units = response.data.data as { id: number; nro: string }[];
    setMatches(units.map(item => ({ id: String(item.id), name: item.nro })));
  });

  const chooseUnit = (id: string) => run("read", async () => {
    setUnitId(id);
    setUnit(null);
    setOwner("");
    if (!id) return;
    const response = await execute(guaranteePath + "/units/" + id, "GET", {}, false, true);
    if (!response.data?.success) {
      setUnitId("");
      throw new Error(getRequestErrorMessage(response.error, "No se pudo cargar la unidad."));
    }
    const result: GuaranteeUnit = response.data.data;
    setUnit(result);
    if (result.holders.length === 1) setOwner(String(result.holders[0].id));
  });

  const amountCents = Math.round(Number(amount) * 100);
  const validAmount = /^\d{1,6}(\.\d{1,2})?$/.test(amount) && amountCents > 0;
  const exceedsBalance = Boolean(refund && validAmount && amountCents > refund.available_cents);
  const canSave = validAmount && !exceedsBalance && reference.trim().length >= 3 &&
    Boolean(refund || (unitId && owner && unit?.deposit_bank_account_id));

  const save = () => run("save", async () => {
    if (!canSave) return;
    const selectedUnit = refund?.unit_id ?? unitId;
    const payload = {
      amount,
      reference: reference.trim(),
      ...(refund ? { kind: "refund", account_id: refund.id } : { kind: "deposit", owner_id: owner }),
    };
    const signature = JSON.stringify([selectedUnit, payload]);
    if (intent.current?.signature !== signature) intent.current = { signature, key: crypto.randomUUID() };
    const response = await execute(guaranteePath + "/units/" + selectedUnit + "/movements", "POST",
      { ...payload, request_key: intent.current.key }, false, true);
    if (!response.data?.success) throw new Error(getRequestErrorMessage(response.error, "No se pudo registrar el movimiento."));
    showToast(refund ? "Devolución registrada" : "Depósito registrado", "success");
    onSaved();
  });

  return (
    <DataModal open title={refund ? "Registrar devolución" : "Registrar depósito"}
      onClose={onClose} onSave={save} maxWidth={600}
      iconClose={busy !== "save"} buttonCancel={busy === "save" ? "" : "Cancelar"} disabled={Boolean(busy) || !canSave}
      buttonText={busy === "save" ? "Guardando…" : "Registrar"}>
      <div className={styles.form}>
        {refund ? <p className={styles.note}>{refund.unit} · {refund.owner} · {refund.bank}.
          Registra una devolución ya realizada. Disponible {formatCents(refund.available_cents)}.</p> : <>
          <DataSearch name="guarantee-unit-search" placeholder="Buscar por número de unidad"
            value={search} setSearch={findUnits} disabled={Boolean(busy)} />
          {search && !busy && !matches.length && !failure && <p className={styles.note}>No se encontraron unidades.</p>}
          {matches.length > 0 && <Select name="guarantee_unit" label="Unidad" options={matches} value={unitId}
            onChange={event => chooseUnit(String(event.target.value))} disabled={Boolean(busy)} />}
          {unit && <>
            {unit.holders.length ? <Select name="guarantee_owner" label="Titular" options={unit.holders}
              value={owner} onChange={event => setOwner(String(event.target.value))} disabled={Boolean(busy)} />
              : <p className={styles.note}>La unidad no tiene un titular vigente.</p>}
            {!unit.deposit_bank_account_id && <p className={styles.note}>Configura la cuenta de garantías para registrar depósitos.</p>}
          </>}
        </>}
        <Input name="guarantee_amount" label="Importe en Bs" type="currency" value={amount} disabled={Boolean(busy)}
          onChange={event => setAmount(String(event.target.value))} />
        {exceedsBalance && <p role="alert" className={styles.error}>La devolución supera el saldo disponible.</p>}
        <Input name="guarantee_reference" label="Referencia del comprobante" value={reference} maxLength={400}
          disabled={Boolean(busy)} onChange={event => setReference(String(event.target.value))} />
        {busy === "read" && <p className={styles.note} role="status">Cargando…</p>}
        {failure && <p role="alert" className={styles.error}>{failure}</p>}
      </div>
    </DataModal>
  );
}
