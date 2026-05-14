"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import PaymentRenderView from "@/modulos/Payments/RenderView/RenderView";
import PartialPaymentRenderView from "@/modulos/PartialPayments/RenderView/RenderView";
import DebtRenderView from "@/modulos/DebtsManager/TabComponents/AllDebts/RenderView/RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { IconCategories, IconPagos } from "@/components/layout/icons/IconsBiblioteca";
import styles from "./UnitFinanceHistory.module.css";

type UnitFinanceHistoryProps = {
  execute: Function;
  extraData?: any;
  loaded: boolean;
  payments: any[];
  reLoad: Function;
  unitDescription?: string;
  unitId?: string | number;
  unitNumber?: string | number;
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
        row?.debt?.month ?? row?.shared?.month,
        row?.debt?.year ?? row?.shared?.year,
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
    row?.debt?.description ||
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
    row?.available_partial_amount ?? row?.total_remaining_amount,
  );

  if (Number.isFinite(outstanding) && outstanding > 0) {
    return Math.round(outstanding * 100) / 100;
  }

  const debtAmount = Number(row?.amount ?? 0);
  const penaltyAmount = Number(row?.penalty_amount ?? 0);
  const maintenanceAmount = Number(row?.maintenance_amount ?? 0);

  return Math.round((debtAmount + penaltyAmount + maintenanceAmount) * 100) / 100;
};

const resolveDebtStatus = (row: any) => {
  const dueAtString = row?.debt?.due_at || row?.due_at || "";
  const todayString = new Date().toISOString().split("T")[0];

  if (row?.status === "A" && dueAtString && dueAtString < todayString) {
    return "M";
  }

  return row?.status || "A";
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
              debt?.debt?.month ?? debt?.shared?.month,
              debt?.debt?.year ?? debt?.shared?.year,
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

const UnitFinanceHistory = ({
  execute,
  extraData,
  loaded,
  payments,
  reLoad,
  unitDescription,
  unitId,
  unitNumber,
}: UnitFinanceHistoryProps) => {
  const { showToast, user } = useAuth();
  const [activeTab, setActiveTab] = useState("payments");
  const [debts, setDebts] = useState<any[]>([]);
  const [isLoadingDebts, setIsLoadingDebts] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | number | null>(
    null,
  );
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const [selectedPartialDebt, setSelectedPartialDebt] = useState<any | null>(null);

  const loadDebts = useCallback(async () => {
    if (!unitId && !unitNumber) {
      setDebts([]);
      return;
    }

    setIsLoadingDebts(true);

    try {
      const { data, error } = await execute(
        "/debt-dptos",
        "GET",
        {
          dpto_id: unitId,
          fullType: "L",
          page: 1,
          perPage: -1,
          searchBy: unitNumber,
        },
        false,
        true,
      );

      if (data?.success) {
        const incomingRows = Array.isArray(data?.data) ? data.data : [];
        const normalizedUnitId = String(unitId ?? "");
        const normalizedUnitNumber = String(unitNumber ?? "");

        const rowUnitKeys = incomingRows
          .map((row: any) =>
            String(row?.dpto?.id ?? row?.dpto_id ?? row?.dpto?.nro ?? row?.nro ?? ""),
          )
          .filter(Boolean);

        const filteredRows = incomingRows.filter((row: any) => {
          const rowUnitId = String(row?.dpto?.id ?? row?.dpto_id ?? "");
          const rowUnitNumber = String(row?.dpto?.nro ?? row?.nro ?? "");

          return (
            (normalizedUnitId && rowUnitId === normalizedUnitId) ||
            (normalizedUnitNumber && rowUnitNumber === normalizedUnitNumber)
          );
        });

        const uniqueUnitKeys = [...new Set(rowUnitKeys)];

        const resolvedRows =
          filteredRows.length > 0
            ? filteredRows
            : uniqueUnitKeys.length <= 1
              ? incomingRows
              : [];

        const sortedRows = [...resolvedRows].sort((left, right) =>
          String(left?.due_at || left?.debt?.due_at || left?.created_at || "").localeCompare(
            String(
              right?.due_at || right?.debt?.due_at || right?.created_at || "",
            ),
          ),
        );

        setDebts(sortedRows);
      } else {
        setDebts([]);
        if (error?.message || data?.message) {
          showToast(
            error?.message || data?.message || "No se pudieron cargar las deudas",
            "error",
          );
        }
      }
    } catch (error) {
      setDebts([]);
      showToast("No se pudieron cargar las deudas de la unidad", "error");
    } finally {
      setIsLoadingDebts(false);
    }
  }, [execute, showToast, unitId, unitNumber]);

  useEffect(() => {
    void loadDebts();
  }, [loadDebts]);

  const handleRefreshFinancialData = useCallback(async () => {
    await loadDebts();
    await reLoad({ extraData: true });
  }, [loadDebts, reLoad]);

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
    [],
  );

  const debtsHeader = useMemo(
    () => [
      {
        key: "due_at",
        label: "Vencimiento",
        responsive: "desktop",
        width: "140px",
        onRender: ({ item }: any) =>
          getDateStrMesShort(item?.due_at || item?.debt?.due_at) || "-/-",
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
          const dueAtString = item?.debt?.due_at || item?.due_at;
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
      { value: "payments", text: "Pagos", numero: payments?.length || 0 },
      { value: "debts", text: "Deudas", numero: debts?.length || 0 },
    ],
    [debts.length, payments?.length],
  );

  const subtitle = useMemo(() => {
    if (activeTab === "payments") {
      return `${payments?.length || 0} pagos registrados para esta unidad${
        unitDescription ? ` · ${unitDescription}` : ""
      }`;
    }

    return `${debts.length} deudas vinculadas a esta unidad${
      unitDescription ? ` · ${unitDescription}` : ""
    }`;
  }, [activeTab, debts.length, payments?.length, unitDescription]);

  return (
    <>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Estado financiero de la unidad</h3>
          <p className={styles.subtitle}>{subtitle}</p>
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
            !loaded ? (
              <TableSkeleton />
            ) : payments?.length > 0 ? (
              <Table
                className={styles.clickableTable}
                data={payments}
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
          ) : isLoadingDebts ? (
            <TableSkeleton />
          ) : debts.length > 0 ? (
            <Table
              className={styles.clickableTable}
              data={debts}
              header={debtsHeader as any}
              height="100%"
              onRowClick={(row: any) => {
                if (row?.status === "I") {
                  setSelectedPartialDebt(row);
                  return;
                }

                setSelectedDebt(row);
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

      {selectedPartialDebt ? (
        <PartialPaymentRenderView
          open={Boolean(selectedPartialDebt)}
          onClose={() => setSelectedPartialDebt(null)}
          item={selectedPartialDebt}
          extraData={extraData}
          execute={execute}
          reLoad={handleRefreshFinancialData}
          showToast={showToast}
        />
      ) : null}
    </>
  );
};

export default UnitFinanceHistory;
