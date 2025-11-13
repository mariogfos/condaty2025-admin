import React, { useState, useEffect, useMemo } from "react";
import styles from "./PaymentsConfig.module.css";
import Button from "@/mk/components/forms/Button/Button";
import Br from "@/components/Detail/Br";
import Select from "@/mk/components/forms/Select/Select";

const PaymentsConfig = ({
  formState,
  onChange,
  errors,
  bankAccounts,
  onSave,
}: any) => {
  
  const [mainAccountID, setMainAccountID] = useState<number>(0)
  const [expenseAccountID, setExpenseAccountID] = useState<number>(0)
  const [reserveAccountID, setReserveAccountID] = useState<number>(0)

  useEffect(() => {
    setMainAccountID(formState?.main_account_id)
    setExpenseAccountID(formState?.expense_account_id)
    setReserveAccountID(formState?.reserve_account_id)
  }, [formState?.expense_account_id, formState?.main_account_id, formState?.reserve_account_id]);

  console.log(mainAccountID + ' ' + expenseAccountID + ' ' + reserveAccountID)
  console.log(JSON.stringify(bankAccounts))

  const getBankAccounts = useMemo(
      () =>
        bankAccounts.map((bacc: { id: number; alias_holder: string; bank_entity: { name: string; }; account_number: number; }) => {
          return {
            id: bacc.id,
            name:
              bacc?.alias_holder +
              ' (' +
              bacc?.bank_entity?.name +
              ' - ' +
              bacc?.account_number + ')'
          };
        }),
      [bankAccounts]
    );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value === "" || value === "-") {
      onChange(e);
      return;
    }

    onChange(e);
  };
  
  return (
    <div className={styles.paymentsContainer}>
      
      <div>
        <h1 className={styles.mainTitle}>Cuentas de pago</h1>
        <p className={styles.headerSubtitle}>
          Configura los métodos de pagos con los cuales los residentes podrán pagar sus cuotas,
          deudas y demás transacciones del condominio
        </p>
      </div>

      <div className={styles.formContainer}>
      
        <div className={styles.sectionContainer}>
          <div style={{gap: 8}}>
            <h2 className={styles.sectionTitle}>Cuenta principal</h2>
            <p className={styles.sectionSubtitle}>
              Asigna la cuenta bancaria que recibirá los pagos principales en tu administración para tu condominio.
            </p>
          </div>
          <Select
            name="main_account_id"
            label="Asignar cuenta bancaria"
            error={errors}
            required
            value={formState?.main_account_id}
            onChange={onChange}
            options={getBankAccounts}
          />
        </div>

        <div className={styles.sectionContainer}>
          <Br />
          <div style={{gap: 8}}>
            <h2 className={styles.sectionTitle}>Pagos de reservas</h2>
            <p className={styles.sectionSubtitle}>
              Asigna la cuenta bancaria que recibirá los pagos principales en tu administración para tu condominio.
            </p>
          </div>
          <Select
            name="reserve_account_id"
            label="Asignar cuenta bancaria"
            error={errors}
            value={formState?.reserve_account_id}
            onChange={onChange}
            options={getBankAccounts}
          />
        </div>

        <div className={styles.sectionContainer}>
          <Br />
          
          <div style={{gap: 8}}>
            <h2 className={styles.sectionTitle}>Pagos de expensas</h2>
            <p className={styles.sectionSubtitle}>
              Asigna la cuenta bancaria que recibirá los pagos principales en tu administración para tu condominio.
            </p>
          </div>

          <Select
            name="expense_account_id"
            label="Asignar cuenta bancaria"
            error={errors}
            value={formState?.expense_account_id}
            onChange={onChange}
            options={getBankAccounts}
          />
        </div>

        <div className={styles.saveButtonContainer}>
          <Button className={`${styles.saveButton} `} onClick={onSave}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsConfig;
