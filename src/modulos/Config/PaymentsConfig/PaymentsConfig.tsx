import React, { useEffect, useMemo, useState } from "react";
import styles from "./PaymentsConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Br from "@/components/Detail/Br";
import Select from "@/mk/components/forms/Select/Select";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

interface PropsType {
  bankAccounts: any[];
  onSave: (e: object) => Promise<void> | void;
  client_config: any;
}

const PaymentsConfig = ({ bankAccounts, onSave, client_config }: PropsType) => {
  const initialState = useMemo(
    () => ({
      main_account_id: client_config?.main_account_id || "",
      reserve_account_id: client_config?.reserve_account_id || "",
      expense_account_id: client_config?.expense_account_id || "",
    }),
    [
      client_config?.expense_account_id,
      client_config?.main_account_id,
      client_config?.reserve_account_id,
    ],
  );
  const [formState, setFormState]: any = useState(initialState);
  const [errors, setErrors]: any = useState({});
  const [editMode, setEditMode] = useState(false);
  const isDirty = JSON.stringify(formState) !== JSON.stringify(initialState);

  useEffect(() => {
    setFormState(initialState);
    setErrors({});
    setEditMode(false);
  }, [initialState]);

  const getBankAccounts = useMemo(
    () =>
      bankAccounts?.map(
        (bacc: {
          id: number;
          alias_holder: string;
          bank_entity: { name: string };
          account_number: number;
        }) => {
          return {
            id: bacc?.id ?? null,
            name: `${bacc?.alias_holder ?? ""} (${bacc?.bank_entity?.name ?? "N/A"} - ${bacc?.account_number ?? ""})`,
          };
        },
      ),
    [bankAccounts],
  );
  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState.main_account_id,
      rules: ["required"],
      key: "main_account_id",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.reserve_account_id,
      rules: ["required"],
      key: "reserve_account_id",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState.expense_account_id,
      rules: ["required"],
      key: "expense_account_id",
      errors,
      data: formState,
    });

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validate())) return;
    await onSave(formState);
    setEditMode(false);
  };
  const handleChange = (e: any) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
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
    <div className={styles.paymentsContainer}>
      <div className={styles.headerRow}>
        <div className={styles.headerContent}>
          <h1 className={styles.mainTitle}>Cuentas de pago</h1>
          <p className={styles.headerSubtitle}>
            Configura los métodos de pagos con los cuales los residentes podrán
            pagar sus cuotas, deudas y demás transacciones del condominio
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
          <div style={{ gap: 8 }}>
            <h2 className={styles.sectionTitle}>Cuenta principal</h2>
            <p className={styles.sectionSubtitle}>
              Asigna la cuenta bancaria que recibirá los pagos principales en tu
              administración para tu condominio.
            </p>
          </div>
          <Select
            name="main_account_id"
            label="Asignar cuenta bancaria"
            error={errors}
            required
            value={formState?.main_account_id}
            onChange={handleChange}
            options={getBankAccounts}
            disabled={!editMode}
          />
        </div>

        <div className={styles.sectionContainer}>
          <Br />
          <div style={{ gap: 8 }}>
            <h2 className={styles.sectionTitle}>Pagos de reservas</h2>
            <p className={styles.sectionSubtitle}>
              Asigna la cuenta bancaria que recibirá los pagos principales en tu
              administración para tu condominio.
            </p>
          </div>
          <Select
            name="reserve_account_id"
            label="Asignar cuenta bancaria"
            error={errors}
            value={formState?.reserve_account_id}
            onChange={handleChange}
            options={getBankAccounts}
            disabled={!editMode}
          />
        </div>

        <div className={styles.sectionContainer}>
          <Br />

          <div style={{ gap: 8 }}>
            <h2 className={styles.sectionTitle}>Pagos de expensas</h2>
            <p className={styles.sectionSubtitle}>
              Asigna la cuenta bancaria que recibirá los pagos principales en tu
              administración para tu condominio.
            </p>
          </div>

          <Select
            name="expense_account_id"
            label="Asignar cuenta bancaria"
            error={errors}
            value={formState?.expense_account_id}
            onChange={handleChange}
            options={getBankAccounts}
            disabled={!editMode}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentsConfig;
