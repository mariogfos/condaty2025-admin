import React, { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import EmptyData from "@/components/NoData/EmptyData";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { ChartType } from "@/mk/components/ui/Graphs/GraphsTypes";
import { formatNumber } from "@/mk/utils/numbers";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import WidgetBase from "../../WidgetBase/WidgetBase";
import styles from "./WidgetGraphResume.module.css";

type PropsType = {
  saldoInicial?: number;
  ingresos: { amount: number; mes: number }[];
  egresos: { amount: number; mes: number }[];
  chartTypes?: ChartType[];
  h?: number | string;
  title?: string;
  subtitle?: string;
  className?: string;
  periodo?: string;
  showEmptyData?: boolean;
  emptyDataProps?: {
    message?: string;
    line2?: string;
    h?: number;
    icon?: React.ReactNode;
  };
};

type BalanceData = {
  inicial: number[];
  ingresos: number[];
  egresos: number[];
  saldos: number[];
};

const MONTH_COUNT = 12;
const CHART_SERIES = [
  { color: "#8b98a8", key: "openingBalance" },
  { color: "#00e38c", key: "incomes" },
  { color: "#f2a65a", key: "outlays" },
  { color: "#8ea7ff", key: "cumulativeBalance" },
] as const;
const CHART_COLORS = CHART_SERIES.map(({ color }) => color);

const createEmptyBalance = (): BalanceData => ({
  inicial: Array(MONTH_COUNT).fill(0),
  ingresos: Array(MONTH_COUNT).fill(0),
  egresos: Array(MONTH_COUNT).fill(0),
  saldos: Array(MONTH_COUNT).fill(0),
});

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;

const WidgetGraphResume = ({
  saldoInicial = 0,
  ingresos,
  egresos,
  chartTypes = ["area"],
  h = 310,
  title,
  subtitle,
  className,
  periodo = "",
  showEmptyData = false,
  emptyDataProps,
}: PropsType) => {
  const { localeTag, translate } = useScopedI18n("graph");
  const currentYear = new Date().getFullYear();

  const { balance, meses, longMonths } = useMemo(() => {
    const nextBalance = createEmptyBalance();
    const shortMonthFormatter = new Intl.DateTimeFormat(localeTag, {
      month: "short",
    });
    const longMonthFormatter = new Intl.DateTimeFormat(localeTag, {
      month: "long",
    });
    const shortMonths = Array.from({ length: MONTH_COUNT }, (_, index) =>
      capitalize(
        shortMonthFormatter
          .format(new Date(currentYear, index, 1))
          .replace(/\.$/, ""),
      ),
    );
    const fullMonths = Array.from({ length: MONTH_COUNT }, (_, index) =>
      capitalize(longMonthFormatter.format(new Date(currentYear, index, 1))),
    );
    let firstActiveMonth = MONTH_COUNT;
    let lastActiveMonth = 0;

    ingresos?.forEach((item) => {
      const monthIndex = Math.trunc(Number(item.mes)) - 1;
      if (monthIndex < 0 || monthIndex >= MONTH_COUNT) return;

      const amount = Number(item.amount) || 0;
      nextBalance.ingresos[monthIndex] += amount;
      firstActiveMonth = Math.min(firstActiveMonth, monthIndex);
      lastActiveMonth = Math.max(lastActiveMonth, monthIndex + 1);
    });

    egresos?.forEach((item) => {
      const monthIndex = Math.trunc(Number(item.mes)) - 1;
      if (monthIndex < 0 || monthIndex >= MONTH_COUNT) return;

      const amount = Number(item.amount) || 0;
      nextBalance.egresos[monthIndex] += amount;
      firstActiveMonth = Math.min(firstActiveMonth, monthIndex);
      lastActiveMonth = Math.max(lastActiveMonth, monthIndex + 1);
    });

    let runningBalance = Number(saldoInicial) || 0;
    for (let index = 0; index < MONTH_COUNT; index += 1) {
      const hasMovement =
        nextBalance.ingresos[index] !== 0 || nextBalance.egresos[index] !== 0;
      const openingBalance = runningBalance;
      runningBalance +=
        nextBalance.ingresos[index] - nextBalance.egresos[index];

      if (hasMovement) {
        nextBalance.inicial[index] = openingBalance;
        nextBalance.saldos[index] = runningBalance;
      }
    }

    if (
      periodo !== "y" &&
      periodo !== "ly" &&
      firstActiveMonth < MONTH_COUNT
    ) {
      const sliceBalance = (values: number[]) =>
        values.slice(firstActiveMonth, lastActiveMonth);

      return {
        balance: {
          inicial: sliceBalance(nextBalance.inicial),
          ingresos: sliceBalance(nextBalance.ingresos),
          egresos: sliceBalance(nextBalance.egresos),
          saldos: sliceBalance(nextBalance.saldos),
        },
        meses: shortMonths.slice(firstActiveMonth, lastActiveMonth),
        longMonths: fullMonths.slice(firstActiveMonth, lastActiveMonth),
      };
    }

    return {
      balance: nextBalance,
      meses: shortMonths,
      longMonths: fullMonths,
    };
  }, [currentYear, egresos, ingresos, localeTag, periodo, saldoInicial]);

  const activeMonthIndexes = balance.ingresos
    .map((income, index) =>
      income !== 0 || balance.egresos[index] !== 0 ? index : -1,
    )
    .filter((index) => index >= 0);
  const currentMonthIndex = activeMonthIndexes.at(-1) ?? 0;
  const previousMonthIndex = activeMonthIndexes.at(-2);
  const hasFinancialMovement = activeMonthIndexes.length > 0;
  const currentIncome = balance.ingresos[currentMonthIndex] || 0;
  const currentOutlay = balance.egresos[currentMonthIndex] || 0;
  const currentNet = currentIncome - currentOutlay;
  const currentBalance = hasFinancialMovement
    ? balance.saldos[currentMonthIndex]
    : Number(saldoInicial) || 0;
  const previousBalance =
    previousMonthIndex !== undefined
      ? balance.saldos[previousMonthIndex]
      : Number(saldoInicial) || 0;
  const balanceDelta = currentBalance - previousBalance;
  const balanceChange =
    previousMonthIndex !== undefined && previousBalance !== 0
      ? (balanceDelta / Math.abs(previousBalance)) * 100
      : null;
  const currentMonth = longMonths[currentMonthIndex] || meses[currentMonthIndex];
  const previousMonth =
    previousMonthIndex !== undefined
      ? longMonths[previousMonthIndex] || meses[previousMonthIndex]
      : "";
  const hasPositiveFlow = currentNet > 0;
  const hasNegativeFlow = currentNet < 0;
  const trendDirection =
    balanceDelta > 0 ? "positive" : balanceDelta < 0 ? "negative" : "neutral";
  const TrendIcon =
    trendDirection === "positive"
      ? ArrowUpRight
      : trendDirection === "negative"
        ? ArrowDownRight
        : Minus;
  const comparisonLabel =
    balanceChange === null
      ? translate("firstRecordedMonth")
      : translate("versusPreviousMonth", {
          month: previousMonth,
          value: `${balanceChange > 0 ? "+" : balanceChange < 0 ? "−" : ""}${formatNumber(
            Math.abs(balanceChange),
            1,
          )}%`,
        });
  const insightCopy = hasPositiveFlow
    ? translate("positiveInsight", {
        amount: formatNumber(Math.abs(currentNet)),
        month: currentMonth,
      })
    : hasNegativeFlow
      ? translate("negativeInsight", {
          amount: formatNumber(Math.abs(currentNet)),
          month: currentMonth,
        })
      : translate("balancedInsight", { month: currentMonth });
  const insightStatus = hasPositiveFlow
    ? translate("positiveCashFlow")
    : hasNegativeFlow
      ? translate("attentionCashFlow")
      : translate("balancedCashFlow");
  const chartEndIndex = Math.max(currentMonthIndex + 1, 1);
  const primaryChartType = chartTypes[0] || "area";
  const chartHeader = (
    <div className={styles.headerRow}>
      <div className={styles.titleBlock}>
        <p className={styles.title}>{title || translate("title")}</p>
        <p className={styles.subtitle}>
          {subtitle || translate("subtitle", { year: currentYear })}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className={[styles.widgetGraphResume, className]
        .filter(Boolean)
        .join(" ")}
      data-i18n-ignore="true"
    >
      <WidgetBase className={styles.widgetBase}>
        {showEmptyData ? (
          <>
            {chartHeader}
            <EmptyData
              message={emptyDataProps?.message || translate("noDataAvailable")}
              line2={emptyDataProps?.line2}
              h={emptyDataProps?.h || 300}
              icon={emptyDataProps?.icon}
            />
          </>
        ) : (
          <div className={styles.analyticsLayout}>
            <div className={styles.chartColumn}>
              {chartHeader}
              <div className={styles.chartCanvas}>
                <GraphBase
                  data={{
                    labels: meses.slice(0, chartEndIndex),
                    values: [
                      {
                        name: translate("openingBalance"),
                        values: balance.inicial.slice(0, chartEndIndex),
                      },
                      {
                        name: translate("incomes"),
                        values: balance.ingresos.slice(0, chartEndIndex),
                      },
                      {
                        name: translate("outlays"),
                        values: balance.egresos.slice(0, chartEndIndex),
                      },
                      {
                        name: translate("cumulativeBalance"),
                        values: balance.saldos.slice(0, chartEndIndex),
                      },
                    ],
                  }}
                  chartTypes={[primaryChartType]}
                  options={{
                    height: h,
                    variant: "dashboard",
                    colors: CHART_COLORS,
                  }}
                />
              </div>
              <div className={styles.seriesLegend}>
                {CHART_SERIES.map(({ color, key }) => (
                  <div key={key} className={styles.seriesKey}>
                    <span
                      className={styles.seriesKeyDot}
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span>{translate(key)}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside
              className={styles.insightPanel}
              aria-label={translate("periodReading")}
            >
              <div className={styles.insightHeader}>
                <span className={styles.insightEyebrow}>
                  {translate("periodReading")}
                </span>
                <span
                  className={`${styles.statusBadge} ${
                    hasPositiveFlow
                      ? styles.statusPositive
                      : hasNegativeFlow
                        ? styles.statusNegative
                        : styles.statusNeutral
                  }`}
                >
                  {insightStatus}
                </span>
              </div>

              <span className={styles.insightMetricLabel}>
                {translate("cumulativeBalance")}
              </span>
              <strong
                className={`${styles.insightValue} ${
                  currentBalance < 0 ? styles.negativeValue : ""
                }`}
              >
                Bs. {formatNumber(currentBalance)}
              </strong>

              <div
                className={`${styles.comparison} ${
                  trendDirection === "positive"
                    ? styles.comparisonPositive
                    : trendDirection === "negative"
                      ? styles.comparisonNegative
                      : styles.comparisonNeutral
                }`}
              >
                <TrendIcon size={15} strokeWidth={2} aria-hidden="true" />
                <span>{comparisonLabel}</span>
              </div>

              <p className={styles.insightCopy}>{insightCopy}</p>

              <div className={styles.breakdown}>
                <p className={styles.breakdownTitle}>
                  {translate("monthlyMovements")}
                </p>
                <div className={styles.breakdownRow}>
                  <span>{translate("incomes")}</span>
                  <strong>Bs. {formatNumber(currentIncome)}</strong>
                </div>
                <div className={styles.breakdownRow}>
                  <span>{translate("outlays")}</span>
                  <strong>Bs. {formatNumber(currentOutlay)}</strong>
                </div>
                <div className={`${styles.breakdownRow} ${styles.netRow}`}>
                  <span>{translate("netResult")}</span>
                  <strong className={currentNet < 0 ? styles.negativeValue : ""}>
                    Bs. {formatNumber(currentNet)}
                  </strong>
                </div>
              </div>
            </aside>
          </div>
        )}
      </WidgetBase>
    </div>
  );
};

export default WidgetGraphResume;
