"use client";

import React, { useEffect, useMemo, useState } from "react";
import styles from "./QrDynamicConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import Input from "@/mk/components/forms/Input/Input";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Card } from "@/mk/components/ui/Card/Card";
import Br from "@/components/Detail/Br";
import Switch from "@/mk/components/forms/Switch/Switch";
import { QR_ENVIRONMENT_LABEL, QrDynamicMode, QrEnvironment } from "../types";

// ============================================================================
// Types & Enums
// ============================================================================

export const QrDynamicModeLabels: Record<QrDynamicMode, string> = {
  [QrDynamicMode.DISABLED]: "Manual (QR desactivado)",
  [QrDynamicMode.GLOBAL]: "Global (services del módulo)",
  [QrDynamicMode.OWN]: "Personalizado (credenciales propias)",
};

interface BankOption {
  id: string;
  bank_code: string;
  bank_name: string;
  is_active: boolean;
}

interface QrDynamicFormState {
  qr_dynamic_environment: QrEnvironment;
  qr_dynamic_mode: QrDynamicMode;
  qr_dynamic_bank_id: string | null;
  qr_dynamic_api_key: string;
  qr_dynamic_username: string;
  qr_dynamic_password: string;
  qr_dynamic_account_reference: string;
  qr_dynamic_api_key_sandbox: string;
  qr_dynamic_username_sandbox: string;
  qr_dynamic_password_sandbox: string;
  qr_dynamic_account_reference_sandbox: string;
}

const getComparableQrState = (state: QrDynamicFormState) => ({
  ...state,
  qr_dynamic_username: state.qr_dynamic_username || "",
  qr_dynamic_account_reference: state.qr_dynamic_account_reference || "",
  password: "",
  api_key: "",
});

interface QrDynamicConfigProps {
  client_config?: any;
  onSave: (formState: any) => Promise<void>;
  availableBanks: BankOption[];
}

// ============================================================================
// Component
// ============================================================================

