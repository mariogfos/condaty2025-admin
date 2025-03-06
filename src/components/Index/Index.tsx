import { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";

import styles from "./index.module.css";

import { WidgetSkeleton } from "@/mk/components/ui/Skeleton/Skeleton";
import { WidgetDashCard } from "../ Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes, getNow } from "@/mk/utils/date";
import WidgetBase from "../ Widgets/WidgetBase/WidgetBase";
import WidgetGraphResume from "../ Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};
const HomePage = () => {
  const { setStore, userCan } = useAuth();
  const { user } = useAuth();
  const [histParams, setHistParams] = useState<any[]>([]);
  const [params, setParams] = useState<any>(paramsInitial);

  useEffect(() => {
    setStore({
      title: "Inicio",
    });
  }, []);

   const {
     data: dashboard,
     reLoad,
     loaded,
   } = useAxios("/dashboard", "GET", {
     ...params,
   });

  const today = getNow()
  const formattedDate =`Al ${getDateStrMes(today)}`
  let balance: any =
  Number(dashboard?.data?.TotalIngresos) -
  Number(dashboard?.data?.TotalEgresos);
  const balanceMessage = balance > 0 ? "Saldo a favor" : "Saldo en contra";

  if (!userCan("home", "R")) return <NotAccess />;
  // if (!loaded) return <WidgetSkeleton />;
  return <div className={styles.container}>
<section>
    <WidgetDashCard
      title="Ingresos"
      subtitle={formattedDate}
      data={"Bs. " + formatNumber(dashboard?.data?.TotalIngresos)}
      onClick={()=> window.location.href = "/payments"} 
   />
     <WidgetDashCard
     title="Egresos"
     subtitle={formattedDate}
     data={"Bs. " + formatNumber(dashboard?.data?.TotalEgresos)}
     onClick={()=> window.location.href = "/ingresos"}
 
   />
     <WidgetDashCard
     title={balanceMessage}
     color={balance < 0 ? "var(--cError)" : ""}
     subtitle={formattedDate}
     data={
       "Bs. " +
       formatNumber(
         Number(dashboard?.data?.TotalIngresos) -
           Number(dashboard?.data?.TotalEgresos)
       )
     }
     
   
   />
     <WidgetDashCard
     title="Cartera vencida"
     subtitle={formattedDate}
     data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
     onClick={()=> window.location.href = "/defaultersview"} 
   
   />
   </section>
   <section>
    
    <WidgetGraphResume
                  saldoInicial={dashboard?.data?.saldoInicial}
                  ingresos={dashboard?.data?.ingresosHist}
                  egresos={dashboard?.data?.egresosHist}
                  periodo="y"
                />
 
   </section>
  </div>;
};

export default HomePage;
