"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "./RenderView.module.css";
import paymentStyles from "@/modulos/Payments/RenderView/RenderView.module.css";
import { formatBs } from "@/mk/utils/numbers";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import ExpenseDetailModal from "@/modulos/Expenses/ExpensesDetails/RenderView/RenderView";
import ReservationDetailModal from "@/modulos/Reservas/RenderView/RenderView";
import PaymentRenderView from "@/modulos/Payments/RenderView/RenderView";
import PaymentRenderForm from "@/modulos/Payments/RenderForm/RenderForm";
import {
  MONTHS_ES,
  formatToDayDDMMYYYY,
  formatToDayFdMYH,
} from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { getTitular } from "@/mk/utils/adapters";
import { hasMaintenanceValue } from "@/mk/utils/utils";
import {
  getStatusText,
  getDetailButtonText as getDetailButtonTextFromConstants,
  getAvailableActions as getAvailableActionsFromConstants,
} from "../../constants";
import { paymentsApi } from "@/modulos/Payments/api";
import DebtQrSection from "@/modulos/QrDinamico/DebtQrSection/DebtQrSection";
import { Ban, PencilLine } from "lucide-react";
import { FinancialDetailModal } from "@/features/financial-records/FinancialDetailModal";
import {
  FinancialDetailGrid,
  FinancialDetailMessage,
  FinancialDetailSection,
  type FinancialDetailField,
} from "@/features/financial-records/FinancialDetailPrimitives";

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item: any;
  extraData?: any;
  user?: any;
  onEdit?: (item: any) => void;
  onDel?: (item: any) => void;
  hideSharedDebtButton?: boolean;
  hideEditAndDeleteButtons?: boolean;
  onReload?: () => void;
}

const getResolvedPaymentId = (item: any) =>
  item?.resolved_payment_id ?? item?.payment_id ?? null;

const hasEnoughDebtDetail = (item: any) =>
  Boolean(
    item?.dpto &&
    (item?.subcategory || item?.subcategory_id) &&
    (item?.type != null || item?.debt || item?.description),
  );

