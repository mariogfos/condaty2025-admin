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

interface QrDynamicConfigData {
  id?: string;
  environment: string;
  is_active: boolean;
  user_name: string | null;
  password: string;
  api_key: string;
  account_reference: string | null;
  has_password: boolean;
  has_api_key: boolean;
}

const QrDynamicConfig: React.FC = () => {
  const { showToast } = useAuth();
  const { execute, data: configData, loaded } = useAxios();
  // const { execute: saveConfig } = useAxios();

  const [formState, setFormState] = useState<QrDynamicConfigData>({
    environment: "sandbox",
    is_active: false,
    user_name: null,
    password: "",
    api_key: "",
    has_password: false,
    has_api_key: false,
    account_reference: null,
  });

  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadQrConfig();
  }, []);

  const loadQrConfig = async () => {
    const res = await execute("/qr-dynamic/config", "GET");
    if (res?.success && res?.data) {
      setFormState({
        id: res.data.id,
        environment: res.data.environment,
        is_active: res.data.is_active,
        user_name: res.data.user_name,
        password: "", // Nunca se devuelve, se deja vacío
        api_key: res.data.api_key || "",
        has_password: res.data.has_password || false,
        has_api_key: res.data.has_api_key || false,
        account_reference: res.data.account_reference,
      });
    }
  };

  const handleChange = (field: keyof QrDynamicConfigData, value: any) => {
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

    if (!formState.environment) {
      newErrors.environment = "El entorno es requerido";
    }

    if (!formState.user_name) {
      newErrors.user_name = "El usuario es requerido";
    }

    // Si no tiene password configurado o si está cambiando el password
    if (!formState.has_password && !password) {
      newErrors.password = "La contraseña es requerida";
    }

    if (password && password.length < 4) {
      newErrors.password = "La contraseña debe tener al menos 4 caracteres";
    }

    if (!formState.account_reference) {
      newErrors.account_reference = "La referencia de cuenta es requerida";
    }

    // API Key es requerida si no tiene una guardada
    if (!formState.has_api_key && !formState.api_key) {
      newErrors.api_key = "La API Key es requerida";
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
      const payload: any = {
        environment: formState.environment,
        is_active: formState.is_active,
        user_name: formState.user_name,
        account_reference: formState.account_reference,
      };

      // Solo enviar password si se especificó uno nuevo
      if (password) {
        payload.password = password;
      }

      // Solo enviar api_key si se especificó una nueva
      if (formState.api_key) {
        payload.api_key = formState.api_key;
      }

      const res = await execute("/qr-dynamic/config", "PUT", payload);

      if (res?.success) {
        showToast("Configuración guardada correctamente", "success");
        setPassword(""); // Limpiar password después de guardar
        handleChange("api_key", ""); // Limpiar API key después de guardar
        loadQrConfig(); // Recargar para actualizar has_password y has_api_key
      } else {
        showToast(res?.message || "Error al guardar", "error");
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Error al guardar configuración";
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const environmentOptions = [
    { id: "sandbox", name: "Sandbox (Pruebas)" },
    { id: "production", name: "Producción" },
  ];

  if (!loaded) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando configuración...</div>
      </div>
    );
  }

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
                // label="Activar QR Dinámico"
                name="is_active"
                value={formState.is_active ? "Y" : "N"}
                checked={formState.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
              />
              {/* <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={formState.is_active}
                  onChange={(e) =>
                    handleChange("is_active", e.target.checked)
                  }
                />
                <span className={styles.toggleSlider}></span>
              </label> */}
            </div>
          </Card>
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
            onChange={(e) => handleChange("environment", e.target.value)}
            options={environmentOptions}
            error={errors}
          />
        </div>

        <Br />

        {/* Credenciales */}
        <div className={styles.sectionContainer}>
          <h2 className={styles.sectionTitle}>Credenciales del Banco</h2>
          <p className={styles.sectionSubtitle}>
            Ingresa las credenciales proporcionadas por el banco para la
            integración QR
          </p>

          <div className={styles.formGrid}>
            <Input
              name="user_name"
              label="Usuario (Código de Cliente)"
              value={formState.user_name || ""}
              onChange={(e) => handleChange("user_name", e.target.value)}
              placeholder="Ej: 5052069"
              error={errors.user_name}
            />

            <Input
              name="password"
              label={
                formState.has_password
                  ? "Nueva Contraseña (dejar vacío para mantener)"
                  : "Contraseña"
              }
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                formState.has_password
                  ? "Ingresa solo si deseas cambiarla"
                  : "Contraseña del banco"
              }
              error={errors.password}
            />

            <Input
              name="account_reference"
              label="Referencia de Cuenta (Account Reference)"
              value={formState.account_reference || ""}
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
              value={formState.api_key}
              onChange={(e) => handleChange("api_key", e.target.value)}
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

        {/* Sandbox Info */}
        {formState.environment === "sandbox" && (
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

        {formState.environment === "production" && (
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
