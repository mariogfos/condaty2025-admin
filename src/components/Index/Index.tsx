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
  IconGraphics,
  IconIngresos,
  IconWallet,
  IconAlerts,
  IconReservedAreas,
  IconPagos,
  IconGroup2,
} from "../layout/icons/IconsBiblioteca";
import WidgetContentsResume from "../Widgets/WidgetsDashboard/WidgetContentsResume/WidgetContentsResume";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import EmptyData from "@/components/NoData/EmptyData";

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
                      color={!dashboard?.data?.TotalIngresos || dashboard?.data?.TotalIngresos === 0 ? "var(--cBlackV2)" : "var(--cAccent)"}
                      style={{ backgroundColor: !dashboard?.data?.TotalIngresos || dashboard?.data?.TotalIngresos === 0 ? "var(--cWhiteV2)" : "var(--cHoverSuccess)" }}
                      circle
                      size={38}
                    />
                  }
                  className={styles.widgetResumeCard}
                  tooltip={true}
                  tooltipTitle="Dinero total que entra a las cuentas del condominio. Principalmente por cuotas de expensas, alquiler de áreas comunes, intereses bancarios, multas y otros aportes."
                  tooltipColor="var(--cWhiteV1)"
                />
                <WidgetDashCard
                  title="Egresos"
                  data={"Bs. " + formatNumber(dashboard?.data?.TotalEgresos)}
                  onClick={() => (window.location.href = "/outlays")}
                  icon={
                    <IconEgresos
                      color={!dashboard?.data?.TotalEgresos || dashboard?.data?.TotalEgresos === 0 ? "var(--cBlackV2)" : "var(--cError)"}
                      style={{ backgroundColor: !dashboard?.data?.TotalEgresos || dashboard?.data?.TotalEgresos === 0 ? "var(--cWhiteV2)" : "var(--cHoverError)" }}
                      circle
                      size={38}
                    />
                  }
                  className={styles.widgetResumeCard}
                  tooltip={true}
                  tooltipTitle="Pagos o salidas de dinero del condominio para cubrir gastos operativos y de mantenimiento. Incluye servicios básicos, personal, reparaciones, seguros, administración, impuestos y otros costos."
                  tooltipColor="var(--cWhiteV1)"
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
                      color={!balance || balance === 0 ? "var(--cBlackV2)" : "var(--cInfo)"}
                      style={{ backgroundColor: !balance || balance === 0 ? "var(--cWhiteV2)" : "var(--cHoverInfo)" }}
                      circle
                      size={38}
                    />
                  }
                  className={styles.widgetResumeCard}
                  tooltip={true}
                  tooltipTitle="Monto pagado en exceso por un propietario o residente en sus cuotas u otros pagos. Puede compensarse en futuros pagos o devolverse."
                  tooltipColor="var(--cWhiteV1)"
                />
                <WidgetDashCard
                  title="Cartera vencida"
                  data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
                  onClick={() => (window.location.href = "/defaultersview")}
                  icon={
                    <IconWallet
                      color={!dashboard?.data?.morosos || dashboard?.data?.morosos === 0 ? "var(--cBlackV2)" : "var(--cAlert)"}
                      style={{ backgroundColor: !dashboard?.data?.morosos || dashboard?.data?.morosos === 0 ? "var(--cWhiteV2)" : "var(--cHoverAlert)" }}
                      circle
                      size={38}
                    />
                  }
                  className={styles.widgetResumeCard}
                  tooltip={true}
                  tooltipTitle="Deudas pendientes de pago al condominio que han superado la fecha límite. Principalmente expensas impagas, multas o recargos vencidos. Su gestión es crucial para la liquidez del condominio."
                 tooltipColor="var(--cWhiteV1)"
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
                    showEmptyData={(!dashboard?.data?.ingresosHist || !dashboard?.data?.egresosHist || 
                      (dashboard?.data?.ingresosHist?.length === 0 && dashboard?.data?.egresosHist?.length === 0))}
                    emptyDataProps={{
                      message: "Gráfica financiera sin datos. verás la evolución del control financiero a medida ",
                      line2: "que tengas movimiento financiero.",
                      h: 300,
                      icon: <IconGraphics size={80} />
                    }}
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
                    emptyListMessage="No hay pagos por revisar. Una vez los residentes"
                    emptyListLine2="comiencen a pagar sus deudas se mostrarán aquí."
                    emptyListIcon={<IconPagos size={32} />}
                    data={dashboard?.data?.porConfirmar}
                    renderItem={pagosList}
                  />
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title="Alertas"
                    viewAllText="Ver todas"
                    onViewAllClick={() => (window.location.href = "/alerts")}
                    emptyListMessage="No existe ningún tipo de alerta. Cuando un guardia o"
                    emptyListLine2="residente registre una se mostrará aquí."
                    emptyListIcon={<IconAlerts size={32} />}
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
                    emptyListMessage="Sin solicitudes de reserva. Una vez los residentes"
                    emptyListLine2="comiencen a reservar las áreas se mostrarán aquí."
                    emptyListIcon={<IconReservedAreas size={32} />}
                    data={dashboard?.data?.porReservar}
                    renderItem={reservasList}
                  />
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title="Pre-registro"
                    viewAllText="Ver todos"
                    onViewAllClick={() => setOpenPreRegistroModal(true)}
                    emptyListMessage="No se encontró ninguna cuenta de pre-registro,"
                    emptyListLine2="cuando un usuario se auto-registre se mostrará aquí."
                    emptyListIcon={<IconGroup2 size={32} />}
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
                  tooltip={true}
                  tooltipTitle="Cantidad total de administradores registrados en el condominio. Los administradores gestionan y supervisan el sistema."
                  tooltipColor="var(--cWhiteV1)"
                  // style={{ flexGrow: 1, flexBasis: 0 }}
                />
                <WidgetDashCard
                  title="Residentes"
                  data={formatNumber(dashboard?.data?.ownersCount, 0)}
                  tooltip={true}
                  tooltipTitle="Cantidad total de residentes registrados. Los residentes son los usuarios que viven en el condominio."
                  tooltipColor="var(--cWhiteV1)"
                  // style={{ flexGrow: 1, flexBasis: 0 }}
                />
                <WidgetDashCard
                  title="Guardias"
                  data={formatNumber(dashboard?.data?.guardsCount, 0)}
                  tooltip={true}
                  tooltipTitle="Cantidad total de guardias registrados. Los guardias son responsables de la seguridad y el control de accesos."
                  tooltipColor="var(--cWhiteV1)"
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
