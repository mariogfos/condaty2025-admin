'use client';
import Select from '@/mk/components/forms/Select/Select';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { useAuth } from '@/mk/contexts/AuthProvider';
import useAxios from '@/mk/hooks/useAxios';
import { getFullName } from '@/mk/utils/string';
import React, { useEffect, useState } from 'react';
import { checkRules, hasErrors } from "@/mk/utils/validate/Rules";
import styles from './ActiveOwner.module.css'

const ActiveOwner = ({ open, onClose, data, typeActive , onCloseOwner }: any) => {
  const { store, showToast } = useAuth();
  const { execute,reLoad } = useAxios();
  const [formState, setFormState]: any = useState({});
  const [errors, setErrors] = useState({});
  const [ldpto, setLdpto] = useState([]);

  const { data: dptos } = useAxios("/dptos", "GET", {
    fullType: 'L'
  });

  useEffect(() => {
    const lista = dptos?.data
      ?.filter((item: any) => item?.titular === null)
      .map((item: any) => ({
        id: item?.id,
        nro: item?.nro + " " + store?.UnitsType + " " + item?.description,
      })) || [];
  
    setLdpto(lista);
  }, [dptos]);
  

  const handleChangeInput = (e: any) => {
    const { name, value } = e.target;
    setFormState({ ...formState, [name]: value });
  };

 
  const validate = () => {
    let errs: any = {};
    if (typeActive === "R") {
  
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
    if (typeActive === "R") {
      params = { id: data?.id, confirm: "R", obs: formState.obs };
    } else {
      params = { id: data?.id, dpto_id: formState.dpto_id, confirm: "A" };
    }

    const { data: dataResident, error } = await execute(
      "/activeRegister",
      "POST",
      params
    );
    if (dataResident?.success === true) {
      if (typeActive === "R") {
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
      title={typeActive === "R" ? "Rechazar cuenta" : "Asignar unidad"}
      buttonText="Guardar"
      onClose={onClose}
    
    >
      {typeActive === "S" ? (
        <div className={styles.activeContainer}>
          <div>
            Selecciona la unidad para el residente
            <span> {getFullName(data)}</span>
          </div>
          <p className="font-light text-md mb-6 text-lightv3">
            El residente indicó que está en la unidad: <span>{data?.preunidad}</span>
          </p>
          <div>
            <Select
              placeholder={"Número de " + store.UnitsType}
              name="dpto_id"
              required={true}
              value={formState.dpto_id}
              options={ldpto}
              optionLabel="nro"
              error={ errors}
              optionValue="id"
              onChange={handleChangeInput}
            />
            
          </div>
        </div>
      ) : (
        <div>
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
