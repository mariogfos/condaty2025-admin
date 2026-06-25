"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Table from "@/mk/components/ui/Table/Table";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import EmptyData from "@/components/NoData/EmptyData";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { TableSkeleton } from "@/mk/components/ui/Skeleton/Skeleton";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { MONTHS_S, getDateStrMes, getDateStrMesShort } from "@/mk/utils/date";
import { getPaymentStatusConfig, type PaymentStatus } from "@/types/payment";
import {
  getStatusConfig as getDebtStatusConfig,
  getStatusText as getDebtStatusText,
} from "@/modulos/DebtsManager/TabComponents/constants";
import { paymentsApi } from "@/modulos/Payments/api";
import PaymentRenderView from "@/modulos/Payments/RenderView/RenderView";
import DebtRenderView from "@/modulos/DebtsManager/TabComponents/AllDebts/RenderView/RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { IconCategories, IconPagos } from "@/components/layout/icons/IconsBiblioteca";
import { formatNumber } from "@/mk/utils/numbers";
import styles from "./UnitFinanceHistory.module.css";

type UnitFinanceHistoryProps = {
  execute: Function;
  extraData?: any;
  loaded: boolean;
  reLoad: Function;
  unitDescription?: string;
  unitId?: string | number;
};

const getMonthPeriodLabel = (monthValue: any, yearValue: any) => {
  if (monthValue == null || yearValue == null) return "";

  const monthNumber = Math.max(1, Math.min(12, Number(monthValue)));
  const monthLabel = MONTHS_S[monthNumber] || String(monthValue);

  return `${monthLabel} ${yearValue}`;
};

const getReservationAreaLabel = (row: any) =>
  row?.reservation?.area?.title ||
  row?.debt?.reservation?.area?.title ||
  row?.penalty_reservation?.area?.title ||
  row?.debt?.penalty_reservation?.area?.title ||
  row?.penaltyReservation?.area?.title ||
  row?.debt?.reservation_penalty?.area?.title ||
  "";

const getDebtConceptLabel = (row: any) => {
  const debtType = Number(row?.type ?? row?.debt?.type ?? -1);

  if (debtType === 1) {
    return (
      getMonthPeriodLabel(
        row?.month ?? row?.shared?.month,
        row?.year ?? row?.shared?.year,
      ) || "-/-"
    );
  }

  if (debtType === 2) {
    return getReservationAreaLabel(row) || "-/-";
  }

  if (debtType === 3) {
    return getReservationAreaLabel(row) || row?.description || "-/-";
  }

  return (
    row?.description ||
    row?.shared?.description ||
    row?.subcategory?.name ||
    "-/-"
  );
};

const getDebtTypeLabel = (row: any) => {
  switch (Number(row?.type ?? row?.debt?.type ?? -1)) {
    case 0:
      return "Otras deudas";
    case 1:
      return "Expensas";
    case 2:
      return "Reservas";
    case 3:
      return "Reserva con multa";
    case 4:
      return "Compartida";
    case 5:
      return "Condonación";
    default:
      return "-/-";
  }
};

const getDebtBalance = (row: any) => {
  const outstanding = Number(
    row?.total_remaining_amount ?? row?.available_partial_amount,
  );

  if (Number.isFinite(outstanding) && outstanding > 0) {
    return Math.round(outstanding * 100) / 100;
  }

  const debtAmount = Number(row?.amount ?? 0);
  const penaltyAmount = Number(row?.penalty_amount ?? 0);
  const maintenanceAmount = Number(row?.maintenance_amount ?? 0);

  return Math.round((debtAmount + penaltyAmount + maintenanceAmount) * 100) / 100;
};

const getDebtStatusCode = (row: any) =>
  String(
    row?.status ??
      row?.debt_status ??
      row?.debt_dpto?.status ??
      "",
  )
    .trim()
    .toUpperCase();

const getDebtRowId = (row: any) =>
  row?.debt_dpto_id ??
  row?.debt_dpto?.id ??
  row?.id ??
  row?.debtDptoId ??
  row?.debt_id ??
  row?.shared_id ??
  null;

const normalizeDebtRow = (row: any) => ({
  ...row,
  id: getDebtRowId(row),
  debt_dpto_id: row?.debt_dpto_id ?? row?.debt_dpto?.id ?? getDebtRowId(row),
  status: getDebtStatusCode(row) || row?.status || "A",
});

