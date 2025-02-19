import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useState } from "react";

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
  const [formState, setFormState] = useState({ ...item });
  const [errors, setErrors] = useState({});
  const [oldEmail, setOldEmail] = useState(formState.email);
  const { showToast } = useAuth();
  const handleChange = (e: any) => {
    let value = e.target.value;

    setFormState({ ...formState, [e.target.name]: value });
  };
  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState.name,
      rules: ["required"],
      key: "name",
      errors,
    });
    errors = checkRules({
      value: formState.middle_name,
      rules: [""],
      key: "middle_name",
      errors,
    });
    errors = checkRules({
      value: formState.last_name,
      rules: ["required"],
      key: "last_name",
      errors,
    });
    errors = checkRules({
      value: formState.mother_last_name,
      rules: [""],
      key: "mother_last_name",
      errors,
    });
    errors = checkRules({
      value: formState.ci,
      rules: ["required"],
      key: "ci",
      errors,
    });
    errors = checkRules({
      value: formState.email,
      rules: ["required", "email"],
      key: "email",
      errors,
    });
    errors = checkRules({
      value: formState.rep_email,
      rules: ["required", "same:email"],
      key: "rep_email",
      errors,
      data: formState,
    });

    setErrors(errors);
    return errors;
  };
  const onCheckEmail = async () => {
    if (formState.email === oldEmail) {
      return;
    }
    const { data: response } = await execute(
      "/adm-exist",
      "GET",
      {
        searchBy: formState.email,
        type: "email",
        cols: "id",
      },
      false,
      true
    );
    if (response?.data != null) {
      setErrors({ ...errors, email: "El correo electrónico ya existe" });
    }
  };
  const onSave = async () => {
    if (hasErrors(validate())) return;
    const { data: response } = await execute(
      "/users/" + formState.id,
      "PUT",
      {
        name: formState.name,
        middle_name: formState.middle_name,
        last_name: formState.last_name,
        mother_last_name: formState.mother_last_name,
        ci: formState.ci,
        email: formState.email,
        role_id: formState.role_id,
      },
      false
    );
    if (response?.success == true) {
      reLoad();
      setItem(formState);
      showToast(response?.message, "success");
      onClose();
    }
  };

  // const getRoles = () => {
  //   let roles = [];
  //   console.log(item);
  //   extraData?.roles?.map((rol:any)=>{})
  //   if (item.level) {
  //   }
  //   console.log(extraData.roles);
  // };
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Editar administrador"
      onSave={onSave}
    >
      <Input
        label="Primer nombre"
        name="name"
        value={formState.name}
        onChange={handleChange}
        error={errors}
      />
      <Input
        label="Segundo nombre"
        name="middle_name"
        value={formState.middle_name}
        onChange={handleChange}
        error={errors}
      />
      <Input
        label="Apellido paterno"
        name="last_name"
        value={formState.last_name}
        onChange={handleChange}
        error={errors}
      />
      <Input
        label="Apellido materno"
        name="mother_last_name"
        value={formState.mother_last_name}
        onChange={handleChange}
        error={errors}
      />
      <Select
        label="Rol"
        name="role_id"
        value={formState.role_id}
        options={extraData?.roles}
        disabled
        optionLabel="name"
        onChange={handleChange}
        error={errors}
      />
      <Input
        label="Cédula de identidad"
        name="ci"
        value={formState.ci}
        onChange={handleChange}
        error={errors}
        disabled={true}
      />
      <Input
        label="Correo electrónico"
        name="email"
        value={formState.email}
        onChange={handleChange}
        onBlur={onCheckEmail}
        error={errors}
      />
      <Input
        label="Repita el correo electrónico"
        name="rep_email"
        value={formState.rep_email}
        onChange={handleChange}
        error={errors}
      />
    </DataModal>
  );
};

export default RenderForm;
