import Input from "@/mk/components/forms/Input/Input";
import React from "react";
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

const limit_msgs: any = {
  C: {
    label: "Cantidad",
    soft: {
      title:
        "Define después de cuántas expensas impagas, se activará la notificación de aviso al residente para informarle que pague sus expensas",
      tooltip:
        "El pre-aviso es la configuración que define cuántas expensas impagas puede acumular un residente, antes de que el sistema le envíe una notificación automática recordándole realizar el pago.",
    },

    hard: {
      title:
        "Define después de cuántas expensas impagas, el sistema bloqueará el acceso del residente a la app",
      tooltip:
        "El bloqueo es la configuración que define cuántas expensas impagas puede acumular un residente antes de que el sistema restrinja automáticamente su acceso a la aplicación del condominio.",
    },
  },
  D: {
    label: "Dias",
    soft: {
      title:
        "Define después de cuántos días desde el vencimiento de la expensa mas antigua, se activará la notificación de aviso al residente para informarle que pague sus expensas",
      tooltip:
        "El pre-aviso es la configuración que define cuántos días desde el vencimiento de la expensa mas antigua impaga, antes de que el sistema le envíe una notificación automática recordándole realizar el pago.",
    },
    hard: {
      title:
        "Define después de cuántos días desde el vencimiento de la expensa mas antigua, el sistema bloqueará el acceso del residente a la app",
      tooltip:
        "El bloqueo es la configuración que define después de cuántos días desde el vencimiento de la expensa mas antigua impaga, el sistema restrinja automáticamente su acceso a la aplicación del condominio.",
    },
  },
  M: {
    label: "Fin de mes",
    soft: {
      title:
        "Define después de cuántos días desde el vencimiento de la expensa mas antigua, se activará la notificación de aviso al residente para informarle que pague sus expensas",
      tooltip:
        "El pre-aviso es la configuración que define cuántos días desde el vencimiento de la expensa mas antigua impaga, antes de que el sistema le envíe una notificación automática recordándole realizar el pago.",
    },
    hard: {
      title:
        "Define después de cuántos días desde el vencimiento de la expensa mas antigua, el sistema bloqueará el acceso del residente a la app",
      tooltip:
        "El bloqueo es la configuración que define después de cuántos días desde el vencimiento de la expensa mas antigua impaga, el sistema restrinja automáticamente su acceso a la aplicación del condominio.",
    },
  },
};

const lLimit_type = [
  { id: "C", name: "Por cantidad de expensas impagas" },
  { id: "D", name: "Por días desde el vencimiento de la deuda mas antigua" },
  { id: "M", name: "Por fin de mes" },
];

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
              <h2 className={styles.sectionTitle}>
                Tipo de cálculo para el pre-aviso y bloqueo
              </h2>
              <Tooltip
                position="right"
                title="indique que tipo de limitante se pondrá a los pre-avisos y bloqueos."
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              {limit_msgs[formState?.limit_type].soft.title}
            </p>
          </div>
          <div className={styles.inputField}>
            <Select
              label="Tipo de cálculo"
              name="limit_type"
              error={errors}
              required
              value={formState?.limit_type}
              onChange={onChange}
              options={lLimit_type}
            />
          </div>
        </div>
        <div className={styles.sectionContainer}>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <h2 className={styles.sectionTitle}>Pre-aviso</h2>
              <Tooltip
                position="right"
                title={limit_msgs[formState?.limit_type].soft.tooltip}
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              {limit_msgs[formState?.limit_type].soft.title}
            </p>
          </div>

          <div className={styles.inputField}>
            <Input
              type="number"
              label={limit_msgs[formState?.limit_type].label}
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
                title={limit_msgs[formState?.limit_type].hard.tooltip}
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              {limit_msgs[formState?.limit_type].hard.title}
            </p>
          </div>

          <div className={styles.inputField}>
            <Input
              type="number"
              label={limit_msgs[formState?.limit_type].label}
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
              <h2 className={styles.sectionTitle}>Multa por morosidad</h2>
              <Tooltip
                position="right"
                title="Define cómo se aplicará la multa por pagos atrasados: puede ser un porcentaje, un monto fijo o un valor personalizado según el mes de mora."
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              Define el tipo de multa que se aplicará cuando haya retraso en el
              pago
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
          {formState?.penalty_type == 0 && (
            <p className={styles.sectionSubtitle}>
              No se aplicará ningún recargo por mora
            </p>
          )}

          {formState?.penalty_type == 1 && (
            <>
              <p className={styles.sectionSubtitle}>
                Define un porcentaje sobre el monto pendiente al momento del
                retraso.
              </p>
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
            </>
          )}
          {formState?.penalty_type == 2 && (
            <>
              <p className={styles.sectionSubtitle}>
                Define un monto fijo como multa única por mora.
              </p>
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
            </>
          )}
          {formState?.penalty_type == 3 && (
            <>
              <p className={styles.sectionSubtitle}>
                Define el monto de multa que se aplicará después de la fecha del
                día 10 del mes de la deuda
              </p>
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
              <p className={styles.sectionSubtitle}>
                Define el monto de multa que se aplicará por retraso en el pago
                al finalizar el mes
              </p>
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
            </>
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
