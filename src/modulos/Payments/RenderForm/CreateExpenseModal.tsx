"use client";
import React, { useState, useEffect, useMemo } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import styles from "./RenderForm.module.css";
import type { NewExpense, Deuda } from "../hooks/usePaymentsForm";

export interface CreateExpenseModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Heurística de pre-carga del monto "normal" de la unidad. Cuando el back
   * pinea `dptos.expense_amount` en `queryForExtraData`, este hook debería
   * recibirlo y pasarlo como `suggestedAmount` directo.
   */
  suggestedAmount?: number;
  /**
   * Si se está editando una expensa virtual ya creada, se pasa su data
   * para pre-rellenar el form.
   */
  editing?: NewExpense | null;
  /**
   * Deudas pre-existentes del dpto actual (adminDebts). Se valida contra
   * estas en tiempo real para detectar duplicados.
   */
  existingDebts?: Deuda[];
  /**
   * Virtuales ya creadas en este form. Se valida contra estas en tiempo real
   * para detectar duplicados y para excluir la virtual que se está editando.
   */
  existingVirtuals?: NewExpense[];
  /**
   * onConfirm devuelve { ok, error? }. El padre (RenderForm) llama al helper
   * addNewExpense/updateNewExpense del hook y muestra el toast si hay error.
   */
  onConfirm: (data: {
    month: number;
    year: number;
    description: string;
    amount: number;
  }) => { ok: boolean; error?: string };
}

const MONTHS = [
  { id: 1, name: "Enero" },
  { id: 2, name: "Febrero" },
  { id: 3, name: "Marzo" },
  { id: 4, name: "Abril" },
  { id: 5, name: "Mayo" },
  { id: 6, name: "Junio" },
  { id: 7, name: "Julio" },
  { id: 8, name: "Agosto" },
  { id: 9, name: "Septiembre" },
  { id: 10, name: "Octubre" },
  { id: 11, name: "Noviembre" },
  { id: 12, name: "Diciembre" },
];

const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  open,
  onClose,
  suggestedAmount = 0,
  editing = null,
  existingDebts = [],
  existingVirtuals = [],
  onConfirm,
}) => {
  const now = new Date();
  const [month, setMonth] = useState<number>(editing?.month ?? now.getMonth() + 1);
  const [year, setYear] = useState<string>(String(editing?.year ?? now.getFullYear()));
  const [description, setDescription] = useState<string>(editing?.description ?? "");
  const [amount, setAmount] = useState<string>(
    editing ? String(editing.amount) : String(suggestedAmount || "")
  );

  // Reset al abrir/cambiar edición.
  useEffect(() => {
    if (open) {
      setMonth(editing?.month ?? now.getMonth() + 1);
      setYear(String(editing?.year ?? now.getFullYear()));
      setDescription(editing?.description ?? "");
      setAmount(editing ? String(editing.amount) : String(suggestedAmount || ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.virtualId]);

  /**
   * Validación en tiempo real (mientras el admin escribe/cambia valores).
   * Devuelve un mensaje de error si hay algún problema, o null si está OK.
   *
   * Chequeos:
   * - Mes dentro de 1-12 (lo pinea el Select, pero defensivo).
   * - Año entre 2000-2100.
   * - Monto parseable y > 0.
   * - Periodo (mes, año) NO está en deudas pre-existentes del dpto.
   * - Periodo (mes, año) NO está en virtuales ya creadas (excluyendo la que
   *   se está editando, para no chocar consigo misma).
   */
  const liveError = useMemo<string | null>(() => {
    if (!month || month < 1 || month > 12) return "Mes inválido";
    const y = Number(year);
    if (!year || y < 2000 || y > 2100) return "Año inválido";
    const a = Number(amount);
    if (!amount || Number.isNaN(a) || a <= 0) return "El monto debe ser mayor a 0";

    const conflictDebt = existingDebts.find(
      (d) => Number(d.month) === month && Number(d.year) === y
    );
    if (conflictDebt) {
      return `Ya existe una deuda para ${month}/${y} en esta unidad.`;
    }

    const conflictVirtual = existingVirtuals.find(
      (v) => v.virtualId !== editing?.virtualId && Number(v.month) === month && Number(v.year) === y
    );
    if (conflictVirtual) {
      return `Ya creaste una expensa para ${month}/${y} en este formulario.`;
    }

    return null;
  }, [month, year, amount, existingDebts, existingVirtuals, editing?.virtualId]);

  const handleConfirm = () => {
    if (liveError) return;
    const result = onConfirm({
      month,
      year: Number(year),
      description: description.trim(),
      amount: Number(amount),
    });
    if (!result.ok) {
      // Si el hook detecta algo extra (ej: duplicado por race condition),
      // el modal queda abierto y el botón se rehabilita. Pero como ya
      // validamos en tiempo real, este caso es raro. Igual manejamos.
      return;
    }
    onClose();
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      onSave={handleConfirm}
      title={editing ? "Editar expensa" : "Crear expensa nueva"}
      buttonText={editing ? "Guardar cambios" : "Crear y agregar al pago"}
      buttonCancel="Cancelar"
      disabled={Boolean(liveError)}
      minWidth={420}
      maxWidth={520}
    >
      <div className={styles["income-form-container"]}>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--cWhiteV1)",
            margin: 0,
            marginBottom: 4,
          }}
        >
          Esta expensa se creará y pagará junto con el ingreso actual (en la
          misma operación). El backend la registra como deuda para la unidad
          seleccionada.
        </p>

        <div className={styles["input-row"]}>
          <div className={styles["input-half"]}>
            <Select
              name="new-expense-month"
              label="Mes"
              value={String(month)}
              onChange={(e: any) => setMonth(Number(e.target.value))}
              options={MONTHS}
              required
              optionLabel="name"
              optionValue="id"
            />
          </div>
          <div className={styles["input-half"]}>
            <Input
              type="number"
              name="new-expense-year"
              label="Año"
              value={year}
              onChange={(e) => {
                const raw = (e.target.value || "").replace(/\D/g, "").slice(0, 4);
                setYear(raw);
              }}
              required
              maxLength={4}
            />
          </div>
        </div>

        <div className={styles["input-container"]}>
          <Input
            type="currency"
            name="new-expense-amount"
            label="Monto"
            value={amount}
            onChange={(e) => {
              const raw = (e.target.value || "").replace(/[^\d.]/g, "");
              setAmount(raw);
            }}
            required
            maxLength={20}
          />
        </div>

        <div className={styles["input-container"]}>
          <Input
            type="text"
            name="new-expense-description"
            label="Descripción (opcional)"
            placeholder="Ej: Pago adelantado"
            value={description}
            onChange={(e) => setDescription(e.target.value.substring(0, 100))}
            maxLength={100}
          />
        </div>

        {liveError && (
          <div
            data-testid="create-expense-error"
            style={{
              color: "var(--cError, #f44)",
              fontSize: "0.9rem",
              marginTop: 8,
            }}
          >
            {liveError}
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default CreateExpenseModal;
