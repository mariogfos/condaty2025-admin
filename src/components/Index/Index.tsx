import { ReactNode, useEffect } from "react";
import Link from "next/link";
import {
  ChartColumnBig,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "../auth/NotAccess/NotAccess";
import WidgetBase from "../Widgets/WidgetBase/WidgetBase";
import WidgetGraphResume from "../Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume";
import { formatNumber } from "@/mk/utils/numbers";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import { AssemblyDashboardCard } from "@/modulos/Assemblies/components/AssemblyDashboardCard/AssemblyDashboardCard";
import { firstCountOrZero } from "@/mk/utils/dashboardCounts";
import styles from "./index.module.css";

const paramsInitial = {
  fullType: "L",
  searchBy: "",
};

type FinancialMetricProps = {
  href: string;
  icon: ReactNode;
  label: string;
  tone: "income" | "outlay" | "delinquency";
  value: number;
};

const FinancialMetric = ({
  href,
  icon,
  label,
  tone,
  value,
}: FinancialMetricProps) => (
  <Link
    href={href}
    className={`${styles.financialMetric} ${styles[`financialMetric_${tone}`]}`}
  >
    <span className={styles.financialMetricHeader}>
      <span>{label}</span>
      <span className={styles.financialMetricIcon} aria-hidden="true">
        {icon}
      </span>
    </span>
    <strong>Bs. {formatNumber(value)}</strong>
  </Link>
);

const HomePage = () => {
  const { store, setStore, userCan } = useAuth();
  const { localeTag, translate } = useScopedI18n("home");
  const { isMobile } = useScreenSize();
  const { data: dashboard, reLoad } = useAxios("/dashboard", "GET", {
    ...paramsInitial,
  });

  useEffect(() => {
    const pageTitle = translate("pageTitle");
    if (store?.title === pageTitle) return;
    setStore({ title: pageTitle });
  }, [setStore, store?.title, translate]);

  useEffect(() => {
    if (!store?.reLoadDashboard) return;
    reLoad();
  }, [store?.reLoadDashboard, reLoad]);

  if (!userCan("home", "R")) return <NotAccess />;

  const dashboardData = dashboard?.data ?? {};
  const totalIncomes = Number(dashboardData.TotalIngresos) || 0;
  const totalOutlays = Number(dashboardData.TotalEgresos) || 0;
  const delinquency = Number(dashboardData.morosos) || 0;
  const balance = totalIncomes - totalOutlays;
  const balanceMessage =
    balance >= 0 ? translate("positiveBalance") : translate("negativeBalance");

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
  const totalUsers = administratorsCount + residentsCount + guardsCount;
  const userGroups = [
    {
      count: administratorsCount,
      key: "administrators",
      label: translate("administrators"),
      tooltip: translate("administratorsTooltip"),
    },
    {
      count: residentsCount,
      key: "residents",
      label: translate("residents"),
      tooltip: translate("residentsTooltip"),
    },
    {
      count: guardsCount,
      key: "guards",
      label: translate("guards"),
      tooltip: translate("guardsTooltip"),
    },
  ] as const;

  const today = new Date();
  const monthLabel = new Intl.DateTimeFormat(localeTag, {
    month: "long",
  }).format(today);
  const formattedDate = translate("summaryOfMonth", {
    month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
  });
  const hasFinancialHistory =
    (dashboardData.ingresosHist?.length || 0) > 0 ||
    (dashboardData.egresosHist?.length || 0) > 0;
  const upcomingAssembly = dashboardData.assembly;

  return (
    <div className={styles.container} data-i18n-ignore="true">
      <div
        className={`${styles.dashboardGrid} ${
          !upcomingAssembly ? styles.dashboardGridWithoutAssembly : ""
        }`}
        data-testid="home-dashboard-grid"
      >
        <WidgetBase
          variant="V1"
          title={translate("currentSummary")}
          subtitle={formattedDate}
          className={`${styles.dashboardPanel} ${styles.summaryArea}`}
        >
          <div className={styles.balanceHero}>
            <div className={styles.balanceCopy}>
              <span>{balanceMessage}</span>
              <strong className={balance < 0 ? styles.negativeValue : ""}>
                Bs. {formatNumber(balance)}
              </strong>
              <p>{translate("balanceTooltip")}</p>
            </div>
            <span className={styles.balanceIcon} aria-hidden="true">
              <WalletCards size={23} strokeWidth={1.65} />
            </span>
          </div>

          <div className={styles.financialMetrics}>
            <FinancialMetric
              href="/payments"
              label={translate("incomes")}
              value={totalIncomes}
              tone="income"
              icon={<TrendingUp size={16} strokeWidth={1.8} />}
            />
            <FinancialMetric
              href="/outlays"
              label={translate("outlays")}
              value={totalOutlays}
              tone="outlay"
              icon={<TrendingDown size={16} strokeWidth={1.8} />}
            />
            <FinancialMetric
              href="/defaulters"
              label={translate("delinquency")}
              value={delinquency}
              tone="delinquency"
              icon={<ReceiptText size={16} strokeWidth={1.8} />}
            />
          </div>
        </WidgetBase>

        <WidgetBase
          variant="V1"
          title={translate("usersSummary")}
          subtitle={translate("usersSummarySubtitle")}
          className={`${styles.dashboardPanel} ${styles.usersArea}`}
        >
          <div className={styles.usersTotal}>
            <div>
              <span>{translate("registeredUsers")}</span>
              <strong>{formatNumber(totalUsers, 0)}</strong>
            </div>
            <span className={styles.usersIcon} aria-hidden="true">
              <UsersRound size={21} strokeWidth={1.65} />
            </span>
          </div>

          <div className={styles.userBreakdown}>
            {userGroups.map(({ count, key, label, tooltip }) => (
              <div key={key} className={styles.userRow} title={tooltip}>
                <span>
                  <i className={styles[`userDot_${key}`]} aria-hidden="true" />
                  {label}
                </span>
                <strong>{formatNumber(count, 0)}</strong>
              </div>
            ))}
          </div>
        </WidgetBase>

        {upcomingAssembly && (
          <div className={styles.assemblyArea}>
            <AssemblyDashboardCard assembly={upcomingAssembly} />
          </div>
        )}

        <div className={styles.chartArea}>
          <WidgetGraphResume
            saldoInicial={dashboardData.saldoInicial}
            ingresos={dashboardData.ingresosHist || []}
            egresos={dashboardData.egresosHist || []}
            periodo="y"
            h={isMobile ? 250 : 310}
            showEmptyData={!hasFinancialHistory}
            emptyDataProps={{
              message: translate("emptyFinancialChart"),
              h: isMobile ? 220 : 300,
              icon: <ChartColumnBig size={56} strokeWidth={1.35} />,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
