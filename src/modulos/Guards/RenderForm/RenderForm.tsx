import Input from "@/mk/components/forms/Input/Input";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useCallback, useRef, useState } from "react";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import InputFullName from "@/mk/components/forms/InputFullName/InputFullName";
import UploadFileSingle from "@/mk/components/forms/UploadFileSingle/UploadFileSingle";

const normalizeApiErrors = (apiErrors: any) => {
  if (!apiErrors || typeof apiErrors !== "object") return {};

  return Object.fromEntries(
    Object.entries(apiErrors).map(([field, value]) => [
      field,
      Array.isArray(value) ? value[0] : String(value),
    ]),
  );
};

const RenderForm = ({ open, onClose, item, execute, reLoad }: any) => {
  const [formState, setFormState] = useState({ ...item });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingCi, setIsCheckingCi] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingInCurrentCondo, setExistingInCurrentCondo] = useState(false);
  const [ciLookupFailed, setCiLookupFailed] = useState(false);
  const ciLookupRef = useRef("");
  const { showToast } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "ci" && !formState.id) {
      ciLookupRef.current = String(value || "").trim();
      setFormState((prev: any) => {
        const wasAutofilled = Boolean(prev._disabled);

        return {
          ...prev,
          ...(wasAutofilled
            ? {
                name: "",
                middle_name: "",
                last_name: "",
                mother_last_name: "",
                email: "",
                phone: "",
                address: "",
                url_avatar: [],
              }
            : {}),
          ci: value,
          _disabled: false,
        };
      });
      setExistingInCurrentCondo(false);
      setCiLookupFailed(false);
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
    if (!formState.id && existingInCurrentCondo) {
      errors.ci = "Ese CI ya esta en uso en este condominio.";
    }
    if (!formState.id && ciLookupFailed) {
      errors.ci = "No se pudo verificar el CI. Intenta nuevamente.";
    }
    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (isSaving || isCheckingCi || isUploading) return;
    if (hasErrors(validate())) return;
    let method = formState.id ? "PUT" : "POST";

    setIsSaving(true);
    try {
      const { data, error } = await execute(
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

      const apiErrors = normalizeApiErrors(data?.errors || error?.data?.errors);
      if (Object.keys(apiErrors).length > 0) {
        setErrors((prev: any) => ({ ...prev, ...apiErrors }));
      }

      if (data?.success) {
        onClose();
        reLoad(null, true);
        showToast(data?.message || "Documento guardado con éxito", "success");
      } else {
        showToast(
          data?.message ||
            error?.data?.message ||
            "No se pudo guardar el guardia. Intenta nuevamente.",
          "error",
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const lookupGuardByCi = useCallback(
    async (ciValue: string) => {
      const ci = String(ciValue || "").trim();
      if (!ci || formState.id || isCheckingCi) return;

      ciLookupRef.current = ci;
      setIsCheckingCi(true);
      try {
        const { data, error } = await execute(
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

        if (ciLookupRef.current !== ci) return;

        if (error || !data?.success) {
          setExistingInCurrentCondo(false);
          setCiLookupFailed(true);
          setErrors((prev: any) => ({
            ...prev,
            ci: "No se pudo verificar el CI. Intenta nuevamente.",
          }));
          showToast("No se pudo verificar el CI. Intenta nuevamente.", "error");
          return;
        }

        if (data?.success && data.data?.data?.id) {
          const filteredData = data?.data?.data;
          if (filteredData.existCondo) {
            setExistingInCurrentCondo(true);
            setCiLookupFailed(false);
            showToast("El guardia ya existe en este condominio", "warning");
            setErrors((prev: any) => ({
              ...prev,
              ci: "Ese CI ya esta en uso en este condominio.",
            }));
            setFormState((prev: any) => ({
              ...prev,
              ci,
              _disabled: false,
            }));
            return;
          }

          setExistingInCurrentCondo(false);
          setCiLookupFailed(false);
          setErrors((prev: any) => ({ ...prev, ci: "" }));
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

        setExistingInCurrentCondo(false);
        setCiLookupFailed(false);
        setErrors((prev: any) => ({ ...prev, ci: "" }));
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
      disabled={
        isSaving ||
        isCheckingCi ||
        isUploading ||
        existingInCurrentCondo ||
        ciLookupFailed
      }
      variant={"mini"}
    >
      <UploadFileSingle
        formState={formState}
        name="url_avatar"
        setFormState={setFormState}
        onUploadStateChange={setIsUploading}
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
        onChange={handleChange}
        label="Correo electrónico"
        error={errors}
      />
    </DataModal>
  );
};

export default RenderForm;
