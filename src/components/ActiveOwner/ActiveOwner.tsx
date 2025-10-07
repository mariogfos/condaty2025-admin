"use client";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import useAxios from "@/mk/hooks/useAxios";
import { getFullName } from "@/mk/utils/string";
import React, { useEffect, useState } from "react";
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import styles from "./ActiveOwner.module.css";

const ActiveOwner = ({
  open,
  onClose,
  data,
  typeActive,
  onCloseOwner,
  reLoad,
}: any) => {
  const { store, showToast, user } = useAuth();
  const [formState, setFormState]: any = useState({});
  const [errors, setErrors] = useState({});
  // const [ldpto, setLdpto] = useState([]);
  const client = data?.clients?.find(
    (item: any) => item?.id === user?.client_id
  );
  // R:Rechazar
  // X:"Rechazado"
  // A:Aceptado
  // W:En espera

  const { data: dptos, execute } = useAxios(
    "/dptos",
    "GET",
    {
      fullType: "PR",
    },
    true
  );

  // useEffect(() => {
  //   const lista =
  //     dptos?.data?.map((item: any) => ({
  //       id: item?.id,
  //       nro: store?.UnitsType + " " + item?.nro + " - " + item?.description,
  //     })) || [];
  //   setLdpto(lista);
  // }, [dptos?.data]);
  const getLDptos = () => {
    console.log(dptos?.data, "ALLALALLA");
    const lista =
      dptos?.data?.map((item: any) => ({
        id: item?.id,
        // nro: store?.UnitsType + " " + item?.nro + " - " + item?.description,
        nro: `${store?.UnitsType} ${item?.nro} ${
          item?.description ? "- " + item?.description : ""
        }`,
      })) || [];

    return lista;
  };

  const handleChangeInput = (e: any) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

  const validate = () => {
    let errs: any = {};
    if (typeActive === "X") {
      errs = checkRules({
        value: formState.obs,
        rules: ["required"],
        key: "obs",
        errors: errs,
      });
    } else {
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

  const activeResident = async () => {
    const errs = validate();
    if (hasErrors(errs)) return;

    let params = {};
    if (typeActive === "X") {
      params = { id: data?.id, confirm: "X", obs: formState.obs };
    } else {
      params = { id: data?.id, dpto_id: formState.dpto_id, confirm: "A" };
    }

    const { data: dataResident, error } = await execute(
      "/activeRegister",
      "POST",
      params
    );
    if (dataResident?.success === true) {
      if (typeActive === "X") {
        showToast("La cuenta fue rechazada con éxito", "info");
      } else {
        showToast("La cuenta fue activada con éxito", "success");
      }
      onClose();
      onCloseOwner();
      reLoad();
    } else {
      showToast(error?.data?.message || error?.message, "error");
      console.log("error:", error);
    }
  };
  return (
    <DataModal
      open={open}
      onSave={activeResident}
      title={typeActive === "X" ? "Rechazar solicitud" : "Asignar unidad"}
      buttonText="Guardar"
      onClose={onClose}
    >
      {typeActive === "A" ? (
        <div className={styles.activeContainer}>
          <div>
            Selecciona la unidad para el residente
            <span className={styles.resalted}> {getFullName(data)}</span>.
          </div>
          <p className="font-light text-md mb-6 text-lightv3">
            El residente indicó que está en la unidad:{" "}
            <span className={styles.resalted}>
              U: {client?.pivot?.preunidad || "Sin especificar"}
            </span>
          </p>
          <div>
            <Select
              label="Selecciona la unidad"
              // placeholder={"Número de " + store.UnitsType}
              name="dpto_id"
              required={true}
              value={formState.dpto_id}
              options={getLDptos()}
              optionLabel="nro"
              error={errors}
              optionValue="id"
              onChange={handleChangeInput}
            />
          </div>
        </div>
      ) : (
        <div className={styles.activeContainer}>
          <p className={styles.textContent}>
            Por favor indica el motivo del rechazo para que el residente pueda
            comprender y realice el pre-registro de manera correcta
          </p>
          <TextArea
            label="Motivo del rechazo de cuenta"
            name="obs"
            required={true}
            onChange={handleChangeInput}
            value={formState.obs}
            error={errors}
          />
        </div>
      )}
    </DataModal>
  );
};

export default ActiveOwner;
