import React, { useEffect, useMemo, useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import Switch from "@/mk/components/forms/Switch/Switch";
import styles from "../DptoConfig/DptoConfig.module.css";

type FeatureState = {
  has_tasks_visible: boolean;
  has_financial_data: boolean;
  has_financial_debt: boolean;
  financial_mode: number;
  has_marketplace_visible: boolean;
};

type Props = {
  client_config?: Record<string, any>;
  onSave: (values: FeatureState) => Promise<void> | void;
};

const enabled = (value: unknown) =>
  value === true || value === "Y" || Number(value) === 1;

const toFeatureState = (config?: Record<string, any>): FeatureState => ({
  has_tasks_visible: enabled(config?.has_tasks_visible),
  has_financial_data: enabled(config?.has_financial_data),
  has_financial_debt: enabled(config?.has_financial_debt),
  financial_mode: Number(config?.financial_mode) || 0,
  has_marketplace_visible:
    config?.has_marketplace_visible == null ||
    enabled(config.has_marketplace_visible),
});

const FeaturesConfig = ({ client_config, onSave }: Props) => {
  const initialState = useMemo(
    () => toFeatureState(client_config),
    [client_config]
  );
  const [formState, setFormState] = useState(initialState);
  const [editMode, setEditMode] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialState);

  useEffect(() => {
    setFormState(initialState);
    setEditMode(false);
    setErrors({});
  }, [initialState]);

  const handleSwitchChange = ({ target: { name, value } }: any) => {
    setFormState((current) => ({ ...current, [name]: value === "Y" }));
    setErrors({});
  };

  const handleSave = async () => {
    if (
      formState.has_financial_data &&
      formState.has_financial_debt &&
      ![1, 2, 3].includes(formState.financial_mode)
    ) {
      setErrors({ financial_mode: "Selecciona un modo de finanzas" });
      return;
    }

    await onSave(formState);
  };

  return (
    <div className={`${styles.Config} ${styles.compactMode}`}>
      <div className={styles.headerRow}>
        <div className={styles.headerContent}>
          <h1 className={styles.mainTitle}>Funcionalidades</h1>
          <p className={styles.mainSubtitle}>
            Elige qué experiencias estarán disponibles para los residentes de
            este condominio.
          </p>
        </div>
        <div className={styles.headerAction}>
          <div className={styles.headerButtons}>
            {!editMode ? (
              <Button
                variant="secondary"
                className={styles.editButton}
                onClick={() => setEditMode(true)}
              >
                Editar
              </Button>
            ) : (
              <>
                <Button
                  variant="secondary"
                  className={styles.editButton}
                  onClick={() => {
                    setFormState(initialState);
                    setErrors({});
                    setEditMode(false);
                  }}
                >
                  Descartar cambios
                </Button>
                <Button
                  className={styles.saveButton}
                  onClick={handleSave}
                  disabled={!isDirty}
                >
                  Guardar cambios
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={styles.rulesGrid}>
        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <p className={styles.textTitle}>Tareas</p>
            <p className={styles.textSubtitle}>
              Visibilidad inicial de las tareas nuevas.
            </p>
          </div>
          <div className={styles.switchContainer}>
            <div className={styles.switchContent}>
              <p className={styles.textTitle}>
                Tareas visibles para residentes por defecto
              </p>
              <p className={styles.textSubtitle}>
                Define si las tareas nuevas nacen públicas o privadas para los
                residentes.
              </p>
            </div>
            <Switch
              name="has_tasks_visible"
              label=""
              value={formState.has_tasks_visible ? "Y" : "N"}
              onChange={handleSwitchChange}
              checked={formState.has_tasks_visible}
              disabled={!editMode}
            />
          </div>
        </section>

        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <p className={styles.textTitle}>Finanzas para residentes</p>
            <p className={styles.textSubtitle}>
              Visibilidad del resumen y sus deudas en la app.
            </p>
          </div>
          <div className={styles.settingsStack}>
            <div className={styles.switchContainer}>
              <div className={styles.switchContent}>
                <p className={styles.textTitle}>Mostrar resumen financiero</p>
                <p className={styles.textSubtitle}>
                  Habilita el resumen financiero en la vista principal del
                  condominio.
                </p>
              </div>
              <Switch
                name="has_financial_data"
                label=""
                optionValue={["Y", "N"]}
                value={formState.has_financial_data ? "Y" : "N"}
                onChange={handleSwitchChange}
                checked={formState.has_financial_data}
                disabled={!editMode}
              />
            </div>
            {formState.has_financial_data ? (
              <div className={styles.switchContainer}>
                <div className={styles.switchContent}>
                  <p className={styles.textTitle}>Mostrar deudas</p>
                  <p className={styles.textSubtitle}>
                    Incluye deudas dentro del resumen financiero del condominio.
                  </p>
                </div>
                <Switch
                  name="has_financial_debt"
                  label=""
                  value={formState.has_financial_debt ? "Y" : "N"}
                  onChange={handleSwitchChange}
                  checked={formState.has_financial_debt}
                  disabled={!editMode}
                />
              </div>
            ) : null}
            {formState.has_financial_data && formState.has_financial_debt ? (
              <Select
                name="financial_mode"
                label="Modo de finanzas"
                value={formState.financial_mode}
                onChange={({ target: { value } }: any) =>
                  setFormState((current) => ({
                    ...current,
                    financial_mode: Number(value),
                  }))
                }
                options={[
                  { id: 1, name: "Solo expensas" },
                  { id: 2, name: "Expensas y multas separados" },
                  { id: 3, name: "Expensas y multas juntos" },
                ]}
                error={errors}
                disabled={!editMode}
              />
            ) : null}
          </div>
        </section>

        <section className={styles.formCard}>
          <div className={styles.cardHeader}>
            <p className={styles.textTitle}>Marketplace</p>
            <p className={styles.textSubtitle}>
              Publicaciones entre vecinos de este condominio.
            </p>
          </div>
          <div className={styles.switchContainer}>
            <div className={styles.switchContent}>
              <p className={styles.textTitle}>
                Mostrar Marketplace a residentes
              </p>
              <p className={styles.textSubtitle}>
                Si se desactiva, la pestaña Marketplace de la app se reemplaza
                por Reservas.
              </p>
            </div>
            <Switch
              name="has_marketplace_visible"
              label=""
              value={formState.has_marketplace_visible ? "Y" : "N"}
              onChange={handleSwitchChange}
              checked={formState.has_marketplace_visible}
              disabled={!editMode}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default FeaturesConfig;
