"use client";

import React, { useEffect, useState } from "react";
import styles from "./Config.module.css";
import useAxios from "@/mk/hooks/useAxios";

import { useAuth } from "@/mk/contexts/AuthProvider";
import DefaulterConfig from "./DefaulterConfig/DefaulterConfig";
import PaymentsConfig from "./PaymentsConfig/PaymentsConfig";
import DptoConfig from "./DptoConfig/DptoConfig";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import UnitsType from "../UnitTypes/UnitsTypes";
import NotAccess from "@/components/layout/NotAccess/NotAccess";

const Config = () => {
  const [formState, setFormState]: any = useState({});
  const [errorImage, setErrorImage] = useState(false);
  const { user, showToast, getUser, userCan }: any = useAuth();
  const [errors, setErrors]: any = useState({});
  const [typeSearch, setTypeSearch] = useState("C");
  // const router = useRouter();

  const {
    data: client_config,
    reLoad,
    execute,
  } = useAxios("/client-config", "GET", {
    perPage: -1,
    orderBy: "asc",
    sortBy: "",
    relations: "client",
    page: 1,
    // searchBy: "client_id,=," + user?.client_id,
  });
  const onChange = (e: any) => {
    let value = e?.target?.value;
    let name = e.target.name;
    if (e.target.type == "checkbox") {
      value = e.target.checked ? "Y" : "N";
    }
    if (
      name == "percent" ||
      name == "amount" ||
      name == "first_amount" ||
      name == "second_amount"
    ) {
      setFormState({
        ...formState,
        penalty_data: { ...formState?.penalty_data, [name]: value },
      });
      return;
    }
    setFormState({ ...formState, [name]: value });
  };
  useEffect(() => {
    const ci = formState.payment_transfer_ci;

    if (ci && ci.length > 15) {
      // Update the formState to only include the first 10 characters
      setErrors({ ...errors, payment_transfer_ci: "Máximo 15 caracteres" });
      setFormState((prevState: any) => ({
        ...prevState,
        payment_transfer_ci: ci.slice(0, 15),
      }));
    }
  }, [formState.payment_transfer_ci]);

  const validate = () => {
    let errors: any = {};

    if (typeSearch === "C") {
      if (errorImage) {
        errors = checkRules({
          value: formState.avatar,
          rules: ["required"],
          key: "avatar",
          errors,
        });
      }
      errors = checkRules({
        value: formState.name,
        rules: ["required"],
        key: "name",
        errors,
      });
      errors = checkRules({
        value: formState.email,
        rules: ["required", "email"],
        key: "email",
        errors,
      });
      errors = checkRules({
        value: formState.address,
        rules: ["required"],
        key: "address",
        errors,
      });
      errors = checkRules({
        value: formState.phone,
        rules: ["required"],
        key: "phone",
        errors,
      });
      errors = checkRules({
        value: formState.year,
        rules: ["required"],
        key: "year",
        errors,
      });
      errors = checkRules({
        value: formState.month,
        rules: ["required"],
        key: "month",
        errors,
      });
      errors = checkRules({
        value: formState.initial_amount,
        rules: ["required"],
        key: "initial_amount",
        errors,
      });
    }

    if (typeSearch === "M") {
      errors = checkRules({
        value: formState.soft_limit,
        rules: ["required", "lessOrEqual:hard_limit,Bloqueo"],
        key: "soft_limit",
        errors,
        data: formState,
      });
      errors = checkRules({
        value: formState.hard_limit,
        rules: ["required", "greaterOrEqual:soft_limit,Pre-aviso"],
        key: "hard_limit",
        errors,
        data: formState,
      });
      errors = checkRules({
        value: formState.penalty_limit,
        rules: ["required", "lessOrEqual:hard_limit,Bloqueo"],
        key: "penalty_limit",
        errors,
        data: formState,
      });

      if (formState.penalty_type == 1) {
        errors = checkRules({
          value: formState.penalty_data?.percent,
          rules: ["required"],
          key: "percent",
          errors,
          data: formState.penalty_data,
        });
      }
      if (formState.penalty_type == 2) {
        errors = checkRules({
          value: formState.penalty_data?.amount,
          rules: ["required"],
          key: "amount",
          errors,
          data: formState.penalty_data,
        });
      }
      if (formState.penalty_type == 3) {
        errors = checkRules({
          value: formState.penalty_data?.first_amount,
          rules: ["required"],
          key: "first_amount",
          errors,
          data: formState.penalty_data,
        });
        errors = checkRules({
          value: formState.penalty_data?.second_amount,
          rules: ["required"],
          key: "second_amount",
          errors,
          data: formState.penalty_data,
        });
      }
    }

    if (typeSearch === "P") {
      if (errorImage) {
        errors = checkRules({
          value: formState.avatarQr,
          rules: ["required"],
          key: "avatarQr",
          errors,
        });
      }
      errors = checkRules({
        value: formState.payment_transfer_bank,
        rules: ["required"],
        key: "payment_transfer_bank",
        errors,
      });
      errors = checkRules({
        value: formState.payment_transfer_account,
        rules: ["required"],
        key: "payment_transfer_account",
        errors,
      });
      errors = checkRules({
        value: formState.payment_transfer_name,
        rules: ["required"],
        key: "payment_transfer_name",
        errors,
      });
      errors = checkRules({
        value: formState.payment_office_obs,
        rules: ["required"],
        key: "payment_office_obs",
        errors,
      });
      errors = checkRules({
        value: formState.payment_transfer_ci,
        rules: ["required", "min:5", "max:15"],
        key: "payment_transfer_ci",
        errors,
      });
    }

    setErrors(errors);
    return errors;
  };

  // Ahora, el onSave utiliza la función validate para comprobar si hay errores:
  const onSave = async () => {
    if (hasErrors(validate())) return;
    const { data, error } = await execute("/client-config-actualizar", "PUT", {
      ...formState,
      penalty_data: formState.penalty_data,
    });

    if (data?.success === true) {
      showToast("Datos guardados", "success");
      setErrors({});

      // Forzar recarga completa de la página
      // window.location.reload();
    } else {
      showToast(error?.data?.message || data?.message, "error");
      console.log("error:", error);
      // setErrors(error?.data?.errors);
    }
  };

  useEffect(() => {
    // const client = user?.clients?.find((i: any) => i.id == user?.client_id);
    // const client = await = execute('/clients', 'GET', {id: user?.client_id)
    //setFormState({ ...client_config?.data[0], ...client });

    setFormState({
      ...client_config?.data[0],
      client: undefined,
      deleted_at: undefined,
      created_at: undefined,
      remember_token: undefined,
      ...client_config?.data[0]?.client,
      // updated_at:
      //   client_config?.data[0]?.updated_at >
      //   client_config?.data[0]?.client?.updated_at
      //     ? client_config?.data[0]?.updated_at
      //     : client_config?.data[0]?.client?.updated_at,
    });
  }, [client_config?.data]);

  useEffect(() => {
    if (formState.penalty_type !== client_config?.data[0]?.penalty_type) {
      setFormState({
        ...formState,
        penalty_data: {},
      });
    }
    // setFormState({
    //   ...formState,
    //   // penalty_data: {
    //   //   ...formState.penalty_data,
    //   //   percent: formState.penalty_type == 1 ? formState.penalty_data?.percent : undefined,
    //   //   amout: formState.penalty_type == 2 ? formState.penalty_data?.amout : undefined,
    //   //   first_amount: formState.penalty_type == 3 ? formState.penalty_data?.first_amount : undefined,
    //   //   second_amount: formState.penalty_type == 3 ? formState.penalty_data?.second_amount : undefined,
    //   // }
    //   penalty_data: {},
    // });
  }, [formState.penalty_type]);
  if (!userCan("settings", "R")) {
    return <NotAccess />;
  }
  console.log(formState);
  return (
    <div className={styles.Config}>
      <div>
        <TabsButtons
          tabs={[
            { value: "C", text: "Condominio" },
            { value: "P", text: "Cuentas de pagos" },
            { value: "M", text: "Morosidad" },
            { value: "T", text: "Tipos de unidades" },
          ]}
          sel={typeSearch}
          setSel={setTypeSearch}
        />
      </div>

      <div className="">
        {typeSearch == "M" && (
          <LoadingScreen>
            <DefaulterConfig
              formState={formState}
              onChange={onChange}
              errors={errors}
              onSave={onSave}
            />
          </LoadingScreen>
        )}

        {typeSearch == "P" && (
          <LoadingScreen>
            <PaymentsConfig
              formState={formState}
              onChange={onChange}
              errors={errors}
              setErrors={setErrors}
              onSave={onSave}
            />
          </LoadingScreen>
        )}
        {typeSearch == "C" && (
          <LoadingScreen>
            <DptoConfig
              formState={formState}
              setFormState={setFormState}
              onChange={onChange}
              errors={errors}
              setErrors={setErrors}
              client_config={client_config}
              onSave={onSave}
            />
          </LoadingScreen>
        )}
        {typeSearch == "T" && <UnitsType />}
      </div>
    </div>
  );
};

export default Config;
