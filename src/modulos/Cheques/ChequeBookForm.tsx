"use client";

import { useEffect, useMemo, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import styles from "./Cheques.module.css";

type Account = { id: number; alias_holder: string; account_number: string };

export default function ChequeBookForm({ open, onClose, accounts, execute, reLoad, getExtraData, showToast }: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  execute: Function;
  reLoad: Function;
  getExtraData: Function;
  showToast: Function;
}) {
  const [form, setForm] = useState({ bank_account_id: "", name: "", first_number: "", cheque_count: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ bank_account_id: "", name: "", first_number: "", cheque_count: "" });
      setErrors({});
    }
  }, [open]);

  const lastNumber = useMemo(() => {
    const count = Number(form.cheque_count);
    if (!/^[0-9]{1,12}$/.test(form.first_number) || !Number.isInteger(count) || count < 1 || count > 100) return null;
    const last = Number(form.first_number) + count - 1;
    if (String(last).length > 12) return null;
    return String(last).padStart(form.first_number.length, "0");
  }, [form.first_number, form.cheque_count]);

  const change = ({ target: { name, value } }: any) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const save = async () => {
    if (saving) return;
    const nextErrors: Record<string, string> = {};
    if (!form.bank_account_id) nextErrors.bank_account_id = "Selecciona una cuenta corriente";
    if (!/^[0-9]{1,12}$/.test(form.first_number)) nextErrors.first_number = "Ingresa hasta 12 dígitos";
    if (!lastNumber) nextErrors.cheque_count = "Ingresa de 1 a 100 cheques sin superar 12 dígitos";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const { data, error } = await execute("/cheque-books", "POST", {
        bank_account_id: Number(form.bank_account_id),
        name: form.name.trim() || null,
        first_number: form.first_number,
        cheque_count: Number(form.cheque_count),
      }, false, true);
      if (!data?.success) {
        showToast(data?.message || error?.data?.message || "No se pudo crear el talonario", "error");
        return;
      }
      showToast("Talonario creado", "success");
      onClose();
      reLoad();
      getExtraData();
    } catch {
      showToast("No se pudo crear el talonario", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DataModal open={open} onClose={onClose} onSave={save} title="Nuevo talonario" buttonText={saving ? "Guardando…" : "Crear talonario"} disabled={saving} maxWidth={660}>
      <div className={styles.form}>
        <p className={styles.helper}>Los cheques se generan consecutivamente en la cuenta indicada. El número no puede repetirse en esa cuenta.</p>
        <Select name="bank_account_id" label="Cuenta corriente" value={form.bank_account_id} onChange={change}
          options={accounts.map((account) => ({ id: account.id, name: `${account.alias_holder} · ${account.account_number}` }))}
          error={errors} filter required />
        <Input name="name" label="Nombre del talonario (opcional)" value={form.name} onChange={change} maxLength={100} required={false} />
        <div className={styles.grid}>
          <Input name="first_number" label="Primer número" value={form.first_number} onChange={change} error={errors} maxLength={12} required />
          <Input name="cheque_count" type="number" label="Cantidad de cheques" value={form.cheque_count} onChange={change} error={errors} min={1} max={100} required />
        </div>
        {lastNumber ? <p className={styles.helper}>Rango: {form.first_number} al {lastNumber} ({form.cheque_count} cheques).</p> : null}
      </div>
    </DataModal>
  );
}
