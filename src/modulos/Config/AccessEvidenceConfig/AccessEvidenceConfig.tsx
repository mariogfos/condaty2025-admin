"use client";

import React, { useEffect, useMemo, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import Switch from "@/mk/components/forms/Switch/Switch";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import styles from "./AccessEvidenceConfig.module.css";

type PolicyState = {
  enabled: boolean;
  max_photos_per_access: number;
  max_photo_size_value: string;
  monthly_max_photo_count: string;
  monthly_storage_value: string;
  monthly_storage_unit: "MB" | "GB";
  retention_enabled: boolean;
  retention_value: string;
  retention_unit: "days" | "months";
  storage_ready: boolean;
};

const DEFAULT_POLICY: PolicyState = {
  enabled: false,
  max_photos_per_access: 3,
  max_photo_size_value: "",
  monthly_max_photo_count: "",
  monthly_storage_value: "",
  monthly_storage_unit: "MB",
  retention_enabled: false,
  retention_value: "",
  retention_unit: "days",
  storage_ready: false,
};

const MAX_PHOTO_SIZE_MB = 100;

const bytesToMegabytes = (bytes?: number | null) => {
  if (!bytes) return "";
  return String(Number((bytes / 1024 / 1024).toFixed(2)));
};

const policyToForm = (policy: any): PolicyState => ({
  enabled: Boolean(policy?.enabled),
  max_photos_per_access: Number(policy?.max_photos_per_access || 3),
  max_photo_size_value: bytesToMegabytes(policy?.max_photo_bytes),
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
  storage_ready: Boolean(policy?.storage_ready ?? policy?.delivery_ready),
});

const comparablePolicy = ({ storage_ready: _storageReady, ...policy }: PolicyState) =>
  policy;

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return "0 MB";
  const gb = bytes / 1024 / 1024 / 1024;
  return gb >= 1 ? `${gb.toFixed(2)} GB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const formatUsd = (value?: number | null) => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatMonth = (month?: number) => {
  if (!month || month < 1 || month > 12) return "—";

  return new Intl.DateTimeFormat("es-BO", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2024, month - 1, 1)));
};

const AccessEvidenceConfigContent = () => {
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
  const [initialForm, setInitialForm] = useState<PolicyState>(DEFAULT_POLICY);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const policy = policyResponse?.data;
  const usage = usageResponse?.data;
  const usagePeriods = Array.isArray(usage?.periods) ? usage.periods : [];

  useEffect(() => {
    if (policyResponse?.success) {
      const nextForm = policyToForm(policy);
      setForm(nextForm);
      setInitialForm(nextForm);
    }
  }, [policy, policyResponse?.success]);

  const monthlyMaxBytes = useMemo(() => {
    const value = Number(form.monthly_storage_value);
    if (!Number.isFinite(value) || value <= 0) return null;
    const multiplier = form.monthly_storage_unit === "GB" ? 1024 ** 3 : 1024 ** 2;
    return Math.round(value * multiplier);
  }, [form.monthly_storage_unit, form.monthly_storage_value]);

  const maxPhotoBytes = useMemo(() => {
    const value = Number(form.max_photo_size_value);
    if (!Number.isFinite(value) || value <= 0) return null;
    return Math.round(value * 1024 ** 2);
  }, [form.max_photo_size_value]);

  const retentionDays = useMemo(() => {
    const value = Number(form.retention_value);
    if (!Number.isFinite(value) || value <= 0) return null;
    return form.retention_unit === "months" ? Math.round(value * 30) : Math.round(value);
  }, [form.retention_unit, form.retention_value]);

  const isDirty = useMemo(
    () =>
      JSON.stringify(comparablePolicy(form)) !==
      JSON.stringify(comparablePolicy(initialForm)),
    [form, initialForm],
  );

  const updateField = (name: keyof PolicyState, value: any) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async () => {
    if (form.enabled && !form.storage_ready) {
      showToast(
        "No se puede habilitar la captura porque el almacenamiento de evidencias no está disponible en este entorno.",
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

    if (form.max_photo_size_value && !maxPhotoBytes) {
      showToast("El peso máximo por foto debe ser mayor que cero.", "error");
      return;
    }

    if (maxPhotoBytes && maxPhotoBytes > MAX_PHOTO_SIZE_MB * 1024 ** 2) {
      showToast(`El peso máximo por foto debe estar entre 1 y ${MAX_PHOTO_SIZE_MB} MB.`, "error");
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
      max_photo_bytes: maxPhotoBytes,
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

    const nextForm = policyToForm(data.data);
    setForm(nextForm);
    setInitialForm(nextForm);
    setEditMode(false);
    reloadPolicy();
    reloadUsage();
    showToast("Reglas de evidencia actualizadas", "success");
  };

  const discardChanges = () => {
    setForm(initialForm);
    setEditMode(false);
  };

  if (!policyLoaded || !usageLoaded) {
    return <div className={styles.loading}>Cargando reglas de evidencia…</div>;
  }

  return (
    <div className={styles.config}>
      <header className={styles.headerRow}>
        <div className={styles.headerContent}>
          <h1 className={styles.mainTitle}>Reglas de evidencia</h1>
          <p className={styles.mainSubtitle}>
            Define cuándo portería puede adjuntar fotos opcionales, sus límites y el tiempo de conservación.
          </p>
        </div>

        <div className={styles.headerAction}>
          <div className={styles.headerButtons}>
            {!editMode ? (
              <Button variant="secondary" className={styles.editButton} onClick={() => setEditMode(true)}>
                Editar
              </Button>
            ) : (
              <>
                <Button variant="secondary" className={styles.editButton} onClick={discardChanges}>
                  Descartar cambios
                </Button>
                <Button className={styles.saveButton} onClick={save} disabled={!isDirty || saving}>
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className={styles.rulesGrid}>
        {!form.storage_ready && (
          <aside className={styles.storageNotice}>
            El almacenamiento de evidencias no está disponible en este entorno. Puedes revisar esta regla, pero no
            podrás activar la captura por ahora.
          </aside>
        )}

        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <p className={styles.textTitle}>Captura en portería</p>
            <p className={styles.textSubtitle}>
              Las fotos son opcionales para el guardia y no reemplazan las fotos de carnet o placa existentes.
            </p>
          </div>

          <div className={styles.settingsStack}>
            <div className={styles.switchContainer}>
              <div className={styles.switchContent}>
                <p className={styles.textTitle}>Permitir evidencia de acceso</p>
                <p className={styles.textSubtitle}>
                  La aplicación de Guardias mostrará esta opción después de crear un acceso cuando esta regla esté
                  activa.
                </p>
              </div>
              <Switch
                name="enabled"
                value={form.enabled ? "Y" : "N"}
                onChange={({ target }: any) => updateField("enabled", target.value === "Y")}
                ariaLabel="Permitir evidencia de acceso"
                disabled={!editMode || !form.storage_ready}
              />
            </div>

          <div className={styles.formGrid}>
            <div className={styles.fieldWithHint}>
                <Input
                  type="number"
                  label="Máximo de fotos por ingreso o salida"
                  name="max_photos_per_access"
                  value={form.max_photos_per_access}
                  min={1}
                  max={10}
                  required={false}
                  disabled={!editMode || !form.enabled}
                  onChange={({ target }: any) => updateField("max_photos_per_access", target.value)}
                />
                <p className={styles.fieldHint}>
                  Define entre 1 y 10 fotos para cada ingreso y cada salida.
                </p>
              </div>
              <div className={styles.fieldWithHint}>
                <Input
                  type="number"
                  label="Peso máximo por foto (MB)"
                  name="max_photo_size_value"
                  value={form.max_photo_size_value}
                  min={1}
                  max={MAX_PHOTO_SIZE_MB}
                  placeholder="Ej.: 10"
                  required={false}
                  disabled={!editMode || !form.enabled}
                  onChange={({ target }: any) => updateField("max_photo_size_value", target.value)}
                />
                <p className={styles.fieldHint}>
                  Define entre 1 y {MAX_PHOTO_SIZE_MB} MB por foto.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <p className={styles.textTitle}>Cuota mensual</p>
            <p className={styles.textSubtitle}>
              Limita por cantidad de fotos, tamaño total o ambos. La medición se hace sobre fotos nuevas del mes.
            </p>
          </div>

          <div className={styles.quotaGrid}>
            <Input
              type="number"
              label="Máximo de fotos al mes"
              name="monthly_max_photo_count"
              value={form.monthly_max_photo_count}
              min={1}
              placeholder="Sin límite por cantidad"
              required={false}
              disabled={!editMode || !form.enabled}
              onChange={({ target }: any) => updateField("monthly_max_photo_count", target.value)}
            />
            <Input
              type="number"
              label="Almacenamiento mensual"
              name="monthly_storage_value"
              value={form.monthly_storage_value}
              min={1}
              placeholder="Sin límite por tamaño"
              required={false}
              disabled={!editMode || !form.enabled}
              onChange={({ target }: any) => updateField("monthly_storage_value", target.value)}
            />
            <Select
              label="Unidad"
              name="monthly_storage_unit"
              value={form.monthly_storage_unit}
              options={[
                { id: "MB", name: "MB" },
                { id: "GB", name: "GB" },
              ]}
              required={false}
              style={{ minWidth: 0 }}
              inputStyle={{ minWidth: 0 }}
              disabled={!editMode || !form.enabled}
              onChange={({ target }: any) => updateField("monthly_storage_unit", target.value)}
            />
          </div>
        </section>

        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <p className={styles.textTitle}>Conservación y eliminación</p>
            <p className={styles.textSubtitle}>
              Al vencer el plazo, las fotos se eliminan automáticamente.
            </p>
          </div>

          <div className={styles.settingsStack}>
            <div className={styles.switchContainer}>
              <div className={styles.switchContent}>
                <p className={styles.textTitle}>Borrado automático</p>
                <p className={styles.textSubtitle}>
                  Conserva las fotos durante un plazo definido y luego elimina únicamente la evidencia asociada.
                </p>
              </div>
              <Switch
                name="retention_enabled"
                value={form.retention_enabled ? "Y" : "N"}
                onChange={({ target }: any) => updateField("retention_enabled", target.value === "Y")}
                ariaLabel="Activar borrado automático"
                disabled={!editMode || !form.enabled}
              />
            </div>

            {form.retention_enabled && (
              <div className={styles.retentionRow}>
                <div className={styles.fieldPair}>
                  <Input
                    type="number"
                    label="Conservar durante"
                    name="retention_value"
                    value={form.retention_value}
                    min={1}
                    max={form.retention_unit === "months" ? 120 : 3650}
                    required={false}
                    disabled={!editMode || !form.enabled}
                    onChange={({ target }: any) => updateField("retention_value", target.value)}
                  />
                  <Select
                    label="Unidad"
                    name="retention_unit"
                    value={form.retention_unit}
                    options={[
                      { id: "days", name: "Días" },
                      { id: "months", name: "Meses" },
                    ]}
                    required={false}
                    disabled={!editMode || !form.enabled}
                    onChange={({ target }: any) => updateField("retention_unit", target.value)}
                  />
                </div>
                <p className={styles.fieldHint}>
                  Cada mes equivale a 30 días.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <p className={styles.textTitle}>Consumo de evidencia</p>
            <p className={styles.textSubtitle}>
              Uso del condominio por período. No representa una factura final.
            </p>
          </div>

          <div className={styles.usageTableWrap}>
            <table className={styles.usageTable}>
              <thead>
                <tr>
                  <th scope="col">Año</th>
                  <th scope="col">Mes</th>
                  <th scope="col">Fotos cargadas</th>
                  <th scope="col">Almacenamiento activo</th>
                  <th scope="col">Costo estimado</th>
                  <th scope="col">Cobro sugerido</th>
                </tr>
              </thead>
              <tbody>
                {usagePeriods.map((period: any) => (
                  <tr key={period.period}>
                    <td data-label="Año">{period.year}</td>
                    <td data-label="Mes">{formatMonth(period.month)}</td>
                    <td data-label="Fotos cargadas">
                      <strong>{period.uploaded_photo_count || 0}</strong>
                      <small>{formatBytes(period.uploaded_bytes)}</small>
                    </td>
                    <td data-label="Almacenamiento activo">
                      <strong>{formatBytes(period.active_bytes)}</strong>
                      <small>{period.active_photo_count || 0} fotos disponibles</small>
                    </td>
                    <td data-label="Costo estimado">{formatUsd(period.estimated_cost_usd)}</td>
                    <td data-label="Cobro sugerido">{formatUsd(period.suggested_charge_usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const AccessEvidenceConfig = () => {
  const { user } = useAuth();

  if (user?.type !== "ADM" || !user?.fosrole_id) {
    return <NotAccess />;
  }

  return <AccessEvidenceConfigContent />;
};

export default AccessEvidenceConfig;
