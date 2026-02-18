"use client";

import React, { useState } from "react";
import styles from "./Config.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DefaulterConfig from "./DefaulterConfig/DefaulterConfig";
import PaymentsConfig from "./PaymentsConfig/PaymentsConfig";
import DptoConfig from "./DptoConfig/DptoConfig";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import UnitsType from "../UnitTypes/UnitsTypes";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
const paramsInitial = {
  perPage: -1,
  page: 1,
  extraData: true,
};
const Config = () => {
  const { getUser } = useAuth();
  const { showToast, userCan }: any = useAuth();
  const [typeSearch, setTypeSearch] = useState("C");

  const {
    data: client_config,
    reLoad,
    execute,
  } = useAxios("/client-config", "GET", {
    ...paramsInitial,
  });

  const onSave = async (formState: any) => {
    const { data, error } = await execute("/client-config-actualizar", "PUT", {
      ...formState,
    });

    if (data?.success === true) {
      showToast("Datos guardados", "success");
      reLoad(paramsInitial);
      getUser();
    } else {
      showToast(error?.data?.message || data?.message, "error");
      console.log("error:", error);
    }
  };

  if (!userCan("settings", "R")) {
    return <NotAccess />;
  }

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

      <div>
        {typeSearch == "M" && (
          <LoadingScreen>
            <DefaulterConfig
              client_config={client_config?.data?.[0]}
              onSave={onSave}
            />
          </LoadingScreen>
        )}

        {typeSearch == "P" && (
          <LoadingScreen>
            <PaymentsConfig
              bankAccounts={client_config?.extraData?.bankAccounts}
              client_config={client_config?.data?.[0]}
              onSave={onSave}
            />
          </LoadingScreen>
        )}
        {typeSearch == "C" && (
          <LoadingScreen>
            <DptoConfig
              client_config={client_config?.data?.[0]}
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
