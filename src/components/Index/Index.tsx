import { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";

import styles from "./index.module.css";

import { WidgetSkeleton } from "@/mk/components/ui/Skeleton/Skeleton";
import { WidgetDashCard } from "../Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes, getDateTimeStrMes, getNow } from "@/mk/utils/date";
import WidgetBase from "../Widgets/WidgetBase/WidgetBase";
import WidgetGraphResume from "../Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";
import Button from "@/mk/components/forms/Button/Button";
import WidgetCalculatePenalty from "../Widgets/WidgetsDashboard/WidgetCalculatePenalty/WidgetCalculatePenalty";
import { WidgetList } from "../Widgets/WidgetsDashboard/WidgetList/WidgetList";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { getFullName } from "@/mk/utils/string";
import { UnitsType } from "@/mk/utils/utils";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import OwnersRender from "@/modulos/Owners/RenderView/RenderView";
import PaymentRender from "@/modulos/Payments/RenderView/RenderView";
import ReservationDetailModal from "@/modulos/Reservas/RenderView/RenderView";
import { IconBriefCaseMoney, IconEgresos, IconIngresos, IconWallet } from "../layout/icons/IconsBiblioteca";
import WidgetContentsResume from "../Widgets/WidgetsDashboard/WidgetContentsResume/WidgetContentsResume";
// Asegúrate que la ruta al modal sea correcta

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};

