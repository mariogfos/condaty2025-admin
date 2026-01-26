import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useState } from "react";
import DataModalV2 from "@/mk/components/ui/DataModalV2/DataModalV2";
import { IconDepartment2 } from "@/components/layout/icons/IconsBiblioteca";
import Br from "@/components/Detail/Br";
import styles from "./RenderForm.module.css";
import InputFullName from "@/mk/components/forms/InputFullName/InputFullName";

const RenderForm = ({
  open,
  onClose,
  item,
  execute,
  extraData,
  reLoad,
}: any) => {
  const [formState, setFormState] = useState({ ...item });
  const [errors, setErrors] = useState({});
  const { showToast } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };
  const validate = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState?.name,
      rules: ["required"],
      key: "name",
      errors,
    });
    errors = checkRules({
      value: formState?.ci,
      rules: ["required"],
      key: "ci",
      errors,
    });
    errors = checkRules({
      value: formState?.phone,
      rules: ["required"],
      key: "phone",
      errors,
    });

    errors = checkRules({
      value: formState?.last_name,
      rules: ["required"],
      key: "last_name",
      errors,
    });
    errors = checkRules({
      value: formState?.middle_name,
      rules: ["alpha"],
      key: "middle_name",
      errors,
    });
    errors = checkRules({
      value: formState?.mother_last_name,
      rules: ["alpha"],
      key: "mother_last_name",
      errors,
    });
    errors = checkRules({
      value: formState?.email,
      rules: ["required", "email"],
      key: "email",
      errors,
    });

    errors = checkRules({
      value: formState?.fosrole_id,
      rules: ["required"],
      key: "fosrole_id",
      errors,
    });

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validate())) return;
    if (await onExistEmail()) {
      setErrors({ email: "El correo electrónico ya existe" });
      return;
    }
    let method = formState.id ? "PUT" : "POST";
    const { data } = await execute(
      "/users" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        name: formState?.name || "",
        ci: formState?.ci || "",
        phone: formState?.phone || "",
        last_name: formState?.last_name || "",
        middle_name: formState?.middle_name || "",
        mother_last_name: formState?.mother_last_name || "",
        email: formState?.email || "",
        fosrole_id: formState?.fosrole_id || "",
      },
    );

    if (data?.success) {
      onClose();
      reLoad();
      showToast(data.message, "success");
    } else {
      showToast(data.message, "error");
    }
  };
  const onExistEmail = async () => {
    if (formState.email === item.email) {
      return false;
    }
    const { data: response } = await execute(
      "/users",
      "GET",
      {
        searchBy: formState.email,
        type: "email",
        fullType: "EXIST",
        cols: "id",
      },
      false,
      true,
    );
    if (response?.data?.data?.id != null) {
      // setErrors({ ...errors, email: "El correo electrónico ya existe" });
      return true;
    }
    return false;
  };
  return (
    <DataModalV2
      open={open}
      onClose={onClose}
      icon={<IconDepartment2 />}
      title={formState.id ? "Editar superadmin" : "Crear superadmin"}
      subtitle="Completa el formulario para crear un nuevo superadmin"
      onSave={_onSave}
      variant={"mini"}
      buttonText={formState.id ? "Actualizar superadmin" : "Crear superadmin"}
      maxWidth={560}
    >
      <p className={styles.title}>Información personal</p>
      <p className={styles.subtitle}>
        Ingresa los datos personales del administrador.
      </p>
      <div style={{ display: "flex", gap: "12px" }}>
        <Input
          label="Carnet de identidad"
          name="ci"
          type="number"
          value={formState.ci || ""}
          onChange={handleChange}
          error={errors}
          required
        />
        <Input
          label="Celular"
          name="phone"
          type="number"
          value={formState.phone || ""}
          onChange={handleChange}
          error={errors}
          required
        />
      </div>
      <InputFullName
        name="name"
        value={formState}
        onChange={handleChange}
        errors={errors}
      />
      <Input
        label="Correo electrónico"
        name="email"
        value={formState.email || ""}
        onChange={handleChange}
        error={errors}
        required
      />
      <Br
        style={{
          margin: "20px 0px",
          backgroundColor: "var(--cBackground)",
          height: 1,
        }}
      />
      <p className={styles.title}>Roles</p>
      <p className={styles.subtitle}>
        Selecciona el tipo de permisos que tendrá este administrador.
      </p>
      <Select
        label="Selecciona el rol"
        name="fosrole_id"
        value={formState.fosrole_id || ""}
        optionLabel="name"
        options={extraData?.fosRoles || []}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />
    </DataModalV2>
  );
};

export default RenderForm;
