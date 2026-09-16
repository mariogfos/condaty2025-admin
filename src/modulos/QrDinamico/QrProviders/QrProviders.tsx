"use client";
import React, { useCallback, useEffect, useState } from "react";
import Input from "@/mk/components/forms/Input/Input";
import InputPassword from "@/mk/components/forms/InputPassword/InputPassword";
import Switch from "@/mk/components/forms/Switch/Switch";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { apiMessage } from "../shared";
import styles from "./QrProviders.module.css";

/**
 * Proveedores de QR dinámico — SOLO FOS.
 *
 * Acá viven las credenciales con las que EL BANCO nos llama (el webhook).
 * No confundirlas con las de la cuenta bancaria, que son con las que nosotros
 * lo llamamos a él: esas se configuran al editar la cuenta.
 *
 * Hay una por proveedor, no por condominio. Hasta esta pantalla no existía
 * dónde cambiarlas y rotarlas pedía una migración.
 *
 * La contraseña es de sólo escritura: el backend guarda un hash y no devuelve
 * nada, ni enmascarado. Dejarla vacía significa "no la toques".
 */

interface QrProvider {
  id: string;
  bank_code: string;
  bank_name: string;
  is_active: boolean;
  base_url: string | null;
  sandbox_base_url: string | null;
  webhook_username: string | null;
  has_webhook_password: boolean;
  pending_orders: number;
}

type Borrador = Record<string, string>;

const QrProviders: React.FC = () => {
  const { execute } = useAxios();
  const [providers, setProviders] = useState<QrProvider[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [borradores, setBorradores] = useState<Record<string, Borrador>>({});
  const [guardando, setGuardando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ id: string; texto: string; ok: boolean } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await execute("/qr-dynamic/banks", "GET", {});
    if (res?.data?.success) {
      setProviders(res.data.data ?? []);
      setBorradores({});
      return;
    }
    setLoadError(
      apiMessage(res) || "No se pudieron cargar los proveedores de QR dinámico.",
    );
    setProviders([]);
    // execute se recrea en cada render, así que queda fuera de las dependencias
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const valor = (p: QrProvider, campo: keyof QrProvider): string => {
    const borrador = borradores[p.id];
    if (borrador && campo in borrador) return borrador[campo as string];
    const actual = p[campo];
    return actual === null || actual === undefined ? "" : String(actual);
  };

  const cambiar = (id: string, campo: string, valorNuevo: string) => {
    setBorradores((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [campo]: valorNuevo },
    }));
  };

  const guardar = async (p: QrProvider) => {
    const borrador = borradores[p.id] ?? {};
    const payload: Record<string, unknown> = {};

    for (const campo of [
      "bank_name",
      "webhook_username",
      "base_url",
      "sandbox_base_url",
    ]) {
      if (campo in borrador) payload[campo] = borrador[campo];
    }
    if ("is_active" in borrador) payload.is_active = borrador.is_active === "Y";
    // Vacía = no la toques. Mandarla vacía la borraría del formulario cada vez
    // que se guarda cualquier otro campo.
    if (borrador.webhook_password) {
      payload.webhook_password = borrador.webhook_password;
    }

    if (Object.keys(payload).length === 0) {
      setAviso({ id: p.id, texto: "No hay cambios para guardar.", ok: true });
      return;
    }

    setGuardando(p.id);
    const res = await execute(`/qr-dynamic/banks/${p.id}`, "PUT", payload);
    setGuardando(null);

    if (res?.data?.success) {
      setAviso({ id: p.id, texto: "Proveedor actualizado.", ok: true });
      load();
      return;
    }
    setAviso({
      id: p.id,
      texto: apiMessage(res) || "No se pudo guardar el proveedor.",
      ok: false,
    });
  };

  if (providers === null) {
    return <p className={styles.muted}>Cargando proveedores…</p>;
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <p className={styles.error}>{loadError}</p>
        <Button onClick={load}>Reintentar</Button>
      </div>
    );
  }

  if (providers.length === 0) {
    return <p className={styles.muted}>No hay proveedores de QR cargados.</p>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Proveedores de QR dinámico</h2>
      <p className={styles.hint}>
        Credenciales con las que el banco nos avisa de un pago. Las que usamos
        para llamarlo a él se configuran al editar cada cuenta bancaria.
      </p>

      {providers.map((p) => {
        const estaActivo = (borradores[p.id]?.is_active ?? (p.is_active ? "Y" : "N")) === "Y";
        const seVaApagar = p.is_active && !estaActivo && p.pending_orders > 0;

        return (
          <section key={p.id} className={styles.card}>
            <header className={styles.cardHeader}>
              <span className={styles.code}>{p.bank_code}</span>
              <span className={styles.badge} data-active={estaActivo}>
                {estaActivo ? "Activo" : "Inactivo"}
              </span>
            </header>

            <Input
              label="Nombre"
              name={`bank_name_${p.id}`}
              value={valor(p, "bank_name")}
              onChange={(e: any) => cambiar(p.id, "bank_name", e.target.value)}
            />

            <Switch
              name={`is_active_${p.id}`}
              label="Proveedor activo"
              value={estaActivo ? "Y" : "N"}
              onChange={(e: any) =>
                cambiar(p.id, "is_active", e.target.value === "Y" ? "Y" : "N")
              }
            />

            {seVaApagar && (
              <p className={styles.warning}>
                {`Este proveedor tiene ${p.pending_orders} ${
                  p.pending_orders === 1
                    ? "QR esperando pago"
                    : "QR esperando pago"
                }. Al desactivarlo el banco deja de poder avisarnos, y esos pagos no se acreditan solos.`}
              </p>
            )}

            <Input
              label="Usuario del webhook"
              name={`webhook_username_${p.id}`}
              value={valor(p, "webhook_username")}
              onChange={(e: any) =>
                cambiar(p.id, "webhook_username", e.target.value)
              }
            />

            <p className={styles.credentialsState}>
              {p.has_webhook_password
                ? "Contraseña configurada"
                : "Sin contraseña configurada"}
            </p>
            <p className={styles.hint}>
              La contraseña guardada no se vuelve a mostrar. Para cambiarla,
              escribí una nueva; vacía no se toca.
            </p>

            <InputPassword
              label="Contraseña nueva"
              name={`webhook_password_${p.id}`}
              value={borradores[p.id]?.webhook_password ?? ""}
              onChange={(e: any) =>
                cambiar(p.id, "webhook_password", e.target.value)
              }
              autoComplete="new-password"
              error={{}}
            />

            <Input
              label="URL de producción"
              name={`base_url_${p.id}`}
              value={valor(p, "base_url")}
              onChange={(e: any) => cambiar(p.id, "base_url", e.target.value)}
            />
            <Input
              label="URL de pruebas"
              name={`sandbox_base_url_${p.id}`}
              value={valor(p, "sandbox_base_url")}
              onChange={(e: any) =>
                cambiar(p.id, "sandbox_base_url", e.target.value)
              }
            />

            {aviso?.id === p.id && (
              <p className={aviso.ok ? styles.ok : styles.error}>{aviso.texto}</p>
            )}

            <Button onClick={() => guardar(p)} disabled={guardando === p.id}>
              {guardando === p.id ? "Guardando…" : "Guardar"}
            </Button>
          </section>
        );
      })}
    </div>
  );
};

export default QrProviders;
