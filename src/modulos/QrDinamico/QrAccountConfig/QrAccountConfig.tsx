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
import { BankAccountStatus } from "../../BankAccounts/Type/BankType";
import { apiMessage } from "../shared";
import styles from "./QrAccountConfig.module.css";

/**
 * La configuración del QR dinámico de UNA cuenta bancaria.
 *
 * **Decisión del dueño, 2026-09-05**: *«pueden tener varias y elegir cuál
 * cobra»*. La configuración es de la cuenta, no del condominio.
 *
 * **Decisión del dueño, 2026-09-06**: *«sobre quien configura los QR solo los
 * usuarios FOS»*. A un administrador de condominio el API le contesta 403 y
 * esta sección no se dibuja.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * 🔴 POR QUÉ NO VIAJA CON EL RESTO DEL FORMULARIO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * El CRUD de cuentas **descarta** los campos `qr_dynamic_*` que lleguen por
 * ahí: tienen su propia puerta, con su propio permiso. Así que esta sección se
 * guarda sola, contra su endpoint, **después** de que la cuenta se guardó.
 *
 * ⚠️ Pero el usuario ve UN SOLO botón. El formulario padre es el dueño de ese
 * botón y llama acá por `ref`; dos botones de guardar en un mismo modal es una
 * pregunta que el usuario no tiene por qué contestar.
 */

interface QrProvider {
  id: number;
  name: string;
  bank_code: string;
}

interface QrAccountConfigData {
  bank_account_id: number;
  qr_dynamic_status: number | null;
  qr_dynamic_bank_id: number | null;
  qr_dynamic_account_reference: string | null;
  cobra_por_qr: boolean;
  has_credentials: boolean;
  qr_dynamic_username_masked: string | null;
  qr_providers: QrProvider[];
}

interface Props {
  bankAccountId: number | string;
}

/** Lo que el formulario padre puede pedirle a esta sección. */
export interface QrAccountConfigHandle {
  /** `true` cuando no había nada que guardar, o cuando el guardado salió bien. */
  save: () => Promise<boolean>;
}

/** El encabezado se dibuja siempre, para que la sección se encuentre. */
const Section = ({ children }: { children: React.ReactNode }) => (
  <div className={styles.container} id="qr-account-config">
    <p className={styles.sectionTitle}>QR Dinámico</p>
    {children}
  </div>
);

const LAS_CREDENCIALES = [
  "qr_dynamic_api_key",
  "qr_dynamic_username",
  "qr_dynamic_password",
] as const;

