"use client";
import React, { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Switch from "@/mk/components/forms/Switch/Switch";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getFullName } from "@/mk/utils/string";
import useAxios from "@/mk/hooks/useAxios";

const parseBoolean = (value: any) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "Y" ||
  value === "S" ||
  value === "true";

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  extraData,
  user,
  reLoad,
}: any) => {
  const [formState, setFormState]: any = useState({
    ...item,
    has_payment_plan: parseBoolean(item?.has_payment_plan),
    has_membership: parseBoolean(item?.has_membership),
    can_receive_visits:
      item?.can_receive_visits === undefined ||
      item?.can_receive_visits === null
        ? true
        : parseBoolean(item?.can_receive_visits),
  });
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
        const formStateUpdate = {
          ...item,
          type: item.type_id,
          has_payment_plan: parseBoolean(
            item?.has_payment_plan
          ),
          has_membership: parseBoolean(item?.has_membership),
          can_receive_visits:
            item?.can_receive_visits === undefined ||
            item?.can_receive_visits === null
              ? true
              : parseBoolean(item?.can_receive_visits),
        };

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

    if (
      name === "has_payment_plan" ||
      name === "can_receive_visits" ||
      name === "has_membership"
    ) {
      setFormState((prev: any) => ({
        ...prev,
        [name]: checked ?? parseBoolean(value),
      }));
    } else if (name === "type") {
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
    // errs = checkRules({
    //   value: formState.description,
    //   rules: ["required"],
    //   key: "description",
    //   errors: errs,
    // });
    errs = checkRules({
      value: formState.type_id,
      rules: ["required"],
      key: "type_id",
      errors: errs,
    });
    errs = checkRules({
      value: formState.expense_amount,
      rules: ["required", "positive"],
      key: "expense_amount",
      errors: errs,
    });
    errs = checkRules({
      value: formState.dimension,
      rules: ["required", "positive"],
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
        value: formState[`field_${field.id}`] ?? "",
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
        has_payment_plan: Boolean(formState.has_payment_plan),
        has_membership: Boolean(formState.has_membership),
        can_receive_visits: Boolean(formState.can_receive_visits),
        homeowner_id:
          formState.homeowner_id == "X" ? null : formState.homeowner_id,
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
      variant={"mini"}
    >
      <Input
        label="Número de Unidad"
        name="nro"
        value={formState.nro}
        onChange={handleChange}
        error={errors}
        required={true}
        disabled={!!formState.id}
      />

      <Select
        label="Tipo de unidad"
        name="type_id"
        value={formState.type_id}
        options={extraData?.type || []}
        onChange={handleChange}
        error={errors}
        required={true}
        disabled={!!formState.id}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
          gap: 12,
          width: "100%",
        }}
      >
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
        label="Dirección"
        name="description"
        value={formState.description}
        onChange={handleChange}
        error={errors}
        required={false}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          padding: "12px 0",
          width: "100%",
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <p
            style={{
              color: "var(--twhite)",
              fontSize: "var(--sM)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Tiene plan de pagos activo
          </p>
          <p
            style={{
              color: "var(--cWhiteV1)",
              fontSize: "var(--sS)",
              lineHeight: 1.4,
              margin: "4px 0 0",
            }}
          >
            Permite operar sin bloqueo por mora cuando el plan está activo.
          </p>
        </div>
        <Switch
          name="has_payment_plan"
          optionValue={["1", "0"]}
          value={formState.has_payment_plan ? "1" : "0"}
          checked={Boolean(formState.has_payment_plan)}
          onChange={handleChange}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          padding: "12px 0",
          width: "100%",
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <p
            style={{
              color: "var(--twhite)",
              fontSize: "var(--sM)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Tiene membresía activa
          </p>
          <p
            style={{
              color: "var(--cWhiteV1)",
              fontSize: "var(--sS)",
              lineHeight: 1.4,
              margin: "4px 0 0",
            }}
          >
            Permite ver en residentes las áreas sociales marcadas como solo
            miembros.
          </p>
        </div>
        <Switch
          name="has_membership"
          optionValue={["1", "0"]}
          value={formState.has_membership ? "1" : "0"}
          checked={Boolean(formState.has_membership)}
          onChange={handleChange}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          padding: "12px 0",
          width: "100%",
        }}
      >
        <div style={{ flex: "1 1 220px", minWidth: 0 }}>
          <p
            style={{
              color: "var(--twhite)",
              fontSize: "var(--sM)",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Esta unidad puede recibir visitas
          </p>
          <p
            style={{
              color: "var(--cWhiteV1)",
              fontSize: "var(--sS)",
              lineHeight: 1.4,
              margin: "4px 0 0",
            }}
          >
            Al desactivarlo, no aparecerá en la lista de visitas de guardia.
          </p>
        </div>
        <Switch
          name="can_receive_visits"
          optionValue={["1", "0"]}
          value={formState.can_receive_visits ? "1" : "0"}
          checked={Boolean(formState.can_receive_visits)}
          onChange={handleChange}
        />
      </div>

      {/* <Select
        label="Propietario"
        name="homeowner_id"
        value={formState.homeowner_id}
        onChange={handleChange}
        options={[{ id: "X", name: "Sin propietario" }, ...homeownerOptions]}
        error={errors}
        required={true}
      /> */}

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
