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
      value: formState?.type,
      rules: ["required"],
      key: "type",
      errors,
    });
    errors = checkRules({
      value: formState?.privacy,
      rules: ["required"],
      key: "privacy",
      errors,
    });

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validate())) return;
    let method = formState.id ? "PUT" : "POST";
    const { data } = await execute(
      "/clients" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        name: formState?.name || "",
        type: formState?.type || "",
        privacy: formState?.privacy || "",
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

  return (
    <DataModalV2
      open={open}
      onClose={onClose}
      icon={<IconDepartment2 />}
      title={formState.id ? "Editar superadmin" : "Crear superadmin"}
      subtitle="Completa el formulario para crear un nuevo superadmin"
      onSave={_onSave}
      variant={"mini"}
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
          value={formState.ci || ""}
          onChange={handleChange}
          error={errors}
          required
        />
        <Input
          label="Celular"
          name="phone"
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
      <p className={styles.title}>Privacidad</p>
      <p className={styles.subtitle}>
        Determina si el condominio será público o interno.
      </p>
      <Select
        label="Selecciona el rol"
        name="role"
        value={formState.role || ""}
        optionLabel="name"
        disabled={item?.id}
        options={extraData?.roles || []}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />
    </DataModalV2>
  );
};

export default RenderForm;
