"use client";
import React, {
  forwardRef,
  useCallback,
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

interface QrAccountConfigData {
  bank_account_id: number;
  qr_dynamic_enabled: boolean;
  qr_dynamic_bank_id: string | null;
  qr_dynamic_account_reference: string | null;
  has_credentials: boolean;
  qr_dynamic_username_masked: string | null;
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

  // Solo los campos que el usuario tocó viajan en el PUT (parcial)
  const [form, setForm] = useState<Record<string, string | boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const [cfgRes, provRes] = await Promise.all([
      execute(`/qr-dynamic/accounts/${bankAccountId}/config`, "GET", {}, false, true),
      execute("/qr-dynamic/providers", "GET", {}, false, true),
    ]);
    if (cfgRes?.data?.success) {
      setConfig(cfgRes.data.data);
      setLoadError(null);
    } else {
      // On a non-2xx axios throws and useAxios returns data:null + error
      // (DES-32). Never fall through to a silent null: only a 403 is a
      // legitimate reason to render nothing.
      setConfig(null);
      const status = cfgRes?.error?.status;
      const detail = apiMessage(cfgRes);
      setLoadError(
        status === 403
          ? "forbidden"
          : "No se pudo cargar la configuración del QR dinámico. " +
              (detail || "Revisá tu conexión y volvé a intentar."),
      );
    }
    if (provRes?.data?.success) setProviders(provRes.data.data.providers ?? []);
    setForm({});
    setLoading(false);
  }, [bankAccountId, execute]);

  useEffect(() => {
    load();
    // execute (useAxios) cambia de identidad en cada render: colgar el
    // efecto de load provoca un bucle infinito de requests. Solo la cuenta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankAccountId]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const enabledValue =
    "qr_dynamic_enabled" in form
      ? (form.qr_dynamic_enabled as string)
      : config?.qr_dynamic_enabled
        ? "Y"
        : "N";

  const bankIdValue =
    "qr_dynamic_bank_id" in form
      ? (form.qr_dynamic_bank_id as string)
      : (config?.qr_dynamic_bank_id ?? "");

  const isEnabled = enabledValue === "Y";

  const referenceValue =
    "qr_dynamic_account_reference" in form
      ? (form.qr_dynamic_account_reference as string)
      : (config?.qr_dynamic_account_reference ?? "");

  const save = async (): Promise<boolean> => {
    // PUT parcial: solo lo tocado. El toggle viaja como booleano.
    const payload: Record<string, unknown> = {};
    if ("qr_dynamic_enabled" in form)
      payload.qr_dynamic_enabled = form.qr_dynamic_enabled === "Y";
    // La referencia y el proveedor viajan aunque estén vacíos (limpiar es
    // válido); una credencial vacía NO viaja (vacío = "no la toques")
    for (const key of ["qr_dynamic_bank_id", "qr_dynamic_account_reference"]) {
      if (key in form) payload[key] = form[key];
    }
    for (const key of [
      "qr_dynamic_api_key",
      "qr_dynamic_username",
      "qr_dynamic_password",
    ]) {
      if (key in form && form[key] !== "") payload[key] = form[key];
    }
    // Nada que tocar acá no es un fallo: el formulario padre sigue su curso.
    if (Object.keys(payload).length === 0) {
      return true;
    }
    setSaving(true);
    const res = await execute(
      `/qr-dynamic/accounts/${bankAccountId}/config`,
      "PUT",
      payload,
    );
    setSaving(false);
    if (res?.data?.success) {
      load();
      return true;
    }

    // 422: axios tira y el mensaje del backend llega en error.data (DES-32)
    showToast(
      apiMessage(res) || "No se pudo guardar la configuración del QR dinámico",
      "error",
    );
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
        <Button onClick={load}>Reintentar</Button>
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
      />

      {/* Con el QR deshabilitado el resto no aplica: se oculta en vez de
          ofrecer campos que nadie va a usar. */}
      {isEnabled && (
        <>
        <Select
          label="Banco / proveedor"
          name="qr_dynamic_bank_id"
          value={bankIdValue}
          options={providers}
          optionLabel="bank_name"
          optionValue="id"
          onChange={handleChange}
        />

        <Input
          label="Referencia de cuenta"
          name="qr_dynamic_account_reference"
          value={referenceValue}
          onChange={handleChange}
        />

        <p className={styles.credentialsState}>
          {config.has_credentials
            ? `Credenciales configuradas — usuario: ${config.qr_dynamic_username_masked ?? "•••"}`
            : "Sin credenciales configuradas"}
        </p>
        <p className={styles.hint}>
          Las credenciales guardadas no se vuelven a mostrar. Para cambiar una,
          escribí el valor nuevo; los campos vacíos no se tocan.
        </p>

        <InputPassword
          label="API Key"
          name="qr_dynamic_api_key"
          value={(form.qr_dynamic_api_key as string) ?? ""}
          onChange={handleChange}
          autoComplete="new-password"
          error={{}}
        />
        <Input
          label="Usuario"
          name="qr_dynamic_username"
          value={(form.qr_dynamic_username as string) ?? ""}
          onChange={handleChange}
        />
        <InputPassword
          label="Contraseña"
          name="qr_dynamic_password"
          value={(form.qr_dynamic_password as string) ?? ""}
          onChange={handleChange}
          autoComplete="new-password"
          error={{}}
        />
        </>
      )}
    </Section>
  );
});

export default QrAccountConfig;
