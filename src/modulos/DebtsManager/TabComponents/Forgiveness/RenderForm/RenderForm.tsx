import {
  IconCheckOff,
  IconCheckSquare,
} from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { MONTHS_S } from "@/mk/utils/date";
import { MONTHS } from "@/mk/utils/date1";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useCallback, useEffect, useState } from "react";
import { formatBs } from "../../../../../mk/utils/numbers";

interface DebtItem {
  id: number;
  debt_id: number;
  name: string;
  amount: number;
  penalty_amount?: number;
  maintenance_amount?: number;
  is_forgivable?: "Y" | "N";
}
interface Forgiveness {
  id: number;
  debt_id: number;
  amount?: number;
  penalty_amount?: number;
  maintenance_amount?: number;
}
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
  const [formState, setFormState]: any = useState({
    category_id: extraData?.category?.id || "",
    discount_type: "percent",
    forgiveness: [],
  });
  const [errors, setErrors] = useState({});
  const [debts, setDebts] = useState([]);
  const { showToast } = useAuth();

  const totalAmount = formState?.forgiveness
    ?.reduce(
      (total: number, debt: any) =>
        total + (debt?.is_forgivable === "Y" ? Number(debt.amount) || 0 : 0),
      0
    )
    .toFixed(2);
  const totalPenaltyAmount = formState?.forgiveness
    ?.reduce(
      (total: number, debt: any) => total + (Number(debt.penalty_amount) || 0),
      0
    )
    .toFixed(2);
  const totalMaintenanceAmount = formState?.forgiveness
    ?.reduce(
      (total: number, debt: any) =>
        total + (Number(debt.maintenance_amount) || 0),
      0
    )
    .toFixed(2);

  const amountForgiveness =
    Number(totalAmount) +
    Number(totalPenaltyAmount) +
    Number(totalMaintenanceAmount);

  const handleChange = (e: any) => {
    if (e.target.name == "amount_value") {
      setFormState({
        ...formState,
        percent_value: (
          (Number(e.target.value) / amountForgiveness) *
          100
        ).toFixed(2),
        amount_value: e.target.value,
      });

      return;
    }
    if (e.target.name == "percent_value") {
      setFormState({
        ...formState,
        amount_value: (
          (Number(e.target.value) / 100) *
          amountForgiveness
        ).toFixed(2),
        percent_value: e.target.value,
      });
      return;
    }

    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const getUnits = () => {
    if (!extraData?.units) {
      return [];
    }
    return extraData?.units?.map((unit: any) => ({
      id: unit.id,
      name: unit.nro + " - " + unit.description,
    }));
  };

  const getDptosDebts = async () => {
    const { data } = await execute(
      "/dptos-debts",
      "GET",
      {
        dpto_id: formState?.dpto_id,
      },
      false,
      true
    );
    if (data?.success) {
      setDebts(data?.data);
    } else {
      showToast(data?.message || "Ocurrió un error", "error");
    }
  };
  useEffect(() => {
    if (formState?.dpto_id) {
      getDptosDebts();
      setFormState({ ...formState, forgiveness: [] });
      setErrors({});
      setDebts([]);
    }
  }, [formState?.dpto_id]);

  // const toggleForgivability = useCallback(
  //   (item: any, type: "A" | "M" | "MV") => {
  //     if (type == "A" && item?.is_forgivable == "N") return;
  //     setFormState((prev: any) => {
  //       const forgiveness = [...prev.forgiveness];
  //       const idx = forgiveness.findIndex((f) => f.id === item.id);
  //       const fieldMap: any = {
  //         A: "amount",
  //         M: "penalty_amount",
  //         MV: "maintenance_amount",
  //       };
  //       const field = fieldMap[type];

  //       if (idx > -1) {
  //         const updated = { ...forgiveness[idx] };
  //         if (updated[field]) {
  //           delete updated[field];
  //         } else {
  //           updated[field] = item[field as keyof DebtItem];
  //         }
  //         if (
  //           !updated.amount &&
  //           !updated.penalty_amount &&
  //           !updated.maintenance_amount
  //         ) {
  //           forgiveness.splice(idx, 1);
  //         } else {
  //           forgiveness[idx] = updated;
  //         }
  //         return { ...prev, forgiveness };
  //       }

  //       return {
  //         ...prev,
  //         forgiveness: [
  //           ...forgiveness,
  //           {
  //             id: item.id,
  //             debt_id: item.debt_id,
  //             [field]: item[field as keyof DebtItem],
  //           },
  //         ],
  //       };
  //     });
  //   },
  //   []
  // );
  const toggleForgivability = (item: any) => {
    // if (item?.is_forgivable == "N") return;
    const idx = formState.forgiveness.findIndex((f: any) => f.id === item.id);
    if (idx > -1) {
      const forgiveness = [...formState.forgiveness];
      forgiveness.splice(idx, 1);
      setFormState({ ...formState, forgiveness });
    } else {
      const forgiveness = [...formState.forgiveness];
      forgiveness.push(item);
      setFormState({ ...formState, forgiveness });
    }
  };

  // const debtOptions = [
  //   { label: "Monto", type: "A", field: "amount" },
  //   { label: "Multa", type: "M", field: "penalty_amount" },
  //   {
  //     label: "Mantenimiento de valor",
  //     type: "MV",
  //     field: "maintenance_amount",
  //   },
  // ];

  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState.dpto_id,
      rules: ["required"],
      key: "dpto_id",
      errors,
    });

    errors = checkRules({
      value: formState.category_id,
      rules: ["required"],
      key: "category_id",
      errors,
    });

    errors = checkRules({
      value: formState.due_at,
      rules: ["required"],
      key: "due_at",
      errors,
    });

    errors = checkRules({
      value: formState.amount_value,
      rules: ["required", `less:${amountForgiveness}`, "greater:0"],
      key: "amount_value",
      errors,
    });

    errors = checkRules({
      value: formState.percent_value,
      rules: ["required", "less:100", "greater:0"],
      key: "percent_value",
      errors,
    });

    errors = checkRules({
      value: formState.description,
      rules: ["required"],
      key: "description",
      errors,
    });

    setErrors(errors);
    return errors;
  };

  const onSave = async () => {
    let method = formState.id ? "PUT" : "POST";
    if (hasErrors(validate())) return;
    let total = 0;
    formState?.forgiveness?.forEach((debt: any) => {
      total +=
        Number(debt.amount) +
        Number(debt.penalty_amount) +
        Number(debt.maintenance_amount);
    });
    const amount = (total - Number(formState.amount_value)).toFixed(2);
    const idsForgiveness = formState.forgiveness.map((f: any) => f.id);

    const dataToSend: any = {
      type: "5",
      begin_at: formState.begin_at,
      due_at: formState.due_at,
      category_id: formState.category_id,
      dpto_id: formState.dpto_id,
      amount: amount,
      percent_value: formState.percent_value,
      amount_value: formState.amount_value,
      description: formState.description,
      forgiveness: idsForgiveness,
    };

    const { data: response } = await execute(
      "/debt-dptos" + (formState.id ? "/" + formState.id : ""),
      method,
      dataToSend,
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

  return (
    <DataModal
      title="Crear condonación"
      open={open}
      onClose={onClose}
      onSave={onSave}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Select
          name="dpto_id"
          label="Unidad"
          options={getUnits()}
          value={formState?.dpto_id}
          onChange={handleChange}
          error={errors}
        />
        <Input
          name="due_at"
          type="date"
          label="Fecha de plazo"
          value={formState?.due_at}
          onChange={handleChange}
          error={errors}
        />
      </div>

      {/* <Select
        name="category_id"
        label="Categoría"
        options={[extraData?.category]}
        value={formState?.category_id}
        onChange={handleChange}
        error={errors}
      /> */}
      <div
        style={{
          backgroundColor: "var(--cBlack)",
          border: "1px solid #3E4244",
          borderRadius: 12,
        }}
      >
        {debts?.map((debt: any) => (
          <div
            style={{
              // backgroundColor: "var(--cBlack)",
              padding: "10px 16px",
              borderBottom: "1px solid #3E4244",
            }}
            key={debt?.id}
            onClick={() => toggleForgivability(debt)}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <p
                  style={{
                    color: "var(--cWhite)",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  {`${
                    debt?.month
                      ? debt?.name +
                        " - " +
                        MONTHS[debt?.month] +
                        ", " +
                        debt?.year
                      : debt?.name
                  }`}
                </p>
                <p
                  style={{
                    color: "var(--cWhiteV1)",
                    fontSize: 12,
                    marginTop: 4,
                  }}
                >
                  {`Deuda: ${formatBs(debt?.amount)} • Mora: ${formatBs(
                    debt?.penalty_amount
                  )} • Mant. Valor: ${formatBs(debt?.maintenance_amount)}`}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <p
                  style={{
                    color: "var(--cWhite)",
                    fontSize: 14,
                    fontWeight: "bold",
                  }}
                >
                  {formatBs(
                    Number(debt?.amount) +
                      Number(debt?.penalty_amount) +
                      Number(debt?.maintenance_amount)
                  )}
                </p>
                {formState?.forgiveness?.some((f: any) => f.id === debt.id) ? (
                  <IconCheckSquare color="var(--cAccent)" />
                ) : (
                  <IconCheckOff />
                )}
              </div>
            </div>
            {/* {debtOptions.map(({ label, type, field }) => (
            <div
              key={type}
              onClick={() => toggleForgivability(debt, type as any)}
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "space-between",
                backgroundColor: "var(--cBlackV1)",
                padding: 8,
                borderRadius: 4,
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <p>
                {label}: {debt[field as keyof DebtItem]} Bs
              </p>
              {formState?.forgiveness?.some(
                (f: any) => f.id === debt.id && f[field as keyof Forgiveness]
              ) ? (
                <IconCheckSquare color="var(--cAccent)" />
              ) : (
                ((field == "amount" && debt?.is_forgivable == "Y") ||
                  field === "penalty_amount" ||
                  field == "maintenance_amount") && <IconCheckOff />
              )}
            </div>
          ))} */}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Input
          name="amount_value"
          label="Monto a condonar"
          value={formState?.amount_value}
          onChange={handleChange}
          error={errors}
          type="number"
          suffix="Bs"
        />
        <Input
          name="percent_value"
          label="Porcentaje a condonar"
          value={formState?.percent_value}
          onChange={handleChange}
          error={errors}
          type="number"
          suffix="%"
        />
      </div>
      <p>Monto disponible a condonar: {amountForgiveness.toFixed(2)}</p>

      <TextArea
        name="description"
        label="Descripción"
        value={formState?.description}
        onChange={handleChange}
        error={errors}
      />
      <div></div>
    </DataModal>
  );
};

export default RenderForm;
