import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useEffect, useState } from "react";
import DataModalV2 from "@/mk/components/ui/DataModalV2/DataModalV2";
import { IconDepartment2 } from "@/components/layout/icons/IconsBiblioteca";
import Br from "@/components/Detail/Br";
import styles from "./RenderForm.module.css";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";

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
      value: formState?.selectCondominium,
      rules: ["required"],
      key: "selectCondominium",
      errors,
    });

    if (formState.selectCondominium === "S") {
      errors = checkRules({
        value: formState?.clientIds,
        rules: ["required"],
        key: "clientIds",
        errors,
      });
    }

    errors = checkRules({
      value: formState?.images,
      rules: ["required"],
      key: "images",
      errors,
    });

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validate())) return;
    let method = formState.id ? "PUT" : "POST";
    const allClientIds = extraData.clients?.map((c: any) => c.id) ?? [];
    const clientIdsToSend =
      formState.selectCondominium === "ALL"
        ? allClientIds
        : formState.clientIds;

    const { data } = await execute(
      "/campaigns" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        name: formState?.name || "",
        clientIds: clientIdsToSend || [],
        images: formState?.images || [],
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
  useEffect(() => {
    if (item?.id) {
      setFormState({
        ...item,
        selectCondominium:
          item?.clients_count !== extraData.clients.length ? "S" : "ALL",
        clientIds: item?.clients.map((c: any) => c.client_id) || [],
      });
    }
  }, []);
  return (
    <DataModalV2
      open={open}
      onClose={onClose}
      icon={<IconDepartment2 />}
      title={formState.id ? "Editar campaña" : "Crear campaña"}
      subtitle="Crea una nueva campaña o evento para tu condominio"
      onSave={_onSave}
      variant={"mini"}
      buttonText={formState.id ? "Actualizar campaña" : "Crear campaña"}
      maxWidth={600}
    >
      <p className={styles.title}>Información de la campaña</p>
      <p className={styles.subtitle}>Ingresa los datos de la campaña</p>

      <Input
        label="Nombre de la campaña"
        name="name"
        type="text"
        value={formState.name || ""}
        onChange={handleChange}
        error={errors}
        required
      />
      <Select
        label="¿A qué condominio quieres aplicarla?"
        name="selectCondominium"
        value={formState.selectCondominium || ""}
        optionLabel="name"
        options={[
          { id: "ALL", name: "Todos los condominios" },
          { id: "S", name: "Condominios específicos" },
        ]}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />
      {formState.selectCondominium === "S" && (
        <Select
          label="Selecciona los condominios"
          name="clientIds"
          value={formState.clientIds || ""}
          optionLabel="name"
          options={extraData.clients}
          multiSelect
          filter
          optionValue="id"
          onChange={handleChange}
          error={errors}
          required
        />
      )}
      <Br
        style={{
          margin: "20px 0px",
          backgroundColor: "var(--cBackground)",
          height: 1,
        }}
      />
      <p className={styles.title}>Invitaciones QR</p>
      <p className={styles.subtitle}>
        Sube las imágenes que usará esta campaña para generar las invitaciones.
      </p>
      <UploadFileV3
        formState={formState}
        setFormState={setFormState}
        name="images"
        error={errors}
        cant={1}
        maxMB={2}
      />
    </DataModalV2>
  );
};

export default RenderForm;
