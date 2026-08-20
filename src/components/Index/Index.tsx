import { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
import ConfigHealth from "@/components/ConfigHealth/ConfigHealth";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";
import styles from "./index.module.css";
import { WidgetDashCard } from "../Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import { formatNumber } from "@/mk/utils/numbers";
import { getDateTimeStrMes } from "@/mk/utils/date";
import WidgetBase from "../Widgets/WidgetBase/WidgetBase";
import WidgetGraphResume from "../Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";
import { WidgetList } from "../Widgets/WidgetsDashboard/WidgetList/WidgetList";
import { getFullName, truncateText } from "@/mk/utils/string";
import OwnersRender from "@/modulos/Owners/RenderView/RenderView";
import PaymentRender from "@/modulos/Payments/RenderView/RenderView";
import ReservationDetailModal from "@/modulos/Reservas/RenderView/RenderView";
import AlertsRender from "@/modulos/Alerts/RenderView/RenderView";
import { ALERT_LEVEL_LABELS } from "@/modulos/Alerts/alertConstants";
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
  IconAlertCircle,
} from "../layout/icons/IconsBiblioteca";
// ⚠️ Esta pantalla RENDERIZA texto escrito por el servidor (CDT-99, como el
// widget «Comunidad» de al lado desde CDT-47): el `message` de un sobre que no
// sea 5xx llega tal cual a la vista. El riesgo residual de eso —para los 4xx el
// único guardián es la lista de patrones técnicos— está medido y explicado en
// el docblock de `leerElErrorDelApi`.
import { leerElErrorDelApi } from "@/mk/hooks/useCrud/leerElErrorDelApi";
import WidgetContentsResume from "../Widgets/WidgetsDashboard/WidgetContentsResume/WidgetContentsResume";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import ContentRenderView from "@/modulos/Contents/RenderView/RenderView";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import { AssemblyDashboardCard } from "@/modulos/Assemblies/components/AssemblyDashboardCard/AssemblyDashboardCard";

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};

