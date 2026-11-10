"use client";

import { useRef, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import Switch from "@/mk/components/forms/Switch/Switch";
import shared from "../DptoConfig/DptoConfig.module.css";
import styles from "../UsdBilling/UsdBilling.module.css";

type Settings = { enabled: boolean; effective_from: string | null; bank_account_id: number | null };
type Option = { id: number | string; name: string };
type Account = {
  id: number;
  owner: string;
  bank_account_id: number;
  balance_cents: number;
  available_cents: number;
  committed_cents: number;
};
type Unit = { holders: Option[]; accounts: Account[]; deposit_bank_account_id: number | null };

const path = "/reservation-guarantees";
const bs = (cents: number) => new Intl.NumberFormat("es-BO", {
  style: "currency", currency: "BOB",
}).format(cents / 100);

export default function ReservationGuarantees() {
  const { userCan, showToast } = useAuth();
  const { data, error, execute, reLoad } = useAxios(path + "/settings", "GET");
  const result = data?.data as { settings: Settings; banks: Option[]; fos: boolean } | undefined;
  const [form, setForm] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [units, setUnits] = useState<Option[]>([]);
  const [unitId, setUnitId] = useState("");
  const [unit, setUnit] = useState<Unit | null>(null);
  const [kind, setKind] = useState<"deposit" | "refund">("deposit");
  const [owner, setOwner] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const intent = useRef<{ signature: string; key: string } | null>(null);
  const inFlight = useRef(false);

  if (!result) return <p role={error ? "alert" : "status"}>{error ? "No se pudo cargar Garantías." : "Cargando Garantías…"}</p>;

  const settings = form ?? result.settings;
  const canEdit = result.fos && userCan("settings", "U");
  const bankName = (id: number) => result.banks.find(bank => Number(bank.id) === id)?.name || "Cuenta " + id;

  const run = async (operation: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      await operation();
    } catch {
      showToast("No se pudo completar la solicitud. Intenta nuevamente.", "error");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const save = () => run(async () => {
    const response = await execute(path + "/settings", "PUT", settings, false, true);
    if (!response.data?.success) {
      showToast(response.error?.data?.message || "No se pudo guardar la configuración.", "error");
      return;
    }
    await reLoad(null, true);
    setForm(null);
    showToast("Configuración guardada", "success");
  });

  const findUnits = () => run(async () => {
    const response = await execute(path + "/units", "GET", { search: search.trim() }, false, true);
    if (!response.data?.success) throw new Error("unit search");
    const matches = response.data.data.map((item: { id: number; nro: string }) => ({ id: String(item.id), name: item.nro }));
    setUnit(null);
    setUnitId("");
    setUnits(matches);
    if (!matches.length) showToast("No se encontraron unidades.", "error");
  });

  const loadUnit = async (id: string) => {
    const response = await execute(path + "/units/" + id, "GET", {}, false, true);
    if (!response.data?.success) throw new Error("unit");
    setUnit(response.data.data);
    setUnitId(id);
  };

  const move = () => run(async () => {
    const payload = {
      kind,
      amount,
      reference: reference.trim(),
      ...(kind === "deposit" ? { owner_id: owner } : { account_id: Number(account) }),
    };
    const signature = JSON.stringify([unitId, payload]);
    if (intent.current?.signature !== signature) intent.current = { signature, key: crypto.randomUUID() };
    const response = await execute(path + "/units/" + unitId + "/movements", "POST", {
      ...payload, request_key: intent.current.key,
    }, false, true);
    if (!response.data?.success) {
      showToast(response.error?.data?.message || "No se pudo registrar el movimiento.", "error");
      return;
    }
    setAmount("");
    setReference("");
    intent.current = null;
    showToast("Movimiento registrado", "success");
    await loadUnit(unitId);
  });

  return <div className={`${shared.Config} ${shared.compactMode}`}>
    <div className={shared.headerRow}>
      <div className={shared.headerContent}>
        <h1 className={shared.mainTitle}>Garantías de reservas</h1>
        <p className={shared.mainSubtitle}>Configura desde cuándo se requiere una garantía reutilizable al reservar áreas sociales.</p>
      </div>
      {canEdit && <div className={shared.headerButtons}>
        {form ? <>
          <Button variant="secondary" className={shared.editButton} disabled={busy} onClick={() => setForm(null)}>Descartar cambios</Button>
          <Button className={shared.saveButton} disabled={busy || (form.enabled && (!form.effective_from || !form.bank_account_id))} onClick={save}>Guardar cambios</Button>
        </> : <Button variant="secondary" className={shared.editButton} disabled={busy} onClick={() => setForm(result.settings)}>Editar</Button>}
      </div>}
    </div>
    <div className={shared.rulesGrid}>
      <section className={shared.formCard}>
        <Switch name="guarantees_enabled" label="Pedir garantía en nuevas reservas" value={settings.enabled ? "Y" : "N"}
          disabled={!form || busy} onChange={event => setForm({ ...settings, enabled: event.target.checked })} />
        <Input name="guarantees_effective_from" type="date" label="Activar desde" value={settings.effective_from ?? ""}
          disabled={!form || busy} onChange={event => setForm({ ...settings, effective_from: event.target.value || null })} />
        <Select name="guarantees_bank_account" label="Cuenta de garantías" options={result.banks} value={settings.bank_account_id ?? ""}
          disabled={!form || busy} onChange={event => setForm({ ...settings, bank_account_id: Number(event.target.value) || null })} />
        <p className={styles.hint}>El importe se define por área social. Si la tarifa y la garantía usan la misma cuenta, el residente paga ambos conceptos juntos.</p>
      </section>
      <section className={shared.formCard}>
        <h2 className={styles.sectionTitle}>Garantía por unidad</h2>
        <Input name="guarantee_unit_search" label="Número de unidad" value={search} onChange={event => setSearch(event.target.value)} />
        <Button variant="secondary" className={shared.editButton} disabled={busy || !search.trim()} onClick={findUnits}>Buscar unidades</Button>
        {units.length > 0 && <Select name="guarantee_unit" label="Unidad" options={units} value={unitId} disabled={busy}
          onChange={event => run(async () => {
            setUnit(null);
            setOwner("");
            setAccount("");
            setAmount("");
            setReference("");
            if (event.target.value) await loadUnit(String(event.target.value));
            else setUnitId("");
          })} />}
        {unit && <>
          {unit.accounts.length === 0 && <p className={styles.hint}>La unidad aún no tiene garantías registradas.</p>}
          {unit.accounts.map(item => <p key={item.id} className={styles.hint}>
            <strong>{item.owner}</strong> · {bankName(item.bank_account_id)}<br />
            Depositado {bs(item.balance_cents)} · Comprometido {bs(item.committed_cents)} · Disponible {bs(item.available_cents)}
          </p>)}
          {canEdit && <div className={shared.rulesGrid}>
            <Select name="guarantee_kind" label="Movimiento" value={kind} options={[
              { id: "deposit", name: "Registrar depósito recibido" }, { id: "refund", name: "Registrar devolución realizada" },
            ]} onChange={event => setKind(event.target.value === "refund" ? "refund" : "deposit")} disabled={busy} />
            {kind === "deposit" ? <Select name="guarantee_owner" label="Titular" options={unit.holders} value={owner}
              disabled={busy} onChange={event => setOwner(event.target.value)} /> :
              <Select name="guarantee_refund_account" label="Garantía" value={account} disabled={busy}
                options={unit.accounts.map(item => ({ id: String(item.id), name: item.owner + " · " + bankName(item.bank_account_id) }))}
                onChange={event => setAccount(event.target.value)} />}
            <Input name="guarantee_amount" label="Importe en Bs" type="number" value={amount} disabled={busy}
              onChange={event => setAmount(event.target.value)} />
            <Input name="guarantee_reference" label="Referencia del comprobante" value={reference} disabled={busy}
              onChange={event => setReference(event.target.value)} />
            <Button className={shared.saveButton} onClick={move} disabled={busy || !amount || reference.trim().length < 3 ||
              (kind === "deposit" ? !owner || !unit.deposit_bank_account_id : !account)}>
              Registrar movimiento
            </Button>
          </div>}
        </>}
      </section>
    </div>
  </div>;
}
