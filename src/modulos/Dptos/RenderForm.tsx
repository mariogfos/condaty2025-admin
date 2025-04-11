'use client';
import React, { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getFullName } from "@/mk/utils/string";

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  user,
  reLoad,
}: any) => {
  const [formState, setFormState]: any = useState({ ...item });
  const [errors, setErrors]: any = useState({});
  const { showToast } = useAuth();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
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
      value: formState.status,
      rules: ["required"],
      key: "status",
      errors: errs,
    });
    setErrors(errs);
    return errs;
  };

  const onSave = async () => {
    let method = formState.id ? "PUT" : "POST";
    if (hasErrors(validate())) return;
    const { data: response } = await execute(
      "/dptos" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        nro: formState.nro,
        description: formState.description,
        status: formState.status,
        owner_id: formState.owner_id,
      },
      false
    );
    if (response?.success === true) {
      reLoad();
      setItem(formState);
      showToast(response?.message, "success");
      onClose();
    } else {
      showToast(response?.message, "error");
    }
  };

  const ownerOptions = extraData?.owners?.map((owner: any) => ({
    id: owner.id,
    name: getFullName(owner),
  })) || [];

  return (
    <DataModal open={open} onClose={onClose} title="Departamento" onSave={onSave}>
      <Input
        label="Número de departamento"
        name="nro"
        value={formState.nro}
        onChange={handleChange}
        error={errors}
      />
      <TextArea
        label="Descripción"
        name="description"
        value={formState.description}
        onChange={handleChange}
        error={errors}
      />
      <Select
        label="Estado"
        name="status"
        value={formState.status}
        onChange={handleChange}
        options={[
          { id: "A", name: "Activo" },
          { id: "X", name: "Inactivo" },
        ]}
        error={errors}
      />
      <Select
        label="Titular"
        name="owner_id"
        value={formState.owner_id}
        onChange={handleChange}
        options={ownerOptions}
        error={errors}
      />
    </DataModal>
  );
};

export default RenderForm;