const HomePage = () => {
  const { store, setStore, userCan, showToast, user } = useAuth();
  const { localeTag, translate } = useScopedI18n("home");
  const { isMobile } = useScreenSize();
  const [openActive, setOpenActive] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [dataOwner, setDataOwner]: any = useState({});
  const [dataPayment, setDataPayment]: any = useState({});
  const [openReservation, setOpenReservation] = useState(false);
  const [selectedReservationId, setSelectedReservationId]: any = useState(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [selectedAlert, setSelectedAlert]: any = useState(null);
  const [openPreRegistroModal, setOpenPreRegistroModal] = useState(false);

  // Modal de contenidos (RenderView)
  const [openContentRender, setOpenContentRender] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(
    null,
  );
  const [selectedContentData, setSelectedContentData] = useState<any>(null);

  const handleOpenContentRenderView = (id: number, data?: any) => {
    setSelectedContentId(id);
    setSelectedContentData(data || null);
    setOpenContentRender(true);
  };

  const handleCloseContentRenderView = () => {
    setOpenContentRender(false);
    setSelectedContentId(null);
    setSelectedContentData(null);
  };

  useEffect(() => {
    const pageTitle = translate("pageTitle");
    if (store?.title === pageTitle) return;
    setStore({
      title: pageTitle,
    });
  }, [setStore, store?.title, translate]);

  const {
    data: dashboard,
    reLoad,
    loaded,
    error,
    isStale,
    execute,
  } = useAxios("/dashboard", "GET", {
    ...paramsInitial,
  });

  /**
   * ────────────────────────────────────────────────────────────────────────
   * 🔴 CDT-99 — «no hay datos» y «no se pudo pedir» eran lo MISMO en pantalla.
   * ────────────────────────────────────────────────────────────────────────
   *
   * `useAxios` pone `loaded = true` en su `finally` pase lo que pase y deja
   * `data` en `null` (`useAxios.tsx:234`). Río abajo, un fallo de red y un
   * condominio recién creado son indistinguibles para quien no mire `error`
   * — y acá `error` ni se desestructuraba.
   *
   * ⚠️ LO QUE HAY QUE ENTENDER ANTES DE TOCAR ESTO: el panel entero cuelga de
   * UN SOLO pedido. Ese `/dashboard` alimenta las 4 tarjetas del resumen, el
   * gráfico financiero, las 4 listas (`WidgetList`), la tarjeta de asamblea y
   * las 3 tarjetas de usuarios. Cuando falla no queda «un pedazo vacío»:
   * quedan NUEVE afirmaciones falsas a la vez —«Bs. 0» de ingresos, «Bs. 0» de
   * cartera vencida, «No hay pagos por revisar», «No existe ningún tipo de
   * alerta»…—. Por eso el aviso es UNO solo y no nueve carteles peleándose la
   * pantalla: falló un pedido, se dice una vez.
   *
   * Lo que NO se toca son los pedidos que no fallaron: `ConfigHealth` y el
   * widget «Comunidad» tienen los suyos y su propio estado de error (CDT-47),
   * así que siguen en pantalla.
   *
   * Las dos formas del fallo, las mismas que cerró CDT-47:
   * - `error` — axios rechazó (5xx, 4xx, red caída, timeout).
   * - sin `data` en el sobre — el HTTP 200 rechazado en el cuerpo
   *   (`sendError($msg, [], 200)` devuelve `{success:false, message}` y NINGÚN
   *   `data`). Axios no rechaza un 200, así que ahí no hay `error` que mirar.
   *
   * ⚠️ Un condominio sin movimientos SÍ trae `data`: `sendResponse` siempre
   * arma la clave. El vacío legítimo sigue cayendo en sus `EmptyData` de
   * siempre, que es lo que tiene que pasar.
   */
  const cargandoDashboard = !loaded && !dashboard?.data;
  /**
   * 🔴 La condición pregunta por el DATO, no por `error`, y eso NO es un
   * descuido (review de CDT-99).
   *
   * `useAxios` NO limpia `data` cuando falla (`useAxios.tsx:227`: `setError`
   * y nada más). Si la condición fuera `!!error || !dashboard?.data`, un
   * refresco fallado —el que dispara un modal al cerrarse, o el botón de
   * reintentar— le BORRARÍA al usuario un panel correcto que estaba mirando,
   * para poner un cartel de error. Cambiar «no se pudo actualizar» por «no
   * hay nada» es el mismo defecto que este ticket vino a cerrar, con el
   * signo al revés.
   *
   * Para ese caso —hay dato viejo en pantalla y el refresco falló— está
   * `isStale`, que el hook expone justo para esto (CDT-42).
   */
  const cargaFallida = loaded && !dashboard?.data;
  const sinPanel = cargandoDashboard || cargaFallida;

  /**
   * El dato quedó viejo: se avisa SIN sacar de pantalla lo que el usuario
   * está leyendo. Se apaga solo en cuanto un refresco entra bien.
   */
  /**
   * 🔴 La guarda pregunta por `loaded`, NO por `cargandoDashboard` (review 4R).
   *
   * `cargandoDashboard` y `cargaFallida` comparten el predicado
   * `!dashboard?.data`, así que durante un refresco fallado —que es el ÚNICO
   * caso donde `isStale` está prendido, porque hay dato viejo en pantalla— las
   * dos son `false` y no suprimen nada: la banda se pintaba igual, encima del
   * panel, mientras el reintento estaba en vuelo. La guarda existía y estaba
   * MUERTA.
   *
   * `loaded` sí distingue: `execute` lo baja de forma síncrona al arrancar
   * cada pedido, así que mientras hay uno en vuelo la banda —y su botón de
   * Reintentar, que prometía resolver algo que ya se estaba resolviendo— no se
   * pintan.
   */
  const datoDesactualizado = isStale && !cargaFallida && loaded;

  // Manda el código HTTP (CDT-94): 5xx y red caída caen al genérico; un 4xx
  // —un 403 de permisos— trae su propio texto, que es el que hay que leer,
  // porque reintentar no arregla un permiso.
  // ⚠️ El sobre del 200 rechazado viaja en `data`, no en `error`: axios no
  // rechaza un 200. `leerElErrorDelApi` mira los dos justamente por eso.
  const { mensaje: mensajeDeCargaFallida } = leerElErrorDelApi(
    dashboard,
    error,
    translate("loadErrorLine2"),
  );

  /**
   * 🔴 El reintento vuelve al estado de CARGA, no repinta el error.
   *
   * `useAxios` limpia su `error` al ARRANCAR la petición (`execute` hace
   * `setError("")` y `setLoaded(false)` de forma síncrona), así que basta con
   * pedir: `cargandoDashboard` toma la posta en el mismo render. Sin esa
   * transición el usuario vería el cartel viejo —o peor, los «no hay» que este
   * ticket vino a sacar— mientras el request está en vuelo.
   */
  const handleRetryDashboard = () => {
    reLoad();
  };

  const today = new Date();
  const monthLabel = new Intl.DateTimeFormat(localeTag, {
    month: "long",
  }).format(today);
  const formattedDate = translate("summaryOfMonth", {
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
  });
  let balance: any =
    Number(dashboard?.data?.TotalIngresos) -
    Number(dashboard?.data?.TotalEgresos);
  const balanceMessage =
    balance > 0 ? translate("positiveBalance") : translate("negativeBalance");

  const paymentProps: any = {
    open: openPayment,
    onClose: () => setOpenPayment(false),
    payment_id: dataPayment?.id,
    reLoad: reLoad,
  };

  const pagosList = (data: any) => {
    const imageUrl = data?.owner;
    const primaryText = getFullName(data?.owner);
    const secondaryText = `${data?.details?.[0]?.debt_dpto?.dpto?.type?.name} ${data?.details?.[0]?.debt_dpto?.dpto?.nro}`;
    const ownerInitials = primaryText
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return (
      <div
        className={`${styles.itemRow}`}
        onClick={() => {
          setDataPayment(data);
          setOpenPayment(true);
        }}
      >
        <div className={styles.itemImageContainer}>
          {imageUrl ? (
            <Avatar
              src={data?.owner?.url_avatar}
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
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">
            {primaryText}
          </span>
          <span className={styles.itemSecondaryText} data-i18n-ignore="true">
            {secondaryText}
          </span>
        </div>
        <div className={styles.itemActionContainer}>
          <button className={styles.itemActionButton}>
            {translate("review")}
          </button>
        </div>
      </div>
    );
  };

  const reservasList = (data: any) => {
    const imageUrl = data?.owner;
    const primaryText = getFullName(data?.owner);
    const secondaryText = `${data?.area?.title || translate("areaNotSpecified")}`;
    const ownerInitials = primaryText
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    return (
      <div
        className={`${styles.itemRow}`}
        onClick={() => {
          setSelectedReservationId(data.id);
          setOpenReservation(true);
        }}
      >
        <div className={styles.itemImageContainer}>
          {imageUrl ? (
            <Avatar
              src={data?.owner?.url_avatar}
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
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">
            {primaryText}
          </span>
          <span className={styles.itemSecondaryText} data-i18n-ignore="true">
            {secondaryText}
          </span>
        </div>
        <div className={styles.itemActionContainer}>
          <button className={styles.itemActionButton}>
            {translate("review")}
          </button>
        </div>
      </div>
    );
  };

  const registroList = (data: any) => {
    const ownerData = data?.owner || data;
    const primaryText = getFullName(ownerData);
    const secondaryText = ownerData?.ci
      ? `${translate("preRegistrationIdLabel")}: ${ownerData.ci}`
      : ownerData?.email || "";

    return (
      <div
        className={styles.itemRow}
        onClick={() => {
          if (userCan("owners", "C") == false)
            return showToast(
              translate("preRegistrationPermissionDenied"),
              "error",
            );
          setDataOwner({ ...ownerData, type_owner: data?.type });
          setOpenActive(true);
        }}
      >
        <div className={styles.itemImageContainer}>
          <Avatar
            src={ownerData?.url_avatar}
            name={primaryText}
            w={40}
            h={40}
            className={styles.itemImage}
          />
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">
            {primaryText}
          </span>
          {secondaryText && (
            <span className={styles.itemSecondaryText} data-i18n-ignore="true">
              {secondaryText}
            </span>
          )}
        </div>
        <div className={styles.itemActionContainer}>
          <button
            className={styles.itemActionButton}
            onClick={() => {
              if (userCan("owners", "C") == false)
                return showToast(
                  translate("preRegistrationPermissionDenied"),
                  "error",
                );
              setDataOwner({ ...ownerData, type_owner: data.type });
              setOpenActive(true);
            }}
          >
            {translate("review")}
          </button>
        </div>
      </div>
    );
  };

  const alertasList = (data: any) => {
    const hasGuard = !!data?.guardia;
    const hasOwner = !!data?.owner;
    let dataSource = null;
    let primaryText: string = translate("systemAlert");

    if (hasGuard) {
      dataSource = data.guardia;
      primaryText = getFullName(dataSource);
    } else if (hasOwner) {
      dataSource = data.owner;
      primaryText = getFullName(dataSource);
    }

    const userInitials = primaryText
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
    const secondaryText = data.descrip || translate("noDescription");
    const truncatedSecondaryText = truncateText(secondaryText, 35);

    let levelClass = styles.levelLow;
    let levelTextIndicator =
      ALERT_LEVEL_LABELS[data.level as keyof typeof ALERT_LEVEL_LABELS] ||
      ALERT_LEVEL_LABELS[1];
    if (data.level === 2) {
      levelClass = styles.levelMedium;
    } else if (data.level === 3 || data.level > 2) {
      levelClass = styles.levelHigh;
    }
    const canDisplayAvatarImage = !!dataSource?.id;
    let avatarImageUrl = dataSource?.url_avatar;

    return (
      <div
        className={styles.itemRow}
        onClick={() => {
          setSelectedAlert(data);
          setOpenAlert(true);
        }}
      >
        <div className={styles.itemImageContainer}>
          {canDisplayAvatarImage && avatarImageUrl ? (
            <Avatar
              src={avatarImageUrl}
              name={primaryText}
              w={40}
              h={40}
              className={styles.itemImage}
            />
          ) : (
            <div className={styles.itemImagePlaceholder}>
              {userInitials || "!"}
            </div>
          )}
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">
            {primaryText}
          </span>
          <span
            className={styles.itemSecondaryText}
            title={secondaryText}
            data-i18n-ignore="true"
          >
            {truncatedSecondaryText}
          </span>
          <span className={styles.itemDateText} data-i18n-ignore="true">
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
          <div key={item?.id ?? index} className={styles.preRegistroItem}>
            {registroList(item)}
          </div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    if (!store?.reLoadDashboard) return;
    reLoad();
  }, [store?.reLoadDashboard, reLoad]);

  if (!userCan("home", "R")) return <NotAccess />;

  return (
    <>
      <div className={styles.container} data-i18n-ignore="true">
        {/* Arriba de todo y antes del resumen: si al condominio le falta
            configuración, hay operaciones que van a fallar, y eso se tiene que
            ver antes que los números. Se pinta solo cuando falta algo. */}
        <ConfigHealth />
        <div className={styles.mainLayout}>
          <div className={styles.leftColumn}>
            {/* 🔴 CDT-99: mientras no se sepa, no se afirma. Los tres estados
                del panel son excluyentes a propósito —cargando, falló, listo—
                para que no queden dos a la vez ni parpadee del uno al otro. */}
            {cargandoDashboard ? (
              <div className={styles.loadingState}>
                {translate("loadingDashboard")}
              </div>
            ) : cargaFallida ? (
              <div className={styles.loadErrorState} role="alert">
                <IconAlertCircle size={40} color="var(--cWarning)" />
                <p>{translate("loadErrorTitle")}</p>
                <span>{mensajeDeCargaFallida}</span>
                <button
                  type="button"
                  className={styles.retryButton}
                  onClick={handleRetryDashboard}
                >
                  {translate("retry")}
                </button>
              </div>
            ) : (
              <>
                {/* No saca de pantalla lo que el usuario está leyendo: sólo
                    avisa que no se pudo actualizar. */}
                {datoDesactualizado && (
                  <div className={styles.staleBanner} role="status">
                    <IconAlertCircle size={20} color="var(--cWarning)" />
                    <span>{translate("staleData")}</span>
                    <button
                      type="button"
                      className={styles.retryButton}
                      onClick={handleRetryDashboard}
                    >
                      {translate("retry")}
                    </button>
                  </div>
                )}
                <WidgetBase
                  variant={"V1"}
                  title={translate("currentSummary")}
                  subtitle={formattedDate}
                  className={styles.summaryWidgetEqualHeight}
                  style={{ maxHeight: "max-content" }}
                >
                  <div className={styles.widgetsResumeContainer}>
                    <WidgetDashCard
                      title={translate("incomes")}
                      data={
                        "Bs. " + formatNumber(dashboard?.data?.TotalIngresos)
                      }
                      onClick={
                        isMobile
                          ? undefined
                          : () => (window.location.href = "/payments")
                      }
                      icon={
                        <IconIngresos
                          color={
                            !dashboard?.data?.TotalIngresos ||
                            dashboard?.data?.TotalIngresos === 0
                              ? "var(--cWhiteV1)"
                              : "var(--cSuccess)"
                          }
                          style={{
                            backgroundColor:
                              !dashboard?.data?.TotalIngresos ||
                              dashboard?.data?.TotalIngresos === 0
                                ? "var(--cHover)"
                                : "var(--cHoverCompl2)",
                          }}
                          circle
                          size={16}
                        />
                      }
                      className={styles.widgetResumeCard}
                    />
                    <WidgetDashCard
                      title={translate("outlays")}
                      data={
                        "Bs. " + formatNumber(dashboard?.data?.TotalEgresos)
                      }
                      onClick={
                        isMobile
                          ? undefined
                          : () => (window.location.href = "/outlays")
                      }
                      icon={
                        <IconEgresos
                          color={
                            !dashboard?.data?.TotalEgresos ||
                            dashboard?.data?.TotalEgresos === 0
                              ? "var(--cWhiteV1)"
                              : "var(--cError)"
                          }
                          style={{
                            backgroundColor:
                              !dashboard?.data?.TotalEgresos ||
                              dashboard?.data?.TotalEgresos === 0
                                ? "var(--cHover)"
                                : "var(--cHoverError)",
                          }}
                          circle
                          size={16}
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
                            Number(dashboard?.data?.TotalEgresos),
                        )
                      }
                      onClick={undefined}
                      icon={
                        <IconBriefCaseMoney
                          color={
                            !balance || balance === 0
                              ? "var(--cWhiteV1)"
                              : "var(--cInfo)"
                          }
                          style={{
                            backgroundColor:
                              !balance || balance === 0
                                ? "var(--cHover)"
                                : "var(--cHoverCompl3)",
                          }}
                          circle
                          size={16}
                        />
                      }
                      className={styles.widgetResumeCard}
                    />
                    <WidgetDashCard
                      title={translate("delinquency")}
                      data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
                      onClick={
                        isMobile
                          ? undefined
                          : () => (window.location.href = "/defaulters")
                      }
                      icon={
                        <IconWallet
                          color={
                            !dashboard?.data?.morosos ||
                            dashboard?.data?.morosos === 0
                              ? "var(--cWhiteV1)"
                              : "var(--cMediumAlert)"
                          }
                          style={{
                            backgroundColor:
                              !dashboard?.data?.morosos ||
                              dashboard?.data?.morosos === 0
                                ? "var(--cHover)"
                                : "var(--cHoverCompl5)",
                          }}
                          circle
                          size={16}
                        />
                      }
                      className={styles.widgetResumeCard}
                    />
                  </div>
                </WidgetBase>

                <AssemblyDashboardCard assembly={dashboard?.data?.assembly} />

                <div className={styles.solicitudesSection}>
                  {!isMobile && (
                    <div className={styles.widgetGraphResumeContainer}>
                      <WidgetGraphResume
                        saldoInicial={dashboard?.data?.saldoInicial}
                        ingresos={dashboard?.data?.ingresosHist}
                        egresos={dashboard?.data?.egresosHist}
                        periodo="y"
                        showEmptyData={
                          !dashboard?.data?.ingresosHist ||
                          !dashboard?.data?.egresosHist ||
                          (dashboard?.data?.ingresosHist?.length === 0 &&
                            dashboard?.data?.egresosHist?.length === 0)
                        }
                        emptyDataProps={{
                          message: translate("emptyFinancialChart"),
                          h: 300,
                          icon: <IconGraphics size={80} />,
                        }}
                      />
                    </div>
                  )}
                  <section
                    className={`${styles.fourWidgetSection} ${styles.widgetsHome}`}
                  >
                    <div className={styles.widgetRow}>
                      <WidgetList
                        className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                        title={translate("paymentReviews")}
                        viewAllText={
                          isMobile ? undefined : translate("seeAllFeminine")
                        }
                        onViewAllClick={() =>
                          (window.location.href = "/payments")
                        }
                        emptyListMessage={translate("paymentsReviewEmpty")}
                        emptyListIcon={<IconPagos size={32} />}
                        data={dashboard?.data?.porConfirmar}
                        renderItem={pagosList}
                        disabledWrapText={true}
                      />
                      {!isMobile && (
                        <WidgetList
                          className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                          title={translate("alerts")}
                          viewAllText={translate("seeAllFeminine")}
                          onViewAllClick={() =>
                            (window.location.href = "/alerts")
                          }
                          emptyListMessage={translate("alertsEmpty")}
                          emptyListIcon={<IconAlerts size={32} />}
                          data={dashboard?.data?.alertas}
                          renderItem={alertasList}
                          disabledWrapText={true}
                        />
                      )}
                    </div>
                    <div className={styles.widgetRow}>
                      <WidgetList
                        className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                        title={translate("reservationRequests")}
                        viewAllText={
                          isMobile ? undefined : translate("seeAllFeminine")
                        }
                        onViewAllClick={() =>
                          (window.location.href = "/reservas")
                        }
                        emptyListMessage={translate("reservationsEmpty")}
                        emptyListIcon={<IconReservedAreas size={32} />}
                        data={dashboard?.data?.porReservar}
                        renderItem={reservasList}
                        disabledWrapText={true}
                      />
                      <WidgetList
                        className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                        title={translate("preRegistrations")}
                        viewAllText={
                          isMobile ? undefined : translate("seeAllMasculine")
                        }
                        onViewAllClick={() => setOpenPreRegistroModal(true)}
                        emptyListMessage={translate("preRegistrationsEmpty")}
                        emptyListIcon={<IconGroup2 size={32} />}
                        data={dashboard?.data?.porActivar}
                        renderItem={registroList}
                        disabledWrapText={true}
                      />
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>

          <div className={styles.rightColumn}>
            {/* Sale del MISMO `/dashboard`: si no llegó, estas tres tarjetas
                mostraban «0 administradores, 0 residentes, 0 guardias». Se
                ocultan; el aviso ya está a la izquierda, una sola vez. */}
            {!isMobile && !sinPanel && (
              <WidgetBase
                variant={"V1"}
                title={translate("usersSummary")}
                subtitle={translate("usersSummarySubtitle")}
                className={styles.summaryWidgetEqualHeight}
                style={{ maxHeight: "max-content" }}
              >
                <div className={styles.widgetsResumeContainer}>
                  <WidgetDashCard
                    title={translate("administrators")}
                    data={formatNumber(dashboard?.data?.adminsCount, 0)}
                    tooltip={true}
                    tooltipTitle={translate("administratorsTooltip")}
                    tooltipColor="var(--cWhiteV1)"
                    tooltipPosition="left"
                    tooltipWidth={500}
                  />
                  <WidgetDashCard
                    title={translate("residents")}
                    data={formatNumber(dashboard?.data?.ownersCount, 0)}
                    tooltip={true}
                    tooltipTitle={translate("residentsTooltip")}
                    tooltipColor="var(--cWhiteV1)"
                    tooltipPosition="left"
                    tooltipWidth={500}
                  />
                  <WidgetDashCard
                    title={translate("guards")}
                    data={formatNumber(dashboard?.data?.guardsCount, 0)}
                    tooltip={true}
                    tooltipTitle={translate("guardsTooltip")}
                    tooltipColor="var(--cWhiteV1)"
                    tooltipPosition="left"
                    tooltipWidth={500}
                  />
                </div>
              </WidgetBase>
            )}
            {!isMobile && (
              <div className={styles.widgetContents}>
                <WidgetContentsResume
                  onOpenRenderView={handleOpenContentRenderView}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {openPayment && (
        <PaymentRender
          {...paymentProps}
          onClose={() => setOpenPayment(false)}
        />
      )}
      {openReservation && (
        <ReservationDetailModal
          open={openReservation}
          onClose={() => {
            setOpenReservation(false);
            setSelectedReservationId(null);
          }}
          reservationId={selectedReservationId}
          reLoad={reLoad}
        />
      )}
      <DataModal
        open={openPreRegistroModal}
        title={translate("fullPreRegistrationsList")}
        onClose={() => setOpenPreRegistroModal(false)}
        buttonText=""
        buttonCancel=""
        variant={"mini"}
      >
        <div data-i18n-ignore="true">{renderPreRegistroList()}</div>
      </DataModal>
      {openActive && (
        <OwnersRender
          open={openActive}
          onClose={() => setOpenActive(false)}
          item={dataOwner}
          reLoad={reLoad}
          execute={execute}
        />
      )}
      {openAlert && (
        <AlertsRender
          open={openAlert}
          onClose={() => {
            setOpenAlert(false);
            setSelectedAlert(null);
          }}
          item={selectedAlert}
          reLoad={reLoad}
        />
      )}
      <ContentRenderView
        open={openContentRender}
        onClose={handleCloseContentRenderView}
        item={{ data: selectedContentData }}
        contentId={selectedContentId || undefined}
        selectedContentData={selectedContentData || undefined}
        showActions={false}
      />
    </>
  );
};

export default HomePage;
