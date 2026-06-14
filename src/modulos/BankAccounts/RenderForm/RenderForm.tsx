import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useState, useEffect } from "react";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { BankAccountType } from "../Type/BankType";

const RenderForm = ({
  open,
  onClose,
  item,
  execute,
  extraData,
  reLoad,
}: any) => {
  const [formState, setFormState] = useState({ 
    ...item, 
    initial_amount: item?.initial_amount ?? 0,
    account_type_v3: item?.account_type_v3 ?? BankAccountType.SAVINGS 
  });
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
  useEffect(() => {
    setFormState((prev: any) => ({
      ...prev,
      ...item,
      initial_amount: item?.initial_amount ?? 0,
      account_type_v3: item?.account_type_v3 ?? BankAccountType.SAVINGS
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, open]);
  const validate = () => {
    let errors: any = {};
    if (!formState?.id) {
      errors = checkRules({
        value: formState?.images,
        rules: ["required"],
        key: "images",
        errors,
        data: formState,
      });
    }
    errors = checkRules({
      value: formState?.bank_entity_id,
      rules: ["required"],
      key: "bank_entity_id",
      errors,
    });
    errors = checkRules({
      value: formState?.ci_holder,
      rules: ["required", "ci"],
      key: "ci_holder",
      errors,
    });

    errors = checkRules({
      value: formState?.account_type_v3,
      rules: ["required"],
      key: "account_type_v3",
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
      value: formState?.initial_amount,
      rules: ["number", "positive"],
      key: "initial_amount",
      errors,
    });
    errors = checkRules({
      value: formState?.holder,
      rules: ["required"],
      key: "holder",
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
      "/v3/bank-accounts" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        images: formState.images || "",
        bank_entity_id: formState.bank_entity_id || "",
        account_type_v3: Number(formState.account_type_v3 ?? BankAccountType.SAVINGS),
        account_number: formState.account_number || "",
        currency_type_id: formState.currency_type_id || "",
        holder: formState.holder || "",
        ci_holder: formState.ci_holder || "",
        alias_holder: formState.alias_holder || "",
        initial_amount: Number(formState.initial_amount || 0),
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
    <DataModal
      open={open}
      onClose={onClose}
      maxWidth={760}
      title={
        formState.id ? "Editar cuenta bancaria" : "Agregar cuenta bancaria"
      }
      onSave={_onSave}
      variant={"mini"}
    >
      <p style={{ marginBottom: 12, color: "var(--cWhite)", fontWeight: 600 }}>
        Subir QR
      </p>
      <UploadFileV3
        formState={formState}
        setFormState={setFormState}
        name="images"
        error={errors}
        cant={1}
      />
      <Select
        label="Entidad bancaria"
        name="bank_entity_id"
        filter
        value={formState.bank_entity_id || ""}
        optionLabel="name"
        options={extraData?.bankEntities || []}
        optionValue="id"
        onChange={handleChange}
        disabled={item?.isInUse}
        error={errors}
        required
      />
      <Select
        label="Tipo de cuenta"
        name="account_type_v3"
        value={formState.account_type_v3 || ""}
        disabled={item?.isInUse}
        optionLabel="name"
        options={[
          {
            id: BankAccountType.SAVINGS,
            name: "Cuenta ahorro",
          },
          {
            id: BankAccountType.CURRENT,
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
        disabled={item?.isInUse}
        required
      />
      <Select
        label="Tipo de moneda"
        name="currency_type_id"
        value={formState.currency_type_id || ""}
        optionLabel="name"
        disabled={item?.isInUse}
        options={extraData?.currencyTypes || []}
        optionValue="id"
        onChange={handleChange}
        error={errors}
        required
      />
      <Input
        label="Saldo inicial"
        name="initial_amount"
        value={
          formState.initial_amount !== undefined && formState.initial_amount !== null
            ? String(formState.initial_amount)
            : ""
        }
        onChange={handleChange}
        error={errors}
        type="number"
      />
      <Input
        label="Titular"
        name="holder"
        value={formState.holder || ""}
        onChange={handleChange}
        disabled={item?.isInUse}
        error={errors}
      />
      <Input
        label="CI/NIT"
        name="ci_holder"
        type="number"
        value={formState.ci_holder || ""}
        onChange={handleChange}
        disabled={item?.isInUse}
        error={errors}
      />
      <Input
        label="Alias"
        name="alias_holder"
        value={formState.alias_holder || ""}
        onChange={handleChange}
        error={errors}
        required
      />
    </DataModal>
  );
};

export default RenderForm;
