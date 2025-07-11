"use client";
import React, { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getFullName } from "@/mk/utils/string";
import useAxios from "@/mk/hooks/useAxios";

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  extraData,
  user,
  reLoad,
}: any) => {
  const [formState, setFormState]: any = useState({ ...item });
  const [errors, setErrors]: any = useState({});
  const [typeFields, setTypeFields]: any = useState([]);
  const [enabledFields, setEnabledFields]: any = useState({});
  const { showToast } = useAuth();
  const { execute } = useAxios();

  useEffect(() => {
    if (item?.type_id) {
      const selectedType = extraData?.type?.find(
        (t: any) => t.id === parseInt(item.type_id)
      );
      if (selectedType) {
        const fields = selectedType.fields || [];
        setTypeFields(fields);

        // Inicializar los campos habilitados y sus valores
        const enabledFieldsInit: any = {};
        const formStateUpdate = { ...item, type: item.type_id };

        // Procesar field_values si existen
        if (item.field_values && Array.isArray(item.field_values)) {
          item.field_values.forEach((fieldValue: any) => {
            enabledFieldsInit[fieldValue.field_id] = true;
            formStateUpdate[`field_${fieldValue.field_id}`] = fieldValue.value;
          });
        }

        setEnabledFields(enabledFieldsInit);
        setFormState(formStateUpdate);
      }
    }
  }, [item, extraData]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    if (name === "type") {
      const selectedType = extraData?.type?.find(
        (t: any) => t.id === parseInt(value)
      );
      const fields = selectedType?.fields || [];
      setTypeFields(fields);
      setEnabledFields({});
      setFormState((prev: any) => ({
        ...prev,
        [name]: value,
        // Limpiar los valores de los campos adicionales al cambiar el tipo
        ...fields.reduce((acc: any, field: any) => {
          acc[`field_${field.id}`] = "";
          return acc;
        }, {}),
      }));
    } else if (name.startsWith("enable_")) {
      const fieldId = name.replace("enable_", "");
      setEnabledFields((prev: any) => ({
        ...prev,
        [fieldId]: checked,
      }));
      if (!checked) {
        setFormState((prev: any) => ({
          ...prev,
          [`field_${fieldId}`]: "",
        }));
      }
    } else {
      setFormState((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    let errs: any = {};
    errs = checkRules({
      value: formState.nro,
      rules: ["required"],
      key: "nro",
      errors: errs,
    });
    errs = checkRules({
      value: formState.description,
      rules: ["required"],
      key: "description",
      errors: errs,
    });
    errs = checkRules({
      value: formState.type_id,
      rules: ["required"],
      key: "type_id",
      errors: errs,
    });
    errs = checkRules({
      value: formState.expense_amount,
      rules: ["required"],
      key: "expense_amount",
      errors: errs,
    });
    errs = checkRules({
      value: formState.dimension,
      rules: ["required"],
      key: "dimension",
      errors: errs,
    });
    // errs = checkRules({
    //   value: formState.homeowner_id,
    //   rules: ["required"],
    //   key: "homeowner_id",
    //   errors: errs,
    // });
    setErrors(errs);
    return errs;
  };

  const onSave = async () => {
    let method = formState.id ? "PUT" : "POST";
    if (hasErrors(validate())) return;

    // Preparar los campos adicionales habilitados en el formato requerido
    const fields = typeFields
      .filter((field: any) => enabledFields[field.id])
      .map((field: any) => ({
        field_id: field.id,
        value: formState[`field_${field.id}`] || "",
      }));

    const { data: response } = await execute(
      "/dptos" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        nro: formState.nro,
        description: formState.description,
        type_id: parseInt(formState.type_id),
        expense_amount: formState.expense_amount,
        dimension: formState.dimension,
        homeowner_id: formState.homeowner_id,
        fields: fields,
      },
      false
    );
    if (response?.success === true) {
      reLoad();
      if (setItem) setItem(formState);
      showToast(response?.message, "success");
      onClose();
    } else {
      showToast(response?.message, "error");
    }
  };

  const homeownerOptions =
    extraData?.homeowners?.map((c: any) => ({
      id: c.id,
      name: getFullName(c),
    })) || [];

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={formState.id ? "Editar unidad" : "Nueva unidad"}
      onSave={onSave}
    >
      <Input
        label="Número de Unidad"
        name="nro"
        value={formState.nro}
        onChange={handleChange}
        error={errors}
        required={true}
      />

      <Select
        label="Tipo de unidad"
        name="type_id"
        value={formState.type_id}
        options={extraData?.type || []}
        onChange={handleChange}
        error={errors}
        required={true}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <Input
          label="Dimensiones en m²"
          name="dimension"
          value={formState.dimension}
          onChange={handleChange}
          type="number"
          error={errors}
          required={true}
        />
        <Input
          label="Monto de expensa (Bs)"
          name="expense_amount"
          value={formState.expense_amount}
          onChange={handleChange}
          type="number"
          error={errors}
          required={true}
        />
      </div>
      <TextArea
        label="Dirrección"
        name="description"
        value={formState.description}
        onChange={handleChange}
        error={errors}
        required={true}
      />

      <Select
        label="Propietario"
        name="homeowner_id"
        value={formState.homeowner_id}
        onChange={handleChange}
        options={homeownerOptions}
        error={errors}
        required={true}
      />

      {/* campos extra --- para un futuro quiza
      {typeFields.map((field: any) => (
        <div key={field.id} style={{ marginBottom: 'var(--spS)',display:'flex' ,gap:5}}>
          <div style={{ display: 'flex', alignItems: 'center',width:'50%'}}>
            <Input
              name={`field_extra_${field.id}`}
              value={ field.name}
              onChange={handleChange}
              type={field.type}
              error={errors}
              disabled={true}
              iconRight={  <input
                type="checkbox"
                id={`enable_${field.id}`}
                name={`enable_${field.id}`}
                checked={enabledFields[field.id] || false}
                onChange={handleChange}
                />}
              />
            

          </div>
          {enabledFields[field.id] && (
            <Input
              label={field.name}
              name={`field_${field.id}`}
              value={formState[`field_${field.id}`] || ''}
              onChange={handleChange}
              type={field.type}
              error={errors}
              style={{ width:'50%' }}

            />
          )}
        </div>
      ))} */}
    </DataModal>
  );
};

export default RenderForm;
