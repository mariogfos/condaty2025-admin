import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useState, useEffect, useRef } from "react";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import QrAccountConfig, {
  QrAccountConfigHandle,
} from "@/modulos/QrDinamico/QrAccountConfig/QrAccountConfig";
import { apiMessage } from "@/modulos/QrDinamico/shared";
import { BankAccountStatusBadge } from "../BankAccountBadges";

const qrPendingStyle: React.CSSProperties = {
  marginTop: 20,
  paddingTop: 16,
  borderTop: "1px solid var(--cWhiteV1, rgba(255, 255, 255, 0.12))",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const accountPayload = (account: any) => ({
  images: account?.images || "",
  bank_entity_id: account?.bank_entity_id || "",
  account_type: account?.account_type || "",
  account_number: account?.account_number || "",
  currency_type_id: account?.currency_type_id || "",
  holder: account?.holder || "",
  ci_holder: account?.ci_holder || "",
  alias_holder: account?.alias_holder || "",
  initial_amount: Number(account?.initial_amount || 0),
});

const RenderForm = ({
  open,
  onClose,
  item,
  execute,
  extraData,
  reLoad,
}: any) => {
  const [formState, setFormState] = useState({ ...item, initial_amount: item?.initial_amount ?? 0 });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const saveInProgress = useRef(false);
  const savedAccountPayload = useRef(JSON.stringify(accountPayload(item)));
  // The QR configuration is written through its own endpoint, so this form
  // saves it right after the account: one button stores the whole modal.
  const qrConfigRef = useRef<QrAccountConfigHandle>(null);
  const { showToast, user } = useAuth();

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
    setFormState({ ...item, initial_amount: item?.initial_amount ?? 0 });
    savedAccountPayload.current = JSON.stringify(accountPayload(item));
    setErrors({});
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
    if (saveInProgress.current) return;
    const payload = accountPayload(formState);
    const serializedPayload = JSON.stringify(payload);
    const accountChanged = !formState.id || serializedPayload !== savedAccountPayload.current;
    if (accountChanged && hasErrors(validate())) return;

    saveInProgress.current = true;
    setSaving(true);
    try {
      let message = "Cambios guardados";
      if (accountChanged) {
        const result = await execute(
          formState.id ? `/bank-accounts/${formState.id}` : "/bank-accounts",
          formState.id ? "PUT" : "POST",
          payload,
        );
        if (!result?.data?.success) {
          showToast(apiMessage(result) || "No se pudo guardar la cuenta bancaria.", "error");
          return;
        }
        savedAccountPayload.current = serializedPayload;
        message = result.data.message || message;
      }

      const qrSaved = (await qrConfigRef.current?.save()) ?? true;
      if (accountChanged || qrSaved) reLoad();
      if (!qrSaved) return;

      onClose();
      showToast(message, "success");
    } finally {
      saveInProgress.current = false;
      setSaving(false);
    }
  };

  return (
    <DataModal
      open={open}
      onClose={(reason) => { if (!saveInProgress.current) onClose(reason); }}
      maxWidth={760}
      title={
        formState.id ? "Editar cuenta bancaria" : "Agregar cuenta bancaria"
      }
      onSave={_onSave}
      disabled={saving}
      buttonText={saving ? "Guardando…" : "Guardar"}
      buttonCancel={saving ? "" : "Cancelar"}
      iconClose={!saving}
      variant={"mini"}
    >
      {formState.id && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          Estado de la cuenta <BankAccountStatusBadge status={formState.status} />
        </div>
      )}
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
        name="account_type"
        value={formState.account_type || ""}
        disabled={item?.isInUse}
        optionLabel="name"
        options={[
          {
            id: "S",
            name: "Cuenta ahorro",
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
      {/* QR Dinámico por cuenta (DES-20/21): SOLO usuarios FOS. La config vive
          en su propio endpoint, no en este CRUD, así que necesita un id; en el
          alta se anuncia la sección en vez de esconderla (QR-07).
          RN-ADM-01: un admin de condominio no ve esta sección. */}
      {Boolean(user?.fosrole_id) &&
        (formState.id ? (
          <QrAccountConfig key={formState.id} ref={qrConfigRef} bankAccountId={formState.id} />
        ) : (
          <div id="qr-account-config-pending" style={qrPendingStyle}>
            <p style={{ color: "var(--cWhite)", fontWeight: 600, margin: 0 }}>
              QR Dinámico (solo FOS)
            </p>
            <p style={{ fontSize: 12, margin: 0 }}>
              Guardá la cuenta primero. El QR dinámico se configura después,
              editando la cuenta.
            </p>
          </div>
        ))}
    </DataModal>
  );
};

export default RenderForm;
