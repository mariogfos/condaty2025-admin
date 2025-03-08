import { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";

import styles from "./index.module.css";

import { WidgetSkeleton } from "@/mk/components/ui/Skeleton/Skeleton";
import { WidgetDashCard } from "../ Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes, getDateTimeStrMes, getNow } from "@/mk/utils/date";
import WidgetBase from "../ Widgets/WidgetBase/WidgetBase";
import WidgetGraphResume from "../ Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";
import Button from "@/mk/components/forms/Button/Button";
import WidgetCalculatePenalty from "../ Widgets/WidgetsDashboard/WidgetCalculatePenalty/WidgetCalculatePenalty";
import { WidgetList } from "../ Widgets/WidgetsDashboard/WidgetList/WidgetList";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { getFullName } from "@/mk/utils/string";
import { UnitsType } from "@/mk/utils/utils";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import RenderView from "@/modulos/Owners/RenderView";
import DetailPayment from "@/modulos/Payments/PaymentDetail/PaymentDetail";

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};
const HomePage = () => {
  const { store,setStore, userCan ,showToast,user } = useAuth();
  const [histParams, setHistParams] = useState<any[]>([]);
  const [params, setParams] = useState<any>(paramsInitial);
  const [ openActive , setOpenActive ] = useState(false);
  const [ openPayment , setOpenPayment ] = useState(false);
  const [ dataOwner , setDataOwner ]:any = useState({});
  const [ dataPayment , setDataPayment ]:any = useState({});


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


  const paymentProps : any = {
    open:openPayment,
    onClose:()=>setOpenPayment(false),
    item:dataPayment,
  }

    
    const pagosList = (data:any) => {
      // console.log(data,'pagoslist')
      // Función para eliminar duplicados
      const removeDuplicates = (string:string) => {
        const uniqueArray = string.split(",").filter((item, index, self) => {
          return self.indexOf(item) === index;
        });
        return uniqueArray.join(" ");
      };
  
  
      return (
        <ItemList
          title={getFullName(data?.owner)}
          subtitle={store.UnitsType + " " + removeDuplicates(data?.dptos)}
          right={
            <Button
              onClick={() => {
                if (userCan("inicio", "C") == false)
                  return showToast(
                    "No tiene permisos para aceptar pagos",
                    "error"
                  );
                 setDataPayment(data);
                 setOpenPayment(true);
              }}
              
            >
              Revisar
            </Button>
          }
        >
          {/* <div className="items-center justify-between gap-4 hidden">
            <div>Periodos: {data.details?.length}</div>
            <div>Monto: {data.amount}</div>
          </div> */}
        </ItemList>
      );
    };

    const registroList = (data:any) => {
      return (
        <ItemList
          title={getFullName({
            last_name: data.owner.last_name,
            middle_name: data.owner.middle_name,
            mother_last_name: data.owner.mother_last_name,
            name: data.owner.name,
          })}
          right={
            <Button
              onClick={() => {
                if (userCan("inicio", "C") == false)
                  return showToast(
                    "No tiene permisos para aceptar cuentas pre-registradas",
                    "error"
                  );
                setDataOwner(data.owner);
                setOpenActive(true);
              }}
              
            >
              Ver
            </Button>
          }
        ></ItemList>
      );
    };
   

    const alertasList = (data:any) => {
      return (
        <div title={""} className={styles.alertsList}>
         <section> 
          <div>
              <div>
                {getFullName(data?.guardia)}{" "}
              </div>
              <div>
                Descripción: {data.descrip}
              </div>
              
                <div>
                  {getDateTimeStrMes(data.created_at)}
                </div>
          </div>
            <div className="flex justify-end items-center -mt-6">
              <div
                className={`${styles.levelText}  ${
                  data?.level === 1
                    ? styles.levelLow
                    : data.level === 2
                    ? styles.levelMedium
                    : styles.levelHigh
                }`}
              >
                <p className="text-xs">
                  {`Nivel ${
                    data.level === 1
                      ? "bajo"
                      : data.level === 2
                      ? "medio"
                      : "alto"
                  }`}
                </p>
              </div>
            </div>
          
          </section>
        </div>
      );
    };
  if (!userCan("home", "R")) return <NotAccess />;
  // if (!loaded) return <WidgetSkeleton />;
  return <>
  
  <div className={styles.container}>

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
     onClick={()=> window.location.href = "/outlays"}
 
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
   <section >
   <div className={styles.widgetsContainer}>
      <WidgetCalculatePenalty />
    
  
        <WidgetList
        className={styles.widgetAlerts}
        title="Solicitudes de pago"
        message="En este momento no tienes pagos por revisar"
        data={dashboard?.data?.porConfirmar}
        renderItem={pagosList}
        />
        <WidgetList        
            className={styles.widgetAlerts}
            title="Cuentas pre-registro"
            message="En este momento no tienes cuentas por activar"
            data={dashboard?.data?.porActivar}
            renderItem={registroList}
          />
    </div>
    <WidgetList
       className={styles.widgetAlerts}
       title="Últimas alertas"
       message="En este momento no tienes ninguna alerta"
       data={dashboard?.data?.alertas}
       renderItem={alertasList}
     />                                   
   </section>
  </div>
 <RenderView 
  open={openActive}
  onClose={()=>setOpenActive(false)}
  item={dataOwner}
 />
 <DetailPayment
{ ...paymentProps}
 />
  </>;
};

export default HomePage;
