import Input from "@/mk/components/forms/Input/Input";
import React, { useState, useEffect } from "react";
import styles from "./DefaulterConfig.module.css";
import Tooltip from "@/components/Tooltip/Tooltip";
import { IconQuestion } from "@/components/layout/icons/IconsBiblioteca";

interface DefaulterConfigProps {
  formState: any;
  onChange: any;
  errors: any;
  onSave?: any;
}

const DefaulterConfig = ({
  formState,
  onChange,
  errors,
  onSave,
}: DefaulterConfigProps) => {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Validar cambios en el formulario
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validación 1: Preaviso debe ser menor al bloqueo y máximo 2 dígitos
    if (formState?.soft_limit) {
      const softLimit = parseInt(formState.soft_limit);
      const hardLimit = parseInt(formState.hard_limit || "0");

      if (softLimit >= hardLimit && hardLimit > 0) {
        newErrors.soft_limit = "El preaviso debe ser menor al bloqueo";
      }

      if (softLimit > 99) {
        newErrors.soft_limit = "Máximo 2 dígitos permitidos";
      }
    }

    // Validación 2: Bloqueo debe ser mayor al preaviso y máximo 2 dígitos
    if (formState?.hard_limit) {
      const softLimit = parseInt(formState.soft_limit || "0");
      const hardLimit = parseInt(formState.hard_limit);

      if (hardLimit <= softLimit && softLimit > 0) {
        newErrors.hard_limit = "El bloqueo debe ser mayor al preaviso";
      }

      if (hardLimit > 99) {
        newErrors.hard_limit = "Máximo 2 dígitos permitidos";
      }
    }

    // Validación 3: Meses para multa debe tener máximo 2 dígitos
    if (formState?.penalty_limit) {
      const penaltyLimit = parseInt(formState.penalty_limit);

      if (penaltyLimit > 99) {
        newErrors.penalty_limit = "Máximo 2 dígitos permitidos";
      }
    }

    // Validación 4: Porcentaje de multa debe tener máximo 3 dígitos
    if (formState?.penalty_percent) {
      const penaltyPercent = parseInt(formState.penalty_percent);

      if (penaltyPercent > 999) {
        newErrors.penalty_percent = "Máximo 3 dígitos permitidos";
      }
    }

    setValidationErrors(newErrors);
  }, [formState]);

  // Función para manejar cambios con validación
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Restricción de dígitos según el campo
    if (
      name === "soft_limit" ||
      name === "hard_limit" ||
      name === "penalty_limit"
    ) {
      // Limitar a 2 dígitos
      if (value === "" || /^\d{1,2}$/.test(value)) {
        onChange(e);
      }
    } else if (name === "penalty_percent") {
      // Limitar a 3 dígitos
      if (value === "" || /^\d{1,3}$/.test(value)) {
        onChange(e);
      }
    } else {
      onChange(e);
    }
  };

  // Función para validar antes de guardar
  const handleSave = () => {
    // Si hay errores de validación, no permitir guardar
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (onSave) {
      onSave();
    }
  };
  console.log(formState);
  return (
    <div className={styles.defaulterContainer}>
      <div>
        <h1 className={styles.headerTitle}>Gestión de morosidad</h1>
        <p className={styles.headerSubtitle}>
          Configura las acciones que se tomarán con los morosos del condominio
        </p>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.sectionContainer}>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <h2 className={styles.sectionTitle}>Pre-aviso</h2>
              <Tooltip
                position="right"
                title="El pre-aviso es la configuración que define cuántas expensas impagas puede acumular un residente, antes de que el sistema le envíe una notificación automática recordándole realizar el pago."
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              Define después de cuántas expensas impagas, se activará la
              notificación de aviso al residente para informarle que pague sus
              expensas
            </p>
          </div>

          <div className={styles.inputField}>
            <Input
              type="number"
              label="Cantidad"
              name="soft_limit"
              error={validationErrors.soft_limit || errors?.soft_limit}
              required
              value={formState?.soft_limit}
              onChange={handleChange}
              maxLength={2}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <h2 className={styles.sectionTitle}>Bloqueo</h2>
              <Tooltip
                position="right"
                title="El bloqueo es la configuración que define cuántas expensas impagas puede acumular un residente antes de que el sistema restrinja automáticamente su acceso a la aplicación del condominio."
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              Define después de cuántas expensas impagas, el sistema bloqueará
              el acceso del residente a la app
            </p>
          </div>

          <div className={styles.inputField}>
            <Input
              type="number"
              label="Cantidad"
              name="hard_limit"
              error={validationErrors.hard_limit || errors?.hard_limit}
              required
              value={formState?.hard_limit}
              onChange={handleChange}
              maxLength={2}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <h2 className={styles.sectionTitle}>
                Meses para empezar a cobrar la multa
              </h2>
              <Tooltip
                position="right"
                title="Esta es la configuración que define el número de meses de retraso en el pago de las expensas que deben transcurrir antes de que el sistema comience a aplicar la multa por mora al residente."
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              Ingresa el número de meses de retraso permitidos antes de aplicar
              la multa por mora
            </p>
          </div>

          <div className={styles.inputField}>
            <Input
              type="number"
              label="Número de meses"
              name="penalty_limit"
              error={validationErrors.penalty_limit || errors?.penalty_limit}
              required
              value={formState?.penalty_limit}
              onChange={handleChange}
              maxLength={2}
            />
          </div>
        </div>

        <div className={styles.sectionContainer}>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <h2 className={styles.sectionTitle}>
                Porcentaje de multa por morosidad
              </h2>
              <Tooltip
                position="right"
                title="Esta es la tasa porcentual que se aplicará como multa sobre el monto total de las expensas adeudadas por cada mes que el pago se encuentre en mora."
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              Indica el porcentaje de multa que se aplicará por cada mes de
              retraso en el pago
            </p>
          </div>

          <div className={styles.inputField}>
            <div className={styles.percentInputContainer}>
              <Input
                type="number"
                label="Porcentaje"
                name="penalty_percent"
                error={
                  validationErrors.penalty_percent || errors?.penalty_percent
                }
                required
                value={formState?.penalty_percent}
                onChange={handleChange}
                maxLength={3}
              />
              {(formState?.penalty_percent ||
                formState?.penalty_percent != 0) && (
                <span className={styles.percentSymbol}>%</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.saveButtonContainer}>
          <button
            className={`${styles.saveButton} ${
              Object.keys(validationErrors).length > 0
                ? styles.disabledButton
                : ""
            }`}
            onClick={handleSave}
            disabled={Object.keys(validationErrors).length > 0}
          >
            Guardar datos
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefaulterConfig;
