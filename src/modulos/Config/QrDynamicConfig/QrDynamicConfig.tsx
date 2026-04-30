"use client";

import React, { useState, useEffect } from "react";
import styles from "./QrDynamicConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import Input from "@/mk/components/forms/Input/Input";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Card } from "@/mk/components/ui/Card/Card";
import Br from "@/components/Detail/Br";
import Switch from "@/mk/components/forms/Switch/Switch";

// ============================================================================
// Types & Enums (matching backend QrEnvironmentEnum and QrDynamicModeEnum)
// ============================================================================

/**
 * QrEnvironmentEnum: 'S'=sandbox, 'P'=production
 */
export type QrEnvironment = "S" | "P";

/**
 * QrDynamicModeEnum: 0=disabled, 1=global, 2=own
 */
export enum QrDynamicMode {
  DISABLED = 0,
  GLOBAL = 1,
  PROPIO = 2,
}

export const QrEnvironmentLabels: Record<QrEnvironment, string> = {
  S: "Sandbox (Pruebas)",
  P: "Producción",
};

export const QrDynamicModeLabels: Record<QrDynamicMode, string> = {
  [QrDynamicMode.DISABLED]: "Manual (QR desactivado)",
  [QrDynamicMode.GLOBAL]: "Global (services del módulo)",
  [QrDynamicMode.PROPIO]: "Personalizado (credenciales propias)",
};

// ============================================================================
// API Response Types (matching GET /qr-dynamic/config)
// ============================================================================

interface QrConfigResponse {
  success: boolean;
  data: QrConfigData;
}

interface QrConfigData {
  // Module-level config
  module_environment: QrEnvironment;
  module_environment_label: string;
  module_is_sandbox: boolean;
  module_default_bank_code: string;
  // Client-specific config
  has_client_config: boolean;
  client_environment: QrEnvironment | null;
  client_environment_label: string | null;
  client_mode: QrDynamicMode | null;
  client_mode_label: string | null;
  client_is_dynamic_enabled: boolean;
  client_bank_id: number | null;
  client_has_credentials: boolean;
  client_webhook_username: string | null;
}

// ============================================================================
// Form State Types
// ============================================================================

interface QrDynamicFormState {
  // Config toggle
  is_active: boolean;
  // Environment: 'S' or 'P' (maps to sandbox/production)
  environment: QrEnvironment;
  // Mode: 0=disabled, 1=global, 2=own
  mode: QrDynamicMode;
  // Bank ID
  bank_id: number | null;
  // Credentials (sent only when provided)
  username: string;
  password: string;
  api_key: string;
  account_reference: string;
  // Webhook credentials
  webhook_username: string;
  webhook_password: string;
  // Flags indicating if credentials exist on backend
  has_username: boolean;
  has_api_key: boolean;
  has_webhook_username: boolean;
}

// ============================================================================
// Component
// ============================================================================

