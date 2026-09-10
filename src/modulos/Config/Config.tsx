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
  const { getUser, user } = useAuth();
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
    const { data, error } = await execute("/v3/client-configs/actualizar", "PUT", {
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
      <div className={styles.tabBar}>
        <div className={styles.tabBarInner}>
          <TabsButtons
            tabs={[
              { value: "C", text: "Condominio" },
              { value: "R", text: "Reglas Operativas" },
              { value: "P", text: "Cuentas de pagos" },
              { value: "M", text: "Morosidad" },
              { value: "T", text: "Tipos de unidades" },
            ]}
            sel={typeSearch}
            setSel={setTypeSearch}
            variant="pill"
          />
        </div>
      </div>

      <div className={styles.contentPanel}>
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
        {typeSearch == "R" && (
          <LoadingScreen>
            <DptoConfig
              client_config={client_config?.data?.[0]}
              onSave={onSave}
              mode="rules"
            />
          </LoadingScreen>
        )}
        {typeSearch == "T" && (
          <div className={styles.tablePanel}>
            <UnitsType />
          </div>
        )}
        {/* ⚠️ Acá vivía la configuración del QR dinámico, y se retiró a
            propósito.

            Decisión del dueño, 2026-09-05: *«pueden tener varias y elegir cuál
            cobra»*. La configuración dejó de ser del condominio y pasó a ser de
            la CUENTA BANCARIA: vive en el formulario de cada cuenta.

            Y 2026-09-06: *«sobre quien configura los QR solo los usuarios
            FOS»*. Un administrador de condominio que la viera acá sólo podía
            recibir un 403. */}
      </div>
    </div>
  );
};

export default Config;
