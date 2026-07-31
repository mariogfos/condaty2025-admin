import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useCallback, useState } from "react";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import InputFullName from "@/mk/components/forms/InputFullName/InputFullName";
import UploadFileSingle from "@/mk/components/forms/UploadFileSingle/UploadFileSingle";

const RenderForm = ({ open, onClose, item, execute, reLoad }: any) => {
  const [formState, setFormState] = useState({ ...item });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCi, setIsCheckingCi] = useState(false);
  const { showToast } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "ci" && !formState.id) {
      setFormState((prev: any) => ({
        ...prev,
        ci: value,
        _disabled: false,
      }));
      setErrors((prev: any) => ({ ...prev, ci: "" }));
      return;
    }

    setFormState((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };
  const validate = () => {
    let errors: any = {};
    errors = checkRules({
      value: formState?.ci,
      rules: ["required"],
      key: "ci",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.url_avatar,
      rules: [""],
      key: "url_avatar",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.name,
      rules: ["required"],
      key: "name",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.middle_name,
      rules: ["alpha"],
      key: "middle_name",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.last_name,
      rules: ["required"],
      key: "last_name",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.mother_last_name,
      rules: ["alpha"],
      key: "mother_last_name",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState?.phone,
      rules: ["phone"],
      key: "phone",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.address,
      rules: [""],
      key: "address",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.email,
      rules: ["required", "email"],
      key: "email",
      errors,
      data: formState,
    });
    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (isSaving) return;
    if (hasErrors(validate())) return;
    let method = formState.id ? "PUT" : "POST";

    setIsSaving(true);
    try {
      const { data } = await execute(
        "/guards" + (formState.id ? "/" + formState.id : ""),
        method,
        {
          ci: formState.ci,
          url_avatar: formState.url_avatar,
          name: formState.name,
          middle_name: formState.middle_name,
          last_name: formState.last_name,
          mother_last_name: formState.mother_last_name,
          email: formState.email,
          phone: formState.phone,
          address: formState.address,
        },
        false,
        true,
      );

      if (data?.success) {
        onClose();
        reLoad(null, true);
        showToast(data?.message || "Documento guardado con éxito", "success");
      } else {
        showToast(data?.message || "Error al guardar el documento", "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const lookupGuardByCi = useCallback(
    async (ciValue: string) => {
      const ci = String(ciValue || "").trim();
      if (!ci || formState.id || isCheckingCi) return;

      setIsCheckingCi(true);
      try {
        const { data } = await execute(
          "/guards",
          "GET",
          {
            fullType: "EXIST",
            type: "ci",
            searchBy: ci,
          },
          false,
          true,
        );

        if (data?.success && data.data?.data?.id) {
          const filteredData = data?.data?.data;
          if (filteredData.existCondo) {
            showToast("El guardia ya existe en este condominio", "warning");
            setErrors({ ci: "Ese CI ya esta en uso en este condominio." });
            setFormState((prev: any) => ({
              ...prev,
              ci,
              _disabled: false,
            }));
            return;
          }

          setErrors({ ci: "" });
          setFormState((prev: any) => ({
            ...prev,
            ci: filteredData.ci,
            name: filteredData.name,
            middle_name: filteredData.middle_name,
            last_name: filteredData.last_name,
            mother_last_name: filteredData.mother_last_name,
            email: filteredData.email ?? "",
            phone: filteredData.phone,
            address: filteredData.address,
            url_avatar: filteredData.url_avatar ? [filteredData.url_avatar] : [],
            _disabled: true,
          }));
          showToast(
            "El guardia ya existe en Condaty, se va a vincular al condominio",
            "warning",
          );
          return;
        }

        setErrors({ ci: "" });
        setFormState((prev: any) => ({
          ...prev,
          ci,
          _disabled: false,
        }));
      } finally {
        setIsCheckingCi(false);
      }
    },
    [execute, formState.id, isCheckingCi, showToast],
  );

  const onBlurCi = async (e: React.FocusEvent<HTMLInputElement>) => {
    await lookupGuardByCi(e.target.value);
  };

  const onCiKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await lookupGuardByCi((e.currentTarget as HTMLInputElement).value);
    }
  };

  const onBlurEmail = useCallback(async () => {
    if (!formState.email) return;
    const { data } = await execute(
      "/guards",
      "GET",
      {
        fullType: "EXIST",
        type: "email",
        searchBy: formState.email,
      },
      false,
      true,
    );

    if (data?.success && data.data?.data?.id) {
      showToast("El email ya esta en uso", "warning");
      setErrors({ email: "El email ya esta en uso" });
      setFormState({ ...formState, email: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState?.email]);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      maxWidth={760}
      title={formState.id ? "Editar guardia" : "Nuevo guardia"}
      onSave={_onSave}
      buttonText={
        isSaving ? "Guardando..." : formState.id ? "Actualizar" : "Guardar"
      }
      disabled={isSaving || isCheckingCi}
      variant={"mini"}
    >
      <UploadFileSingle
        formState={formState}
        name="url_avatar"
        setFormState={setFormState}
        error={errors}
      />
      <Input
        name="ci"
        value={formState.ci || ""}
        disabled={Boolean(formState.id)}
        onChange={handleChange}
        label="Carnet de identidad"
        onBlur={onBlurCi}
        onKeyDown={onCiKeyDown}
        error={errors}
        required
      />

      <InputFullName
        name="name"
        value={formState}
        onChange={handleChange}
        errors={errors}
        disabled={formState._disabled}
      />
      <Input
        name="phone"
        value={formState.phone || ""}
        disabled={formState._disabled}
        onChange={handleChange}
        label="Celular"
        error={errors}
        required={false}
      />
      <TextArea
        label="Dirección"
        name="address"
        value={formState.address || ""}
        onChange={handleChange}
        error={errors}
      />
      <p style={{ margin: "8px 0px" }}>
        La contraseña será enviada al correo que indiques en este campo
      </p>
      <Input
        name="email"
        value={formState.email || ""}
        disabled={formState._disabled}
        onBlur={onBlurEmail}
        onChange={handleChange}
        label="Correo electrónico"
        error={errors}
      />
    </DataModal>
  );
};

export default RenderForm;
