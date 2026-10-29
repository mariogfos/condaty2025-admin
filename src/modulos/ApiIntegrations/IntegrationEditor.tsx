"use client";

import { useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { scopeLabels, type Catalogs, type Integration } from "./types";
import styles from "./ApiIntegrations.module.css";

type Draft = { name: string; client_id: string; scopes: string[]; is_active: boolean; expires_at: string | null; webhook_url: string | null; request_id?: string; version?: string };
type Props = { item: Integration | null; catalogs: Catalogs; busy: boolean; error: string; onClose: () => void; onSave: (draft: Draft) => void };

export default function IntegrationEditor({ item, catalogs, busy, error, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Draft>(() => ({
    name: item?.name ?? "", client_id: item?.client_id ?? "", scopes: item?.scopes ?? ["units:read", "debts:read", "payments:read"],
    is_active: item?.is_active ?? false, expires_at: item?.expires_at ?? null,
    webhook_url: item?.webhook_url ?? null,
    ...(item ? { version: item.version } : { request_id: crypto.randomUUID() }),
  }));
  const [validation, setValidation] = useState("");
  const toggle = (scope: string) => setDraft((current) => ({ ...current,
    scopes: current.scopes.includes(scope) ? current.scopes.filter((s) => s !== scope) : [...current.scopes, scope],
  }));
  const save = () => {
    if (!draft.name.trim() || !draft.client_id || !draft.scopes.length) {
      setValidation("Completa el nombre, el condominio y al menos un permiso.");
      return;
    }
    setValidation("");
    onSave({ ...draft, name: draft.name.trim() });
  };
  return (
    <DataModal open title={item ? "Editar integración" : "Nueva integración"} onClose={() => { if (!busy) onClose(); }}
      onSave={save} disabled={busy} buttonText={busy ? "Guardando…" : item ? "Guardar cambios" : "Crear integración"} maxWidth={760}>
      <div className={styles.form}>
        <p className={styles.helper}>Una credencial sólo puede operar en el condominio seleccionado. Los permisos no cambian los de los administradores.</p>
        <div className={styles.formGrid}>
          <Input name="name" label="Nombre de integración" value={draft.name} placeholder="Ej. Sistema contable"
            maxLength={120} required disabled={busy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft((s) => ({ ...s, name: e.target.value }))} />
          <Select name="client_id" label="Condominio" value={draft.client_id} options={catalogs.clients} filter required
            disabled={busy || Boolean(item)} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDraft((s) => ({ ...s, client_id: e.target.value }))} />
          <Input name="expires_at" label="Vencimiento opcional" type="date" value={draft.expires_at ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/La_Paz" }).format(new Date(draft.expires_at)) : ""} disabled={busy}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft((s) => ({ ...s, expires_at: e.target.value ? `${e.target.value}T23:59:59-04:00` : null }))} />
          <label className={styles.check}><input type="checkbox" checked={draft.is_active} disabled={busy}
            onChange={(e) => setDraft((s) => ({ ...s, is_active: e.target.checked }))} /><span>Integración activa</span></label>
        </div>
        <Input name="webhook_url" label="Webhook HTTPS opcional" value={draft.webhook_url ?? ""} placeholder="https://tu-sistema.example/eventos"
          disabled={busy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft((s) => ({ ...s, webhook_url: e.target.value || null }))} />
        <p className={styles.helper}>El webhook sólo avisa de cambios, sin datos personales. Requiere changes:read; se entrega en una cola independiente. Si cambias el destino se genera una nueva clave de firma.</p>
        <fieldset className={styles.permissions}><legend>Permisos de la API</legend>
          {catalogs.scopes.map((scope) => <label key={scope} className={styles.check}>
            <input type="checkbox" checked={draft.scopes.includes(scope)} onChange={() => toggle(scope)} disabled={busy} />
            <span>{scopeLabels[scope] ?? scope}<small>{scope}</small></span>
          </label>)}
        </fieldset>
        {draft.scopes.includes("people:identity") ? <p className={styles.warning}>Corregir CI es un permiso sensible: conserva la cuenta y exige motivo. Las identidades compartidas con otros condominios requieren revisión de Backoffice.</p> : null}
        {error || validation ? <p className={styles.error} role="alert">{error || validation}</p> : null}
      </div>
    </DataModal>
  );
}
