import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useState } from "react";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { lOptionsFortoDocument } from "../Documents";
import TextArea from "@/mk/components/forms/TextArea/TextArea";

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
      value: formState?.files,
      rules: ["required"],
      key: "files",
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
      value: formState?.for_to,
      rules: ["required"],
      key: "for_to",
      errors,
      data: formState,
    });
    errors = checkRules({
      value: formState?.descrip,
      rules: ["required"],
      key: "descrip",
      errors,
      data: formState,
    });

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validate())) return;
    let method = formState.id ? "PUT" : "POST";
    const ext = formState?.files[0]?.split(".").pop()?.toLowerCase() ?? "";
    const { data } = await execute(
      "/v3/documents" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        name: formState.name || "",
        for_to: formState.for_to || "",
        descrip: formState.descrip || "",
        files: formState.files || "",
        ext: ext || "",
      },
    );

    if (data?.success) {
      onClose();
      reLoad();
      showToast(data?.message || "Documento guardado con éxito", "success");
    } else {
      showToast(data?.message || "Error al guardar el documento", "error");
    }
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      maxWidth={760}
      title={formState.id ? "Editar documento" : "Nuevo documento"}
      onSave={_onSave}
      variant={"mini"}
    >
      <Input
        name="name"
        value={formState.name || ""}
        onChange={handleChange}
        label="Nombre del documento"
        error={errors}
        required
      />
      <Select
        label="Visible para"
        name="for_to"
        value={formState.for_to || ""}
        optionLabel="name"
        options={lOptionsFortoDocument || []}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />

      <TextArea
        label="Descripción"
        name="descrip"
        value={formState.descrip || ""}
        onChange={handleChange}
        error={errors}
        required
      />

      <UploadFileV3
        formState={formState}
        setFormState={setFormState}
        name="files"
        error={errors}
        mode="documents"
        cant={1}
      />
    </DataModal>
  );
};

export default RenderForm;
