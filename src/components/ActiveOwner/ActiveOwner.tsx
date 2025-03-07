'use client';
import Select from '@/mk/components/forms/Select/Select';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { useAuth } from '@/mk/contexts/AuthProvider';
import useAxios from '@/mk/hooks/useAxios';
import { getFullName } from '@/mk/utils/string';
import { UnitsType } from '@/mk/utils/utils'
import React, { useState } from 'react'

const ActiveOwner = ({open,onClose,data}:any) => {
    const {store,showToast} = useAuth();
    const { execute } = useAxios()
   const [formState,setFormState]:any = useState({});
    const activeResident = async (rechazar = false) => {
        let err = {};
        let params = {};
        if (rechazar == true) {
          if (!formState?.obs) {
            err = { ...err, obs: "El campo es requerido" };
          }
        } else {
          if (!formState?.dpto_id) {
            err = { ...err, dpto_id: "El campo es requerido" };
          }
        }
        console.log("err:", err);
    
        if (Object.keys(err).length > 0) {
        //   setErrorsDash(err);
          return;
        }
    
        if (rechazar == true) {
          params = { id: data?.id, confirm: "X", obs: formState.obs };
        } else {
          params = {
            id: data?.id,
            dpto_id: formState?.dpto_id,
            confirm: "P",
          };
        }
    
        const { data: dataResident, error } = await execute(
          "/activeRegister",
          "POST",
          params
        );
        if (dataResident?.success == true) {
     
          if (rechazar == true) {
            showToast("La cuenta fue rechazada con éxito", "info");
          } else {
            showToast("La cuenta fue activada con éxito", "success");
          }
        } else {
          showToast(error?.data?.message || error?.message, "error");
          console.log("error:", error);
        }
      };

  return (
    // {activeUnidad && (
        <DataModal
          open={open}
          onSave={activeResident}
          title="Asignar unidad"
          buttonText="Guardar"
          onClose={onClose}
        //     setActiveUnidad(false);
        //     setHeightModal(false);
        //     setErrorsDash({});
        //   }}
        >
          <div>
            <div >
              Selecciona la unidad para el residente
              <span >{getFullName(data)}</span>
            </div>
            <p className="font-light text-md mb-6 text-lightv3">
              El residente indicó que está en la unidad:
              {/* <span> {pivot?.preunidad}</span> */}
            </p>
            <div
            // onClick={(e) => {
            //   e.preventDefault();
            //   setHeightModal(!heightModal);
            // }}
            >
              {/* <Select
                placeholder={"Número de " + store.UnitsType}
                name="dpto_id"
                // error={errorsDash}
                required={true}
                value={formState.dpto_id}
                onChange={handleChangeInput}
                options={ldpto}
                optionLabel="nro"
                optionValue="id"
                
              /> */}
          
      
          {/* <TextArea
            label="Motivo del rechazo de cuenta"
            name="obs"
            required={true}
            onChange={handleChangeInput}
            value={formState.obs}
          /> */}
     </div>
     </div>

    </DataModal>
  )
};

export default ActiveOwner