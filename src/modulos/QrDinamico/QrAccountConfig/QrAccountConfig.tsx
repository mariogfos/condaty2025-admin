"use client";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import Select from "@/mk/components/forms/Select/Select";
import Switch from "@/mk/components/forms/Switch/Switch";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { apiMessage } from "../shared";
import styles from "./QrAccountConfig.module.css";

/**
 * QR Dinámico por cuenta bancaria (DES-20/21) — SOLO FOS.
 *
 * Lee y escribe por los endpoints dedicados (qr-dynamic/accounts/{id}/config),
 * nunca por el CRUD genérico de cuentas: el backend descarta los campos
 * qr_dynamic_* que lleguen por ahí.
 *
 * Credenciales write-only (RN-ADM-03): el backend jamás las devuelve; la UI
 * muestra el usuario enmascarado y si existen credenciales. Para cambiar una,
 * se escribe un valor nuevo. El PUT es parcial: solo pisa lo enviado, y
 * desactivar no borra credenciales.
 */

interface QrProvider {
  id: string;
  bank_code: string;
  bank_name: string;
}

type Environment = "S" | "P";
type Field = "qr_dynamic_enabled" | "qr_dynamic_bank_id" | "qr_dynamic_account_reference"
  | "qr_dynamic_api_key" | "qr_dynamic_username" | "qr_dynamic_password";

const environmentNames: Record<Environment, string> = { S: "Pruebas", P: "Producción" };
const credentialFields = ["qr_dynamic_api_key", "qr_dynamic_username", "qr_dynamic_password"] as const;

interface QrAccountConfigData {
  bank_account_id: number;
  qr_dynamic_enabled: boolean;
  qr_dynamic_bank_id: string | null;
  qr_dynamic_account_reference: string | null;
  has_credentials: boolean;
  qr_dynamic_username_masked: string | null;
  environment: Environment;
  active_environment: Environment;
}

interface Props {
  bankAccountId: number | string;
}

/**
 * The QR configuration lives behind its own endpoint, so the bank-account
 * form cannot post it along with the rest. The parent form owns the only
 * save button and calls this handle after the account itself is stored.
 */
export interface QrAccountConfigHandle {
  /** true when there was nothing to save or the save succeeded. */
  save: () => Promise<boolean>;
}

/** Always-on heading so the section is discoverable while loading or failing. */
const Section = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.container} id="qr-account-config">
    <p className={styles.sectionTitle}>QR Dinámico (solo FOS)</p>
    {children}
  </div>
);

