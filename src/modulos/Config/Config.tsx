"use client";
import { getUrlImages } from "@/mk/utils/string";
import React, { useEffect, useState } from "react";
import styles from "./Config.module.css";
import useAxios from "@/mk/hooks/useAxios";
// import { useRouter } from "next/router";
import { formatNumber } from "@/mk/utils/numbers";
import Input from "@/mk/components/forms/Input/Input";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import {
  IconArrowDown,
  IconCamera,
} from "@/components/layout/icons/IconsBiblioteca";
import Button from "@/mk/components/forms/Button/Button";
import Select from "@/mk/components/forms/Select/Select";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DefaulterConfig from "./DefaulterConfig/DefaulterConfig";
import PaymentsConfig from "./PaymentsConfig/PaymentsConfig";
import DptoConfig from "./DptoConfig/DptoConfig";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import UnitsType from "../UnitTypes/UnitsTypes";

const Config = () => {
  const [formState, setFormState]: any = useState({});
  const [errorImage, setErrorImage] = useState(false);
  const [preview, setPreview]: any = useState(null);
  const [previewQr, setPreviewQr]: any = useState(null);
  const { user, showToast, getUser }: any = useAuth();
  const [errors, setErrors]: any = useState({});
  const [typeSearch, setTypeSearch] = useState("C");
  const [imageError, setImageError] = useState(false);
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
    if (e.target.type == "checkbox") {
      value = e.target.checked ? "Y" : "N";
    }
    setFormState({ ...formState, [e.target.name]: value });
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
        rules: ["required"],
        key: "soft_limit",
        errors,
      });
      errors = checkRules({
        value: formState.hard_limit,
        rules: ["required"],
        key: "hard_limit",
        errors,
      });
      errors = checkRules({
        value: formState.penalty_percent,
        rules: ["required"],
        key: "penalty_percent",
        errors,
      });
    }

    if (typeSearch === "P") {
      // Si hay error con la imagen, se valida que el avatarQr sea obligatorio
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

    const { data, error } = await execute(
      "/client-config-actualizar",
      "PUT",
      formState
    );

    if (data?.success === true) {
      showToast("Datos guardados", "success");
      setErrors({});
      // Aquí puedes realizar otras acciones como redirigir o refrescar datos.
      reLoad();
    } else {
      showToast(error?.data?.message || error?.message, "error");
      console.log("error:", error);
      setErrors(error?.data?.errors);
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

  return (
    <div className={styles.Config}>
      <div>
        <TabsButtons
          tabs={[
            { value: "C", text: "Condominio" },
            { value: "P", text: "Pagos" },
            { value: "M", text: "Morosidad" },
          ]}
          sel={typeSearch}
          setSel={setTypeSearch}
        />
      </div>
      <LoadingScreen>
        <div className="">
        {typeSearch == "M" && (
            <DefaulterConfig
              formState={formState}
              onChange={onChange}
              errors={errors}
              onSave={onSave}
            />
          )}
          {typeSearch == "P" && (
            <PaymentsConfig
              formState={formState}
              onChange={onChange}
              errors={errors}
              setErrors={setErrors}
              onSave={onSave}
            />
          )}
          {typeSearch == "C" && (
            <DptoConfig
              formState={formState}
              setFormState={setFormState}
              onChange={onChange}
              errors={errors}
              setErrors={setErrors}
              client_config={client_config}
              onSave={onSave}
            />
          )}
          {typeSearch == "T" &&
             <UnitsType />

          }
          <div className="w-full flex justify-center mb-6">
            <Button
              className={
                typeSearch == "P"
                  ? "w-[68%] btn btn-primary"
                  : "btn btn-primary"
              }
              onClick={() => onSave()}
            >
              Guardar
            </Button>
          </div>
        </div>
      </LoadingScreen>
    </div>
  );
};

export default Config;