const RenderView: React.FC<RenderViewProps> = ({
  open,
  onClose,
  item,
  extraData,
  user,
  onEdit,
  onDel,
  hideSharedDebtButton = false,
  hideEditAndDeleteButtons = false,
  onReload, // Nueva prop
}) => {
  const { showToast: authShowToast } = useAuth();

  const [showExpenseDetail, setShowExpenseDetail] = useState(false);
  const [showReservationDetail, setShowReservationDetail] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);
  const [resolvedPaymentId, setResolvedPaymentId] = useState<
    string | number | null
  >(getResolvedPaymentId(item));

  const { data, execute, loaded } = useAxios(
    "/debt-dptos",
    "GET",
    {
      searchBy: item?.id,
      fullType: "DET",
      perPage: -1,
      page: 1,
      extraData: true,
    },
    open && !!item?.id,
  );

  const debtDetail = currentItem || data?.data?.[0] || item;
  const debtType = debtDetail?.type || debtDetail?.debt?.type || 0;
  const executeRef = useRef(execute);

  const hasApiData = data?.data?.[0];
  const shouldShowLoading = Boolean(
    open && item?.id && !loaded && !hasApiData && !hasEnoughDebtDetail(item),
  );

  const resolveStatus = (status: string, dueDate?: string) => {
    let finalStatus = status;
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const dueAtString = dueDate;
    if (dueAtString && dueAtString < todayString && status === "A") {
      finalStatus = "M";
    }
    return finalStatus;
  };

  const getPaymentTypeText = (type: string) => {
    const paymentTypeMap: { [key: string]: string } = {
      T: "Transferencia bancaria",
      E: "Efectivo",
      C: "Cheque",
      Q: "Pago QR",
      O: "Pago en oficina",
    };
    return paymentTypeMap[type] || type;
  };

  const getDebtTypeText = (type: number) => {
    switch (Number(type)) {
      case 0:
        return "Otras deudas";
      case 1:
        return "Expensas";
      case 2:
        return "Reservas";
      case 3:
        return "Reserva con multa";
      case 4:
        return "Deuda compartida";
      case 5:
        return "Condonación";
      default:
        return "-/-";
    }
  };

  const getConceptText = (detail: any) => {
    switch (Number(detail?.type ?? detail?.debt?.type ?? 0)) {
      case 1: {
        const month = detail?.debt?.month ?? detail?.shared?.month;
        const year = detail?.debt?.year ?? detail?.shared?.year;
        if (month && year) {
          return `${MONTHS_ES[Number(month) - 1] || month} ${year}`;
        }
        return detail?.description || detail?.subcategory?.name || "-/-";
      }
      case 2:
        return (
          detail?.reservation?.area?.title ||
          detail?.debt?.reservation?.area?.title ||
          detail?.description ||
          "-/-"
        );
      case 3:
        return (
          detail?.penaltyReservation?.area?.title ||
          detail?.debt?.reservation_penalty?.area?.title ||
          detail?.penalty_reservation?.area?.title ||
          detail?.description ||
          "-/-"
        );
      case 4:
        return detail?.shared?.description || detail?.description || "-/-";
      default:
        return (
          detail?.description ||
          detail?.debt?.description ||
          detail?.subcategory?.name ||
          "-/-"
        );
    }
  };

  const getAvailableActions = (status: string, type: number) => {
    return getAvailableActionsFromConstants(status, type);
  };

  const getDetailButtonText = (type: number) => {
    return getDetailButtonTextFromConstants(type, hideSharedDebtButton);
  };

  const handleDetailButtonClick = (type: number) => {
    const targetId = debtDetail?.debt?.id || debtDetail?.shared_id;

    switch (type) {
      case 1:
        setShowExpenseDetail(true);
        break;
      case 2:
        setShowReservationDetail(true);
        break;
      case 3:
        setShowPaymentForm(true);
        break;
      case 4:
        window.location.href = `/debts_manager/shared-debt-detail/${targetId}`;
        break;
    }
  };

  const handleShowToast = (
    msg: string,
    type: "info" | "success" | "error" | "warning",
  ) => {
    authShowToast(msg, type);
  };

  useEffect(() => {
    executeRef.current = execute;
  }, [execute]);

  useEffect(() => {
    setCurrentItem(item);
    setResolvedPaymentId(getResolvedPaymentId(item));
  }, [item]);

  useEffect(() => {
    if (data?.data?.[0]) {
      setCurrentItem(data.data[0]);
    }
  }, [data?.data]);

  useEffect(() => {
    if (!open || !item?.id) return;

    let cancelled = false;

    const fetchResolvedPayment = async () => {
      const response = await executeRef.current(
        paymentsApi.resolvedPayment(item.id),
        "GET",
        {},
        false,
        true,
      );

      if (!cancelled && response?.data?.success) {
        setResolvedPaymentId(response.data.data?.payment_id || null);
      }
    };

    fetchResolvedPayment();

    return () => {
      cancelled = true;
    };
  }, [open, item?.id]);

  if (!open || !item) return null;

  const reloadItem = async () => {
    try {
      const response = await executeRef.current(
        "/debt-dptos",
        "GET",
        {
          searchBy: currentItem.id,
          fullType: "DET",
          perPage: -1,
          page: 1,
        },
        false,
        true,
      );
      if (response?.data?.success) {
        setCurrentItem(response.data.data[0] || currentItem);
      }

      const resolvedResponse = await executeRef.current(
        paymentsApi.resolvedPayment(currentItem.id),
        "GET",
        {},
        false,
        true,
      );
      if (resolvedResponse?.data?.success) {
        setResolvedPaymentId(resolvedResponse.data.data?.payment_id || null);
      }

      if (onReload) {
        onReload();
      }
    } catch (error) {
      handleShowToast("Error al actualizar los datos", "error");
    }
  };

  const handleClose = () => {
    onClose();
  };

  const getPaymentFormData = () => {
    const currentExtraData = data?.extraData || extraData;

    const calculatedTotalBalance =
      debtAmount + penaltyAmount + maintenanceAmount;
    const subcategoryId =
      debtDetail?.subcategory_id || debtDetail?.subcategory?.id;
    const categoryId =
      debtDetail?.subcategory?.padre?.id ||
      debtDetail?.subcategory?.category_id;
    let finalCategoryId = categoryId;
    if (!finalCategoryId && subcategoryId && currentExtraData?.categories) {
      const foundCategory = currentExtraData.categories.find((cat: any) =>
        cat.hijos?.some((hijo: any) => hijo.id === subcategoryId),
      );
      finalCategoryId = foundCategory?.id;
    }

    const isIndividualDebt = debtType === 0; // Tipo 0 = Deudas individuales
    const isExpensasDebt = debtType === 1; // Tipo 1 = Expensas
    const isReservationsDebt = debtType === 2 || debtType === 3; // Tipo 2 y 3 = Reservas
    const isSharedDebt = debtType === 4; // Tipo 4 = Deudas compartidas

    const isForgivenessDebt =
      debtDetail?.description?.toLowerCase().includes("condonación") ||
      debtDetail?.debt?.description?.toLowerCase().includes("condonación") ||
      debtDetail?.subcategory?.name?.toLowerCase().includes("condonación");

    const shouldLockFields =
      isIndividualDebt || isExpensasDebt || isReservationsDebt || isSharedDebt;

    let paymentType = "I";

    if (isForgivenessDebt) {
      paymentType = "F"; // Condonación
    } else if (isExpensasDebt) {
      paymentType = "E"; // Expensas
    } else if (isReservationsDebt) {
      paymentType = "R"; // Reservas
    } else if (isIndividualDebt || isSharedDebt) {
      paymentType = "O"; // Otras deudas
    }

    const titular = getTitular(debtDetail?.dpto);
    const owner_id = titular?.id;

    return {
      paid_at: new Date().toISOString().split("T")[0],
      dpto_id: debtDetail?.dpto?.nro,
      category_id: finalCategoryId,
      subcategory_id: subcategoryId,
      isCategoryLocked: shouldLockFields,
      isSubcategoryLocked: shouldLockFields,
      isAmountLocked: shouldLockFields,
      amount: calculatedTotalBalance,
      type: paymentType,
      debt_dpto_id: debtDetail?.id,
      concept: [
        debtDetail?.subcategory?.name || "Pago",
        `Pago de ${debtDetail?.subcategory?.name || "deuda"} - Unidad ${debtDetail?.dpto?.nro}`,
      ],
      owner: debtDetail?.dpto?.homeowner,
      owner_id: owner_id,
      status: "S",
    };
  };

  const debtAmount = parseFloat(debtDetail?.amount) || 0;
  const penaltyAmount = parseFloat(debtDetail?.penalty_amount) || 0;
  const maintenanceAmount = parseFloat(debtDetail?.maintenance_amount) || 0;
  const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;

  const finalStatus = resolveStatus(debtDetail?.status, debtDetail?.due_at);
  const statusText = getStatusText(finalStatus);
  const actions = getAvailableActions(debtDetail?.status, debtType);
  const detailButtonText = getDetailButtonText(debtType);
  const showDistribution = debtType === 4;
  const ownerDisplay = getFullName(debtDetail?.dpto?.homeowner) || "-/-";
  const tenantDisplay = getFullName(debtDetail?.dpto?.tenant) || "-/-";
  const holderDisplay =
    debtDetail?.dpto?.holder === "T" ? tenantDisplay : ownerDisplay;
  const unitDisplay =
    [debtDetail?.dpto?.nro, debtDetail?.dpto?.description]
      .filter(Boolean)
      .join(" - ") || "-/-";
  const categoryDisplay = debtDetail?.subcategory?.padre?.name || "-/-";
  const subcategoryDisplay = debtDetail?.subcategory?.name || "-/-";
  const conceptDisplay = getConceptText(debtDetail);
  const debtDescription =
    debtDetail?.debt?.description ||
    debtDetail?.description ||
    conceptDisplay ||
    "-/-";
  const startDateDisplay = formatToDayDDMMYYYY(
    debtDetail?.debt?.begin_at || debtDetail?.created_at,
  );
  const dueDateDisplay = formatToDayDDMMYYYY(
    debtDetail?.debt?.due_at || debtDetail?.due_at,
  );
  const paidAtDisplay = formatToDayDDMMYYYY(
    debtDetail?.payment?.paid_at || debtDetail?.paid_at,
  );
  const headerSubtitle =
    finalStatus === "P"
      ? `Pagada el ${formatToDayFdMYH(
          debtDetail?.payment?.paid_at || debtDetail?.paid_at,
          true,
          false,
          true,
        )}`
      : [
          conceptDisplay !== "-/-" ? conceptDisplay : null,
          dueDateDisplay !== "-/-" ? `Vence el ${dueDateDisplay}` : null,
        ]
          .filter(Boolean)
          .join(" · ");
  const showRegistrarPagoAction =
    actions.showRegistrarPago && debtDetail?.status !== "F";
  const showVerPagoAction = actions.showVerPago && resolvedPaymentId;
  const showRelatedDetailAction = Boolean(detailButtonText);
  const showEditAction =
    actions.showEditar && onEdit && !hideEditAndDeleteButtons;
  const showCancelAction =
    actions.showAnular && onDel && !hideEditAndDeleteButtons;
  const hasDebtActions =
    showRegistrarPagoAction ||
    showVerPagoAction ||
    showRelatedDetailAction;
  const debtActionButtons =
    !shouldShowLoading &&
    Object.keys(debtDetail).length > 0 &&
    hasDebtActions ? (
      <div
        className={`${paymentStyles.voucherButtonContainer} ${styles.actionsWrap}`}
      >
        {showRegistrarPagoAction && (
          <Button
            onClick={() => setShowPaymentForm(true)}
            className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
          >
            Registrar Pago
          </Button>
        )}
        {showVerPagoAction && (
          <Button
            onClick={() => setShowPaymentModal(true)}
            variant="secondary"
            className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
          >
            Ver pago
          </Button>
        )}
        {showRelatedDetailAction && (
          <Button
            onClick={() => handleDetailButtonClick(debtType)}
            variant="secondary"
            className={`${paymentStyles.voucherButton} ${styles.actionButtonStretch}`}
            disabled={!hasApiData}
          >
            {detailButtonText}
          </Button>
        )}
      </div>
    ) : null;

  const debtFields: FinancialDetailField[] = [
    { id: "unit", label: "Unidad", value: unitDisplay },
    { id: "homeowner", label: "Propietario", value: ownerDisplay },
    { id: "holder", label: "Titular", value: holderDisplay },
    { id: "category", label: "Categoría", value: categoryDisplay },
    { id: "subcategory", label: "Subcategoría", value: subcategoryDisplay },
    { id: "type", label: "Tipo", value: getDebtTypeText(debtType) },
    { id: "concept", label: "Concepto / período", value: conceptDisplay },
    { id: "start-date", label: "Fecha de inicio", value: startDateDisplay },
    { id: "due-date", label: "Vencimiento", value: dueDateDisplay },
    {
      id: "status",
      label: "Estado",
      value: statusText,
      tone:
        finalStatus === "P"
          ? "success"
          : finalStatus === "M" || finalStatus === "X"
            ? "danger"
            : "warning",
    },
    { id: "principal", label: "Deuda", value: formatBs(debtAmount) },
    { id: "penalty", label: "Multa", value: formatBs(penaltyAmount) },
    ...(hasMaintenanceValue(user)
      ? [
          {
            id: "maintenance",
            label: "Mantenimiento de valor",
            value: formatBs(maintenanceAmount),
          } satisfies FinancialDetailField,
        ]
      : []),
    {
      id: "total",
      label: finalStatus === "P" ? "Monto total" : "Saldo pendiente",
      value: formatBs(totalBalance),
    },
    ...(debtDetail?.status === "P"
      ? [
          {
            id: "payment-method",
            label: "Método de pago",
            value: getPaymentTypeText(debtDetail?.payment?.method) || "-/-",
          } satisfies FinancialDetailField,
          {
            id: "paid-at",
            label: "Fecha de pago",
            value: paidAtDisplay,
          } satisfies FinancialDetailField,
        ]
      : []),
    ...(showDistribution
      ? [
          {
            id: "distribution",
            label: "Distribución",
            value: debtDetail?.debt?.distribution || "Dividido por igual",
          } satisfies FinancialDetailField,
        ]
      : []),
  ];

  const customActions = [
    ...(showEditAction
      ? [
          {
            id: "edit-debt",
            label: "Editar deuda",
            icon: <PencilLine size={18} />,
            onSelect: () => onEdit?.(debtDetail),
          },
        ]
      : []),
    ...(showCancelAction
      ? [
          {
            id: "cancel-debt",
            label: "Anular deuda",
            icon: <Ban size={18} />,
            destructive: true,
            onSelect: () => onDel?.(debtDetail),
          },
        ]
      : []),
  ];

  const isChildModalOpen =
    showExpenseDetail ||
    showReservationDetail ||
    showPaymentModal ||
    showPaymentForm;

  return (
    <>
      <FinancialDetailModal
        open={open && !isChildModalOpen}
        onClose={handleClose}
        title="Detalle de deuda"
        description="Composición, vencimiento, cobros relacionados e historial de correcciones."
        record={{
          type: "debt",
          id: debtDetail?.id ?? item.id,
          penaltyAmount: penaltyAmount,
          paidAt: debtDetail?.paid_at,
        }}
        summary={{
          amount: formatBs(totalBalance),
          date: headerSubtitle || "-/-",
          eyebrow: finalStatus === "P" ? "Monto cobrado" : "Monto por cobrar",
          status: {
            label: statusText,
            tone:
              finalStatus === "P"
                ? "success"
                : finalStatus === "M" || finalStatus === "X"
                  ? "danger"
                  : "warning",
          },
        }}
        loading={shouldShowLoading || Object.keys(debtDetail).length === 0}
        customActions={customActions}
        onRecordChanged={reloadItem}
        footer={debtActionButtons}
      >
        <FinancialDetailSection title="Datos de la deuda">
          <FinancialDetailGrid fields={debtFields} />
        </FinancialDetailSection>

        <FinancialDetailSection title="Descripción">
          <FinancialDetailMessage>{debtDescription}</FinancialDetailMessage>
        </FinancialDetailSection>

        <DebtQrSection
          debtDptoId={debtDetail?.id ?? item?.id}
          onPaymentConfirmed={reloadItem}
        />
      </FinancialDetailModal>

      {/* Modales de detalle - solo para los que son modales */}
      {showExpenseDetail && (
        <ExpenseDetailModal
          open={showExpenseDetail}
          onClose={() => setShowExpenseDetail(false)}
          item={debtDetail}
          execute={execute}
        />
      )}

      {showReservationDetail && (
        <ReservationDetailModal
          open={showReservationDetail}
          onClose={() => setShowReservationDetail(false)}
          reservationId={debtDetail?.reservation?.id}
        />
      )}

      {/* Modal de Payment para ver pago existente */}
      {showPaymentModal && (
        <PaymentRenderView
          open={showPaymentModal}
          onClose={() => {
            reloadItem();
            setShowPaymentModal(false);
          }}
          payment_id={resolvedPaymentId as string | number}
          noWaiting={true}
        />
      )}

      {/* Formulario de Payment para registrar nuevo pago */}
      {showPaymentForm && (
        <PaymentRenderForm
          open={showPaymentForm}
          onClose={() => {
            reloadItem();
            setShowPaymentForm(false);
          }}
          item={getPaymentFormData()}
          extraData={data?.extraData || extraData}
          execute={execute as (...args: any[]) => Promise<any>}
          showToast={handleShowToast}
          reLoad={() => {
            reloadItem();
          }}
          debtId={item?.id}
        />
      )}
    </>
  );
};

export default RenderView;