const HomePage = () => {
  const { store, setStore, userCan, showToast, user } = useAuth();
  const [histParams, setHistParams] = useState<any[]>([]);
  const [params, setParams] = useState<any>(paramsInitial);
  const [openActive, setOpenActive] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [dataOwner, setDataOwner]: any = useState({});
  const [dataPayment, setDataPayment]: any = useState({});
  const [openReservation, setOpenReservation] = useState(false);
  // Estado para guardar el ID de la reserva seleccionada
  const [selectedReservationId, setSelectedReservationId]: any = useState(null);

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

  const today = getNow();
  const formattedDate = `Resumen ala fecha actual, ${getDateStrMes(today)}`;
  let balance: any =
    Number(dashboard?.data?.TotalIngresos) -
    Number(dashboard?.data?.TotalEgresos);
  const balanceMessage = balance > 0 ? "Saldo a favor" : "Saldo en contra";

  const paymentProps: any = {
    open: openPayment,
    onClose: () => setOpenPayment(false),
    item: dataPayment,
    payment_id: dataPayment?.id,
    reLoad: reLoad,
  };

  const removeDuplicates = (str: string | undefined | null): string => {
    if (!str) return "";
    const uniqueArray = str.split(",").filter((item, index, self) => {
      const trimmedItem = item.trim();
      return (
        trimmedItem !== "" &&
        self.findIndex((s) => s.trim() === trimmedItem) === index
      );
    });
    return uniqueArray.join(" ");
  };

  const pagosList = (data: any) => {
    return (
      <ItemList
        title={getFullName(data?.owner)}
        subtitle={store.UnitsType + " " + removeDuplicates(data?.dptos)}
        right={
          <Button
            onClick={() => {
              if (userCan("payments", "C") == false) {
                return showToast(
                  "No tiene permisos para aceptar pagos",
                  "error"
                );
              }
              setDataPayment(data);
              setOpenPayment(true);
            }}
          >
            Revisar
          </Button>
        }
      />
    );
  };

  // Modificado para guardar y enviar solo el ID
  const reservasList = (data: any) => {
    return (
      <ItemList
        title={getFullName(data?.owner)}
        subtitle={`Área: ${data?.area?.title || "No especificada"}`}
        right={
          <Button
            onClick={() => {
              setSelectedReservationId(data.id); // <- Guarda solo el ID
              setOpenReservation(true);
            }}
          >
            Aprobar
          </Button>
        }
      />
    );
  };

  const registroList = (data: any) => {
    return (
      <ItemList
        title={getFullName(data?.owner)}
        right={
          <Button
            onClick={() => {
              if (userCan("owners", "C") == false) {
                return showToast(
                  "No tiene permisos para aceptar cuentas pre-registradas",
                  "error"
                );
              }
              setDataOwner(data.owner);
              setOpenActive(true);
            }}
          >
            Ver
          </Button>
        }
      />
    );
  };

  const alertasList = (data: any) => {
    return (
      <div title={""} className={styles.alertsList}>
        <section>
          <div>
            <div>
              {data?.guardia ? getFullName(data.guardia) : "Alerta Sistema/App"}
            </div>
            <div>Descripción: {data.descrip}</div>
            <div>{getDateTimeStrMes(data.created_at)}</div>
          </div>
          <div className="flex justify-end items-center -mt-6">
            <div
              className={`${styles.levelText} ${
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

  return (
    <>
      <div className={styles.container}>
        <section>
          <WidgetBase variant={'V1'} title={'Resumen actual'} subtitle={formattedDate}>
            <div className={styles.widgetsResumeContainer}>
          <WidgetDashCard
            title="Ingresos"
            // subtitle={formattedDate}
            data={"Bs. " + formatNumber(dashboard?.data?.TotalIngresos)}
            onClick={() => (window.location.href = "/payments")}
            icon={<IconIngresos color={'var(--cAccent)'}  style={{backgroundColor:'var(--cHoverSuccess)'}} circle size={38}/>}
            className={styles.widgetResumeCard}
          />
          <WidgetDashCard
            title="Egresos"
            data={"Bs. " + formatNumber(dashboard?.data?.TotalEgresos)}
            onClick={() => (window.location.href = "/outlays")}
            icon={<IconEgresos color={'var(--cError)'}  style={{backgroundColor:'var(--cHoverError)'}} circle size={38}/>}
            className={styles.widgetResumeCard}


          />
          <WidgetDashCard
            title={balanceMessage}
            color={balance < 0 ? "var(--cError)" : ""}
            data={
              "Bs. " +
              formatNumber(
                Number(dashboard?.data?.TotalIngresos) -
                  Number(dashboard?.data?.TotalEgresos)
              )
            }
            icon={<IconBriefCaseMoney color={'var(--cInfo)'}  style={{backgroundColor:'var(--cHoverInfo)'}} circle size={38}/>}
            className={styles.widgetResumeCard}


          />
          <WidgetDashCard
            title="Cartera vencida"
            data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
            onClick={() => (window.location.href = "/defaultersview")}
            icon={<IconWallet color={'var(--cAlert)'}  style={{backgroundColor:'var(--cHoverAlert)'}} circle size={38}/>}
            className={styles.widgetResumeCard}

            
          />
          </div>
          </WidgetBase>

          <WidgetBase variant={'V1'} title={'Resumen de usuarios'} subtitle={'Cantidad de todos los usuarios en general del condominio'}>
          <div className={styles.widgetsResumeContainer}>  
          <WidgetDashCard
            title="Administradores"
            data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
            
          />
               <WidgetDashCard
            title="Residentes"
            data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
            
          />
               <WidgetDashCard
            title="Guardias"
            data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
            
          />
          </div>
          </WidgetBase>

        </section>

        <section>
          <WidgetGraphResume
            saldoInicial={dashboard?.data?.saldoInicial}
            ingresos={dashboard?.data?.ingresosHist}
            egresos={dashboard?.data?.egresosHist}
            periodo="y"
          />

          <WidgetContentsResume data={dashboard?.data?.publications}/>
        </section>

        <section>
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
              title="Solicitudes de Reservas"
              message="No hay solicitudes de reserva pendientes"
              data={dashboard?.data?.porReservar}
              renderItem={reservasList} // <- Usa la función modificada
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

      <OwnersRender
        open={openActive}
        onClose={() => setOpenActive(false)}
        item={dataOwner}
        reLoad={reLoad}
      />

      <PaymentRender {...paymentProps} />

      {/* Modificado para pasar solo el ID a través de la prop 'reservationId' */}
      <ReservationDetailModal
        open={openReservation}
        onClose={() => {
          setOpenReservation(false);
          setSelectedReservationId(null);
        }}
        reservationId={selectedReservationId}
        reLoad={() => reLoad()}
      />
    </>
  );
};

export default HomePage;
