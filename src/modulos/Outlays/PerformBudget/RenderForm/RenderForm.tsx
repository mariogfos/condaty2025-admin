import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getUrlImages } from "@/mk/utils/string";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useEffect, useState } from "react";
import { formatNumber } from "../../../../mk/utils/numbers";

interface PropsType {
  item: any;
  setItem: any;
  data: any;
  open: boolean;
  onClose: () => void;
}

const RenderForm = ({ item, setItem, data, open, onClose }: PropsType) => {
  const [formState, setFormState]: any = useState({});
  const [errors, setErrors] = useState([]);
  const handleChange = (e: any) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    });
  };
  useEffect(() => {
    if (data?.action == "edit") {
      let itemEdit = item?.find((item: any) => item?.budget_id == data?.id);
      setFormState({
        ...itemEdit,
      });
    }
  }, []);

  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState?.date_at,
      rules: ["required"],
      key: "date_at",
      errors,
    });
    errors = checkRules({
      value: formState?.amount,
      rules: ["required", "less:amount"],
      key: "amount",
      errors,
      data: {
        amount: data?.amount,
      },
    });
    errors = checkRules({
      value: formState?.description,
      rules: ["required"],
      key: "description",
      errors,
    });
    errors = checkRules({
      value: formState?.file,
      rules: ["required"],
      key: "file",
      errors,
    });

    setErrors(errors);
    return errors;
  };
  const handleEditItem = () => {
    const updatedItems = item?.map((item: any) => {
      if (item?.budget_id === data?.id) {
        return {
          ...formState,
          budget_id: data?.id,
        };
      }
      return item;
    });
    setItem(updatedItems);
  };

  const handleAddItem = () => {
    setItem([
      ...item,
      {
        ...formState,
        budget_id: data?.id,
      },
    ]);
  };

  const onSave = () => {
    if (hasErrors(validate())) return;

    data?.action === "edit" ? handleEditItem() : handleAddItem();
    onClose();
  };

  return (
    <DataModal
      title="Ejecutar presupuesto"
      open={open}
      onClose={onClose}
      onSave={onSave}
    >
      <Input
        type="date"
        name="date_at"
        label="Fecha de pago"
        value={formState?.date_at}
        error={errors}
        onChange={handleChange}
      />
      <Input
        name="amount_item"
        label="Presupuesto del item"
        value={formatNumber(data?.amount, 0)}
        onChange={handleChange}
        disabled={true}
        error={errors}
      />
      {/* <div style={{ display: "flex", gap: 8 }}> */}
      <Select
        name="category_id"
        label="Categoría"
        value={data?.category_id}
        onChange={handleChange}
        options={[data?.category]}
        disabled={true}
        optionLabel="name"
        optionValue="id"
        error={errors}
      />
      {/* <Select
        name="subcategory_id"
        label="Subcategoría"
        value={data?.subcategory_id}
        error={errors}
        onChange={handleChange}
        options={[
          { value: 1, label: "1" },
          { value: 2, label: "2" },
        ]}
      />
    </div> */}
      <Input
        name="amount"
        label="Monto a pagar"
        value={formState?.amount}
        onChange={handleChange}
        error={errors}
      />
      <UploadFile
        name="file"
        value={formState?.file}
        // value={
        //   data?.id
        //     ? getUrlImages("/EXPENSE-" + data?.id + ".webp?" + data?.updated_at)
        //     : ""
        // }
        onChange={handleChange}
        label={"Subir una imagen"}
        error={errors}
        ext={["jpg", "png", "jpeg", "webp"]}
        setError={setErrors}
        img={true}
        item={formState}
        // editor={{ width: 720, height: 363 }}
        // sizePreview={{ width: "720px", height: "363px" }}
      />
      <TextArea
        name="description"
        label="Concepto del pago"
        value={formState?.description}
        onChange={handleChange}
        error={errors}
      />
    </DataModal>
  );
};

export default RenderForm;
