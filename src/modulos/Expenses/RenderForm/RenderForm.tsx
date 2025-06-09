"use client";
import React, { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import Check from "@/mk/components/forms/Check/Check";
import { MONTHS } from "@/mk/utils/date";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import { getFullName } from "@/mk/utils/string";
import { UnitsType } from "@/mk/utils/utils";

type yearProps = { id: string | number; name: string }[];

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  user,
  reLoad,
}: any) => {
  const [formState, setFormState]: any = useState({ ...item });
  const [errors, setErrors]: any = useState({});
  const [ldpto, setLdpto] = useState([]);
  const client = user.clients.filter(
    (item: any) => item.id === user.client_id
  )[0];
  // Estado para el check "asignar"

  console.log(extraData, "extradataatrata");
  const [assignState, setAssignState] = useState(formState.asignar || "");
  const { showToast } = useAuth();

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAssignChange = (e: any) => {
    setAssignState(e.target.name);
    setFormState((prev: any) => ({ ...prev, asignar: e.target.name }));
  };

  // Validación usando checkRules (adaptada a los campos de Expensas)
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
    errs = checkRules({
      value: formState.due_at,
      rules: ["required"],
      key: "due_at",
      errors: errs,
    });
    errs = checkRules({
      value: formState.category_id,
      rules: ["required"],
      key: "category_id",
      errors: errs,
    });
    errs = checkRules({
      value: formState.asignar,
      rules: ["required"],
      key: "asignar",
      errors: errs,
    });
    if (formState.asignar === "S") {
      errs = checkRules({
        value: formState.dpto_id,
        rules: ["required"],
        key: "dpto_id",
        errors: errs,
      });
    }
    setErrors(errs);
    return errs;
  };
  const onSave = async () => {
    let method = formState.id ? "PUT" : "POST";
    if (hasErrors(validate())) return;
    const { data: response } = await execute(
      "/debts" + (formState.id ? "/" + formState.id : ""),
      method,
      {
        year: formState.year,
        month: formState.month,
        due_at: formState.due_at,
        category_id: formState.category_id,
        description: formState.description,
        asignar: formState.asignar,
        dpto_id: formState.dpto_id,
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

  // Opciones para el campo Año, generadas dinámicamente
  const getYearOptions = () => {
    const years: yearProps = [{ id: "", name: "Todos" }];
    const lastYear = new Date().getFullYear();
    for (let i = lastYear; i >= 2000; i--) {
      years.push({ id: i, name: i.toString() });
    }
    return years;
  };

  // Opciones para el campo Mes basadas en el array MONTHS
  const monthOptions = MONTHS.map((month, index) => ({
    id: index,
    name: month,
  }));

  // Opciones para el campo Categoría (en este ejemplo solo "Expensas")
  const categoryOptions = [{ id: 1, name: "Expensas" }];

  useEffect(() => {
    const lista: any = [];
    extraData?.dptos?.map((item: any, key: number) => {
      lista[key] = {
        id: item.id,
        nro:
          (getFullName(item.titular?.owner) || "Sin titular") +
          " - " +
          item.nro +
          " " +
          UnitsType["_" + client.type_dpto] +
          " " +
          item.description,
      };
    });
    setLdpto(lista);
  }, [extraData?.dptos]);

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Crear Expensa"
      onSave={onSave}
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

      <Input
        label="Fecha de vencimiento"
        name="due_at"
        value={formState.due_at}
        onChange={handleChange}
        type="date"
        error={errors}
      />

      <Select
        label="Categoría"
        name="category_id"
        value={formState.category_id}
        options={categoryOptions}
        onChange={handleChange}
        error={errors}
      />

      <TextArea
        label="Descripción"
        name="description"
        value={formState.description}
        onChange={handleChange}
        maxLength={255}
        required={false}
        // type="textarea"
        error={errors.description}
      />

      {/* <div style={{ marginTop: "1rem" }}> */}
      {/* <label>Asignar a</label> */}
      <div className="space-y-3">
        {/* <Check
            label="Todas las unidades"
            name="T"
            checked={assignState === "T"}
            onChange={handleAssignChange}
            optionValue={["Y", "N"]}
            value={assignState === "T" ? "Y" : "N"}
            style={{color:"var(--cWhiteV1)"}}
          />
          <Check
            label="Unidades ocupadas"
            name="O"
            checked={assignState === "O"}
            onChange={handleAssignChange}
            optionValue={["Y", "N"]}
            value={assignState === "O" ? "Y" : "N"}
          />
          <Check
            label="Unidades no ocupadas"
            name="L"
            checked={assignState === "L"}
            onChange={handleAssignChange}
            optionValue={["Y", "N"]}
            value={assignState === "L" ? "Y" : "N"}
          />
          <Check
            label="Seleccionar"
            name="S"
            checked={assignState === "S"}
            onChange={handleAssignChange}
            optionValue={["Y", "N"]}
            value={assignState === "S" ? "Y" : "N"}
          />
          {errors.asignar && (
            <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.asignar}</p>
          )} */}
        <Select
          label="Asignar a"
          name="asignar"
          value={formState.asignar}
          options={[
            { id: "T", name: "Todas las unidades" },
            { id: "O", name: "Unidades ocupadas" },
            { id: "L", name: "Unidades no ocupadas" },
            { id: "S", name: "Asignar a una unidad" },
          ]}
          onChange={handleChange}
          error={errors}
        />
        {formState.asignar === "S" && (
          <Select
            label={"Número de Unidad"}
            name="dpto_id"
            value={formState?.dpto_id}
            options={ldpto}
            optionLabel="nro"
            optionValue="id"
            onChange={handleChange}
            error={errors}
          />
        )}
      </div>
      {/* </div> */}
    </DataModal>
  );
};

export default RenderForm;