const resolveDebtStatus = (row: any) => {
  const normalizedStatus = getDebtStatusCode(row);
  const dueAtString = row?.due_at || "";
  const todayString = new Date().toISOString().split("T")[0];

  if (normalizedStatus === "A" && dueAtString && dueAtString < todayString) {
    return "M";
  }

  return normalizedStatus || "A";
};

const getPaymentConceptLabel = (payment: any) => {
  const details = Array.isArray(payment?.details) ? payment.details : [];

  if (details.length > 0) {
    const concepts = details
      .map((detail: any) => {
        const debt = detail?.debt_dpto;
        if (!debt) {
          return (
            detail?.subcategory?.name ||
            detail?.subcategory?.padre?.name ||
            detail?.description ||
            ""
          );
        }

        const debtType = Number(debt?.type ?? debt?.debt?.type ?? -1);

        if (debtType === 1) {
          return (
            getMonthPeriodLabel(
              debt?.month ?? debt?.shared?.month,
              debt?.year ?? debt?.shared?.year,
            ) || ""
          );
        }

        if (debtType === 2 || debtType === 3) {
          return (
            debt?.reservation?.area?.title ||
            debt?.debt?.reservation?.area?.title ||
            debt?.penaltyReservation?.area?.title ||
            debt?.debt?.reservation_penalty?.area?.title ||
            debt?.description ||
            ""
          );
        }

        return (
          debt?.description ||
          detail?.subcategory?.name ||
          detail?.subcategory?.padre?.name ||
          ""
        );
      })
      .filter(Boolean);

    const uniqueConcepts = [...new Set(concepts)];
    if (uniqueConcepts.length > 0) {
      return uniqueConcepts.join(" / ");
    }
  }

  if (Array.isArray(payment?.concept) && payment.concept.length > 0) {
    return payment.concept.filter(Boolean).join(" / ");
  }

  return (
    payment?.concepto ||
    payment?.subcategory?.name ||
    payment?.category?.name ||
    "-/-"
  );
};

const getPaymentAmount = (payment: any) =>
  Number(payment?.amount ?? 0) + Number(payment?.penalty_amount ?? 0);

const ACTIVE_DEBT_STATUSES = new Set(["A", "M", "S", "I"]);

