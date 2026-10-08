"use client";

import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import styles from "./AdministrationAssets.module.css";

const emptyForm = {
  owner_id: "", name: "", gender: "", specie_id: "", breed: "", color: "",
  age_year: "", age_month: "", description: "", images: [] as string[],
};

export default function PetForm({ open, onClose, onSave, errors, setErrors, extraData }: any) {
  const [form, setForm] = useState<any>(emptyForm);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, images: [] });
      setErrors?.({});
    }
  }, [open, setErrors]);

  const handleChange = ({ target: { name, value } }: any) => {
    setForm((current: any) => ({ ...current, [name]: value }));
    if (errors?.[name]) setErrors?.((current: any) => ({ ...current, [name]: "" }));
  };

  const handleSave = () => {
    if (uploading) return;
    const required = ["owner_id", "name", "gender", "specie_id", "breed", "color", "age_year", "age_month", "description"];
    const missing = required.find((field) => String(form[field] ?? "").trim() === "");
    if (missing || !form.images?.length) {
      setErrors?.((current: any) => ({
        ...current,
        [missing || "images"]: "Este campo es obligatorio",
      }));
      return;
    }
    onSave?.({ ...form, name: form.name.trim(), breed: form.breed.trim(), color: form.color.trim() }, setErrors);
  };

  return (
    <DataModal open={open} onClose={onClose} onSave={handleSave} title="Nueva mascota"
      buttonText={uploading ? "Subiendo fotografía…" : "Registrar mascota"}
      buttonCancel="Cancelar" disabled={uploading} maxWidth={760}>
      <div className={styles.form}>
        <p className={styles.helper}>La mascota quedará vinculada al residente seleccionado y al condominio actual.</p>
        <Select name="owner_id" label="Residente responsable" value={form.owner_id}
          onChange={handleChange} options={extraData?.people || []} filter error={errors} required />
        <UploadFileV3 name="images" formState={form} setFormState={setForm} cant={1}
          onUploadStateChange={setUploading} error={errors} title="Sube una fotografía de la mascota" />
        <div className={styles.grid}>
          <Input name="name" label="Nombre" value={form.name} onChange={handleChange} error={errors} required />
          <Select name="gender" label="Sexo" value={form.gender} onChange={handleChange}
            options={[{ id: "M", name: "Macho" }, { id: "F", name: "Hembra" }]} error={errors} required />
          <Select name="specie_id" label="Especie" value={form.specie_id} onChange={handleChange}
            options={extraData?.species || []} error={errors} required />
          <Input name="breed" label="Raza" value={form.breed} onChange={handleChange} error={errors} required />
          <Input name="color" label="Color" value={form.color} onChange={handleChange} error={errors} required />
          <div />
          <Input name="age_year" label="Edad en años" type="number" min={0} max={50}
            value={form.age_year} onChange={handleChange} error={errors} required />
          <Input name="age_month" label="Edad en meses" type="number" min={0} max={11}
            value={form.age_month} onChange={handleChange} error={errors} required />
        </div>
        <TextArea name="description" label="Descripción" value={form.description}
          onChange={handleChange} error={errors} required maxLength={2000} />
      </div>
    </DataModal>
  );
}
