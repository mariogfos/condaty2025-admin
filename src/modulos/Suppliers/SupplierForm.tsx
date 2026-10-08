"use client";

import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import styles from "./Suppliers.module.css";

const emptyForm = {
  type: "company",
  name: "",
  service_category: "",
  document_number: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  status: "A",
};

export default function SupplierForm({ open, onClose, item, onSave, errors, setErrors }: any) {
  const [form, setForm] = useState<any>(emptyForm);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...(item || {}) });
      setErrors?.({});
    }
  }, [open, item?.id, setErrors]);

  const handleChange = ({ target: { name, value } }: any) => {
    setForm((current: any) => ({ ...current, [name]: value }));
    if (errors?.[name]) setErrors?.((current: any) => ({ ...current, [name]: "" }));
  };

  const handleSave = () => {
    if (!form.name?.trim()) {
      setErrors?.((current: any) => ({ ...current, name: "Ingresa el nombre del proveedor" }));
      return;
    }
    onSave?.({ ...form, name: form.name.trim() }, setErrors);
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title={item?.id ? "Editar proveedor" : "Nuevo proveedor"}
      buttonText={item?.id ? "Guardar cambios" : "Crear proveedor"}
      buttonCancel="Cancelar"
      maxWidth={720}
    >
      <div className={styles.form}>
        <p className={styles.helper}>El proveedor pertenece únicamente al condominio actual. Asociarlo a un egreso es opcional.</p>
        <div className={styles.formGrid}>
          <Select
            name="type"
            label="Tipo de proveedor"
            value={form.type}
            onChange={handleChange}
            options={[{ id: "company", name: "Empresa" }, { id: "person", name: "Persona" }]}
            error={errors}
          />
          <Input
            name="name"
            label={form.type === "person" ? "Nombre completo" : "Nombre o razón social"}
            value={form.name || ""}
            onChange={handleChange}
            error={errors}
            required
            maxLength={160}
          />
          <Input
            name="service_category"
            label="Rubro o servicio"
            placeholder="Ej. Seguridad, jardinería, administración"
            value={form.service_category || ""}
            onChange={handleChange}
            error={errors}
            maxLength={100}
          />
          <Input
            name="document_number"
            label="CI / NIT (opcional)"
            value={form.document_number || ""}
            onChange={handleChange}
            error={errors}
            maxLength={40}
          />
          <Input
            name="contact_name"
            label="Persona de contacto"
            value={form.contact_name || ""}
            onChange={handleChange}
            error={errors}
            maxLength={120}
          />
          <Input
            name="phone"
            label="Teléfono"
            value={form.phone || ""}
            onChange={handleChange}
            error={errors}
            maxLength={40}
          />
          <Input
            name="email"
            label="Correo electrónico"
            value={form.email || ""}
            onChange={handleChange}
            error={errors}
            maxLength={160}
          />
          {item?.id ? (
            <Select
              name="status"
              label="Estado"
              value={form.status}
              onChange={handleChange}
              options={[{ id: "A", name: "Activo" }, { id: "I", name: "Inactivo" }]}
              error={errors}
            />
          ) : null}
        </div>
        <Input
          name="address"
          label="Dirección"
          value={form.address || ""}
          onChange={handleChange}
          error={errors}
          maxLength={255}
        />
        <TextArea
          name="notes"
          label="Notas internas"
          value={form.notes || ""}
          onChange={handleChange}
          error={errors}
          maxLength={2000}
        />
      </div>
    </DataModal>
  );
}
