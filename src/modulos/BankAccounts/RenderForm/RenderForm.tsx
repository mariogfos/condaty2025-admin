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

interface OwnerFormState {
  id?: number | string;
  ci: string;
  name: string;
  middle_name?: string;
  last_name?: string;
  mother_last_name?: string;
  email?: string;
  phone?: string;
  dpto_id?: string | number;
  dptos?: Array<{ dpto_id: string | number; nro?: string; dpto_nro?: string }>;
  _disabled?: boolean;
  _emailDisabled?: boolean;
  [key: string]: any;
}

interface OwnerFormErrors {
  [key: string]: string | undefined;
  ci?: string;
  name?: string;
  last_name?: string;
  email?: string;
  dpto_id?: string;
}
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

interface UnitModalProps {
  open: boolean;
  onClose: () => void;
  units: Array<{ id: string | number; nro: string }>;
  initialData: {
    dpto_id?: string | number;
  };
  onSave: (data: { dpto_id: string | number }) => void;
  typeOwner?: string;
}

const UnitModal: React.FC<UnitModalProps> = ({
  open,
  onClose,
  units,
  initialData,
  onSave,
  typeOwner,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string | number>(
    initialData.dpto_id || ""
  );

  useEffect(() => {
    if (open) {
      setSelectedUnit(initialData.dpto_id || "");
    }
  }, [open, initialData]);

  const handleSelectChange = (valueOrEvent: any) => {
    const val =
      valueOrEvent?.target?.value ?? valueOrEvent?.value ?? valueOrEvent;
    setSelectedUnit(val);
  };

  const handleSave = () => {
    if (
      selectedUnit === "" ||
      selectedUnit === null ||
      selectedUnit === undefined
    )
      return;
    const parsed =
      typeof selectedUnit === "string" && /^\d+$/.test(selectedUnit)
        ? Number(selectedUnit)
        : selectedUnit;

    onSave({
      dpto_id: parsed,
    });
    onClose();
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Asignar Unidad"
      onSave={handleSave}
      buttonText="Asignar"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Select
          name="dpto_id"
          filter={true}
          label="Seleccionar Unidad"
          value={selectedUnit}
          options={units}
          optionLabel="nro"
          optionValue="id"
          onChange={handleSelectChange}
          required
        />
      </div>
    </DataModal>
  );
};

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  reLoad,
}: {
  open: boolean;
  onClose: () => void;
  item: OwnerFormState;
  setItem: (item: OwnerFormState) => void;
  execute: (
    endpoint: string,
    method: string,
    data: any,
    showLoader?: boolean,
    silent?: boolean
  ) => Promise<{ data?: any }>;
  extraData: any;
  reLoad: () => void;
  defaultUnitId?: string | number;
}) => {
  const [formState, setFormState] = useState({ ...item });
  const [errors, setErrors] = useState<OwnerFormErrors>({});
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const { showToast } = useAuth();

  useEffect(() => {
    setFormState((prev: OwnerFormState) => ({
      ...prev,
      ...item,
      _disabled: item?._disabled !== undefined ? item._disabled : false,
      _emailDisabled:
        item?._emailDisabled !== undefined ? item._emailDisabled : false,
    }));
  }, [item]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "type_owner") {
      setFormState((prev: OwnerFormState) => ({
        ...prev,
        [name]: value,
        dptos: [],
        dpto_id: undefined,
      }));
      if (errors.dpto_id) {
        setErrors((prev) => ({ ...prev, dpto_id: undefined }));
      }
      return;
    }

    setFormState((prev: OwnerFormState) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof OwnerFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };
  const onSave = () => {};

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={
        formState.id ? "Editar cuenta bancaria" : "Agregar cuenta bancaria"
      }
      onSave={onSave}
      variant={"mini"}
    >
      <div style={{ display: "flex", gap: 28 }}>
        <div style={{ flex: 1 }}>
          <Select
            label="Entidad bancaria"
            name="banking_entity_id"
            value={formState.banking_entity_id || ""}
            optionLabel="name"
            options={extraData?.banking_entities || []}
            optionValue="id"
            onChange={handleChange}
            error={errors}
            required
          />
          <Select
            label="Tipo de cuenta"
            name="account_type_id"
            value={formState.account_type_id || ""}
            optionLabel="name"
            options={extraData?.account_types || []}
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
            options={extraData?.currencies || []}
            optionValue="id"
            onChange={handleChange}
            error={errors}
            required
          />

          {/* <InputFullName
        name="name"
        value={formState}
        onChange={handleChange}
        errors={errors}
        disabled={formState._disabled}
      /> */}
          <Input
            label="Titular"
            name="holder_name"
            value={formState.holder_name || ""}
            onChange={handleChange}
            error={errors}
          />

          <Input
            label="CI/NIT"
            name="ci"
            type="number"
            value={formState.ci || ""}
            onChange={handleChange}
            error={errors}
            required
          />
          <Select
            label="Alias"
            name="alias"
            value={formState.alias || ""}
            options={extraData?.aliases || []}
            optionLabel="alias"
            optionValue="alias"
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
              typeof formState?.avatar === "object"
                ? formState?.avatar
                : String(formState?.has_image_c) === "1"
                ? getUrlImages(
                    "/CLIENT-" +
                      formState?.id +
                      ".webp?" +
                      formState?.updated_at
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
