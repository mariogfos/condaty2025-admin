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
const path = "/reservation-guarantees/settings";

export default function ReservationGuarantees() {
  const { userCan, showToast } = useAuth();
  const { data, error, execute, reLoad } = useAxios(path, "GET");
  const result = data?.data as { settings: Settings; banks: Option[]; fos: boolean } | undefined;
  const [form, setForm] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  if (!result) return <p role={error ? "alert" : "status"}>{error ? "No se pudo cargar Garantías." : "Cargando Garantías…"}</p>;

  const settings = form ?? result.settings;
  const canEdit = result.fos && userCan("settings", "U");

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
    const response = await execute(path, "PUT", settings, false, true);
    if (!response.data?.success) {
      showToast(response.error?.data?.message || "No se pudo guardar la configuración.", "error");
      return;
    }
    await reLoad(null, true);
    setForm(null);
    showToast("Configuración guardada", "success");
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
    </div>
  </div>;
}
