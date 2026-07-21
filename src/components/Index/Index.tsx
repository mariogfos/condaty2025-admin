import { useEffect, useState } from "react";
import useAxios from "@/mk/hooks/useAxios";
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
} from "../layout/icons/IconsBiblioteca";
import WidgetContentsResume from "../Widgets/WidgetsDashboard/WidgetContentsResume/WidgetContentsResume";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import ContentRenderView from "@/modulos/Contents/RenderView/RenderView";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import { AssemblyDashboardCard } from "@/modulos/Assemblies/components/AssemblyDashboardCard/AssemblyDashboardCard";
import { firstCountOrZero } from "@/mk/utils/dashboardCounts";

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
    execute,
  } = useAxios("/dashboard", "GET", {
    ...paramsInitial,
  });
  const dashboardData = dashboard?.data ?? {};
  const administratorsCount = firstCountOrZero(
    dashboardData.adminsCount,
    dashboardData.administratorsCount,
    dashboardData.admins,
  );
  const residentsCount = firstCountOrZero(
    dashboardData.residentsCount,
    dashboardData.tenantsCount,
    dashboardData.residents,
    dashboardData.tenants,
    dashboardData.ownersCount,
  );
  const guardsCount = firstCountOrZero(
    dashboardData.guardsCount,
    dashboardData.guards,
  );

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
    const ownerInitials = primaryText?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

    return (
      <div className={`${styles.itemRow}`} onClick={() => { setDataPayment(data); setOpenPayment(true); }}>
        <div className={styles.itemImageContainer}>
          {imageUrl ? (
            <Avatar src={data?.owner?.url_avatar} name={primaryText} w={40} h={40} className={styles.itemImage} />
          ) : (
            <div className={styles.itemImagePlaceholder}>{ownerInitials || "?"}</div>
          )}
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">{primaryText}</span>
          <span className={styles.itemSecondaryText} data-i18n-ignore="true">{secondaryText}</span>
        </div>
        <div className={styles.itemActionContainer}>
          <button className={styles.itemActionButton}>{translate("review")}</button>
        </div>
      </div>
    );
  };

  const reservasList = (data: any) => {
    const imageUrl = data?.owner;
    const primaryText = getFullName(data?.owner);
    const secondaryText = `${data?.area?.title || translate("areaNotSpecified")}`;
    const ownerInitials = primaryText?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
    return (
      <div className={`${styles.itemRow}`} onClick={() => { setSelectedReservationId(data.id); setOpenReservation(true); }}>
        <div className={styles.itemImageContainer}>
          {imageUrl ? (
            <Avatar src={data?.owner?.url_avatar} name={primaryText} w={40} h={40} className={styles.itemImage} />
          ) : (
            <div className={styles.itemImagePlaceholder}>{ownerInitials || "?"}</div>
          )}
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">{primaryText}</span>
          <span className={styles.itemSecondaryText} data-i18n-ignore="true">{secondaryText}</span>
        </div>
        <div className={styles.itemActionContainer}>
          <button className={styles.itemActionButton}>{translate("review")}</button>
        </div>
      </div>
    );
  };

  const registroList = (data: any) => {
    const ownerData = data?.owner || data;
    const primaryText = getFullName(ownerData);
    const secondaryText = ownerData?.ci ? `${translate("preRegistrationIdLabel")}: ${ownerData.ci}` : ownerData?.email || "";

    return (
      <div className={styles.itemRow} onClick={() => {
        if (userCan("owners", "C") == false) return showToast(translate("preRegistrationPermissionDenied"), "error");
        setDataOwner({ ...ownerData, type_owner: data?.type });
        setOpenActive(true);
      }}>
        <div className={styles.itemImageContainer}>
          <Avatar src={ownerData?.url_avatar} name={primaryText} w={40} h={40} className={styles.itemImage} />
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">{primaryText}</span>
          {secondaryText && <span className={styles.itemSecondaryText} data-i18n-ignore="true">{secondaryText}</span>}
        </div>
        <div className={styles.itemActionContainer}>
          <button className={styles.itemActionButton} onClick={() => {
            if (userCan("owners", "C") == false) return showToast(translate("preRegistrationPermissionDenied"), "error");
            setDataOwner({ ...ownerData, type_owner: data.type });
            setOpenActive(true);
          }}>{translate("review")}</button>
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

    const userInitials = primaryText?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
    const secondaryText = data.descrip || translate("noDescription");
    const truncatedSecondaryText = truncateText(secondaryText, 35);

    let levelClass = styles.levelLow;
    let levelTextIndicator = ALERT_LEVEL_LABELS[data.level as keyof typeof ALERT_LEVEL_LABELS] || ALERT_LEVEL_LABELS[1];
    if (data.level === 2) {
      levelClass = styles.levelMedium;
    } else if (data.level === 3 || data.level > 2) {
      levelClass = styles.levelHigh;
    }
    const canDisplayAvatarImage = !!dataSource?.id;
    let avatarImageUrl = dataSource?.url_avatar;

    return (
      <div className={styles.itemRow} onClick={() => { setSelectedAlert(data); setOpenAlert(true); }}>
        <div className={styles.itemImageContainer}>
          {canDisplayAvatarImage && avatarImageUrl ? (
            <Avatar src={avatarImageUrl} name={primaryText} w={40} h={40} className={styles.itemImage} />
          ) : (
            <div className={styles.itemImagePlaceholder}>{userInitials || "!"}</div>
          )}
        </div>
        <div className={styles.itemTextInfo}>
          <span className={styles.itemPrimaryText} data-i18n-ignore="true">{primaryText}</span>
          <span className={styles.itemSecondaryText} title={secondaryText} data-i18n-ignore="true">{truncatedSecondaryText}</span>
          <span className={styles.itemDateText} data-i18n-ignore="true">{getDateTimeStrMes(data.created_at)}</span>
        </div>
        <div className={`${styles.itemActionContainer} ${styles.itemAlertLevelContainer}`}>
          <div className={`${styles.alertLevelIndicator} ${levelClass}`}>{levelTextIndicator}</div>
        </div>
      </div>
    );
  };

  const renderPreRegistroList = () => {
    return (
      <div className={styles.preRegistroListContainer}>
        {dashboard?.data?.porActivar?.map((item: any, index: number) => (
          <div key={item?.id ?? index} className={styles.preRegistroItem}>{registroList(item)}</div>
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
        <div className={styles.mainLayout}>
          <div className={styles.leftColumn}>
            <WidgetBase variant={"V1"} title={translate("currentSummary")} subtitle={formattedDate} className={styles.summaryWidgetEqualHeight} style={{ maxHeight: "max-content" }}>
              <div className={styles.widgetsResumeContainer}>
                <WidgetDashCard
                  title={translate("incomes")}
                  data={"Bs. " + formatNumber(dashboard?.data?.TotalIngresos)}
                  onClick={isMobile ? undefined : () => (window.location.href = "/payments")}
                  icon={<IconIngresos color={!dashboard?.data?.TotalIngresos || dashboard?.data?.TotalIngresos === 0 ? "var(--cWhiteV1)" : "var(--cSuccess)"} style={{ backgroundColor: !dashboard?.data?.TotalIngresos || dashboard?.data?.TotalIngresos === 0 ? "var(--cHover)" : "var(--cHoverCompl2)" }} circle size={16} />}
                  className={styles.widgetResumeCard}
                />
                <WidgetDashCard
                  title={translate("outlays")}
                  data={"Bs. " + formatNumber(dashboard?.data?.TotalEgresos)}
                  onClick={isMobile ? undefined : () => (window.location.href = "/outlays")}
                  icon={<IconEgresos color={!dashboard?.data?.TotalEgresos || dashboard?.data?.TotalEgresos === 0 ? "var(--cWhiteV1)" : "var(--cError)"} style={{ backgroundColor: !dashboard?.data?.TotalEgresos || dashboard?.data?.TotalEgresos === 0 ? "var(--cHover)" : "var(--cHoverError)" }} circle size={16} />}
                  className={styles.widgetResumeCard}
                />
                <WidgetDashCard
                  title={balanceMessage}
                  color={balance < 0 ? "var(--cError)" : ""}
                  data={"Bs. " + formatNumber(Number(dashboard?.data?.TotalIngresos) - Number(dashboard?.data?.TotalEgresos))}
                  onClick={undefined}
                  icon={<IconBriefCaseMoney color={!balance || balance === 0 ? "var(--cWhiteV1)" : "var(--cInfo)"} style={{ backgroundColor: !balance || balance === 0 ? "var(--cHover)" : "var(--cHoverCompl3)" }} circle size={16} />}
                  className={styles.widgetResumeCard}
                />
                <WidgetDashCard
                  title={translate("delinquency")}
                  data={"Bs. " + formatNumber(dashboard?.data?.morosos)}
                  onClick={isMobile ? undefined : () => (window.location.href = "/defaulters")}
                  icon={<IconWallet color={!dashboard?.data?.morosos || dashboard?.data?.morosos === 0 ? "var(--cWhiteV1)" : "var(--cMediumAlert)"} style={{ backgroundColor: !dashboard?.data?.morosos || dashboard?.data?.morosos === 0 ? "var(--cHover)" : "var(--cHoverCompl5)" }} circle size={16} />}
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
                    showEmptyData={!dashboard?.data?.ingresosHist || !dashboard?.data?.egresosHist || (dashboard?.data?.ingresosHist?.length === 0 && dashboard?.data?.egresosHist?.length === 0)}
                    emptyDataProps={{ message: translate("emptyFinancialChart"), h: 300, icon: <IconGraphics size={80} /> }}
                  />
                </div>
              )}
              <section className={`${styles.fourWidgetSection} ${styles.widgetsHome}`}>
                <div className={styles.widgetRow}>
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title={translate("paymentReviews")}
                    viewAllText={isMobile ? undefined : translate("seeAllFeminine")}
                    onViewAllClick={() => (window.location.href = "/payments")}
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
                      onViewAllClick={() => (window.location.href = "/alerts")}
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
                    viewAllText={isMobile ? undefined : translate("seeAllFeminine")}
                    onViewAllClick={() => (window.location.href = "/reservas")}
                    emptyListMessage={translate("reservationsEmpty")}
                    emptyListIcon={<IconReservedAreas size={32} />}
                    data={dashboard?.data?.porReservar}
                    renderItem={reservasList}
                    disabledWrapText={true}
                  />
                  <WidgetList
                    className={`${styles.widgetAlerts} ${styles.widgetGrow}`}
                    title={translate("preRegistrations")}
                    viewAllText={isMobile ? undefined : translate("seeAllMasculine")}
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
          </div>

          <div className={styles.rightColumn}>
            {!isMobile && (
              <WidgetBase variant={"V1"} title={translate("usersSummary")} subtitle={translate("usersSummarySubtitle")} className={styles.summaryWidgetEqualHeight} style={{ maxHeight: "max-content" }}>
                <div className={styles.widgetsResumeContainer}>
                  <WidgetDashCard title={translate("administrators")} data={formatNumber(administratorsCount, 0)} tooltip={true} tooltipTitle={translate("administratorsTooltip")} tooltipColor="var(--cWhiteV1)" tooltipPosition="left" tooltipWidth={500} />
                  <WidgetDashCard title={translate("residents")} data={formatNumber(residentsCount, 0)} tooltip={true} tooltipTitle={translate("residentsTooltip")} tooltipColor="var(--cWhiteV1)" tooltipPosition="left" tooltipWidth={500} />
                  <WidgetDashCard title={translate("guards")} data={formatNumber(guardsCount, 0)} tooltip={true} tooltipTitle={translate("guardsTooltip")} tooltipColor="var(--cWhiteV1)" tooltipPosition="left" tooltipWidth={500} />
                </div>
              </WidgetBase>
            )}
            {!isMobile && (
              <div className={styles.widgetContents}>
                <WidgetContentsResume onOpenRenderView={handleOpenContentRenderView} />
              </div>
            )}
          </div>
        </div>
      </div>

      {openPayment && <PaymentRender {...paymentProps} onClose={() => setOpenPayment(false)} />}
      {openReservation && <ReservationDetailModal open={openReservation} onClose={() => { setOpenReservation(false); setSelectedReservationId(null); }} reservationId={selectedReservationId} reLoad={reLoad} />}
      <DataModal open={openPreRegistroModal} title={translate("fullPreRegistrationsList")} onClose={() => setOpenPreRegistroModal(false)} buttonText="" buttonCancel="" variant={"mini"}>
        <div data-i18n-ignore="true">{renderPreRegistroList()}</div>
      </DataModal>
      {openActive && <OwnersRender open={openActive} onClose={() => setOpenActive(false)} item={dataOwner} reLoad={reLoad} execute={execute} />}
      {openAlert && <AlertsRender open={openAlert} onClose={() => { setOpenAlert(false); setSelectedAlert(null); }} item={selectedAlert} reLoad={reLoad} />}
      <ContentRenderView open={openContentRender} onClose={handleCloseContentRenderView} item={{ data: selectedContentData }} contentId={selectedContentId || undefined} selectedContentData={selectedContentData || undefined} showActions={false} />
    </>
  );
};

export default HomePage;