const QrDynamicConfig: React.FC = () => {
  const { showToast } = useAuth();
  const { execute, loaded } = useAxios();

  const [formState, setFormState] = useState<QrDynamicFormState>({
    is_active: false,
    environment: "S",
    mode: QrDynamicMode.DISABLED,
    bank_id: null,
    username: "",
    password: "",
    api_key: "",
    account_reference: "",
    webhook_username: "",
    webhook_password: "",
    has_username: false,
    has_api_key: false,
    has_webhook_username: false,
  });

  const [newPassword, setNewPassword] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [newWebhookPassword, setNewWebhookPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadQrConfig();
  }, []);

  const loadQrConfig = async () => {
    const res = await execute("/qr-dynamic/config", "GET");
    if (res?.success && res?.data) {
      const data = res.data;

      // Determine is_active from mode
      const mode = data.client_mode ?? QrDynamicMode.DISABLED;
      const is_active = mode !== QrDynamicMode.DISABLED;

      setFormState({
        // Toggle state derived from mode
        is_active,
        // Environment from client or module default
        environment: data.client_environment ?? data.module_environment,
        // Mode from client config
        mode,
        // Bank ID
        bank_id: data.client_bank_id,
        // Credentials - never sent back, always empty on load
        username: "",
        password: "",
        api_key: "",
        account_reference: "",
        webhook_username: "",
        webhook_password: "",
        // Flags from API
        has_username: data.client_has_credentials,
        has_api_key: data.client_has_credentials,
        has_webhook_username: !!data.client_webhook_username,
      });
    }
  };

  const handleChange = <K extends keyof QrDynamicFormState>(
    field: K,
    value: QrDynamicFormState[K],
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error when user changes field
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

    // Mode-specific validation
    if (formState.mode === QrDynamicMode.PROPIO) {
      // Username is required in PROPIO mode
      if (!formState.username && !formState.has_username) {
        newErrors.username = "El usuario es requerido";
      }

      // Password required if not already set
      if (!formState.has_username && !newPassword && !formState.password) {
        newErrors.password = "La contraseña es requerida";
      }

      if (newPassword && newPassword.length < 4) {
        newErrors.password = "La contraseña debe tener al menos 4 caracteres";
      }

      // Account reference required in PROPIO mode
      if (!formState.account_reference) {
        newErrors.account_reference = "La referencia de cuenta es requerida";
      }

      // API Key required if not already set
      if (!formState.has_api_key && !newApiKey && !formState.api_key) {
        newErrors.api_key = "La API Key es requerida";
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
      // Build payload matching PUT /qr-dynamic/config contract
      const payload: Record<string, unknown> = {
        environment: formState.environment,
        mode: formState.mode,
      };

      // Only include bank_id if set
      if (formState.bank_id) {
        payload.bank_id = formState.bank_id;
      }

      // Only include credentials if provided (new values)
      if (newPassword) {
        payload.password = newPassword;
      }

      if (newApiKey) {
        payload.api_key = newApiKey;
      }

      if (formState.username) {
        payload.username = formState.username;
      }

      if (formState.account_reference) {
        payload.account_reference = formState.account_reference;
      }

      if (formState.webhook_username) {
        payload.webhook_username = formState.webhook_username;
      }

      if (newWebhookPassword) {
        payload.webhook_password = newWebhookPassword;
      }

      const res = await execute("/qr-dynamic/config", "PUT", payload);

      if (res?.success) {
        showToast("Configuración guardada correctamente", "success");
        // Clear sensitive fields after save
        setNewPassword("");
        setNewApiKey("");
        setNewWebhookPassword("");
        loadQrConfig(); // Reload to update has_* flags
      } else {
        showToast(res?.message || "Error al guardar", "error");
      }
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Error al guardar configuración";
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Map internal environment values to Select options
  const environmentOptions = [
    { id: "S", name: QrEnvironmentLabels.S },
    { id: "P", name: QrEnvironmentLabels.P },
  ];

  // Map mode values to Select options
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
      id: QrDynamicMode.PROPIO,
      name: QrDynamicModeLabels[QrDynamicMode.PROPIO],
    },
  ];

  // Handle is_active toggle - maps to mode
  const handleIsActiveChange = (checked: boolean) => {
    const newMode = checked ? QrDynamicMode.PROPIO : QrDynamicMode.DISABLED;
    handleChange("mode", newMode);
    handleChange("is_active", checked);
  };

  // Handle mode change - sync is_active
  const handleModeChange = (newMode: QrDynamicMode) => {
    handleChange("mode", newMode);
    handleChange("is_active", newMode !== QrDynamicMode.DISABLED);
  };

  if (!loaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando configuración...</div>
      </div>
    );
  }

  const isOwnMode = formState.mode === QrDynamicMode.PROPIO;
  const isGlobalMode = formState.mode === QrDynamicMode.GLOBAL;

  return (
    <div className={styles.container}>
      <div>
        <h1 className={styles.mainTitle}>QR Dinámico</h1>
        <p className={styles.headerSubtitle}>
          Configura la conexión con el banco para generar códigos QR dinámicos
          de pago. Esta configuración aplica a todos los condominios que no
          tengan modo &quot;directo&quot; configurado.
        </p>
      </div>

      <div className={styles.formContainer}>
        {/* Estado */}
        <div className={styles.sectionContainer}>
          <Card>
            <div className={styles.toggleRow}>
              <div>
                <h3 className={styles.sectionTitle}>Activar QR Dinámico</h3>
                <p className={styles.sectionDescription}>
                  Habilita o deshabilita el módulo de QR dinámico para todo el
                  sistema
                </p>
              </div>
              <Switch
                name="is_active"
                value={formState.is_active ? "Y" : "N"}
                checked={formState.is_active}
                onChange={(e) => handleIsActiveChange(e.target.checked)}
              />
            </div>
          </Card>
        </div>

        <Br />

        {/* Modo */}
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Modo de Operación</h2>
          <p className={styles.sectionSubtitle}>
            Selecciona cómo obtener las credenciales: Global usa la
            configuración del módulo, Personalizado usa credenciales propias del
            cliente
          </p>
          <Select
            name="mode"
            label="Modo"
            value={formState.mode}
            onChange={(e) =>
              handleModeChange(Number(e.target.value) as QrDynamicMode)
            }
            options={modeOptions}
            error={errors}
          />
        </div>

        <Br />

        {/* Entorno */}
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Entorno</h2>
          <p className={styles.sectionSubtitle}>
            Selecciona el ambiente del banco: Sandbox para pruebas, Producción
            para operaciones reales
          </p>
          <Select
            name="environment"
            label="Ambiente del banco"
            value={formState.environment}
            onChange={(e) =>
              handleChange("environment", e.target.value as QrEnvironment)
            }
            options={environmentOptions}
            error={errors}
          />
        </div>

        <Br />

        {/* Credenciales - solo mostrar en modo personalizado */}
        {isOwnMode && (
          <>
            <div className={styles.sectionContainer}>
              <h2 className={styles.sectionTitle}>Credenciales del Banco</h2>
              <p className={styles.sectionSubtitle}>
                Ingresa las credenciales proporcionadas por el banco para la
                integración QR
              </p>

              <div className={styles.formGrid}>
                <Input
                  name="username"
                  label={
                    formState.has_username
                      ? "Usuario (dejar vacío para mantener)"
                      : "Usuario (Código de Cliente)"
                  }
                  value={formState.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  placeholder="Ej: 5052069"
                  error={errors.username}
                />

                <Input
                  name="password"
                  label={
                    formState.has_username
                      ? "Nueva Contraseña (dejar vacío para mantener)"
                      : "Contraseña"
                  }
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={
                    formState.has_username
                      ? "Ingresa solo si deseas cambiarla"
                      : "Contraseña del banco"
                  }
                  error={errors.password}
                />

                <Input
                  name="account_reference"
                  label="Referencia de Cuenta (Account Reference)"
                  value={formState.account_reference}
                  onChange={(e) =>
                    handleChange("account_reference", e.target.value)
                  }
                  placeholder="Ej: FORCE_TEST"
                  error={errors.account_reference}
                />

                <Input
                  name="api_key"
                  label={
                    formState.has_api_key
                      ? "API Key (dejar vacío para mantener)"
                      : "API Key del Banco"
                  }
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={
                    formState.has_api_key
                      ? "Ingresa solo si deseas cambiarla"
                      : "API Key del banco (Larga)"
                  }
                  error={errors.api_key}
                />
              </div>
            </div>

            <Br />
          </>
        )}

        {/* Info según entorno */}
        {formState.environment === "S" && (
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

        {formState.environment === "P" && (
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

        <div className={styles.saveButtonContainer}>
          <Button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QrDynamicConfig;
