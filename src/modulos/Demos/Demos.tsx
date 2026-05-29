"use client";

import React, { useState, useEffect } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import Switch from "@/mk/components/forms/Switch/Switch";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2,
  Users,
  Key,
  Trash2,
  Play,
  Sparkles,
  FileText,
  DollarSign,
  ShieldAlert,
  Mail,
  ArrowRight,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import styles from "./Demos.module.css";

interface DemoSummary {
  client?: number;
  role?: number;
  user?: number;
  client_user?: number;
  owner?: number;
  client_owner?: number;
  guard?: number;
  client_guard?: number;
  dpto?: number;
  dpto_owner?: number;
  debt?: number;
  debt_dpto?: number;
  payment?: number;
  payment_detail?: number;
  expense?: number;
  visit?: number;
  access?: number;
  [key: string]: number | undefined;
}

interface DemoItem {
  id: string;
  client_id: string;
  client_name: string;
  config: any;
  summary: DemoSummary;
  ci_prefix: string;
  creator_name: string;
  created_at: string;
}

const DemosModule = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [showWizard, setShowWizard] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientType: "C", // C=Condominio, E=Edificio
    ciPrefix: "", // 3 dígitos
    numUsers: 2,
    numHomeowners: 5,
    numOwners: 10,
    numDependents: 4,
    numGuards: 3,
    createExtraRoles: true,
    numDptos: 15,
    dptoType: "Casa",
    debtPeriods: "2026-04:1,2026-05:1",
    numPayments: 8,
    expensePeriods: "2026-04:2,2026-05:2",
    accessPeriods: "2026-05:10",
    emailMode: "fake", // alias | fake
    emailBase: "",
  });

  const { showToast } = useAuth();

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [generating, setGenerating] = useState(false);
  const [generationSuccess, setGenerationSuccess] = useState(false);
  const [lastGeneratedDemo, setLastGeneratedDemo] = useState<DemoItem | null>(
    null,
  );

  // Estado del polling de progreso
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStep, setProgressStep] = useState("Iniciando...");
  const [pollingDemoId, setPollingDemoId] = useState<string | null>(null);
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<DemoItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Limpiar polling al desmontar
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  /**
   * Extrae el mensaje de error de las posibles estructuras que devuelve el API:
   * - 422 Validación: { message, errors: { field: [msgs] } }
   * - 500 Excepción: { success: false, message, error: "detalle técnico" }
   * - Error de red / desconocido: error.message
   */
  const extractApiError = (error: any, data: any): string => {
    // Error de red o timeout
    if (!error && !data) return "Error de conexión con el servidor.";

    // Intentar leer el cuerpo de la respuesta del API
    const body = error?.data ?? data;

    if (body) {
      // 422: errors por campo
      if (body.errors && typeof body.errors === "object") {
        const fieldErrors = Object.values(body.errors).flat() as string[];
        return fieldErrors[0] ?? body.message ?? "Error de validación.";
      }
      // 500: message + detalle técnico en error
      if (body.message) {
        return body.error ? `${body.message}\n${body.error}` : body.message;
      }
    }

    // Fallback: mensaje del objeto error de useAxios
    return error?.message ?? "Ocurrió un error inesperado.";
  };

  // Hook useAxios para peticiones del API
  const {
    data: demosResponse,
    reLoad: reLoadDemos,
    loaded,
  } = useAxios("/demos", "GET", {});
  const { execute: generateDemoApi } = useAxios();
  const { execute: pollProgressApi } = useAxios();
  const { execute: deleteDemoApi } = useAxios();

  const demosList: DemoItem[] = demosResponse?.data ?? [];

  // Validaciones del Formulario paso por paso
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.clientName.trim()) {
        errors.clientName = "El nombre del condominio es obligatorio.";
      } else if (formData.clientName.length < 3) {
        errors.clientName = "Debe tener al menos 3 caracteres.";
      }
    }

    if (step === 2) {
      if (!formData.ciPrefix.trim()) {
        errors.ciPrefix = "El prefijo CI es obligatorio.";
      } else if (!/^\d{3}$/.test(formData.ciPrefix)) {
        errors.ciPrefix = "Debe ser exactamente un número de 3 dígitos.";
      }

      if (formData.emailMode === "alias") {
        if (!formData.emailBase.trim()) {
          errors.emailBase = "El correo base es obligatorio para modo alias.";
        } else if (!/\S+@\S+\.\S+/.test(formData.emailBase)) {
          errors.emailBase = "Formato de correo electrónico inválido.";
        }
      }
    }

    if (step === 3) {
      if (formData.numUsers < 1 || formData.numUsers > 20) {
        errors.numUsers = "La cantidad de administradores debe estar entre 1 y 20.";
      }
      if (formData.numHomeowners < 0 || formData.numHomeowners > 5000) {
        errors.numHomeowners = "La cantidad de propietarios debe estar entre 0 y 5000.";
      }
      if (formData.numOwners < 0 || formData.numOwners > 5000) {
        errors.numOwners = "La cantidad de residentes debe estar entre 0 y 5000.";
      }
      if (formData.numDependents < 0 || formData.numDependents > 5000) {
        errors.numDependents = "La cantidad de dependientes debe estar entre 0 y 5000.";
      }
      if (formData.numGuards < 0 || formData.numGuards > 100) {
        errors.numGuards = "La cantidad de guardias debe estar entre 0 y 100.";
      }
    }

    if (step === 4) {
      if (formData.numDptos < 1 || formData.numDptos > 5000) {
        errors.numDptos = "La cantidad de unidades debe estar entre 1 y 5000.";
      }
    }

    if (step === 5) {
      if (formData.debtPeriods.trim()) {
        const periods = formData.debtPeriods.split(",");
        for (const p of periods) {
          const trimmed = p.trim();
          if (!trimmed) continue;
          
          const regex = /^(\d{4})-(\d{2}):(\d+)$/;
          const match = trimmed.match(regex);
          if (!match) {
            errors.debtPeriods = "Formato inválido. Debe ser AAAA-MM:pagados (ej: 2026-04:300) separados por comas.";
            break;
          }
          
          const month = parseInt(match[2]);
          if (month < 1 || month > 12) {
            errors.debtPeriods = "El mes del periodo debe estar entre 01 y 12.";
            break;
          }
          
          const paidCount = parseInt(match[3]);
          if (paidCount > formData.numDptos) {
            errors.debtPeriods = `La cantidad de pagos (${paidCount}) no puede superar a la cantidad de unidades (${formData.numDptos}).`;
            break;
          }
        }
      }

      if (formData.expensePeriods.trim()) {
        const periods = formData.expensePeriods.split(",");
        for (const p of periods) {
          const trimmed = p.trim();
          if (!trimmed) continue;
          
          const regex = /^(\d{4})-(\d{2}):(\d+)$/;
          const match = trimmed.match(regex);
          if (!match) {
            errors.expensePeriods = "Formato inválido. Debe ser AAAA-MM:egresos (ej: 2026-04:5) separados por comas.";
            break;
          }
          
          const month = parseInt(match[2]);
          if (month < 1 || month > 12) {
            errors.expensePeriods = "El mes del periodo debe estar entre 01 y 12.";
            break;
          }
        }
      }
    }

    if (step === 6) {
      if (formData.accessPeriods.trim()) {
        const periods = formData.accessPeriods.split(",");
        for (const p of periods) {
          const trimmed = p.trim();
          if (!trimmed) continue;
          
          const regex = /^(\d{4})-(\d{2}):(\d+)$/;
          const match = trimmed.match(regex);
          if (!match) {
            errors.accessPeriods = "Formato inválido. Debe ser AAAA-MM:cantidad (ej: 2026-05:10) separados por comas.";
            break;
          }
          
          const month = parseInt(match[2]);
          if (month < 1 || month > 12) {
            errors.accessPeriods = "El mes del periodo debe estar entre 01 y 12.";
            break;
          }
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleChange = (name: string, value: any) => {
    if (name === "debtPeriods") {
      const parts = value.split(',');
      let sumPayments = 0;
      parts.forEach((p: string) => {
        const colonPart = p.split(':');
        if (colonPart[1]) {
          sumPayments += parseInt(colonPart[1]) || 0;
        }
      });
      setFormData((prev) => ({ ...prev, debtPeriods: value, numPayments: sumPayments }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  // Enviar formulario y arrancar polling de progreso
  const handleGenerate = async () => {
    if (!validateStep(6)) {
      return;
    }
    setGenerating(true);
    setValidationErrors({});

    try {
      const { data, error } = await generateDemoApi("/demos", "POST", formData);

      if (data && data.success && data.data?.id) {
        const demoId = data.data.id;
        setPollingDemoId(demoId);
        setProgressPercent(0);
        setProgressStep("En cola, esperando worker...");
        setProgressVisible(true);
        setGenerating(false);

        // Arrancar polling cada 2 segundos
        pollingRef.current = setInterval(async () => {
          try {
            const { data: pollData } = await pollProgressApi(
              `/demos/${demoId}/progress`,
              "GET",
            );

            if (!pollData) return;

            setProgressPercent(pollData.progress ?? 0);
            setProgressStep(pollData.step ?? "Procesando...");

            if (pollData.status === "done") {
              clearInterval(pollingRef.current!);
              pollingRef.current = null;
              setProgressVisible(false);
              setLastGeneratedDemo(pollData.data);
              setGenerationSuccess(true);
              reLoadDemos();
              showToast("¡Demo generado correctamente!", "success");
            } else if (pollData.status === "failed") {
              clearInterval(pollingRef.current!);
              pollingRef.current = null;
              setProgressVisible(false);
              showToast(
                pollData.error ?? "El job de generación falló.",
                "error",
              );
            }
          } catch {
            // Ignorar errores de red transitorios durante polling
          }
        }, 2000);

      } else {
        showToast(extractApiError(error, data), "error");
        setGenerating(false);
      }
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || e?.message || "Error inesperado.",
        "error",
      );
      setGenerating(false);
    }
  };

  // Confirmar y procesar eliminación de demo histórica
  const handleDeleteDemo = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmText.toLowerCase() !== "eliminar") {
      showToast("Escribí ELIMINAR para confirmar la acción.", "warning");
      return;
    }

    setDeleting(true);
    try {
      const { data, error } = await deleteDemoApi(
        `/demos/${deleteTarget.id}`,
        "DELETE",
      );
      if (data && data.success) {
        setDeleteTarget(null);
        setDeleteConfirmText("");
        reLoadDemos();
        showToast("Demo eliminado correctamente.", "success");
      } else {
        showToast(extractApiError(error, data), "error");
      }
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || e?.message || "Error inesperado.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: "",
      clientType: "C",
      ciPrefix: "",
      numUsers: 2,
      numHomeowners: 5,
      numOwners: 10,
      numDependents: 4,
      numGuards: 3,
      createExtraRoles: true,
      numDptos: 15,
      dptoType: "Casa",
      debtPeriods: "2026-04:1,2026-05:1",
      numPayments: 8,
      expensePeriods: "2026-04:2,2026-05:2",
      accessPeriods: "2026-05:10",
      emailMode: "fake",
      emailBase: "",
    });
    setActiveStep(1);
    setShowWizard(false);
    setGenerationSuccess(false);
    setLastGeneratedDemo(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Generador de Demostración</h1>
          <p className={styles.subtitle}>
            Módulo administrativo para aprovisionamiento seguro de condominios
            demo y personas.
          </p>
        </div>
        {!showWizard && (
          <Button
            onClick={() => setShowWizard(true)}
            className={styles.createBtn}
          >
            <Sparkles size={20} className={styles.iconMargin} />
            Crear Nuevo Demo
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showWizard ? (
          <motion.div
            key="wizard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={styles.glassCard}
          >
            {/* Wizard progress bar */}
            <div className={styles.stepsIndicator}>
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`${styles.stepBubble} ${activeStep >= step ? styles.stepActive : ""} ${activeStep === step ? styles.stepCurrent : ""}`}
                >
                  {step}
                </div>
              ))}
            </div>

            {/* Wizard Steps content */}
            <div className={styles.wizardContent}>
              {activeStep === 1 && (
                <div className={styles.stepPane}>
                  <Building2 size={40} className={styles.stepIcon} />
                  <h2>Paso 1: Datos del Condominio</h2>
                  <p>
                    Define la configuración inicial del condominio o edificio de
                    prueba.
                  </p>

                  <div className={styles.formGroup}>
                    <Input
                      name="clientName"
                      label="Nombre del Condominio"
                      placeholder="Ej. Condominio Jardines del Sol"
                      value={formData.clientName}
                      onChange={(e: any) =>
                        handleChange("clientName", e.target.value)
                      }
                      error={validationErrors.clientName}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <Select
                      name="clientType"
                      label="Tipo de Propiedad"
                      value={formData.clientType}
                      onChange={(e: any) =>
                        handleChange("clientType", e.target.value)
                      }
                      options={[
                        { id: "C", name: "C - Condominio Horizontal" },
                        { id: "E", name: "E - Edificio Vertical" },
                      ]}
                      required
                    />
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className={styles.stepPane}>
                  <Key size={40} className={styles.stepIcon} />
                  <h2>Paso 2: Aislamiento & Correos</h2>
                  <p>
                    Configura las claves de rastreo y formatos de correo para
                    silenciar y aislar las notificaciones del demo.
                  </p>

                  <div className={styles.formGroup}>
                    <Input
                      name="ciPrefix"
                      label="Prefijo numérico CI (3 dígitos)"
                      placeholder="Ej. 777"
                      maxLength={3}
                      value={formData.ciPrefix}
                      onChange={(e: any) =>
                        handleChange("ciPrefix", e.target.value)
                      }
                      error={validationErrors.ciPrefix}
                      required
                    />
                    <small className={styles.helpText}>
                      Se prependerá al CI de todos los residentes creados para
                      visualización clara.
                    </small>
                  </div>

                  <div className={styles.formGroup}>
                    <Select
                      name="emailMode"
                      label="Modalidad de Correos"
                      value={formData.emailMode}
                      onChange={(e: any) =>
                        handleChange("emailMode", e.target.value)
                      }
                      options={[
                        {
                          id: "fake",
                          name: "Correos ficticios auto-generados",
                        },
                        {
                          id: "alias",
                          name: "Alias dinámico (+alias) sobre correo real",
                        },
                      ]}
                      required
                    />
                  </div>

                  {formData.emailMode === "alias" && (
                    <div className={styles.formGroup}>
                      <Input
                        name="emailBase"
                        label="Correo Base para Alias"
                        placeholder="Ej. mi-admin@condaty.com"
                        type="email"
                        value={formData.emailBase}
                        onChange={(e: any) =>
                          handleChange("emailBase", e.target.value)
                        }
                        error={validationErrors.emailBase}
                        required
                      />
                      <small className={styles.helpText}>
                        Los correos se generarán como
                        mi-admin+admin1@condaty.com.
                      </small>
                    </div>
                  )}
                </div>
              )}

              {activeStep === 3 && (
                <div className={styles.stepPane}>
                  <Users size={40} className={styles.stepIcon} />
                  <h2>Paso 3: Personal & Población</h2>
                  <p>
                    Aprovisiona los usuarios y personal de seguridad inicial.
                  </p>

                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <Input
                        name="numUsers"
                        label="Cantidad de Administradores (ADM)"
                        type="number"
                        min={1}
                        max={20}
                        value={formData.numUsers.toString()}
                        onChange={(e: any) =>
                          handleChange(
                            "numUsers",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        error={validationErrors.numUsers}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <Input
                        name="numHomeowners"
                        label="Cantidad de Propietarios (Owners)"
                        type="number"
                        min={0}
                        max={5000}
                        value={formData.numHomeowners.toString()}
                        onChange={(e: any) =>
                          handleChange(
                            "numHomeowners",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        error={validationErrors.numHomeowners}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <Input
                        name="numOwners"
                        label="Residentes Titulares (Resid.)"
                        type="number"
                        min={0}
                        max={5000}
                        value={formData.numOwners.toString()}
                        onChange={(e: any) =>
                          handleChange(
                            "numOwners",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        error={validationErrors.numOwners}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <Input
                        name="numDependents"
                        label="Dependientes Residentes"
                        type="number"
                        min={0}
                        max={5000}
                        value={formData.numDependents.toString()}
                        onChange={(e: any) =>
                          handleChange(
                            "numDependents",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        error={validationErrors.numDependents}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <Input
                        name="numGuards"
                        label="Personal de Seguridad (Guardias)"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.numGuards.toString()}
                        onChange={(e: any) =>
                          handleChange(
                            "numGuards",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        error={validationErrors.numGuards}
                      />
                    </div>

                    <div
                      className={styles.formGroup}
                      style={{ alignSelf: "center", paddingTop: "20px" }}
                    >
                      <Switch
                        name="createExtraRoles"
                        label="Crear roles extras (Tesorero, etc)"
                        value={formData.createExtraRoles ? "Y" : "N"}
                        checked={formData.createExtraRoles}
                        onChange={(e: any) =>
                          handleChange("createExtraRoles", e.target.checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className={styles.stepPane}>
                  <Building2 size={40} className={styles.stepIcon} />
                  <h2>Paso 4: Unidades del Condominio</h2>
                  <p>
                    Configura las unidades habitacionales (casas o
                    departamentos) a poblar.
                  </p>

                  <div className={styles.formGroup}>
                    <Input
                      name="numDptos"
                      label="Cantidad de Unidades (Casas/Dptos)"
                      type="number"
                      min={1}
                      max={5000}
                      value={formData.numDptos.toString()}
                      onChange={(e: any) =>
                        handleChange("numDptos", parseInt(e.target.value) || 1)
                      }
                      error={validationErrors.numDptos}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <Select
                      name="dptoType"
                      label="Tipo de Unidad"
                      value={formData.dptoType}
                      onChange={(e: any) =>
                        handleChange("dptoType", e.target.value)
                      }
                      options={[
                        { id: "Casa", name: "Casas fijas" },
                        { id: "Departamento", name: "Departamentos fijos" },
                        { id: "Lote", name: "Lotes / Terrenos" },
                        { id: "", name: "Distribuir tipos de forma aleatoria" },
                      ]}
                    />
                  </div>
                </div>
              )}

              {activeStep === 5 && (
                <div className={styles.stepPane}>
                  <DollarSign size={40} className={styles.stepIcon} />
                  <h2>Paso 5: Finanzas & Históricos</h2>
                  <p>Simula movimientos contables de ingresos y egresos.</p>

                  <div className={styles.formGroup}>
                    <Input
                      name="debtPeriods"
                      label="Periodos de Expensas (Formato: AAAA-MM:cantidad_pagos)"
                      placeholder="Ej. 2026-04:300,2026-05:400"
                      value={formData.debtPeriods}
                      onChange={(e: any) =>
                        handleChange("debtPeriods", e.target.value)
                      }
                      error={validationErrors.debtPeriods}
                    />
                    <small className={styles.helpText}>
                      Se generará automáticamente exactamente 1 expensa ordinaria mensual por cada unidad para los meses indicados. El número después de los dos puntos es la cantidad de esas deudas que se simularán como PAGADAS en ese mes (ej. si tenés 500 unidades, 2026-04:300 creará 500 expensas y 300 de ellas se marcarán como pagadas).
                    </small>
                  </div>

                  <div className={styles.formGroup}>
                    <Input
                      name="expensePeriods"
                      label="Periodos de Egresos / Gastos (Formato: AAAA-MM:cantidad_gastos)"
                      placeholder="Ej. 2026-04:5,2026-05:10"
                      value={formData.expensePeriods}
                      onChange={(e: any) =>
                        handleChange("expensePeriods", e.target.value)
                      }
                      error={validationErrors.expensePeriods}
                    />
                    <small className={styles.helpText}>
                      Indica cuántos gastos o egresos individuales se registrarán para el condominio en cada mes especificado (ej. 2026-04:5 creará 5 transacciones de gasto en Abril).
                    </small>
                  </div>
                </div>
              )}

              {activeStep === 6 && (
                <div className={styles.stepPane}>
                  <FileText size={40} className={styles.stepIcon} />
                  <h2>Paso 6: Actividad & Confirmación</h2>
                  <p>
                    Define logs de accesos y revisa el resumen antes de disparar
                    la generación.
                  </p>

                  <div className={styles.formGroup}>
                    <Input
                      name="accessPeriods"
                      label="Periodos de Accesos (Visitas)"
                      placeholder="Ej. 2026-05:10"
                      value={formData.accessPeriods}
                      onChange={(e: any) =>
                        handleChange("accessPeriods", e.target.value)
                      }
                      error={validationErrors.accessPeriods}
                    />
                    <small className={styles.helpText}>
                      Simulará registros de ingresos/salidas en portería con
                      vehiculares.
                    </small>
                  </div>

                  <div className={styles.summaryBox}>
                    <h3>Resumen del Plan de Poblado</h3>
                    <div className={styles.summaryGrid}>
                      <div>
                        <strong>Condominio:</strong> {formData.clientName} (
                        {formData.clientType === "C"
                          ? "Condominio"
                          : "Edificio"}
                        )
                      </div>
                      <div>
                        <strong>Prefijo CI:</strong> {formData.ciPrefix}
                      </div>
                      <div>
                        <strong>Admins:</strong> {formData.numUsers}
                      </div>
                      <div>
                        <strong>Residentes:</strong> {formData.numOwners} (+{" "}
                        {formData.numDependents} dep.)
                      </div>
                      <div>
                        <strong>Copropietarios:</strong>{" "}
                        {formData.numHomeowners}
                      </div>
                      <div>
                        <strong>Unidades:</strong> {formData.numDptos} (
                        {formData.dptoType || "Aleatorio"})
                      </div>
                      <div>
                        <strong>Modo Correo:</strong> {formData.emailMode}
                      </div>
                      <div>
                        <strong>Deudas:</strong>{" "}
                        {formData.debtPeriods || "Ninguna"}
                      </div>
                      <div>
                        <strong>Pagos:</strong> {formData.numPayments}
                      </div>
                      <div>
                        <strong>Gastos:</strong>{" "}
                        {formData.expensePeriods || "Ninguno"}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Wizard Actions */}
            <div className={styles.wizardActions}>
              {activeStep > 1 ? (
                <Button
                  onClick={handlePrev}
                  variant="secondary"
                  className={styles.prevBtn}
                >
                  <ArrowLeft size={18} className={styles.iconMargin} />
                  Anterior
                </Button>
              ) : (
                <Button
                  onClick={resetForm}
                  variant="secondary"
                  className={styles.prevBtn}
                >
                  Cancelar
                </Button>
              )}

              {activeStep < 6 ? (
                <Button onClick={handleNext} className={styles.nextBtn}>
                  Siguiente
                  <ArrowRight size={18} className={styles.iconMarginLeft} />
                </Button>
              ) : (
                <Button
                  onClick={handleGenerate}
                  disabled={generating || progressVisible}
                  className={styles.generateBtn}
                >
                  {generating ? (
                    <>Enviando...</>
                  ) : (
                    <>
                      <Play size={18} className={styles.iconMargin} />
                      Iniciar Generación
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.glassCard}
          >
            <h2 className={styles.sectionTitle}>Historial de Demos Activos</h2>
            <p className={styles.sectionSubtitle}>
              Listado de condominios de prueba aprovisionados en el sistema.
            </p>

            {!loaded ? (
              <LoadingScreen />
            ) : demosList.length === 0 ? (
              <div className={styles.emptyState}>
                <Building2 size={64} />
                <h3>No hay condominios demo generados</h3>
                <p>
                  Usa el botón "Crear Nuevo Demo" para crear tu primer entorno
                  de pruebas.
                </p>
              </div>
            ) : (
              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Condominio</th>
                      <th>Prefijo CI</th>
                      <th>Unidades</th>
                      <th>Admins</th>
                      <th>Coprop/Resid</th>
                      <th>Transacciones</th>
                      <th>Creado por</th>
                      <th>Fecha</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demosList.map((demo) => (
                      <tr key={demo.id}>
                        <td>
                          <div className={styles.demoName}>
                            <span className={styles.badge}>
                              {demo.config?.client_type ?? "C"}
                            </span>
                            <strong>{demo.client_name}</strong>
                          </div>
                        </td>
                        <td>
                          <code>{demo.ci_prefix}</code>
                        </td>
                        <td>{demo.summary?.dpto ?? 0}</td>
                        <td>{demo.summary?.user ?? 0}</td>
                        <td>
                          {demo.summary?.homeowner ?? 0} Pro. /{" "}
                          {demo.summary?.owner ?? 0} Res.
                        </td>
                        <td>
                          {demo.summary?.payment ?? 0} Pag. /{" "}
                          {demo.summary?.expense ?? 0} Gas.
                        </td>
                        <td>{demo.creator_name}</td>
                        <td>
                          {new Date(demo.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            onClick={() => setDeleteTarget(demo)}
                            className={styles.deleteBtn}
                            title="Eliminar Condominio y Limpiar Datos"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE PROGRESO DE GENERACIÓN ASÍNCRONA */}
      <AnimatePresence>
        {progressVisible && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={styles.modalContent}
              style={{ maxWidth: "480px", textAlign: "center" }}
            >
              <div className={styles.modalHeader} style={{ justifyContent: "center" }}>
                <Sparkles size={40} style={{ color: "var(--cPrimary)" }} />
                <h2 style={{ marginTop: "12px" }}>Generando Demo</h2>
              </div>
              <div className={styles.modalBody}>
                <p style={{ marginBottom: "20px", color: "var(--cWhiteV1)" }}>
                  {progressStep}
                </p>

                {/* Barra de progreso */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: "999px",
                    height: "12px",
                    overflow: "hidden",
                    marginBottom: "10px",
                  }}
                >
                  <motion.div
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                      height: "100%",
                      background:
                        "linear-gradient(90deg, var(--cPrimary), var(--cEmerald))",
                      borderRadius: "999px",
                    }}
                  />
                </div>

                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--cWhiteV2)",
                    marginBottom: "0",
                  }}
                >
                  {progressPercent}% completado
                </p>

                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--cWhiteV3)",
                    marginTop: "16px",
                  }}
                >
                  El proceso corre en segundo plano. Podés navegar por la app
                  mientras tanto — este modal se cerrará automáticamente al
                  finalizar.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN SEGURA */}
      <AnimatePresence>
        {deleteTarget && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={styles.modalContent}
            >
              <div className={styles.modalHeader}>
                <ShieldAlert size={36} className={styles.warningIcon} />
                <h2>Eliminación Segura & Limpieza Completa</h2>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.warningText}>
                  <strong>¡ADVERTENCIA CRÍTICA!</strong> Estás a punto de
                  eliminar el condominio{" "}
                  <strong>{deleteTarget.client_name}</strong> y TODOS los
                  registros que fueron generados.
                </p>
                <p className={styles.descriptionText}>
                  Esta acción eliminará de forma irreversible y permanente en
                  cascada inversa:
                  <br />
                  <code>
                    accesos → visitas → egresos → pagos → deudas → dptos →
                    residentes → admins → roles → cliente
                  </code>
                  .
                  <br />
                  <span className={styles.highlightText}>
                    Absolutamente ningún registro huérfano quedará en la base de
                    datos.
                  </span>
                </p>
                <div className={styles.formGroup}>
                  <label htmlFor="confirmInput">
                    Para continuar, escribe <strong>ELIMINAR</strong> en el
                    campo a continuación:
                  </label>
                  <input
                    id="confirmInput"
                    type="text"
                    className={styles.modalInput}
                    placeholder="Escribe ELIMINAR"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <Button
                  onClick={() => {
                    setDeleteTarget(null);
                    setDeleteConfirmText("");
                  }}
                  variant="secondary"
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleDeleteDemo}
                  disabled={
                    deleting || deleteConfirmText.toLowerCase() !== "eliminar"
                  }
                  className={styles.dangerActionBtn}
                >
                  {deleting
                    ? "Eliminando y limpiando..."
                    : "Sí, Limpiar Completo"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE GENERACIÓN COMPLETA EXITOSA */}
      <AnimatePresence>
        {generationSuccess && lastGeneratedDemo && (
          <div className={styles.modalOverlay}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={styles.modalContent}
              style={{ borderColor: "var(--cEmerald)", maxWidth: "550px" }}
            >
              <div className={styles.modalHeader}>
                <CheckCircle2 size={48} style={{ color: "var(--cEmerald)" }} />
                <h2>¡Demo Creado Exitosamente!</h2>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.successMessage}>
                  El condominio <strong>{lastGeneratedDemo.client_name}</strong>{" "}
                  ha sido aprovisionado correctamente con todos sus datos
                  iniciales simulados.
                </p>

                <div className={styles.successStatsBox}>
                  <h4>Elementos Creados</h4>
                  <div className={styles.successStatsGrid}>
                    <div>
                      <strong>Casas/Dptos:</strong>{" "}
                      {lastGeneratedDemo.summary?.dpto ?? 0}
                    </div>
                    <div>
                      <strong>Administradores:</strong>{" "}
                      {lastGeneratedDemo.summary?.user ?? 0}
                    </div>
                    <div>
                      <strong>Guardias:</strong>{" "}
                      {lastGeneratedDemo.summary?.guard ?? 0}
                    </div>
                    <div>
                      <strong>Copropietarios:</strong>{" "}
                      {lastGeneratedDemo.summary?.homeowner ?? 0}
                    </div>
                    <div>
                      <strong>Residentes:</strong>{" "}
                      {lastGeneratedDemo.summary?.owner ?? 0}
                    </div>
                    <div>
                      <strong>Campañas Deudas:</strong>{" "}
                      {lastGeneratedDemo.summary?.debt ?? 0}
                    </div>
                    <div>
                      <strong>Pagos de Expensas:</strong>{" "}
                      {lastGeneratedDemo.summary?.payment ?? 0}
                    </div>
                    <div>
                      <strong>Egresos/Gastos:</strong>{" "}
                      {lastGeneratedDemo.summary?.expense ?? 0}
                    </div>
                    <div>
                      <strong>Accesos/Portería:</strong>{" "}
                      {lastGeneratedDemo.summary?.access ?? 0}
                    </div>
                  </div>
                </div>

                <div className={styles.credentialsBox}>
                  <h4>Credenciales del Administrador Principal</h4>
                  <p>
                    <strong>Usuario (C.I.):</strong>{" "}
                    <code>{lastGeneratedDemo.ci_prefix}00001</code>
                    <br />
                    <strong>Contraseña:</strong> <code>12345678</code>
                  </p>
                  <small
                    style={{
                      display: "block",
                      color: "var(--cWhiteV1)",
                      marginTop: "8px",
                    }}
                  >
                    *Puedes ver las credenciales exactas de todos los usuarios
                    en la lista de residentes y administradores dentro del
                    condominio de pruebas.
                  </small>
                </div>
              </div>
              <div className={styles.modalActions}>
                <Button onClick={resetForm} className={styles.successDoneBtn}>
                  Finalizar & Entendido
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DemosModule;
