"use client";
import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useState, useEffect } from "react";
import styles from "./RenderForm.module.css";
import { IconTrash } from "@/components/layout/icons/IconsBiblioteca";
import { checkRules } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";

interface ExtraField {
  id?: number;
  name: string;
  value: string;
}

interface RenderFormProps {
  open: boolean;
  onClose: () => void;
  item: any;
  setItem: (item: any) => void;
  errors: any;
  extraData: any;
  user: any;
  execute: any;
  setErrors: any;
  action: string;
  reLoad: () => void;
}

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  errors,
  extraData,
  user,
  execute,
  setErrors,
  action,
  reLoad,
}: RenderFormProps) => {
  const [extraFields, setExtraFields] = useState<ExtraField[]>([]);
  const [formState, setFormState] = useState({ ...item });
  const [currentErrors, setCurrentErrors] = useState<Record<string, string>>(
    {}
  );
  const { showToast } = useAuth();

  // Sincronizar campos extra al abrir o cuando cambian item/extraData
  useEffect(() => {
    if (action === "add") return;

    // Prioriza campos del item (detalle ya cargado), luego extraData.fields por type_id
    const itemFields =
      (Array.isArray(item?.fields) && item.fields) ||
      (Array.isArray(item?.extras?.fields) && item.extras.fields) ||
      [];

    if (itemFields.length > 0) {
      const mapped = itemFields.map((field: any) => ({
        id: field.id,
        name: field.name,
        value: field.type || "text",
      }));
      setExtraFields(mapped);
      return;
    }

    const edFields = Array.isArray(extraData?.fields) ? extraData.fields : [];
    const fromExtraData = edFields
      .filter(
        (field: any) =>
          field.type_id === item?.id || field.type_id === item?.type_id
      )
      .map((field: any) => ({
        id: field.id,
        name: field.name,
        value: field.type || "text",
      }));

    if (fromExtraData.length > 0) {
      setExtraFields(fromExtraData);
    }
  }, [
    open,
    action,
    item?.id,
    item?.type_id,
    item?.fields,
    item?.extras?.fields,
    extraData?.fields,
  ]);

  // Si no hay campos aún, intenta cargar desde la API /types con fullType: "EXTRA"
  useEffect(() => {
    const shouldFetch =
      open &&
      action !== "add" &&
      (!Array.isArray(item?.fields) || item.fields.length === 0) &&
      (!Array.isArray(item?.extras?.fields) || item.extras.fields.length === 0) &&
      extraFields.length === 0;

    if (!shouldFetch) return;

    const loadExtraFields = async () => {
      try {
        const { data: response } = await execute(
          "/types",
          "GET",
          {
            perPage: -1,
            page: 1,
            fullType: "EXTRA",
          },
          false
        );

        // Acepta distintas formas de respuesta
        const payload = response?.data ?? response ?? {};
        const fieldsPayload =
          (Array.isArray(payload?.fields) && payload.fields) ||
          (Array.isArray(response?.fields) && response.fields) ||
          [];

        const fetched = fieldsPayload
          .filter(
            (field: any) =>
              field.type_id === item?.id || field.type_id === item?.type_id
          )
          .map((field: any) => ({
            id: field.id,
            name: field.name,
            value: field.type || "text",
          }));

        if (fetched.length > 0) {
          setExtraFields(fetched);
        }
      } catch {
        // Silencioso: si falla, mantenemos extraFields vacío
      }
    };

    loadExtraFields();
  }, [open, action, item?.id, item?.type_id, item?.fields, item?.extras?.fields, extraFields.length]);

  // Limpiar errores cuando se cierre el modal
  useEffect(() => {
    if (!open) {
      setCurrentErrors({});
    }
  }, [open]);

  const handleChange = (e: any) => {
    let value = e.target.value;
    const fieldName = e.target.name;

    setFormState({ ...formState, [fieldName]: value });

    // Limpiar error del campo específico si existe
    if (currentErrors[fieldName]) {
      setCurrentErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleAddField = () => {
    setExtraFields([...extraFields, { name: "", value: "text" }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = extraFields.filter((_, i) => i !== index);
    setExtraFields(newFields);
  };

  const handleExtraFieldChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const newFields = [...extraFields];
    newFields[index] = { ...newFields[index], [field]: value };
    setExtraFields(newFields);

    // Limpiar error del campo específico si existe
    const fieldKey = `extra_field_name_${index}`;
    if (currentErrors[fieldKey]) {
      setCurrentErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validate = () => {
    let errs: Record<string, string> = {};

    // Validar nombre
    const nameError = checkRules({
      value: formState.name,
      rules: ["required"],
      key: "name",
      errors: errs,
    });

    if (typeof nameError === "string" && nameError) {
      errs.name = nameError;
    } else if (nameError && typeof nameError === "object") {
      Object.entries(nameError).forEach(([k, v]) => {
        if (v) errs[k] = v;
      });
    }

    // Validar campos extras
    extraFields.forEach((field, index) => {
      if (!field.name.trim()) {
        errs[`extra_field_name_${index}`] = "Este campo es requerido";
      }
    });

    setCurrentErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const formData = {
      name: formState.name,
      description: formState.description || "",
      fields: extraFields.map((field) => {
        let fieldData: any = {
          name: field.name,
          type: field.value,
        };

        if (field.id) {
          fieldData.id = field.id;
        }
        return fieldData;
      }),
    };

    const method = action === "add" ? "POST" : "PUT";
    const endpoint = action === "add" ? "/types" : `/types/${formState.id}`;

    const { data: response } = await execute(endpoint, method, formData, false);

    if (response?.success === true) {
      reLoad();
      showToast(response?.message, "success");
      onClose();
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={
        action === "add" ? "Agregar Tipo de Unidad" : "Editar Tipo de Unidad"
      }
      onSave={handleSubmit}
    >
      <Input
        name="name"
        label="Nombre de la unidad"
        value={formState?.name || ""}
        onChange={handleChange}
        error={currentErrors}
        disabled={action !== "add" && item.is_fixed === "A"}
        required
      />
      <div className={styles.textContainer}>
        <div>Campos adicionales</div>
        <div>
          Campos que una unidad puede o no tener en un condominio (Eje: Garaje,
          Baulera, entre otros)
        </div>
      </div>
      {extraFields.map((field, index) => (
        <div key={field.id || `extra-field-${index}`} className={styles.extraFieldRow}>
          <Input
            name={`extra_field_name_${index}`}
            label="Nombre del Campo"
            value={field.name}
            onChange={(e) =>
              handleExtraFieldChange(index, "name", e.target.value)
            }
            style={{ flex: 1 }}
            iconRight={<IconTrash onClick={() => handleRemoveField(index)} />}
            error={currentErrors}
            required
          />
        </div>
      ))}

      <button
        type="button"
        onClick={handleAddField}
        className={styles.addFieldButton}
      >
        Agregar Campo Extra
      </button>
    </DataModal>
  );
};

export default RenderForm;
