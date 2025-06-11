import { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";
import styles from "./index.module.css";
import { WidgetDashCard } from "../Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateStrMes, getDateTimeStrMes, getNow } from "@/mk/utils/date";
import WidgetBase from "../Widgets/WidgetBase/WidgetBase";
import WidgetGraphResume from "../Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";
import WidgetCalculatePenalty from "../Widgets/WidgetsDashboard/WidgetCalculatePenalty/WidgetCalculatePenalty";
import { WidgetList } from "../Widgets/WidgetsDashboard/WidgetList/WidgetList";
import { getFullName } from "@/mk/utils/string";
import OwnersRender from "@/modulos/Owners/RenderView/RenderView";
import PaymentRender from "@/modulos/Payments/RenderView/RenderView";
import ReservationDetailModal from "@/modulos/Reservas/RenderView/RenderView";
import {
  IconBriefCaseMoney,
  IconEgresos,
  IconIngresos,
  IconWallet,
} from "../layout/icons/IconsBiblioteca";
import WidgetContentsResume from "../Widgets/WidgetsDashboard/WidgetContentsResume/WidgetContentsResume";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};

const HomePage = () => {
  const { store, setStore, userCan, showToast, user } = useAuth();
  const [openActive, setOpenActive] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [dataOwner, setDataOwner]: any = useState({});
  const [dataPayment, setDataPayment]: any = useState({});
  const [openReservation, setOpenReservation] = useState(false);
  const [selectedReservationId, setSelectedReservationId]: any = useState(null);
  const [openPreRegistroModal, setOpenPreRegistroModal] = useState(false);

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
    ...paramsInitial,
  });

  const today = new Date();
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const formattedDate = `Resumen del mes de ${meses[today.getMonth()]}`;
  let balance: any =
    Number(dashboard?.data?.TotalIngresos) -
    Number(dashboard?.data?.TotalEgresos);
  const balanceMessage = balance > 0 ? "Saldo a favor" : "Saldo en contra";

  const paymentProps: any = {
    open: openPayment,
    onClose: () => setOpenPayment(false),
    // item: dataPayment,
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
    const imageUrl = data?.owner;
    const primaryText = getFullName(data?.owner);
    const secondaryText = `${store.UnitsType} ${removeDuplicates(data?.dptos)}`;
    const ownerInitials = primaryText
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <div className={styles.itemRow}>
        <div className={styles.itemImageContainer}>
          {imageUrl ? (
            <Avatar
              src={getUrlImages(
                `/OWNER-${data.owner.id}.webp?d=${data.owner.updated_at}`
              )}
              name={primaryText}
              w={40}
              h={40}
              className={styles.itemImage}
            />
          ) : (
            <div className={styles.itemImagePlaceholder}>
              {ownerInitials || "?"}
            </div>
          )}
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText}>{primaryText}</span>
          <span className={styles.itemSecondaryText}>{secondaryText}</span>
        </div>
        <div className={styles.itemActionContainer}>
          <button
            className={styles.itemActionButton}
            onClick={() => {
              // if (userCan("payments", "C") == false) {
              //   return showToast("No tiene permisos para aceptar pagos", "error");
              // }
              setDataPayment(data);
              setOpenPayment(true);
            }}
          >
            Revisar
          </button>
        </div>
      </div>
    );
  };

  const reservasList = (data: any) => {
    const imageUrl = data?.owner;
    const primaryText = getFullName(data?.owner);
    const secondaryText = `Área: ${data?.area?.title || "No especificada"}`;
    const ownerInitials = primaryText
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <div className={styles.itemRow}>
        <div className={styles.itemImageContainer}>
          {imageUrl ? (
            <Avatar
              src={getUrlImages(
                `/OWNER-${data.owner.id}.webp?d=${data.owner.updated_at}`
              )}
              name={primaryText}
              w={40}
              h={40}
              className={styles.itemImage}
            />
          ) : (
            <div className={styles.itemImagePlaceholder}>
              {ownerInitials || "?"}
            </div>
          )}
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText}>{primaryText}</span>
          <span className={styles.itemSecondaryText}>{secondaryText}</span>
        </div>
        <div className={styles.itemActionContainer}>
          <button
            className={styles.itemActionButton}
            onClick={() => {
              setSelectedReservationId(data.id);
              setOpenReservation(true);
            }}
          >
            Revisar
          </button>
        </div>
      </div>
    );
  };

  const registroList = (data: any) => {
    const ownerData = data?.owner || data;
    const primaryText = getFullName(ownerData);
    const secondaryText = ownerData?.ci
      ? `C.I: ${ownerData.ci}`
      : ownerData?.email || "";

    return (
      <div className={styles.itemRow}>
        <div className={styles.itemImageContainer}>
          <Avatar
            src={getUrlImages(
              `/OWNER-${ownerData.id}.webp?d=${ownerData.updated_at}`
            )}
            name={primaryText}
            w={40}
            h={40}
            className={styles.itemImage}
          />
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText}>{primaryText}</span>
          {secondaryText && (
            <span className={styles.itemSecondaryText}>{secondaryText}</span>
          )}
        </div>
        <div className={styles.itemActionContainer}>
          <button
            className={styles.itemActionButton}
            onClick={() => {
              if (userCan("owners", "C") == false) {
                return showToast(
                  "No tiene permisos para aceptar cuentas pre-registradas",
                  "error"
                );
              }
              setDataOwner(ownerData);
              setOpenActive(true);
            }}
          >
            Revisar
          </button>
        </div>
      </div>
    );
  };

  const alertasList = (data: any) => {
    const hasGuard = !!data?.guardia; // Verifica si el objeto guardia existe y no es nulo
    const hasOwner = !!data?.owner; // Verifica si el objeto owner existe y no es nulo

    let dataSource = null; // Contendrá el objeto guardia o owner
    let entityType = ""; // Será "GUARD" o "OWNER"
    let primaryText = "Alerta del Sistema"; // Texto por defecto

    if (hasGuard) {
      dataSource = data.guardia;
      entityType = "GUARD";
      primaryText = getFullName(dataSource); // Asume que getFullName puede manejar el objeto guardia
    } else if (hasOwner) {
      dataSource = data.owner;
      entityType = "OWNER";
      primaryText = getFullName(dataSource); // Asume que getFullName puede manejar el objeto owner
    }
    // Si ni guardia ni owner están presentes, primaryText permanece "Alerta del Sistema"

    const userInitials = primaryText
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    const secondaryText = data.descrip || "Sin descripción";

    let levelClass = styles.levelLow;
    let levelTextIndicator = "Nivel bajo";
    if (data.level === 2) {
      levelClass = styles.levelMedium;
      levelTextIndicator = "Nivel medio";
    } else if (data.level === 3 || data.level > 2) {
      // Mayor que 2 también es alto
      levelClass = styles.levelHigh;
      levelTextIndicator = "Nivel alto";
    }

    // Determinar si podemos intentar cargar una imagen de avatar
    // Intentamos cargar si dataSource (guardia u owner) está presente y tiene un id.
    const canDisplayAvatarImage = dataSource && dataSource.id;
    let avatarImageUrl = null;

    if (canDisplayAvatarImage) {
      // El campo 'updated_at' podría tener diferentes nombres (updated_at vs updatedAt) o estar ausente.
      // Usar una marca de tiempo actual como fallback si no está disponible para asegurar la invalidación de caché.
      const updatedAtTimestamp =
        dataSource.updated_at ||
        dataSource.updatedAt ||
        new Date().toISOString();
      avatarImageUrl = getUrlImages(
        `/${entityType}-${dataSource.id}.webp?d=${updatedAtTimestamp}`
      );
    }

    return (
      <div className={styles.itemRowAlert}>
        <div className={styles.itemImageContainer}>
          {canDisplayAvatarImage && avatarImageUrl ? (
            <Avatar
              src={avatarImageUrl} // URL construida dinámicamente
              name={primaryText} // El componente Avatar debería manejar el fallback a iniciales si src falla
              w={40}
              h={40}
              className={styles.itemImage}
            />
          ) : (
            // Fallback si no hay un usuario específico (guardia u owner) asociado,
            // o si dataSource no tiene un ID, o si avatarImageUrl es null.
            <div className={styles.itemImagePlaceholder}>
              {userInitials || "!"}{" "}
              {/* Iniciales para "Alerta del Sistema" o si primaryText está vacío */}
            </div>
          )}
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText}>{primaryText}</span>
          <span className={styles.itemSecondaryText}>{secondaryText}</span>
          <span className={styles.itemDateText}>
            {getDateTimeStrMes(data.created_at)}
          </span>
        </div>
        <div
          className={`${styles.itemActionContainer} ${styles.itemAlertLevelContainer}`}
        >
          <div className={`${styles.alertLevelIndicator} ${levelClass}`}>
            {levelTextIndicator}
          </div>
        </div>
      </div>
    );
  };

  const renderPreRegistroList = () => {
    return (
      <div className={styles.preRegistroListContainer}>
        {dashboard?.data?.porActivar?.map((item: any, index: number) => (
          <div key={index} className={styles.preRegistroItem}>
            {registroList(item)}
          </div>
        ))}
      </div>
    );
  };

  if (!userCan("home", "R")) return <NotAccess />;

  return (
    <>
      <div className={styles.container}>
        <div className={styles.mainLayout}>
          {/* Columna Izquierda (65%) */}
          <div className={styles.leftColumn}>
            <WidgetBase
              variant={"V1"}
              title={"Resumen actual"}
              subtitle={formattedDate}
              className={styles.summaryWidgetEqualHeight}
              style={{ maxHeight: "max-content" }}
            >
              <div className={styles.widgetsResumeContainer}>
                <WidgetDashCard
                  title="Ingresos"
                  data={"Bs. " + formatNumber(dashboard?.data?.TotalIngresos)}
                  onClick={() => (window.location.href = "/payments")}
                  icon={
                    <IconIngresos
                      color={"var(--cAccent)"}
                      style={{ backgroundColor: "var(--cHoverSuccess)" }}
                      circle
                      size={38}
                    />
                  }
                  className={styles.widgetResumeCard}
                />
                <WidgetDashCard
                  title="Egresos"
                  data={"Bs. " + formatNumber(dashboard?.data?.TotalEgresos)}
                  onClick={() => (window.location.href = "/outlays")}
                  icon={
                    <IconEgresos
                      color={"var(--cError)"}
                      style={{ backgroundColor: "var(--cHoverError)" }}
                      circle
                      size={38}
                    />
                  }
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
                  icon={
                    <IconBriefCaseMoney
                      color={"var(--cInfo)"}
                      style={{ backgroundColor: "var(--cHoverInfo)" }}
                      circle
                      size={38}
                    />
                  }
                  className={styles.widgetResumeCard}
                />
                <WidgetDashCard
                  title="Cartera vencida"
                  data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
                  onClick={() => (window.location.href = "/defaultersview")}
                  icon={
                    <IconWallet
                      color={"var(--cAlert)"}
                      style={{ backgroundColor: "var(--cHoverAlert)" }}
                      circle
                      size={38}
                    />
                  }
                  className={styles.widgetResumeCard}
                />
              </div>
            </WidgetBase>

            {/* Contenedor para Gráfica y Widgets de Solicitudes */}
            <div className={styles.solicitudesSection}>
              {" "}
              {/* Nuevo contenedor para mantenerlos juntos si es necesario */}
              <div className={styles.widgetGraphResumeContainer}>
                <div className={styles.graphAndLegendWrapper}>
                  <WidgetGraphResume
                    saldoInicial={dashboard?.data?.saldoInicial}
                    ingresos={dashboard?.data?.ingresosHist}
                    egresos={dashboard?.data?.egresosHist}
                    periodo="y"
                  />
                </div>
              </div>
              <section className={styles.fourWidgetSection}>
                <div className={styles.widgetRow}>
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title="Solicitudes de pago"
                    viewAllText="Ver todas"
                    onViewAllClick={() => (window.location.href = "/payments")}
                    emptyListMessage="No hay solicitudes de pago por revisar"
                    data={dashboard?.data?.porConfirmar}
                    renderItem={pagosList}
                  />
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title="Alertas"
                    viewAllText="Ver todas"
                    onViewAllClick={() => (window.location.href = "/alerts")}
                    emptyListMessage="No hay alertas"
                    data={dashboard?.data?.alertas}
                    renderItem={alertasList}
                  />
                </div>
                <div className={styles.widgetRow}>
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title="Solicitudes de Reservas"
                    viewAllText="Ver todas"
                    onViewAllClick={() => (window.location.href = "/reservas")}
                    emptyListMessage="No hay solicitudes de reserva pendientes"
                    data={dashboard?.data?.porReservar}
                    renderItem={reservasList}
                  />
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title="Pre-registro"
                    viewAllText="Ver todos"
                    onViewAllClick={() => setOpenPreRegistroModal(true)}
                    emptyListMessage="No hay cuentas por activar"
                    data={dashboard?.data?.porActivar}
                    renderItem={registroList}
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Columna Derecha (35%) */}
          <div className={styles.rightColumn}>
            <WidgetBase
              variant={"V1"}
              title={"Resumen de usuarios"}
              subtitle={
                "Cantidad de todos los usuarios en general del condominio"
              }
              className={styles.summaryWidgetEqualHeight}
              style={{ maxHeight: "max-content" }}
            >
              <div className={styles.widgetsResumeContainer}>
                <WidgetDashCard
                  title="Administradores"
                  data={formatNumber(dashboard?.data?.adminsCount, 0)}
                  // style={{ flexGrow: 1, flexBasis: 0 }}
                />
                <WidgetDashCard
                  title="Residentes"
                  data={formatNumber(dashboard?.data?.ownersCount, 0)}
                  // style={{ flexGrow: 1, flexBasis: 0 }}
                />
                <WidgetDashCard
                  title="Guardias"
                  data={formatNumber(dashboard?.data?.guardsCount, 0)}
                  // style={{ flexGrow: 1, flexBasis: 0 }}
                />
              </div>
            </WidgetBase>

            <div className={styles.widgetContents}>
              <WidgetContentsResume data={dashboard?.data?.posts} />
            </div>
          </div>
        </div>
      </div>

      {openPayment && <PaymentRender {...paymentProps} />}
      <ReservationDetailModal
        open={openReservation}
        onClose={() => {
          setOpenReservation(false);
          setSelectedReservationId(null);
        }}
        reservationId={selectedReservationId}
        reLoad={() => reLoad()}
      />
      <DataModal
        open={openPreRegistroModal}
        title="Lista completa de pre-registros"
        onClose={() => setOpenPreRegistroModal(false)}
        buttonText=""
        buttonCancel=""
      >
        {renderPreRegistroList()}
      </DataModal>
      <OwnersRender
        open={openActive}
        onClose={() => setOpenActive(false)}
        item={dataOwner}
        reLoad={reLoad}
      />
    </>
  );
};

export default HomePage;
