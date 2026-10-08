"use client";

import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import styles from "./AdministrationAssets.module.css";

const emptyForm = {
  kind: "resident", vehicle_type: "car", plate: "", dpto_id: "", owner_id: "",
  brand: "", model: "", color: "", notes: "",
  images: [] as string[],
};

const initialForm = (item: any) => ({
  ...emptyForm,
  ...Object.fromEntries(Object.keys(emptyForm).map((key) => [key, item?.[key] ?? emptyForm[key as keyof typeof emptyForm]])),
  plate: String(item?.plate ?? "").toUpperCase(),
  images: Array.isArray(item?.images) ? item.images : [],
});

export default function VehicleForm({ open, onClose, onSave, errors, setErrors, extraData, item }: any) {
  const [form, setForm] = useState<any>(() => initialForm(item));
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (open) {
      setForm(initialForm(item));
      setErrors?.({});
    }
  }, [open, item?.id, setErrors]);

  const people = (extraData?.units || []).find(
    (unit: any) => String(unit.id) === String(form.dpto_id),
  )?.people || [];

  const handleChange = ({ target: { name, value } }: any) => {
    const nextValue = name === "plate" ? String(value).toUpperCase() : value === "NONE" ? "" : value;
    setForm((current: any) => ({
      ...current, [name]: nextValue,
      ...(name === "dpto_id" ? { owner_id: "" } : {}),
    }));
    if (errors?.[name]) setErrors?.((current: any) => ({ ...current, [name]: "" }));
  };

  const handleSave = () => {
    if (uploading) return;
    if (!form.plate?.trim() || !form.vehicle_type || !form.dpto_id) {
      setErrors?.((current: any) => ({
        ...current,
        ...(!form.plate?.trim() ? { plate: "Ingresa la placa" } : {}),
        ...(!form.vehicle_type ? { vehicle_type: "Selecciona el tipo" } : {}),
        ...(!form.dpto_id ? { dpto_id: "Selecciona la unidad" } : {}),
      }));
      return;
    }
    onSave?.({
      ...(item?.id ? { id: item.id } : {}),
      kind: "resident",
      vehicle_type: form.vehicle_type,
      plate: form.plate.trim().toUpperCase(),
      dpto_id: form.dpto_id || null,
      owner_id: form.owner_id || null,
      brand: form.brand,
      model: form.model,
      color: form.color,
      notes: form.notes,
      images: form.images,
    }, setErrors);
  };

  return (
    <DataModal open={open} onClose={onClose} onSave={handleSave}
      title={item?.id ? "Editar vehículo" : "Nuevo vehículo"}
      buttonText={uploading ? "Subiendo fotografías…" : item?.id ? "Guardar cambios" : "Registrar vehículo"}
      buttonCancel="Cancelar" disabled={uploading} maxWidth={760}>
      <div className={styles.form}>
        <p className={styles.helper}>Registra un vehículo de una unidad. Los vehículos de visita se muestran automáticamente a partir de los ingresos de portería.</p>
        <div className={styles.grid}>
          <Select name="vehicle_type" label="Tipo de vehículo" value={form.vehicle_type} onChange={handleChange}
            options={[{ id: "car", name: "Automóvil" }, { id: "motorcycle", name: "Motocicleta" },
              { id: "truck", name: "Camioneta / camión" }, { id: "other", name: "Otro" }]}
            error={errors} required />
          <Input name="plate" label="Placa" value={form.plate} onChange={handleChange}
            error={errors} required maxLength={16} styleInput={{ textTransform: "uppercase" }} />
          <Select name="dpto_id" label="Unidad" value={form.dpto_id} onChange={handleChange}
            options={extraData?.units || []} filter error={errors} required />
          <Select name="owner_id" label="Persona de la unidad (opcional)" value={form.owner_id}
            onChange={handleChange} options={[{ id: "NONE", name: "Sin persona" }, ...people]}
            filter error={errors} required={false} />
          <Input name="brand" label="Marca (opcional)" value={form.brand} onChange={handleChange}
            error={errors} required={false} maxLength={80} />
          <Input name="model" label="Modelo (opcional)" value={form.model} onChange={handleChange}
            error={errors} required={false} maxLength={80} />
          <Select name="color" label="Color (opcional)" value={form.color} onChange={handleChange}
            options={[{ id: "NONE", name: "Sin especificar" }, ...(extraData?.vehicleColors || [])]}
            filter error={errors} required={false} />
        </div>
        <UploadFileV3 name="images" formState={form} setFormState={setForm} cant={6}
          maxMB={2} onUploadStateChange={setUploading} preserveExistingOnRemove
          error={errors} title="Sube hasta 6 fotografías del vehículo" />
        <TextArea name="notes" label="Notas (opcional)" value={form.notes}
          onChange={handleChange} error={errors} required={false} maxLength={2000} />
      </div>
    </DataModal>
  );
}
