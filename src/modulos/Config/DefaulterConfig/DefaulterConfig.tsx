import Input from "@/mk/components/forms/Input/Input";
import React, { useState, useEffect } from "react";
import styles from "./DefaulterConfig.module.css";
import Tooltip from "@/mk/components/ui/Tooltip/Tooltip";
import { IconQuestion } from "@/components/layout/icons/IconsBiblioteca";
import Select from "@/mk/components/forms/Select/Select";

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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value === "" || value === "-") {
      onChange(e);
      return;
    }

    const numericValue = parseFloat(value);

    if (isNaN(numericValue)) {
      return;
    }

    if (numericValue < 0) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: "0",
        },
      };
      onChange(syntheticEvent);
      return;
    }

    if (name === "penalty_percent" && numericValue > 100) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: "100",
        },
      };
      onChange(syntheticEvent);
      return;
    }

    onChange(e);
  };

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
              error={errors}
              required
              value={formState?.soft_limit}
              onChange={handleInputChange}
              maxLength={2}
              min={0}
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
              error={errors}
              required
              value={formState?.hard_limit}
              onChange={handleInputChange}
              maxLength={2}
              min={0}
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
              error={errors}
              required
              value={formState?.penalty_limit}
              onChange={handleInputChange}
              maxLength={2}
              min={0}
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

          {/* <div className={styles.inputField}>
            <div className={styles.percentInputContainer}>
              <Input
                type="number"
                label="Porcentaje"
                name="penalty_percent"
                error={errors}
                required
                value={formState?.penalty_percent}
                onChange={handleInputChange}
                maxLength={3}
                min={0}
                max={100}
              />
              {(formState?.penalty_percent ||
                formState?.penalty_percent != 0) && (
                <span className={styles.percentSymbol}>%</span>
              )}
            </div>
          </div> */}
          <Select
            name="penalty_type"
            label="Tipo de multa"
            error={errors}
            required
            value={formState?.penalty_type}
            onChange={handleInputChange}
            options={[
              { id: 0, name: "Sin multa" },
              { id: 1, name: "Porcentaje" },
              { id: 2, name: "Valor Fijo" },
              { id: 3, name: "Personalizado" },
            ]}
          />

          {formState?.penalty_type == 1 && (
            <Input
              type="number"
              label="Porcentaje"
              name="percent"
              error={errors}
              required
              value={formState?.penalty_data?.percent}
              onChange={handleInputChange}
              maxLength={3}
              min={0}
              max={100}
              suffix="%"
            />
          )}
          {formState?.penalty_type == 2 && (
            <div className={styles.inputField}>
              <Input
                type="number"
                label="Monto"
                name="amount"
                error={errors}
                required
                value={formState?.penalty_data?.amount}
                onChange={handleInputChange}
                maxLength={10}
                min={0}
              />
            </div>
          )}
          {formState?.penalty_type == 3 && (
            <div className={styles.inputField}>
              <Input
                type="text"
                label="Primer monto"
                name="first_amount"
                error={errors}
                required
                value={formState?.penalty_data?.first_amount}
                onChange={handleInputChange}
                maxLength={100}
              />
              <Input
                type="text"
                label="Segundo monto"
                name="second_amount"
                error={errors}
                required
                value={formState?.penalty_data?.second_amount}
                onChange={handleInputChange}
                maxLength={100}
              />
            </div>
          )}
        </div>

        <div className={styles.saveButtonContainer}>
          <button className={`${styles.saveButton}`} onClick={onSave}>
            Guardar datos
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefaulterConfig;
