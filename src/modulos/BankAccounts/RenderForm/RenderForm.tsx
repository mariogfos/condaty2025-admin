import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useState, useEffect } from "react";
import styles from "./RenderForm.module.css";
import InputFullName from "@/mk/components/forms/InputFullName/InputFullName";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { getUrlImages } from "@/mk/utils/string";

const TYPE_OWNERS = [
  {
    type_owner: "Propietario",
    name: "Propietario",
  },
  {
    type_owner: "Residente",
    name: "Residente",
  },
];

const getUnitNro = (unitsList: any[] = [], id?: string | number) => {
  if (id === undefined || id === null) return undefined;
  const match = unitsList.find(
    (u) =>
      String(u.id) === String(id) ||
      String(u.dpto_id) === String(id) ||
      String(u.dpto) === String(id)
  );
  return match?.nro ?? match?.nro_dpto ?? match?.number ?? String(id);
};

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  reLoad,
  onSave,
}: any) => {
  const [formState, setFormState] = useState({ ...item });
  const [errors, setErrors] = useState({});
  const { showToast } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      value: formState?.avatar,
      rules: ["requiredImageMultiple"],
      key: "avatar",
      errors,
      data: formState,
    });

    errors = checkRules({
      value: formState?.bank_entity_id,
      rules: ["required"],
      key: "bank_entity_id",
      errors,
    });

    errors = checkRules({
      value: formState?.account_type,
      rules: ["required"],
      key: "account_type",
      errors,
    });
    errors = checkRules({
      value: formState?.account_number,
      rules: ["required", "number"],
      key: "account_number",
      errors,
    });
    errors = checkRules({
      value: formState?.currency_type_id,
      rules: ["required"],
      key: "currency_type_id",
      errors,
    });
    errors = checkRules({
      value: formState?.currency_type_id,
      rules: ["required"],
      key: "currency_type_id",
      errors,
    });
    errors = checkRules({
      value: formState?.holder,
      rules: ["required"],
      key: "holder",
      errors,
    });
    errors = checkRules({
      value: formState?.ci_holder,
      rules: ["required"],
      key: "ci_holder",
      errors,
    });
    errors = checkRules({
      value: formState?.alias_holder,
      rules: ["required"],
      key: "alias_holder",
      errors,
    });

    setErrors(errors);
    return errors;
  };
  const _onSave = async () => {
    if (hasErrors(validate())) return;
    let method = formState.id ? "PUT" : "POST";
    const { data } = await execute(
      "/bank-accounts" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        avatar: formState.avatar || "",
        bank_entity_id: formState.bank_entity_id || "",
        account_type: formState.account_type || "",
        account_number: formState.account_number || "",
        currency_type_id: formState.currency_type_id || "",
        holder: formState.holder || "",
        ci_holder: formState.ci_holder || "",
        alias_holder: formState.alias_holder || "",
      }
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
    <DataModal
      open={open}
      onClose={onClose}
      title={
        formState.id ? "Editar cuenta bancaria" : "Agregar cuenta bancaria"
      }
      onSave={_onSave}
      variant={"mini"}
    >
      <div style={{ display: "flex", gap: 28 }}>
        <div style={{ flex: 1 }}>
          <Select
            label="Entidad bancaria"
            name="bank_entity_id"
            filter
            value={formState.bank_entity_id || ""}
            optionLabel="name"
            options={extraData?.bankEntities || []}
            optionValue="id"
            onChange={handleChange}
            error={errors}
            required
          />
          <Select
            label="Tipo de cuenta"
            name="account_type"
            value={formState.account_type || ""}
            optionLabel="name"
            options={[
              {
                id: "S",
                name: "Cuenta de ahorros",
              },
              {
                id: "C",
                name: "Cuenta corriente",
              },
            ]}
            optionValue="id"
            onChange={handleChange}
            error={errors}
            required
          />
          <Input
            name="account_number"
            value={formState.account_number || ""}
            onChange={handleChange}
            label="Nº de cuenta"
            error={errors}
            type="number"
            required
          />
          <Select
            label="Tipo de moneda"
            name="currency_type_id"
            value={formState.currency_type_id || ""}
            optionLabel="name"
            options={extraData?.currencyTypes || []}
            optionValue="id"
            onChange={handleChange}
            error={errors}
            required
          />
          <Input
            label="Titular"
            name="holder"
            value={formState.holder || ""}
            onChange={handleChange}
            error={errors}
          />
          <Input
            label="CI/NIT"
            name="ci_holder"
            type="number"
            value={formState.ci_holder || ""}
            onChange={handleChange}
            error={errors}
            required
          />
          <Input
            label="Alias"
            name="alias_holder"
            value={formState.alias_holder || ""}
            onChange={handleChange}
            error={errors}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <UploadFile
            name="avatar"
            onChange={handleChange}
            value={
              typeof formState?.avatar === "object" || formState?.id
                ? getUrlImages(
                    "/BANK-" + formState?.id + ".webp?" + formState?.updated_at
                  )
                : undefined
            }
            setError={setErrors}
            error={errors}
            img={true}
            editor={{ width: 1350, height: 568 }}
            sizePreview={{ width: "650px", height: "284px" }}
            placeholder="Subir Código QR"
            ext={["jpg", "png", "jpeg", "webp"]}
            item={formState}
          />
        </div>
      </div>
    </DataModal>
  );
};

export default RenderForm;
