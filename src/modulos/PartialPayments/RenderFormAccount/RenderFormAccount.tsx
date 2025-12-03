/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useCallback, useMemo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import Toast from "@/mk/components/ui/Toast/Toast";
import styles from "./RenderFormAccount.module.css";

interface RenderFormAccountProps {
  open: boolean;
  onClose: () => void;
  execute: (...args: any[]) => Promise<any>;
  reLoad: () => void;
  showToast: (msg: string, type: "info" | "success" | "error" | "warning") => void;
  extraData?: {
    bankAccounts?: any[];
  };
  item?: {
    amount?: number | string;
    method?: string;
    paid_at?: string;
    voucher?: string;
    file?: any;
    obs?: string;
    dpto_id?: string | number;
  };
}

interface Errors {
  amount?: string;
  method?: string;
  paid_at?: string;
  voucher?: string;
  file?: string;
  obs?: string;
  [key: string]: string | undefined;
}

const RenderFormAccount: React.FC<RenderFormAccountProps> = ({
  open,
  onClose,
  execute,
  reLoad,
  showToast,
  extraData,
  item,
}) => {
  const [formState, setFormState] = useState({
    amount: item?.amount ?? "",
    method: item?.method ?? "",
    paid_at: item?.paid_at ?? new Date().toISOString().split("T")[0],
    voucher: item?.voucher ?? "",
    file: item?.file ?? "",
    obs: item?.obs ?? "",
    dpto_id: item?.dpto_id,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [toast] = useState<{ msg: string; method: "info" | "success" | "error" | "warning" }>(
    { msg: "", method: "info" }
  );

  const methodOptions = useMemo(
    () => [
      { id: "Q", name: "Pago QR" },
      { id: "T", name: "Transferencia bancaria" },
      { id: "E", name: "Efectivo" },
      { id: "C", name: "Cheque" },
      { id: "O", name: "Pago en oficina" },
    ],
    []
  );

  const exten = ["jpg", "pdf", "png", "jpeg", "doc", "docx"];

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormState(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const validar = useCallback(() => {
    const err: Errors = {};
    const amt = parseFloat(String(formState.amount || "0"));
    if (!formState.amount || isNaN(amt) || amt <= 0) err.amount = "Este campo es requerido";
    if (!formState.method) err.method = "Este campo es requerido";
    if (!formState.paid_at) err.paid_at = "Este campo es requerido";
    setErrors(err);
    return Object.keys(err).length === 0;
  }, [formState]);

  const _onSave = useCallback(async () => {
    const isValid = validar();
    if (!isValid) {
      showToast("Por favor revise los campos marcados", "warning");
      return;
    }

    const existBankAccount = extraData?.bankAccounts?.find((i: any) => i.is_main == 1)?.id;

    const params: any = {
      paid_at: formState.paid_at,
      method: formState.method,
      file: formState.file,
      obs: formState.obs,
      type: "I",
      bank_account_id: existBankAccount,
      amount: Math.round(parseFloat(String(formState.amount)) * 100) / 100,
    };

    if (formState.voucher && String(formState.voucher).length > 0) {
      params.voucher = formState.voucher;
    }
    if (formState.dpto_id) {
      params.nro_id = formState.dpto_id;
    }

    const { data, error } = await execute("/payments", "POST", params);
    if (data?.success) {
      showToast("Pago a cuenta registrado", "success");
      reLoad();
      onClose();
    } else {
      showToast(error?.message || data?.message || "Error al registrar", "error");
      if (error?.data?.errors) setErrors(error.data.errors);
      else if (data?.errors) setErrors(data.errors);
    }
  }, [execute, extraData?.bankAccounts, formState, onClose, reLoad, showToast, validar]);

  return (
    <>
      <Toast toast={toast as any} showToast={showToast} />
      <DataModal
        open={open}
        onClose={onClose}
        onSave={_onSave}
        buttonCancel={"Cancelar"}
        buttonText={"Registrar pago a cuenta"}
        title={"Registrar pago a cuenta"}
        minWidth={680}
        maxWidth={860}
      >
        <div className={styles.container}>
          <div className={styles.section}>
            <div className={styles.input-row}>
              <div className={styles.input-half}>
                <Input
                  type="currency"
                  name="amount"
                  label="Monto a pagar"
                  value={formState.amount}
                  onChange={handleChange}
                  error={errors}
                />
              </div>
              <div className={styles.input-half}>
                <Select
                  name="method"
                  label="Metodo de pago"
                  value={formState.method}
                  onChange={handleChange}
                  options={methodOptions}
                  error={errors}
                  optionLabel="name"
                  optionValue="id"
                  required
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.input-row}>
              <div className={styles.input-half}>
                <Input
                  type="date"
                  name="paid_at"
                  label="Seleccionar Fecha"
                  value={formState.paid_at || ""}
                  onChange={handleChange}
                  error={errors}
                  required
                />
              </div>
              <div className={styles.input-half}>
                <Input
                  type="text"
                  name="voucher"
                  label="Número de respaldo de pago"
                  value={formState.voucher || ""}
                  onChange={e => {
                    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").substring(0, 50);
                    const newEvent = { ...e, target: { ...e.target, name: "voucher", value } } as any;
                    handleChange(newEvent);
                  }}
                  error={errors}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.upload-panel}>
              <UploadFile
                name="file"
                ext={exten}
                value={formState.file ? { file: formState.file } : ""}
                onChange={handleChange}
                img={true}
                sizePreview={{ width: "40%", height: "auto" }}
                error={errors}
                setError={setErrors}
                required={false}
                placeholder="Cargar un archivo o arrastrar y soltar"
              />
            </div>
          </div>

          <div className={styles.section}>
            <TextArea
              label="Observaciones (Opc)"
              name="obs"
              value={formState.obs || ""}
              onChange={e => {
                const value = e.target.value.substring(0, 250);
                const newEvent = { ...e, target: { ...e.target, name: "obs", value } } as any;
                handleChange(newEvent);
              }}
              error={errors}
            />
          </div>
        </div>
      </DataModal>
    </>
  );
};

export default RenderFormAccount;