const QrDynamicConfig: React.FC<QrDynamicConfigProps> = ({
  client_config,
  onSave,
  availableBanks,
}) => {
  const { showToast } = useAuth();

  const [formState, setFormState] = useState<QrDynamicFormState>({
    qr_dynamic_environment: QrEnvironment.SANDBOX,
    qr_dynamic_mode: QrDynamicMode.DISABLED,
    qr_dynamic_bank_id: null,
    qr_dynamic_api_key: "",
    qr_dynamic_username: "",
    qr_dynamic_password: "",
    qr_dynamic_account_reference: "",
    // Sandbox - credenciales para testing
    qr_dynamic_api_key_sandbox: "",
    qr_dynamic_username_sandbox: "",
    qr_dynamic_password_sandbox: "",
    qr_dynamic_account_reference_sandbox: "",
    // is_active: false,
    // environment: "S",
    // mode: QrDynamicMode.DISABLED,
    // bank_id: null,
    // username: "",
    // usernameandbox: "",
    // password: "",
    // passwordSandbox: "",
    // api_key: "",
    // api_keySandbox: "",
    // account_reference: "",
    // account_referenceSandbox: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [initialSnapshot, setInitialSnapshot] =
    useState<QrDynamicFormState | null>(null);

  const isDirty = useMemo(() => {
    if (!initialSnapshot) return false;
    return (
      JSON.stringify(getComparableQrState(formState)) !==
        JSON.stringify(getComparableQrState(initialSnapshot)) ||
      Boolean(newPassword || newApiKey)
    );
  }, [formState, initialSnapshot, newApiKey, newPassword]);

  // Load and map from client_config props when it changes
  useEffect(() => {
    if (client_config) {
      const mode = client_config.qr_dynamic_mode ?? QrDynamicMode.DISABLED;
      const nextState: QrDynamicFormState = {
        qr_dynamic_environment:
          client_config.qr_dynamic_environment ?? QrEnvironment.SANDBOX,
        qr_dynamic_mode: mode,
        qr_dynamic_bank_id: client_config.qr_dynamic_bank_id
          ? String(client_config.qr_dynamic_bank_id)
          : null,
        qr_dynamic_username: client_config.qr_dynamic_username_active ?? "",
        qr_dynamic_password: "",
        qr_dynamic_api_key: "",
        qr_dynamic_account_reference:
          client_config.qr_dynamic_account_reference_active ?? "",
        qr_dynamic_api_key_sandbox: "",
        qr_dynamic_username_sandbox: "",
        qr_dynamic_password_sandbox: "",
        qr_dynamic_account_reference_sandbox: "",
      };

      setFormState(nextState);
      setInitialSnapshot(nextState);
      setErrors({});
      setNewPassword("");
      setNewApiKey("");
      setEditMode(false);
    }
  }, [client_config]);

  const handleChange = <K extends keyof QrDynamicFormState>(
    field: K,
    value: QrDynamicFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formState.qr_dynamic_mode === QrDynamicMode.OWN) {
      if (!formState.qr_dynamic_username) {
        newErrors.qr_dynamic_username = "El usuario es requerido";
      }
      if (!formState.qr_dynamic_password) {
        newErrors.qr_dynamic_password = "La contraseña es requerida";
      }
      if (!formState.qr_dynamic_account_reference) {
        newErrors.qr_dynamic_account_reference =
          "La referencia de cuenta es requerida";
      }
      if (!formState.qr_dynamic_api_key) {
        newErrors.qr_dynamic_api_key = "La API Key es requerida";
      }

      if (!formState.qr_dynamic_username_sandbox) {
        newErrors.qr_dynamic_username_sandbox = "El usuario es requerido";
      }
      if (!formState.qr_dynamic_password_sandbox) {
        newErrors.qr_dynamic_password_sandbox = "La contraseña es requerida";
      }
      if (!formState.qr_dynamic_account_reference_sandbox) {
        newErrors.qr_dynamic_account_reference_sandbox =
          "La referencia de cuenta es requerida";
      }
      if (!formState.qr_dynamic_api_key_sandbox) {
        newErrors.qr_dynamic_api_key_sandbox = "La API Key es requerida";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      showToast("Por favor completa los campos requeridos", "error");
      return;
    }

    setIsSaving(true);

    try {
      const payload: Record<string, unknown> = {
        qr_dynamic_environment: formState.qr_dynamic_environment,
        qr_dynamic_mode: formState.qr_dynamic_mode,
      };

      if (formState.qr_dynamic_bank_id) {
        payload.qr_dynamic_bank_id = formState.qr_dynamic_bank_id;
      }

      if (newPassword) {
        payload.qr_dynamic_password = newPassword;
      }

      if (newApiKey) {
        payload.qr_dynamic_api_key = newApiKey;
      }

      if (formState.qr_dynamic_username) {
        payload.qr_dynamic_username = formState.qr_dynamic_username;
      }

      if (formState.qr_dynamic_account_reference) {
        payload.qr_dynamic_account_reference =
          formState.qr_dynamic_account_reference;
      }

      await onSave(payload);
      setNewPassword("");
      setNewApiKey("");
      setEditMode(false);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const environmentOptions = [
    {
      id: QrEnvironment.SANDBOX,
      name: QR_ENVIRONMENT_LABEL[QrEnvironment.SANDBOX],
    },
    {
      id: QrEnvironment.PRODUCTION,
      name: QR_ENVIRONMENT_LABEL[QrEnvironment.PRODUCTION],
    },
  ];

  const modeOptions = [
    {
      id: QrDynamicMode.DISABLED,
      name: QrDynamicModeLabels[QrDynamicMode.DISABLED],
    },
    {
      id: QrDynamicMode.GLOBAL,
      name: QrDynamicModeLabels[QrDynamicMode.GLOBAL],
    },
    {
      id: QrDynamicMode.OWN,
      name: QrDynamicModeLabels[QrDynamicMode.OWN],
    },
  ];

  const handleIsActiveChange = (checked: boolean) => {
    const newMode = checked ? QrDynamicMode.GLOBAL : QrDynamicMode.DISABLED;
    handleChange("qr_dynamic_mode", newMode);
  };

  const handleModeChange = (newMode: QrDynamicMode) => {
    handleChange("qr_dynamic_mode", newMode);
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleDiscardChanges = () => {
    if (initialSnapshot && isDirty) {
      setFormState(initialSnapshot);
    }
    setNewPassword("");
    setNewApiKey("");
    setErrors({});
    setEditMode(false);
  };

  const isOwnMode = formState.qr_dynamic_mode === QrDynamicMode.OWN;
  const isGlobalMode = formState.qr_dynamic_mode === QrDynamicMode.GLOBAL;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.headerBlock}>
          <h1 className={styles.mainTitle}>QR Dinámico</h1>
          <p className={styles.headerSubtitle}>
            Configura la conexión con el banco para generar códigos QR dinámicos
            de pago. Esta configuración aplica a todos los condominios que no
            tengan modo &quot;directo&quot; configurado.
          </p>
        </div>

        <div className={styles.headerButtons}>
          {!editMode ? (
            <Button
              variant="secondary"
              className={styles.editButton}
              onClick={handleEditClick}
            >
              Editar
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                className={styles.editButton}
                onClick={handleDiscardChanges}
              >
                Descartar cambios
              </Button>
              <Button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={styles.formContainer}>
        {/* Estado */}
        <div className={styles.sectionContainer}>
          <Card className={styles.surfaceCard}>
            <div className={styles.toggleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Activar QR Dinámico</h3>
                <p className={styles.sectionDescription}>
                  Habilita o deshabilita el módulo de QR dinámico para todo el
                  sistema
                </p>
              </div>
              <Switch
                name="qr_dynamic_is_active"
                value={formState.qr_dynamic_mode > 0 ? "Y" : "N"}
                checked={formState.qr_dynamic_mode > 0}
                onChange={(e) => handleIsActiveChange(e.target.checked)}
                disabled={!editMode}
              />
            </div>
          </Card>
        </div>

        <Br />

        {/* Modo */}
        <div className={styles.sectionContainer}>
          <div className={styles.surfaceCard}>
            <h2 className={styles.sectionTitle}>Modo de Operación</h2>
            <p className={styles.sectionSubtitle}>
              Selecciona cómo obtener las credenciales: Global usa la
              configuración del módulo, Personalizado usa credenciales propias
              del cliente
            </p>
            <Select
              name="qr_dynamic_mode"
              label="Modo"
              value={formState.qr_dynamic_mode}
              onChange={(e) =>
                handleModeChange(e.target.value as QrDynamicMode)
              }
              options={modeOptions}
              error={errors}
              disabled={!editMode}
            />
          </div>
        </div>

        <Br />

        {/* Entorno */}
        <div className={styles.sectionContainer}>
          <div className={styles.surfaceCard}>
            <h2 className={styles.sectionTitle}>Entorno</h2>
            <p className={styles.sectionSubtitle}>
              Selecciona el ambiente del banco: Sandbox para pruebas, Producción
              para operaciones reales
            </p>
            <Select
              name="qr_dynamic_environment"
              label="Ambiente del banco"
              value={formState.qr_dynamic_environment}
              onChange={(e) =>
                handleChange(
                  "qr_dynamic_environment",
                  e.target.value as QrEnvironment,
                )
              }
              options={environmentOptions}
              error={errors}
              disabled={!editMode}
            />
          </div>
        </div>

        <Br />

        {/* Credenciales - solo mostrar en modo personalizado */}
        {isOwnMode && (
          <>
            <div className={styles.sectionContainer}>
              <div className={styles.surfaceCard}>
                <h2 className={styles.sectionTitle}>Credenciales del Banco</h2>
                <p className={styles.sectionSubtitle}>
                  Ingresa las credenciales proporcionadas por el banco para la
                  integración QR
                </p>

                <div className={styles.formGrid}>
                  {availableBanks.length > 0 && (
                    <Select
                      name="bank_id"
                      label="Banco"
                      value={formState.qr_dynamic_bank_id || ""}
                      onChange={(e) =>
                        handleChange(
                          "qr_dynamic_bank_id",
                          e.target.value || null,
                        )
                      }
                      options={availableBanks.map((bank) => ({
                        id: bank.id,
                        name: bank.bank_name,
                      }))}
                      error={errors}
                      disabled={!editMode}
                    />
                  )}

                  <Input
                    name="qr_dynamic_username"
                    label="Usuario (Código de Cliente)"
                    value={formState.qr_dynamic_username}
                    onChange={(e) =>
                      handleChange("qr_dynamic_username", e.target.value)
                    }
                    placeholder="Ej: 5052069"
                    error={errors}
                    disabled={!editMode}
                  />

                  <Input
                    name="password"
                    label={"Contraseña"}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={"Contraseña del banco"}
                    error={errors}
                    disabled={!editMode}
                  />

                  <Input
                    name="qr_dynamic_account_reference"
                    label="Referencia de Cuenta (Account Reference)"
                    value={formState.qr_dynamic_account_reference}
                    onChange={(e) =>
                      handleChange(
                        "qr_dynamic_account_reference",
                        e.target.value,
                      )
                    }
                    placeholder="Ej: FORCE_TEST"
                    error={errors}
                    disabled={!editMode}
                  />

                  <Input
                    name="qr_dynamic_api_key"
                    label={"API Key del Banco"}
                    type="password"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    placeholder={"API Key del banco"}
                    error={errors}
                    disabled={!editMode}
                  />
                </div>
              </div>
            </div>

            <Br />
          </>
        )}

        {/* Info según entorno */}
        {formState.qr_dynamic_environment === QrEnvironment.SANDBOX && (
          <div className={styles.sectionContainer}>
            <Card style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
              <h3 className={styles.infoTitle}>Modo Sandbox Activo</h3>
              <p className={styles.infoText}>
                Estás usando el entorno de pruebas del banco. Los pagos no son
                reales y no se procesarán. Usa las credenciales de sandbox
                proporcionadas por el banco.
              </p>
            </Card>
          </div>
        )}

        {formState.qr_dynamic_environment === QrEnvironment.PRODUCTION && (
          <div className={styles.sectionContainer}>
            <Card style={{ backgroundColor: "rgba(0, 227, 140, 0.1)" }}>
              <h3 className={styles.infoTitle}>Modo Producción</h3>
              <p className={styles.infoText}>
                Los pagos se procesarán con dinero real. Asegúrate de que las
                credenciales sean correctas antes de continuar.
              </p>
            </Card>
          </div>
        )}

        {/* Info según modo */}
        {isGlobalMode && (
          <div className={styles.sectionContainer}>
            <Card style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}>
              <h3 className={styles.infoTitle}>Modo Global</h3>
              <p className={styles.infoText}>
                Se usarán las credenciales globales configuradas en el módulo.
                No necesitas ingresar credenciales propias.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default QrDynamicConfig;