const QrAccountConfig = forwardRef<QrAccountConfigHandle, Props>(
  function QrAccountConfig({ bankAccountId }, ref) {
    const { showToast } = useAuth();
    const { execute } = useAxios();

    const [config, setConfig] = useState<QrAccountConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // null = nada que reportar. "forbidden" = 403, la sección no le
    // corresponde a este usuario. Cualquier otro valor es un mensaje que el
    // usuario TIENE que ver: un fallo silencioso acá se lee como «esta cuenta
    // no tiene QR».
    const [loadError, setLoadError] = useState<"forbidden" | string | null>(null);

    // Sólo los campos que el usuario tocó viajan en el PUT.
    const [form, setForm] = useState<Record<string, string>>({});

    const load = useCallback(async () => {
      setLoading(true);

      const res = await execute(
        `/qr-dynamic/accounts/${bankAccountId}/config`,
        "GET",
        {},
        false,
        true,
      );

      if (res?.data?.success) {
        setConfig(res.data.data);
        setLoadError(null);
      } else {
        // 🔴 En un no-2xx axios lanza y `useAxios` devuelve `data: null` con el
        // cuerpo en `error`. Nunca caer en un null silencioso: sólo un 403 es
        // motivo legítimo para no dibujar nada.
        setConfig(null);
        const detail = apiMessage(res);
        setLoadError(
          res?.error?.status === 403
            ? "forbidden"
            : "No se pudo cargar la configuración del QR dinámico. " +
                (detail || "Revisá tu conexión y volvé a intentar."),
        );
      }

      setForm({});
      setLoading(false);
    }, [bankAccountId, execute]);

    useEffect(() => {
      load();
      // ⚠️ `execute` de `useAxios` cambia de identidad en CADA render: colgar
      // el efecto de `load` dispara un bucle infinito de pedidos. Sólo la
      // cuenta.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bankAccountId]);

    const handleChange = (e: any) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    };

    // El valor que se muestra es el tocado si existe, y si no el guardado.
    const enElFormulario = (campo: string, guardado: string) =>
      campo in form ? form[campo] : guardado;

    const habilitado = enElFormulario(
      "qr_dynamic_status",
      Number(config?.qr_dynamic_status) === BankAccountStatus.ACTIVE ? "Y" : "N",
    );
    const estaHabilitado = habilitado === "Y";

    const banco = enElFormulario(
      "qr_dynamic_bank_id",
      config?.qr_dynamic_bank_id != null ? String(config.qr_dynamic_bank_id) : "",
    );

    const referencia = enElFormulario(
      "qr_dynamic_account_reference",
      config?.qr_dynamic_account_reference ?? "",
    );

    const save = async (): Promise<boolean> => {
      const payload: Record<string, unknown> = {};

      // ⚠️ El interruptor viaja como el ENUM numérico, no como booleano: en
      // este repo la columna es `qr_dynamic_status`.
      if ("qr_dynamic_status" in form) {
        payload.qr_dynamic_status =
          form.qr_dynamic_status === "Y"
            ? BankAccountStatus.ACTIVE
            : BankAccountStatus.INACTIVE;
      }

      // El banco y la referencia viajan aunque queden vacíos: limpiarlos es
      // una acción válida.
      for (const campo of ["qr_dynamic_bank_id", "qr_dynamic_account_reference"]) {
        if (campo in form) payload[campo] = form[campo];
      }

      // 🔴 Una credencial vacía NO viaja. El backend nunca las devuelve, así
      // que el campo arranca en blanco: mandarlo así BORRARÍA la guardada, y
      // el síntoma sería «el banco dejó de responder», días después.
      for (const campo of LAS_CREDENCIALES) {
        if (campo in form && form[campo] !== "") payload[campo] = form[campo];
      }

      // Que no haya nada que tocar no es un fallo: el formulario padre sigue.
      if (Object.keys(payload).length === 0) return true;

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

      showToast(
        apiMessage(res) ||
          "No se pudo guardar la configuración del QR dinámico",
        "error",
      );
      return false;
    };

    // Se rehace en cada render a propósito: `save` cierra sobre el formulario
    // de AHORA, y un handle congelado guardaría lo que había al montar.
    useImperativeHandle(ref, () => ({ save }));

    if (loading) {
      return (
        <Section>
          <p className={styles.muted}>Cargando configuración QR…</p>
        </Section>
      );
    }

    // 403: la configuración del QR no es de este usuario. Es el único caso en
    // que no dibujar nada es la respuesta correcta.
    if (loadError === "forbidden") return null;

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
          Se configura por cuenta. Activar el QR dinámico no reemplaza ni
          elimina el QR manual de la cuenta.
        </p>

        <Switch
          name="qr_dynamic_status"
          label="QR Dinámico habilitado"
          value={habilitado}
          onChange={handleChange}
          disabled={saving}
        />

        {/* Con el QR apagado el resto no aplica: se oculta en vez de ofrecer
            campos que no van a hacer nada. */}
        {estaHabilitado && (
          <>
            <Select
              label="Banco / proveedor"
              name="qr_dynamic_bank_id"
              value={banco}
              options={config.qr_providers ?? []}
              optionLabel="name"
              optionValue="id"
              onChange={handleChange}
              disabled={saving}
            />

            <Input
              label="Referencia de cuenta"
              name="qr_dynamic_account_reference"
              value={referencia}
              onChange={handleChange}
              disabled={saving}
            />

            <p className={styles.credentialsState}>
              {config.has_credentials
                ? `Credenciales configuradas — usuario: ${config.qr_dynamic_username_masked ?? "•••"}`
                : "Sin credenciales configuradas"}
            </p>
            <p className={styles.hint}>
              Las credenciales guardadas no se vuelven a mostrar. Para cambiar
              una, escribí el valor nuevo; los campos vacíos no se tocan.
            </p>

            <InputPassword
              label="API Key"
              name="qr_dynamic_api_key"
              value={form.qr_dynamic_api_key ?? ""}
              onChange={handleChange}
              disabled={saving}
            />
            <Input
              label="Usuario del banco"
              name="qr_dynamic_username"
              value={form.qr_dynamic_username ?? ""}
              onChange={handleChange}
              disabled={saving}
            />
            <InputPassword
              label="Clave del banco"
              name="qr_dynamic_password"
              value={form.qr_dynamic_password ?? ""}
              onChange={handleChange}
              disabled={saving}
            />
          </>
        )}
      </Section>
    );
  },
);

export default QrAccountConfig;