const UnitFinanceHistory = ({
  execute,
  extraData,
  loaded,
  reLoad,
  unitDescription,
  unitId,
}: UnitFinanceHistoryProps) => {
  const { showToast, user } = useAuth();
  const executeRef = useRef(execute);
  const reLoadRef = useRef(reLoad);
  const showToastRef = useRef(showToast);
  const [activeTab, setActiveTab] = useState("payments");
  const [paymentRows, setPaymentRows] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [isLoadingFinancialState, setIsLoadingFinancialState] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | number | null>(
    null,
  );
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);

  const totalPaymentsAmount = useMemo(() => {
    return paymentRows.reduce((acc, row) => acc + getPaymentAmount(row), 0);
  }, [paymentRows]);

  const totalDebtsAmount = useMemo(() => {
    return debts.reduce((acc, row) => acc + getDebtBalance(row), 0);
  }, [debts]);

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    reLoadRef.current = reLoad;
  }, [reLoad]);

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const loadFinancialState = useCallback(async () => {
    if (!unitId) {
      setPaymentRows([]);
      setDebts([]);
      return;
    }

    setIsLoadingFinancialState(true);

    try {
      const { data, error } = await executeRef.current(
        paymentsApi.unitFinancialState(unitId),
        "GET",
        {},
        false,
        true,
      );

      if (data?.success) {
        const incomingPayments = Array.isArray(data?.data?.payments)
          ? data.data.payments
          : [];
        const incomingDebts = Array.isArray(data?.data?.debts)
          ? data.data.debts
          : [];

        const activeRows = incomingDebts.filter((row: any) =>
          ACTIVE_DEBT_STATUSES.has(resolveDebtStatus(row)),
        );

        const sortedRows = [...activeRows].sort((left, right) =>
          String(
            right?.due_at || right?.created_at || "",
          ).localeCompare(
            String(left?.due_at || left?.created_at || ""),
          ),
        );

        setPaymentRows(incomingPayments);
        setDebts(sortedRows);
      } else {
        setPaymentRows([]);
        setDebts([]);
        if (error?.message || data?.message) {
          showToastRef.current(
            error?.message ||
              data?.message ||
              "No se pudo cargar el estado financiero de la unidad",
            "error",
          );
        }
      }
    } catch (error) {
      setPaymentRows([]);
      setDebts([]);
      showToastRef.current(
        "No se pudo cargar el estado financiero de la unidad",
        "error",
      );
    } finally {
      setIsLoadingFinancialState(false);
    }
  }, [unitId]);

  useEffect(() => {
    void loadFinancialState();
  }, [loadFinancialState]);

  const handleRefreshFinancialData = useCallback(async () => {
    await loadFinancialState();
    await reLoadRef.current({ extraData: true });
  }, [loadFinancialState]);

  const getPaymentTypeLabel = useCallback((payment: any) => {
    const details = Array.isArray(payment?.details) ? payment.details : [];

    if (details.length > 0) {
      const types = details
        .map((detail: any) => {
          const debtType = Number(detail?.debt_dpto?.type ?? -1);
          if (Number.isFinite(debtType) && debtType >= 0) {
            return getDebtTypeLabel({ type: debtType });
          }

          return (
            detail?.subcategory?.padre?.name ||
            detail?.subcategory?.name ||
            detail?.description ||
            ""
          );
        })
        .filter(Boolean);

      const uniqueTypes = [...new Set(types)];
      if (uniqueTypes.length > 0) {
        return uniqueTypes.join(" / ");
      }
    }

    return (
      payment?.subcategory?.padre?.name ||
      payment?.subcategory?.name ||
      payment?.category?.name ||
      "-/-"
    );
  }, []);

  const paymentsHeader = useMemo(
    () => [
      {
        key: "paid_at",
        label: "Fecha de pago",
        responsive: "desktop",
        width: "150px",
        onRender: ({ item }: any) => getDateStrMes(item?.paid_at) || "-/-",
      },
      {
        key: "type",
        label: "Tipo",
        responsive: "desktop",
        width: "190px",
        onRender: ({ item }: any) => getPaymentTypeLabel(item),
      },
      {
        key: "concept_period",
        label: "Concepto / Periodo",
        responsive: "desktop",
        width: "100%",
        onRender: ({ item }: any) => getPaymentConceptLabel(item),
      },
      {
        key: "amount",
        label: "Monto",
        responsive: "desktop",
        width: "150px",
        style: { textAlign: "right", justifyContent: "flex-end" },
        onRender: ({ item }: any) => (
          <FormatBsAlign value={getPaymentAmount(item)} alignRight />
        ),
      },
      {
        key: "status",
        label: "Estado",
        responsive: "desktop",
        width: "180px",
        style: { textAlign: "center", justifyContent: "center" },
        onRender: ({ item }: any) => {
          const statusInfo = getPaymentStatusConfig(
            item?.status as PaymentStatus,
          );

          return (
            <StatusBadge
              backgroundColor={statusInfo.backgroundColor}
              color={statusInfo.color}
            >
              {statusInfo.label}
            </StatusBadge>
          );
        },
      },
    ],
    [getPaymentTypeLabel],
  );

  const debtsHeader = useMemo(
    () => [
      {
        key: "due_at",
        label: "Vencimiento",
        responsive: "desktop",
        width: "140px",
        onRender: ({ item }: any) =>
          getDateStrMesShort(item?.due_at) || "-/-",
      },
      {
        key: "concept_period",
        label: "Concepto / Periodo",
        responsive: "desktop",
        width: "100%",
        onRender: ({ item }: any) => getDebtConceptLabel(item),
      },
      {
        key: "type",
        label: "Tipo",
        responsive: "desktop",
        width: "170px",
        onRender: ({ item }: any) => getDebtTypeLabel(item),
      },
      {
        key: "balance_due",
        label: "Saldo pendiente",
        responsive: "desktop",
        width: "160px",
        style: { textAlign: "right", justifyContent: "flex-end" },
        onRender: ({ item }: any) => (
          <FormatBsAlign value={getDebtBalance(item)} alignRight />
        ),
      },
      {
        key: "status",
        label: "Estado",
        responsive: "desktop",
        width: "180px",
        style: { textAlign: "center", justifyContent: "center" },
        onRender: ({ item }: any) => {
          const resolvedStatus = resolveDebtStatus(item);
          const dueAtString = item?.due_at;
          const { color, bgColor } = getDebtStatusConfig(
            resolvedStatus,
            dueAtString,
          );

          return (
            <StatusBadge backgroundColor={bgColor} color={color}>
              {getDebtStatusText(resolvedStatus)}
            </StatusBadge>
          );
        },
      },
    ],
    [],
  );

  const tabs = useMemo(
    () => [
      { value: "payments", text: "Pagos", numero: paymentRows.length || 0 },
      { value: "debts", text: "Deudas", numero: debts?.length || 0 },
    ],
    [debts.length, paymentRows.length],
  );

  const subtitle = useMemo(() => {
    if (activeTab === "payments") {
      return `${paymentRows.length || 0} pagos registrados para esta unidad${
        unitDescription ? ` · ${unitDescription}` : ""
      }`;
    }

    return `${debts.length} deudas vinculadas a esta unidad${
      unitDescription ? ` · ${unitDescription}` : ""
    }`;
  }, [activeTab, debts.length, paymentRows.length, unitDescription]);

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitleArea}>
            <h3 className={styles.title}>Estado financiero de la unidad</h3>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
          <div className={`${styles.totalBadge} ${activeTab === "payments" ? styles.paymentsTotal : styles.debtsTotal}`}>
            {activeTab === "payments" ? (
              <>
                <span className={styles.totalLabel}>Total Pagos:</span>
                <span className={styles.totalValue}>Bs {formatNumber(totalPaymentsAmount)}</span>
              </>
            ) : (
              <>
                <span className={styles.totalLabel}>Total Deudas:</span>
                <span className={styles.totalValue}>Bs {formatNumber(totalDebtsAmount)}</span>
              </>
            )}
          </div>
        </div>

        <div className={styles.tabs}>
          <TabsButtons
            tabs={tabs}
            sel={activeTab}
            setSel={setActiveTab}
            variant="rounded"
          />
        </div>

        <div className={styles.tableArea}>
          {activeTab === "payments" ? (
            !loaded || isLoadingFinancialState ? (
              <TableSkeleton />
            ) : paymentRows.length > 0 ? (
              <Table
                className={styles.clickableTable}
                data={paymentRows}
                header={paymentsHeader as any}
                height="100%"
                onRowClick={(row: any) =>
                  setSelectedPaymentId(row?.payment_id || row?.id || null)
                }
              />
            ) : (
              <div className={styles.emptyState}>
                <EmptyData
                  centered
                  icon={<IconPagos size={72} color="var(--cWhiteV1)" />}
                  message="Sin pagos registrados. Cuando esta unidad comience a pagar"
                  line2="expensas y otros conceptos, los verás aquí."
                />
              </div>
            )
          ) : !loaded || isLoadingFinancialState ? (
            <TableSkeleton />
          ) : debts.length > 0 ? (
            <Table
              className={styles.clickableTable}
              data={debts}
              header={debtsHeader as any}
              height="100%"
              onRowClick={(row: any) => {
                const normalizedRow = normalizeDebtRow(row);

                if (!normalizedRow?.id) {
                  showToast("No se pudo abrir el detalle de la deuda", "error");
                  return;
                }

                setSelectedDebt(normalizedRow);
              }}
            />
          ) : (
            <div className={styles.emptyState}>
              <EmptyData
                centered
                icon={<IconCategories size={72} color="var(--cWhiteV1)" />}
                message="Sin deudas registradas. Cuando esta unidad genere"
                line2="expensas, reservas u otras deudas, las verás aquí."
              />
            </div>
          )}
        </div>
      </div>

      {selectedPaymentId ? (
        <PaymentRenderView
          open={Boolean(selectedPaymentId)}
          onClose={() => setSelectedPaymentId(null)}
          extraData={extraData}
          payment_id={selectedPaymentId}
        />
      ) : null}

      {selectedDebt ? (
        <DebtRenderView
          open={Boolean(selectedDebt)}
          onClose={() => setSelectedDebt(null)}
          item={selectedDebt}
          extraData={extraData}
          user={user}
          onReload={handleRefreshFinancialData}
        />
      ) : null}

    </>
  );
};

export default UnitFinanceHistory;
