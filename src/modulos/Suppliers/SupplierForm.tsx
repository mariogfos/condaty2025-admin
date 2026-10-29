"use client";

import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import SupplierCategoryPicker, { categoryKey } from "./SupplierCategoryPicker";
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

export default function SupplierForm({ open, onClose, item, onSave, errors, setErrors, extraData, getExtraData, execute, showToast }: any) {
  const [form, setForm] = useState<any>(emptyForm);
  const [createdCategories, setCreatedCategories] = useState<{ id: string; name: string }[]>([]);
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...emptyForm, ...(item || {}) });
      setErrors?.({});
    }
  }, [open, item?.id, setErrors]);

  useEffect(() => setCreatedCategories([]), [extraData]);

  const handleChange = ({ target: { name, value } }: any) => {
    setForm((current: any) => ({ ...current, [name]: value }));
    if (errors?.[name]) setErrors?.((current: any) => ({ ...current, [name]: "" }));
  };

  const handleSave = () => {
    if (!form.name?.trim()) {
      setErrors?.((current: any) => ({ ...current, name: "Ingresa el nombre del proveedor" }));
      return;
    }
    const category = form.service_category?.trim();
    const selected = categories.find(({ name }) => categoryKey(name) === categoryKey(category || ""));
    if (category && !selected) {
      setErrors?.((current: any) => ({ ...current, service_category: "Selecciona un rubro o créalo desde la lista." }));
      return;
    }
    onSave?.({ ...form, name: form.name.trim(), service_category: selected?.name || "" }, setErrors);
  };

  const categories = [...(extraData?.serviceCategories || []), ...createdCategories];
  if (item?.service_category && !categories.some(({ name }) => categoryKey(name) === categoryKey(item.service_category))) {
    categories.push({ id: item.service_category, name: item.service_category });
  }

  const createCategory = async (name: string): Promise<boolean> => {
    if (creatingCategory) return false;
    setCreatingCategory(true);
    try {
      const { data, error } = await execute("/suppliers/service-categories", "POST", { name }, false, true);
      if (!data?.success || !data?.data?.name) {
        showToast?.(data?.message || error?.data?.message || "No se pudo crear el rubro", "error");
        return false;
      }
      const created = data.data;
      setCreatedCategories((current) => current.some(({ name }) => categoryKey(name) === categoryKey(created.name))
        ? current : [...current, created]);
      handleChange({ target: { name: "service_category", value: created.name } });
      void getExtraData?.();
      return true;
    } catch {
      showToast?.("No se pudo crear el rubro", "error");
      return false;
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      onSave={handleSave}
      title={item?.id ? "Editar proveedor" : "Nuevo proveedor"}
      buttonText={item?.id ? "Guardar cambios" : "Crear proveedor"}
      buttonCancel="Cancelar"
      disabled={creatingCategory}
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
          <SupplierCategoryPicker
            value={form.service_category || ""}
            options={categories}
            onChange={(value) => handleChange({ target: { name: "service_category", value } })}
            onCreate={createCategory}
            creating={creatingCategory}
            error={errors}
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
