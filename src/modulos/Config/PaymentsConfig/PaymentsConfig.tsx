import React, { useState, useEffect, useMemo } from "react";
import styles from "./PaymentsConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Br from "@/components/Detail/Br";
import Select from "@/mk/components/forms/Select/Select";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";

interface PropsType {
  bankAccounts: any[];
  onSave: (e: object) => void;
  client_config: any;
}

const PaymentsConfig = ({ bankAccounts, onSave, client_config }: PropsType) => {
  const [formState, setFormState]: any = useState({
    main_account_id: client_config?.main_account_id || "",
    reserve_account_id: client_config?.reserve_account_id || "",
    expense_account_id: client_config?.expense_account_id || "",
  });
  const [errors, setErrors]: any = useState({});

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
    [
      bankAccounts,
      formState?.main_account_id,
      formState?.reserve_account_id,
      formState?.expense_account_id,
    ],
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
  const _onSave = () => {
    if (hasErrors(validate())) return;
    onSave(formState);
  };
  const handleChange = (e: any) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };
  return (
    <div className={styles.paymentsContainer}>
      <div>
        <h1 className={styles.mainTitle}>Cuentas de pago</h1>
        <p className={styles.headerSubtitle}>
          Configura los métodos de pagos con los cuales los residentes podrán
          pagar sus cuotas, deudas y demás transacciones del condominio
        </p>
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
          />
        </div>

        <div className={styles.saveButtonContainer}>
          <Button className={`${styles.saveButton} `} onClick={_onSave}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsConfig;
