import Input from "@/mk/components/forms/Input/Input";
import Button from "@/mk/components/forms/Button/Button";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./DefaulterConfig.module.css";
import Tooltip from "@/mk/components/ui/Tooltip/Tooltip";
import { IconQuestion } from "@/components/layout/icons/IconsBiblioteca";
import Select from "@/mk/components/forms/Select/Select";
import Switch from "@/mk/components/forms/Switch/Switch";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

interface DefaulterConfigProps {
  client_config: any;
  onSave?: (e: object) => Promise<void> | void;
}

// Claves numéricas espejo de LimitType (backend: app/Modules/Clients/Enums/LimitType.php)
// 1=COUNT (cantidad), 2=DAYS (días), 3=MONTH (fin de mes)
const limit_msgs: any = {
  1: {
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
  2: {
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
  3: {
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
  { id: 1, name: "Por cantidad de expensas impagas" },
  { id: 2, name: "Por días desde el vencimiento de la deuda mas antigua" },
  { id: 3, name: "Por fin de mes" },
];
const lcheckMora = [
  { id: 0, name: "No" },
  { id: 1, name: "Sí" },
];

const DefaulterConfig = ({ client_config, onSave }: DefaulterConfigProps) => {
  const initialState = useMemo(
    () => ({
      limit_type: client_config?.limit_type || "",
      soft_limit: client_config?.soft_limit || "",
      hard_limit: client_config?.hard_limit || "",
      penalty_limit: client_config?.penalty_limit || "",
      penalty_type: client_config?.penalty_type || "",
      penalty_data: client_config?.penalty_data || "",
      button_mora: client_config?.button_mora || "0",
      check_mora: client_config?.check_mora || "0",
    }),
    [client_config],
  );
  const [formState, setFormState] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [editMode, setEditMode] = useState(false);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialState);

  useEffect(() => {
    setFormState(initialState);
    setErrors({});
    setEditMode(false);
  }, [initialState]);

  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState.limit_type,
      rules: ["required"],
      key: "limit_type",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.soft_limit,
      rules: ["required"],
      key: "soft_limit",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState.hard_limit,
      rules: ["required"],
      key: "hard_limit",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState.penalty_limit,
      rules: ["required"],
      key: "penalty_limit",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState.penalty_type,
      rules: ["required"],
      key: "penalty_type",
      errors,
      data: formState,
    });
    if (formState.penalty_type == 1) {
      errors = checkRules({
        value: formState.penalty_data?.percent,
        rules: ["required", "number", "less:100", "greater:0"],
        key: "percent",
        errors,
        data: formState.penalty_data,
      });
    }
    if (formState.penalty_type == 2) {
      errors = checkRules({
        value: formState.penalty_data?.amount,
        rules: ["required"],
        key: "amount",
        errors,
        data: formState.penalty_data,
      });
    }
    if (formState.penalty_type == 3) {
      errors = checkRules({
        value: formState.penalty_data?.first_amount,
        rules: ["required"],
        key: "first_amount",
        errors,
        data: formState.penalty_data,
      });
      errors = checkRules({
        value: formState.penalty_data?.second_amount,
        rules: ["required"],
        key: "second_amount",
        errors,
        data: formState.penalty_data,
      });
    }

    setErrors(errors);
    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (["percent", "amount", "first_amount", "second_amount"].includes(name)) {
      let newValue: any = value;
      if (name === "percent") {
        const numeric = Number(value);
        if (!isNaN(numeric) && numeric > 100) {
          newValue = 100;
        }
        if (!isNaN(numeric) && numeric < 0) {
          newValue = 0;
        }
      }

      setFormState((prev) => ({
        ...prev,
        penalty_data: {
          ...prev.penalty_data,
          [name]: newValue,
        },
      }));

      return;
    }

    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const _onSave = async () => {
    if (hasErrors(validate())) return;
    await onSave?.(formState);
    setEditMode(false);
  };
  const handleEditClick = () => {
    setEditMode(true);
  };
  const handleDiscardChanges = () => {
    setErrors({});
    if (isDirty) {
      setFormState(initialState);
    }
    setEditMode(false);
  };
  return (
    <div className={styles.defaulterContainer}>
      <div className={styles.headerRow}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Gestión de morosidad</h1>
          <p className={styles.headerSubtitle}>
            Configura las acciones que se tomarán con los morosos del condominio
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
                onClick={_onSave}
                disabled={!isDirty}
              >
                Guardar cambios
              </Button>
            </>
          )}
        </div>
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
              onChange={handleInputChange}
              options={lLimit_type}
              disabled={!editMode}
            />
          </div>
        </div>
        {formState?.limit_type != 3 && (
          <>
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
                  disabled={!editMode}
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
                  disabled={!editMode}
                />
              </div>
            </div>
          </>
        )}

        <div className={styles.sectionContainer}>
          <div>
            <div style={{ display: "flex", gap: 8 }}>
              <h2 className={styles.sectionTitle}>MORA en guardias</h2>
              <Tooltip
                position="right"
                title="Indique si se mostrará a los GUARDIAS si una unidad o residente esta EN MORA."
              >
                <IconQuestion size={16} />
              </Tooltip>
            </div>
            <p className={styles.sectionSubtitle}>
              Indique si se mostrará a los GUARDIAS si una unidad o residente
              esta EN MORA.
            </p>
          </div>
          <div className={styles.inputField}>
            <Select
              label="Mostrar a Guardias"
              name="check_mora"
              error={errors}
              required
              value={formState?.check_mora || 0}
              onChange={handleInputChange}
              options={lcheckMora}
              disabled={!editMode}
            />
          </div>
        </div>
        <div className={styles.sectionContainer}>
          <div className={styles.switchContainer}>
            <div className={styles.switchContent}>
              <p className={styles.textTitle}>
                Mostrar Boton de Avisar en la App de Guardia
              </p>
              <p className={styles.sectionSubtitle}>
                Activa esta opción para que el guardia en la App no pueda avisar
                al Residente cuando recibe una visita si se encuentra en MORA
              </p>
            </div>

            <Switch
              name="button_mora"
              label=""
              value={formState?.button_mora || "0"}
              onChange={handleInputChange}
              optionValue={["1", "0"]}
              checked={formState?.button_mora == 1}
              disabled={!editMode}
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
              disabled={!editMode}
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
            disabled={!editMode}
          />
          {formState?.penalty_type == 0 && (
            <p className={styles.fieldHint}>
              No se aplicará ningún recargo por mora
            </p>
          )}

          {formState?.penalty_type == 1 && (
            <>
              <p className={styles.fieldHint}>
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
                disabled={!editMode}
              />
            </>
          )}
          {formState?.penalty_type == 2 && (
            <>
              <p className={styles.fieldHint}>
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
                disabled={!editMode}
              />
            </>
          )}
          {formState?.penalty_type == 3 && (
            <>
              <p className={styles.fieldHint}>
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
                disabled={!editMode}
              />
              <p className={styles.fieldHint}>
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
                disabled={!editMode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DefaulterConfig;
