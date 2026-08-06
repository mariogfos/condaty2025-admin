import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useState } from "react";
import DataModalV2 from "@/mk/components/ui/DataModalV2/DataModalV2";
import { IconDepartment2 } from "@/components/layout/icons/IconsBiblioteca";
import Br from "@/components/Detail/Br";
import styles from "./RenderForm.module.css";

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
      "/v3/clients" + (formState.id ? "/" + formState.id : ""),
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
      title={formState.id ? "Editar condominio" : "Crear condominio"}
      subtitle="Completa el formulario para crear un nuevo condominio"
      onSave={_onSave}
      variant={"mini"}
      maxWidth={560}
    >
      <p className={styles.title}>Información básica</p>
      <p className={styles.subtitle}>
        Datos visibles para todos los propietarios y residentes.
      </p>
      <Input
        name="name"
        value={formState.name || ""}
        onChange={handleChange}
        label="Nombre del condominio"
        error={errors}
        type="text"
        disabled={item?.isInUse}
        required
      />
      <Select
        label="Tipo de condominio"
        name="type"
        value={formState.type || ""}
        disabled={item?.isInUse}
        optionLabel="name"
        options={extraData?.types || []}
        optionValue="id"
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
        label="Selecciona la privacidad"
        name="privacy"
        value={formState.privacy || ""}
        optionLabel="name"
        disabled={item?.id}
        options={extraData?.privacy || []}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />
    </DataModalV2>
  );
};

export default RenderForm;
