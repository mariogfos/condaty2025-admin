import {
  IconCheckOff,
  IconCheckSquare,
  IconDptosDebts,
} from "@/components/layout/icons/IconsBiblioteca";
import Input from "@/mk/components/forms/Input/Input";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { MONTHS } from "@/mk/utils/date1";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import React, { useEffect, useState } from "react";
import { formatBs } from "../../../../../mk/utils/numbers";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import Br from "@/components/Detail/Br";

const RenderForm = ({
  open,
  onClose,
  item,
  setItem,
  execute,
  extraData,
  reLoad,
}: any) => {
  const [formState, setFormState]: any = useState({
    ...item,
    forgiveness: item?.forgiven_debts || [],
    percent_value: item?.forgiveness_percent,
    amount_value: item?.forgiveness_amount,
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
        type: formState?.id ? "edit" : "add",
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
      if (!formState?.id) {
        setFormState({ ...formState, forgiveness: [] });
      }
      setErrors({});
      setDebts([]);
    }
  }, [formState?.dpto_id]);

  const toggleForgivability = (item: any) => {
    if (formState?.id) return;
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

  const validate = () => {
    let errors: any = {};

    errors = checkRules({
      value: formState.dpto_id,
      rules: ["required"],
      key: "dpto_id",
      errors,
    });

    // errors = checkRules({
    //   value: formState.category_id,
    //   rules: ["required"],
    //   key: "category_id",
    //   errors,
    // });

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

    setErrors(errors);
    return errors;
  };

  const getTotal = () => {
    let total = 0;
    formState?.forgiveness?.forEach((debt: any) => {
      total +=
        Number(debt.amount) +
        Number(debt.penalty_amount) +
        Number(debt.maintenance_amount);
    });
    return total;
  };
  const onSave = async () => {
    let method = formState.id ? "PUT" : "POST";
    if (hasErrors(validate())) return;
    let total = getTotal();
    const amount = (total - Number(formState.amount_value)).toFixed(2);
    const idsForgiveness = formState.forgiveness.map((f: any) => f.id);

    const dataToSend: any = {
      type: "5",
      begin_at: formState.begin_at,
      due_at: formState.due_at,
      // category_id: formState.category_id,
      dpto_id: formState.dpto_id,
      amount: amount,
      percent_value: formState.percent_value,
      amount_value: formState.amount_value,
      obs: `${formState.obsNew ? "- " + formState.obsNew : ""} ${
        formState.obs ? `\n${formState.obs}` : ""
      }`,

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

  useEffect(() => {
    if (formState?.forgiveness?.length > 0 && !formState?.id) {
      setFormState({ ...formState, percent_value: "", amount_value: "" });
    }
  }, [formState?.forgiveness]);

  return (
    <DataModal
      title={formState?.id ? "Editar condonación" : "Crear condonación"}
      open={open}
      onClose={onClose}
      onSave={onSave}
      buttonText={formState?.id ? "Editar condonación" : "Crear condonación"}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <Select
          name="dpto_id"
          label="Unidad"
          options={getUnits()}
          value={formState?.dpto_id}
          onChange={handleChange}
          error={errors}
          disabled={formState?.id}
        />
        <Input
          name="due_at"
          type="date"
          label="Fecha de vencimiento"
          value={formState?.due_at}
          onChange={handleChange}
          error={errors}
          min={new Date().toISOString().split("T")[0]}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <p style={{ fontSize: 16, color: "var(--cWhite)", fontWeight: "500" }}>
          Deudas: {debts?.length}
        </p>
        {!formState?.id && (
          <p
            style={{
              color: "var(--cPrimary)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => setFormState({ ...formState, forgiveness: debts })}
          >
            Seleccionar todas
          </p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "var(--cBlack)",
          border: "1px solid #3E4244",
          borderRadius: 12,
          margin: "12px 0px",
          overflowY: "scroll",
          maxHeight: "169px",
          height: debts?.length == 0 ? "169px" : "auto",
        }}
      >
        {debts?.length == 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <IconDptosDebts size={40} color="var(--cWhiteV1)" />
            <p style={{ marginTop: 16, textAlign: "center" }}>
              Selecciona una unidad para
              <br /> mostrar sus deudas
            </p>
          </div>
        )}
        {debts?.map((debt: any, index: number) => (
          <div
            style={{
              backgroundColor: formState?.forgiveness?.some(
                (f: any) => f.id === debt.id
              )
                ? "var(--cFillSidebar)"
                : "transparent",
              padding: "10px 16px",
              borderBottom:
                index < debts?.length - 1 ? "1px solid #3E4244" : "",
              borderTopRightRadius: index === 0 ? 12 : 0,
              borderTopLeftRadius: index === 0 ? 12 : 0,
              borderBottomRightRadius: index === debts?.length - 1 ? 12 : 0,
              borderBottomLeftRadius: index === debts?.length - 1 ? 12 : 0,
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
          </div>
        ))}
      </div>
      {formState?.forgiveness.length > 0 && (
        <>
          <div
            style={{
              backgroundColor: "#2C2E2F",
              padding: "12px 16px",
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <KeyValue
              title={"Deuda total"}
              value={formatBs(getTotal())}
              colorValue="var(--cWhiteV1)"
            />
            <KeyValue
              title={"Mora total"}
              value={formatBs(totalPenaltyAmount)}
              colorValue="var(--cWhiteV1)"
            />
            <KeyValue
              title={"Mantenimiento de valor total"}
              value={formatBs(totalMaintenanceAmount)}
              colorValue="var(--cWhiteV1)"
            />
          </div>
          <p style={{ fontSize: 16, color: "var(--cWhite)", marginBottom: 10 }}>
            Monto disponible a condonar {formatBs(amountForgiveness)}
          </p>
          {/* {amountForgiveness > 0 && (
            <p style={{ fontSize: 13, fontWeight: "400", marginBottom: 10 }}>
             :{" "}
              <span style={{ color: "var(--cWhite)", fontWeight: "500" }}>
              
              </span>
            </p>
          )} */}
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              name="amount_value"
              label="Monto"
              value={parseFloat(formState?.amount_value)}
              onChange={handleChange}
              error={errors}
              disabled={formState?.id}
              type="number"
              suffix="Bs"
            />
            <Input
              name="percent_value"
              label="Porcentaje"
              value={parseFloat(formState?.percent_value)}
              disabled={formState?.id}
              onChange={handleChange}
              error={errors}
              type="number"
              suffix="%"
            />
          </div>

          {formState?.amount_value > 0 && (
            <div
              style={{
                backgroundColor: "#2C2E2F",
                padding: "12px 16px",
                borderRadius: 12,
                marginBottom: 10,
              }}
            >
              <KeyValue
                colorKey="var(--cWhite)"
                title={"Subtotal"}
                value={formatBs(getTotal())}
              />
              <KeyValue
                title={"Monto a condonar"}
                value={formatBs(formState?.amount_value)}
                colorValue="var(--cWhiteV1)"
              />

              <Br />
              <KeyValue
                colorKey="var(--cWhite)"
                styleTitle={{ fontWeight: "600" }}
                styleValue={{ fontWeight: "600" }}
                title={"Total a pagar"}
                size={17}
                value={formatBs(getTotal() - Number(formState?.amount_value))}
              />
            </div>
          )}
          {formState?.obs && (
            // <TextArea
            //   name="obs"
            //   required={false}
            //   label="Observaciones anteriores"
            //   disabled={formState?.id}
            //   value={formState?.obs}
            //   onChange={handleChange}
            //   error={errors}
            // />
            <>
              <p
                style={{
                  color: "var(--cWhite)",
                  marginBottom: 8,
                  fontSize: 16,
                  fontWeight: "400",
                }}
              >
                Observaciones anteriores
              </p>
              <p
                style={{
                  color: "var(--cWhiteV1)",
                  marginBottom: 8,
                  fontSize: 14,
                  fontWeight: "400",
                  whiteSpace: "pre-wrap",
                }}
              >
                {formState?.obs}
              </p>
            </>
          )}
          <TextArea
            name="obsNew"
            required={false}
            label="Observaciones / Comentarios"
            value={formState?.obsNew}
            onChange={handleChange}
            error={errors}
          />
        </>
      )}
      <div></div>
    </DataModal>
  );
};

export default RenderForm;