const QrAccountConfig = forwardRef<QrAccountConfigHandle, Props>(
  function QrAccountConfig({ bankAccountId }, ref) {
  const { showToast } = useAuth();
  const { execute } = useAxios();

  const [config, setConfig] = useState<QrAccountConfigData | null>(null);
  const [providers, setProviders] = useState<QrProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // null = nothing to report. "forbidden" = 403, the section is legitimately
  // hidden. Any other value is a message the user has to see (QR-07).
  const [loadError, setLoadError] = useState<"forbidden" | string | null>(null);

  const [form, setForm] = useState<Partial<Record<Field, string>>>({});
  const [editingCredentials, setEditingCredentials] = useState(false);
  const configUrl = `/qr-dynamic/accounts/${bankAccountId}/config`;

  const load = async (environment?: Environment) => {
    setLoading(true);
    const [cfgRes, provRes] = await Promise.all([
      execute(configUrl, "GET", environment ? { environment } : {}, false, true),
      environment ? null : execute("/qr-dynamic/providers", "GET", {}, false, true),
    ]);
    if (cfgRes?.data?.success && (environment || provRes?.data?.success)) {
      setConfig(cfgRes.data.data);
      setLoadError(null);
      if (environment) {
        setForm(({ qr_dynamic_enabled, qr_dynamic_bank_id }) => ({
          qr_dynamic_enabled,
          qr_dynamic_bank_id,
        }));
      } else {
        setProviders(provRes.data.data.providers ?? []);
        setForm({});
      }
    } else {
      const failedResponse = cfgRes?.data?.success ? provRes : cfgRes;
      const detail = apiMessage(failedResponse) || "Revisá tu conexión y volvé a intentar.";
      if (environment) {
        showToast(`No se pudieron cargar las credenciales de ${environmentNames[environment]}. ${detail}`, "error");
      } else {
        setConfig(null);
        setLoadError(cfgRes?.error?.status === 403
          ? "forbidden"
          : `No se pudo cargar la configuración del QR dinámico. ${detail}`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // execute (useAxios) cambia de identidad en cada render: colgar el
    // efecto de load provoca un bucle infinito de requests. Solo la cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankAccountId]);

  const enabledValue = form.qr_dynamic_enabled ?? (config?.qr_dynamic_enabled ? "Y" : "N");
  const savedBankId = config?.qr_dynamic_bank_id ?? "";
  const bankIdValue = form.qr_dynamic_bank_id ?? savedBankId;
  const switchingBank = bankIdValue !== savedBankId;
  const isEnabled = enabledValue === "Y";
  const credentialEnvironment = config?.environment ?? "S";
  const selectedProvider = providers.find((provider) => provider.id === bankIdValue);
  const isBnb = selectedProvider?.bank_code === "BNB";
  const savedReference = switchingBank ? "" : (config?.qr_dynamic_account_reference ?? "");
  const referenceValue = form.qr_dynamic_account_reference ?? savedReference;
  const pendingCredentials: Record<string, string> = {};
  for (const field of credentialFields) {
    const value = field === "qr_dynamic_password" ? form[field] : form[field]?.replace(/\s+/g, "");
    if (value && (field !== "qr_dynamic_api_key" || !isBnb)) pendingCredentials[field] = value;
  }
  const normalizedReference = referenceValue.replace(/\s+/g, "");
  if (normalizedReference !== savedReference.replace(/\s+/g, "")) {
    pendingCredentials.qr_dynamic_account_reference = normalizedReference;
  }

  const handleChange = ({ target }: { target: { name: string; value: string } }) => {
    const field = target.name as Field;
    if (field === "qr_dynamic_enabled" && target.value === "Y") setEditingCredentials(true);
    if (field === "qr_dynamic_bank_id" && target.value !== bankIdValue) {
      if (Object.keys(pendingCredentials).length > 0) {
        showToast("Guarda o limpia los datos de este proveedor antes de elegir otro.", "error");
        return;
      }
      // A draft for one provider must never be sent to another provider.
      setForm((prev) => ({ qr_dynamic_enabled: prev.qr_dynamic_enabled, [field]: target.value }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: target.value }));
  };

  const save = async (): Promise<boolean> => {
    if (loading || saving) {
      showToast("Espera a que termine la carga o el guardado del QR dinámico.", "error");
      return false;
    }
    if (!config) return true;
    if (!bankIdValue && Object.keys(pendingCredentials).length > 0) {
      showToast("Selecciona un proveedor antes de guardar sus credenciales.", "error");
      return false;
    }
    const payload: Record<string, unknown> = { ...pendingCredentials };
    if (switchingBank) payload.qr_dynamic_bank_id = bankIdValue || null;
    if (isEnabled !== config.qr_dynamic_enabled) payload.qr_dynamic_enabled = isEnabled;
    if (Object.keys(payload).length === 0) return true;

    setSaving(true);
    const res = await execute(configUrl, "PUT", { ...payload, environment: credentialEnvironment });
    setSaving(false);
    if (res?.data?.success) {
      setConfig(res.data.data);
      setForm({});
      return true;
    }

    const errors = res?.error?.data?.errors as Record<string, string[]> | undefined;
    const detail = errors && Object.values(errors).flat().join(" ");
    const activeHint = res?.error?.status === 422 && isEnabled
      && credentialEnvironment !== config.active_environment
      ? ` Para habilitar el QR, completa las credenciales del ambiente de cobro (${environmentNames[config.active_environment]}).`
      : "";
    showToast((detail || apiMessage(res) || "No se pudo guardar la configuración del QR dinámico.") + activeHint, "error");
    return false;
  };

  // Recreated on every render on purpose: `save` closes over the current form.
  useImperativeHandle(ref, () => ({ save }));

  if (loading) {
    return (
      <Section>
        <p className={styles.muted}>Cargando configuración QR…</p>
      </Section>
    );
  }

  if (loadError === "forbidden") {
    // 403: no tiene permiso sobre la config — la sección no le corresponde
    return null;
  }

  if (loadError) {
    return (
      <Section>
        <p className={styles.error} id="qr-account-config-error">
          {loadError}
        </p>
        <Button onClick={() => load()}>Reintentar</Button>
      </Section>
    );
  }

  if (!config) return null;

  return (
    <Section>
      <p className={styles.hint}>
        Configuración independiente por cuenta. Activar el QR dinámico no
        reemplaza ni elimina el QR manual de la cuenta.
      </p>

      <Switch
        name="qr_dynamic_enabled"
        label="QR Dinámico habilitado"
        value={enabledValue}
        onChange={handleChange}
        disabled={saving}
      />

      {!isEnabled && !editingCredentials && (
        <div>
          <Button variant="secondary" small onClick={() => setEditingCredentials(true)}>
            Configurar credenciales
          </Button>
        </div>
      )}
      {(isEnabled || editingCredentials) && (
        <>
        <Select
          label="Banco / proveedor"
          name="qr_dynamic_bank_id"
          value={bankIdValue}
          options={providers}
          optionLabel="bank_name"
          optionValue="id"
          onChange={handleChange}
          disabled={saving}
        />
        {switchingBank && savedBankId && (
          <p className={styles.hint}>Al guardar otro proveedor se reemplazan las credenciales guardadas en ambos ambientes.</p>
        )}

        <Select
          label="Credenciales del ambiente"
          name="credential_environment"
          value={credentialEnvironment}
          options={[{ id: "S", name: "Pruebas" }, { id: "P", name: "Producción" }]}
          optionLabel="name"
          optionValue="id"
          disabled={saving}
          onChange={(event: { target: { value: string } }) => {
            const next = event.target.value;
            if ((next !== "S" && next !== "P") || next === credentialEnvironment) return;
            if (Object.keys(pendingCredentials).length > 0) {
              showToast(`Guarda o limpia los campos modificados de ${environmentNames[credentialEnvironment]} antes de cambiar de ambiente.`, "error");
              return;
            }
            load(next);
          }}
        />
        <p className={styles.hint}>
          {`Ambiente de cobro del condominio: ${environmentNames[config.active_environment]}. Este selector solo elige qué credenciales editas.`}
        </p>
        {credentialEnvironment !== config.active_environment && (
          <p className={styles.hint}>Puedes preparar las credenciales de este ambiente con el QR deshabilitado.</p>
        )}

        <Input
          label={isBnb ? "Posición de cuenta BNB (1 o 2)" : "Referencia de cuenta"}
          name="qr_dynamic_account_reference"
          value={referenceValue}
          onChange={handleChange}
          disabled={saving}
        />

        <p className={styles.credentialsState}>
          {!switchingBank && config.has_credentials
            ? `Credenciales configuradas — usuario: ${config.qr_dynamic_username_masked ?? "•••"}`
            : "Sin credenciales configuradas"}
        </p>
        <p className={styles.hint}>
          Las credenciales guardadas no se vuelven a mostrar. Para cambiar una,
          escribí el valor nuevo; los campos vacíos no se tocan.
        </p>

        {!isBnb && (
          <InputPassword
            label="API Key"
            name="qr_dynamic_api_key"
            value={form.qr_dynamic_api_key ?? ""}
            onChange={handleChange}
            autoComplete="new-password"
            readOnly={saving}
            error={{}}
          />
        )}
        <Input
          label={isBnb ? "accountId (BNB)" : "Usuario"}
          name="qr_dynamic_username"
          value={form.qr_dynamic_username ?? ""}
          onChange={handleChange}
          autoComplete="off"
          disabled={saving}
        />
        <InputPassword
          label={isBnb ? "authorizationId (BNB)" : "Contraseña"}
          name="qr_dynamic_password"
          value={form.qr_dynamic_password ?? ""}
          onChange={handleChange}
          autoComplete="new-password"
          readOnly={saving}
          error={{}}
        />
        </>
      )}
    </Section>
  );
});

export default QrAccountConfig;
