"use client";

import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import styles from "./AdministrationAssets.module.css";

const emptyForm = {
  kind: "resident", vehicle_type: "car", plate: "", dpto_id: "", owner_id: "",
  visitor_name: "", brand: "", model: "", color: "", notes: "",
};

export default function VehicleForm({ open, onClose, onSave, errors, setErrors, extraData }: any) {
  const [form, setForm] = useState<any>(emptyForm);
  useEffect(() => {
    if (open) {
      setForm(emptyForm);
      setErrors?.({});
    }
  }, [open, setErrors]);

  const people = (extraData?.units || []).find(
    (unit: any) => String(unit.id) === String(form.dpto_id),
  )?.people || [];

  const handleChange = ({ target: { name, value } }: any) => {
    const nextValue = value === "NONE" ? "" : value;
    setForm((current: any) => ({
      ...current, [name]: nextValue,
      ...(name === "kind" ? { owner_id: "", visitor_name: "", dpto_id: "" } : {}),
      ...(name === "dpto_id" ? { owner_id: "" } : {}),
    }));
    if (errors?.[name]) setErrors?.((current: any) => ({ ...current, [name]: "" }));
  };

  const handleSave = () => {
    if (!form.plate?.trim() || !form.vehicle_type || (form.kind === "resident" && !form.dpto_id)) {
      setErrors?.((current: any) => ({
        ...current,
        ...(!form.plate?.trim() ? { plate: "Ingresa la placa" } : {}),
        ...(!form.vehicle_type ? { vehicle_type: "Selecciona el tipo" } : {}),
        ...(form.kind === "resident" && !form.dpto_id ? { dpto_id: "Selecciona la unidad" } : {}),
      }));
      return;
    }
    onSave?.({
      ...form,
      plate: form.plate.trim().toUpperCase(),
      dpto_id: form.dpto_id || null,
      owner_id: form.kind === "resident" ? form.owner_id || null : null,
      visitor_name: form.kind === "visitor" ? form.visitor_name.trim() || null : null,
    }, setErrors);
  };

  return (
    <DataModal open={open} onClose={onClose} onSave={handleSave} title="Nuevo vehículo"
      buttonText="Registrar vehículo" buttonCancel="Cancelar" maxWidth={760}>
      <div className={styles.form}>
        <p className={styles.helper}>Este registro no crea un ingreso en portería. Los vehículos de visita pueden indicar una unidad de destino.</p>
        <div className={styles.grid}>
          <Select name="kind" label="Vínculo" value={form.kind} onChange={handleChange}
            options={[{ id: "resident", name: "Residente" }, { id: "visitor", name: "Visita" }]} error={errors} required />
          <Select name="vehicle_type" label="Tipo de vehículo" value={form.vehicle_type} onChange={handleChange}
            options={[{ id: "car", name: "Automóvil" }, { id: "motorcycle", name: "Motocicleta" },
              { id: "truck", name: "Camioneta / camión" }, { id: "other", name: "Otro" }]}
            error={errors} required />
          <Input name="plate" label="Placa" value={form.plate} onChange={handleChange}
            error={errors} required maxLength={16} />
          <Select name="dpto_id" label={form.kind === "visitor" ? "Unidad de destino (opcional)" : "Unidad"}
            value={form.dpto_id} onChange={handleChange} options={form.kind === "visitor"
              ? [{ id: "NONE", name: "Sin unidad" }, ...(extraData?.units || [])]
              : extraData?.units || []}
            filter error={errors} required={form.kind === "resident"} />
          {form.kind === "resident" ? (
            <Select name="owner_id" label="Persona de la unidad (opcional)" value={form.owner_id}
              onChange={handleChange} options={[{ id: "NONE", name: "Sin persona" }, ...people]}
              filter error={errors} required={false} />
          ) : (
            <Input name="visitor_name" label="Nombre del visitante (opcional)" value={form.visitor_name}
              onChange={handleChange} error={errors} required={false} maxLength={160} />
          )}
          <Input name="brand" label="Marca (opcional)" value={form.brand} onChange={handleChange}
            error={errors} required={false} maxLength={80} />
          <Input name="model" label="Modelo (opcional)" value={form.model} onChange={handleChange}
            error={errors} required={false} maxLength={80} />
          <Input name="color" label="Color (opcional)" value={form.color} onChange={handleChange}
            error={errors} required={false} maxLength={80} />
        </div>
        <TextArea name="notes" label="Notas (opcional)" value={form.notes}
          onChange={handleChange} error={errors} required={false} maxLength={2000} />
      </div>
    </DataModal>
  );
}
