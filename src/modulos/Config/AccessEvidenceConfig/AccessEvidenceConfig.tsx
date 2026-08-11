"use client";

import React, { useEffect, useMemo, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import Switch from "@/mk/components/forms/Switch/Switch";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./AccessEvidenceConfig.module.css";

type PolicyState = {
  enabled: boolean;
  max_photos_per_access: number;
  monthly_max_photo_count: string;
  monthly_storage_value: string;
  monthly_storage_unit: "MB" | "GB";
  retention_enabled: boolean;
  retention_value: string;
  retention_unit: "days" | "months";
  delivery_ready: boolean;
};

const DEFAULT_POLICY: PolicyState = {
  enabled: false,
  max_photos_per_access: 3,
  monthly_max_photo_count: "",
  monthly_storage_value: "",
  monthly_storage_unit: "MB",
  retention_enabled: false,
  retention_value: "",
  retention_unit: "days",
  delivery_ready: false,
};

const bytesToMegabytes = (bytes?: number | null) => {
  if (!bytes) return "";
  return String(Number((bytes / 1024 / 1024).toFixed(2)));
};

const policyToForm = (policy: any): PolicyState => ({
  enabled: Boolean(policy?.enabled),
  max_photos_per_access: Number(policy?.max_photos_per_access || 3),
  monthly_max_photo_count:
    policy?.monthly_max_photo_count === null ||
    policy?.monthly_max_photo_count === undefined
      ? ""
      : String(policy.monthly_max_photo_count),
  monthly_storage_value: bytesToMegabytes(policy?.monthly_max_bytes),
  monthly_storage_unit: "MB",
  retention_enabled: Boolean(policy?.retention_enabled),
  retention_value:
    policy?.retention_days === null || policy?.retention_days === undefined
      ? ""
      : String(policy.retention_days),
  retention_unit: "days",
  delivery_ready: Boolean(policy?.delivery_ready),
});

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return "0 MB";
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatUsd = (value?: number | null) => {
  if (value === null || value === undefined) return "Pendiente de conciliar";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
};

const AccessEvidenceConfig = () => {
  const { showToast } = useAuth();
  const {
    data: policyResponse,
    loaded: policyLoaded,
    reLoad: reloadPolicy,
  } = useAxios("/access/evidence-policy", "GET", {});
  const {
    data: usageResponse,
    loaded: usageLoaded,
    reLoad: reloadUsage,
  } = useAxios("/access/evidence-usage", "GET", {});
  const { execute } = useAxios(null, "GET", {});
  const [form, setForm] = useState<PolicyState>(DEFAULT_POLICY);
  const [saving, setSaving] = useState(false);

  const policy = policyResponse?.data;
  const usage = usageResponse?.data;

  useEffect(() => {
    if (policyResponse?.success) {
      setForm(policyToForm(policy));
    }
  }, [policy, policyResponse?.success]);

  const monthlyMaxBytes = useMemo(() => {
    const value = Number(form.monthly_storage_value);
    if (!Number.isFinite(value) || value <= 0) return null;
    const multiplier = form.monthly_storage_unit === "GB" ? 1024 ** 3 : 1024 ** 2;
    return Math.round(value * multiplier);
  }, [form.monthly_storage_unit, form.monthly_storage_value]);

  const retentionDays = useMemo(() => {
    const value = Number(form.retention_value);
    if (!Number.isFinite(value) || value <= 0) return null;
    return form.retention_unit === "months" ? Math.round(value * 30) : Math.round(value);
  }, [form.retention_unit, form.retention_value]);

  const updateField = (name: keyof PolicyState, value: any) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async () => {
    if (form.enabled && !form.delivery_ready) {
      showToast(
        "Falta configurar CLOUDINARY_URL y la clave privada de entrega de Cloudinary en el Backend.",
        "error",
      );
      return;
    }

    const monthlyPhotoCount = form.monthly_max_photo_count
      ? Number(form.monthly_max_photo_count)
      : null;

    if (form.enabled && !monthlyPhotoCount && !monthlyMaxBytes) {
      showToast("Define al menos una cuota mensual: fotos, tamaño o ambas.", "error");
      return;
    }

    if (form.retention_enabled && !retentionDays) {
      showToast("Define el tiempo de conservación de las fotos.", "error");
      return;
    }

    setSaving(true);
    const { data, error } = await execute("/access/evidence-policy", "PUT", {
      enabled: form.enabled,
      max_photos_per_access: Number(form.max_photos_per_access),
      monthly_max_photo_count: monthlyPhotoCount,
      monthly_max_bytes: monthlyMaxBytes,
      retention_enabled: form.retention_enabled,
      retention_days: form.retention_enabled ? retentionDays : null,
    });
    setSaving(false);

    if (!data?.success) {
      showToast(error?.data?.message || data?.message || "No se pudo guardar la política.", "error");
      return;
    }

    setForm(policyToForm(data.data));
    reloadPolicy();
    reloadUsage();
    showToast("Reglas de evidencia actualizadas", "success");
  };

  if (!policyLoaded || !usageLoaded) {
    return <div className={styles.loading}>Cargando reglas de evidencia…</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Reglas de evidencia de accesos</h1>
          <p>
            Controla las fotos opcionales que portería puede adjuntar a cada ingreso y su costo operativo.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </header>

      {!form.delivery_ready && (
        <div className={styles.warning}>
          La entrega privada de Cloudinary aún no está configurada en el Backend. Puedes revisar esta regla,
          pero no activarla hasta que el equipo configure CLOUDINARY_URL y su clave de token privada.
        </div>
      )}

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Captura en portería</h2>
            <p>Las fotos son opcionales para el guardia y no reemplazan las fotos de carnet o placa existentes.</p>
          </div>
          <Switch
            name="enabled"
            value={form.enabled ? "Y" : "N"}
            onChange={({ target }: any) => updateField("enabled", target.value === "Y")}
            label={form.enabled ? "Habilitada" : "Deshabilitada"}
            disabled={!form.delivery_ready}
          />
        </div>

        <div className={styles.grid}>
          <label>
            <span>Máximo de fotos por acceso</span>
            <input
              type="number"
              min="1"
              max="10"
              value={form.max_photos_per_access}
              disabled={!form.enabled}
              onChange={(event) => updateField("max_photos_per_access", event.target.value)}
            />
            <small>Entre 1 y 10 fotos. El Backend valida el límite incluso si una app está desactualizada.</small>
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Cuota mensual</h2>
            <p>Puedes limitar por cantidad de fotos, por tamaño total o por ambos. Se mide sobre fotos nuevas del mes.</p>
          </div>
        </div>

        <div className={styles.grid}>
          <label>
            <span>Máximo de fotos al mes</span>
            <input
              type="number"
              min="1"
              placeholder="Sin límite por cantidad"
              value={form.monthly_max_photo_count}
              disabled={!form.enabled}
              onChange={(event) => updateField("monthly_max_photo_count", event.target.value)}
            />
          </label>
          <label>
            <span>Máximo de almacenamiento al mes</span>
            <div className={styles.compoundInput}>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Sin límite por tamaño"
                value={form.monthly_storage_value}
                disabled={!form.enabled}
                onChange={(event) => updateField("monthly_storage_value", event.target.value)}
              />
              <select
                value={form.monthly_storage_unit}
                disabled={!form.enabled}
                onChange={(event) => updateField("monthly_storage_unit", event.target.value as "MB" | "GB")}
              >
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </select>
            </div>
          </label>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <h2>Conservación y eliminación</h2>
            <p>Al vencer el plazo, el Backend elimina cada activo identificado y guarda el resultado de la operación.</p>
          </div>
          <Switch
            name="retention_enabled"
            value={form.retention_enabled ? "Y" : "N"}
            onChange={({ target }: any) => updateField("retention_enabled", target.value === "Y")}
            label={form.retention_enabled ? "Borrado automático activo" : "Sin borrado automático"}
            disabled={!form.enabled}
          />
        </div>

        {form.retention_enabled && (
          <label className={styles.retentionInput}>
            <span>Conservar fotos durante</span>
            <div className={styles.compoundInput}>
              <input
                type="number"
                min="1"
                max={form.retention_unit === "months" ? "120" : "3650"}
                value={form.retention_value}
                onChange={(event) => updateField("retention_value", event.target.value)}
              />
              <select
                value={form.retention_unit}
                onChange={(event) => updateField("retention_unit", event.target.value as "days" | "months")}
              >
                <option value="days">días</option>
                <option value="months">meses</option>
              </select>
            </div>
            <small>Los meses se convierten a 30 días para que el plazo sea verificable y automático.</small>
          </label>
        )}
      </section>

      <section className={styles.usageSection}>
        <div>
          <h2>Consumo de {usage?.month || "este mes"}</h2>
          <p>El almacenamiento y las fotos son propios del condominio. El costo se concilia a nivel de cuenta Cloudinary.</p>
        </div>
        <div className={styles.stats}>
          <article>
            <span>Fotos cargadas</span>
            <strong>{usage?.uploaded_photo_count || 0}</strong>
            <small>{formatBytes(usage?.uploaded_bytes)}</small>
          </article>
          <article>
            <span>Almacenamiento activo</span>
            <strong>{formatBytes(usage?.active_bytes)}</strong>
            <small>{usage?.active_photo_count || 0} fotos disponibles</small>
          </article>
          <article>
            <span>Costo {usage?.cost_status === "estimated" ? "estimado" : "por conciliar"}</span>
            <strong>{formatUsd(usage?.estimated_cost_usd)}</strong>
            <small>Solo almacenamiento asignado; entrega y transformaciones se concilian aparte.</small>
          </article>
          <article>
            <span>Cobro sugerido</span>
            <strong>{formatUsd(usage?.suggested_charge_usd)}</strong>
            <small>Incluye {usage?.markup_percent ?? 15}% de margen.</small>
          </article>
        </div>
      </section>
    </div>
  );
};

export default AccessEvidenceConfig;
