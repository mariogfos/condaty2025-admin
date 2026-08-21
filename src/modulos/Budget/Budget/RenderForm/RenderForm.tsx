"use client";
import React, { useState, useEffect, useCallback } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRulesFields, hasErrors } from "@/mk/utils/validate/Rules";
import styles from "./RenderForm.module.css";

interface RenderFormProps {
  open: boolean;
  onClose: () => void;
  item?: any;
  onSave?: () => void;
  extraData: any;
  execute: (...args: any[]) => Promise<any>;
  errors: any;
  setErrors: (errors: any) => void;
  reLoad: () => void;
  action: string;
}

const getPeriodOptions = () => [
  { id: "M", name: "Mensual" },
  { id: "B", name: "Semestral" },
  { id: "Q", name: "Trimestral" },
  { id: "Y", name: "Anual" },
];

const RenderForm: React.FC<RenderFormProps> = ({
  open,
  onClose,
  item,
  extraData,
  execute,
  errors,
  setErrors,
  reLoad,
  action,
}) => {
  const [formState, setFormState] = useState({
    name: "",
    start_date: "",
    end_date: "",
    amount: "",
    period: "",
    // S67 (HALLAZGO-NEW-63): 'category_id' KILLED. La tabla `budgets`
    // backend NO pineá la col (S9 migración unificada). Si en el
    // futuro se quiere, pinear columna + FK + restaurar este state
    // (D-67-1 binding, cross-project).
    ...item,
  });

  const { showToast } = useAuth();

  useEffect(() => {
    if (item) {
      setFormState({
        name: item.name || "",
        start_date: item.start_date ? item.start_date.split(" ")[0] : "",
        end_date: item.end_date ? item.end_date.split(" ")[0] : "",
        amount: item.amount || "",
        period: item.period || "",
        ...item,
      });
    }
  }, [item]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormState((prev: typeof formState) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const validateForm = useCallback(() => {
    const fields = {
      name: { rules: ["required"] },
      start_date: { rules: ["required"] },
      end_date: { rules: ["required"] },
      amount: { rules: ["required", "number"] },
      period: { rules: ["required"] },
      // S67 (HALLAZGO-NEW-63): 'category_id' KILLED de validateForm.
      // La tabla budgets NO pineá la col.
    };

    const validationErrors = checkRulesFields(
      fields,
      formState,
      action as "add" | "edit",
      execute
    );
    setErrors(validationErrors);
    return !hasErrors(validationErrors);
  }, [formState, action, execute, setErrors]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      showToast("Por favor revise los campos marcados", "warning");
      return;
    }

    const url = "/v3/budgets" + (formState.id ? "/" + formState.id : "");
    const method = formState.id ? "PUT" : "POST";

    try {
      const { data: response, error } = await execute(url, method, formState);

      if (response?.success) {
        showToast(
          action === "add"
            ? "Presupuesto creado con éxito"
            : "Presupuesto actualizado con éxito",
          "success"
        );
        reLoad();
        onClose();
      } else {
        showToast(
          response?.message || "Error al guardar el presupuesto",
          "error"
        );
      }
    } catch (error) {
      console.error(error);
      showToast("Error al guardar el presupuesto", "error");
    }
  }, [formState, validateForm, execute, action, showToast, reLoad, onClose]);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={`${action === "add" ? "Nuevo" : "Editar"} Presupuesto`}
      buttonText={action === "add" ? "Guardar" : "Actualizar"}
      onSave={handleSave}
    >
      <div className={styles.container}>
        <div className={styles.field}>
          <Input
            type="text"
            name="name"
            value={formState.name}
            onChange={handleChange}
            label="Nombre"
            error={errors}
            required
          />
        </div>

        <div className={styles.dateRow}>
          <div className={styles.dateField}>
            <Input
              type="date"
              name="start_date"
              value={formState.start_date}
              onChange={handleChange}
              label="Fecha Inicio"
              error={errors}
              required
            />
          </div>
          <div className={styles.dateField}>
            <Input
              type="date"
              name="end_date"
              value={formState.end_date}
              onChange={handleChange}
              label="Fecha Fin"
              error={errors}
              required
            />
          </div>
        </div>
        <div className={styles.dateRow}>
          <div className={styles.field}>
            <Select
              name="period"
              value={formState.period}
              onChange={handleChange}
              label="Periodo"
              options={getPeriodOptions()}
              error={errors}
              required
            />
          </div>

          {/* S67 (HALLAZGO-NEW-63): 'category_id' Select KILLED. La tabla
              `budgets` backend NO pineá la col. Si en el futuro se
              quiere, pinear columna + FK + restaurar este Select
              (D-67-1 binding, cross-project). */}
        </div>

        <div className={styles.field}>
          <Input
            type="number"
            name="amount"
            value={formState.amount}
            onChange={handleChange}
            label="Monto"
            placeholder="Ej: 5000.00"
            error={errors}
            required
          />
        </div>
      </div>
    </DataModal>
  );
};

export default RenderForm;
