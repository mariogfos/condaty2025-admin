"use client";
import React, { useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import { MONTHS } from "@/mk/utils/date";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import TextArea from "@/mk/components/forms/TextArea/TextArea";

type yearProps = { id: string | number; name: string }[];

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  reLoad,
}: any) => {
  const [formState, setFormState]: any = useState({
    ...item,
    type: 1,
  });
  const [errors, setErrors]: any = useState({});
  const { showToast } = useAuth();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    let errs: any = {};
    errs = checkRules({
      value: formState.year,
      rules: ["required"],
      key: "year",
      errors: errs,
    });
    errs = checkRules({
      value: formState.month,
      rules: ["required"],
      key: "month",
      errors: errs,
    });
    setErrors(errs);
    return errs;
  };
  const onSave = async () => {
    let method = formState.id ? "PUT" : "POST";
    if (hasErrors(validate())) return;
    // TODO(advance-payments): selective expense creation moved to the payment form.
    // EXPENSE create now generates for the whole condominio (period-only);
    // the backend derives due_at/begin_at from the period and generates for all active units.
    const { data: response } = await execute(
      "/debt-groups" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        year: formState.year,
        month: formState.month,
        type: 1,
        description: formState.description,
      },
      false
    );
    if (response?.success === true) {
      reLoad();
      setItem(formState);
      showToast(response?.message, "success");
      onClose();
    } else {
      showToast(response?.message, "error");
    }
  };

  const getYearOptions = () => {
    const years: yearProps = [];
    const lastYear = new Date().getFullYear() + 2;
    for (let i = lastYear; i >= 2000; i--) {
      years.push({ id: i, name: i.toString() });
    }
    return years;
  };

  const monthOptions = MONTHS.map((month, index) => ({
    id: index,
    name: month,
  })).filter((option) => option.name !== "");

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Crear Expensa"
      onSave={onSave}
      variant={"mini"}
    >
      <Select
        label="Año"
        name="year"
        value={formState.year}
        options={getYearOptions()}
        onChange={handleChange}
        error={errors}
      />
      <Select
        label="Mes"
        name="month"
        value={formState.month}
        options={monthOptions}
        onChange={handleChange}
        error={errors}
      />
      {/* TODO(advance-payments): selective expense creation moved to the payment form.
          The due-date / assign-to / unit-selection fields were removed; EXPENSE create
          now generates for the whole condominio (period-only). */}
      <TextArea
        label="Descripción"
        name="description"
        value={formState.description}
        onChange={handleChange}
        maxLength={255}
        required={false}
        error={errors}
      />
    </DataModal>
  );
};

export default RenderForm;
