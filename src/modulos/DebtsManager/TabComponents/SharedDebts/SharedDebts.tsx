"use client";
import React, { useMemo, useEffect, useState } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "../../../shared/useCrudUtils";
import { getDateStrMesShort } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";
import { IconCategories } from "@/components/layout/icons/IconsBiblioteca";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import RenderItem from "../../../shared/RenderItem";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Button from "@/mk/components/forms/Button/Button";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { formatNumber } from "@/mk/utils/numbers";
import { useRouter } from "next/navigation";
import { hasMaintenanceValue } from "@/mk/utils/utils";
import { DebtStatus } from "@/types/PaymentType";
import {
  getStatusText,
  getStatusConfig,
  STATUS_FILTER_OPTIONS,
} from "../constants";

interface SharedDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
  onExtraDataChange?: (extraData: any) => void;
}

const SharedDebts: React.FC<SharedDebtsProps> = ({ onExtraDataChange }) => {
  const { user, setStore, store } = useAuth();
  const router = useRouter();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const renderConceptCell = ({ item }: { item: any }) => (
    <div>{item?.description || "Sin descripción"}</div>
  );

  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.name || "-/-"}</div>
  );

  const renderDistributionCell = ({ item }: { item: any }) => {
    const getDistributionText = (amountType: string) => {
      const distributionMap: { [key: string]: string } = {
        M: "Por m²",
        P: "Promedio",
        F: "Fijo",
        V: "Variable",
        A: "Promedio",
      };
      return distributionMap[amountType] || "-/-";
    };

    return <div>{getDistributionText(item?.amount_type)}</div>;
  };

  const renderStatusCell = ({ item }: { item: any }) => {
    const rawStatus = Number(item?.status);
    const numericStatus = Number.isFinite(rawStatus) && rawStatus > 0 ? rawStatus : DebtStatus.PENDING;
    const dueAtString = item?.due_at;
    // getStatusConfig applies the overdue rule internally
    const { color, bgColor } = getStatusConfig(numericStatus, dueAtString);
    const statusText = getStatusText(numericStatus);

    return (
      <StatusBadge color={color} backgroundColor={bgColor}>
        {statusText}
      </StatusBadge>
    );
  };
  const renderMaintenanceAmountCell = ({ item }: { item: any }) => {
    const raw = item?.maintenance_amount;

    const hasValue =
      raw !== null &&
      raw !== undefined &&
      String(raw).trim() !== "" &&
      !isNaN(Number(raw));

    if (!hasValue)
      return (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
          }}
        >
          -/-
        </div>
      );

    return <FormatBsAlign value={parseFloat(raw)} alignRight />;
  };

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-/-</div>;
    return <div>{getDateStrMesShort(item.due_at)}</div>;
  };

  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  const renderPenaltyAmountCell = ({ item }: { item: any }) => {
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;

    return <FormatBsAlign value={totalPenalty} alignRight />;
  };

  const renderBalanceDueCell = ({ item }: { item: any }) => {
    const debtAmount = parseFloat(item?.amount) || 0;
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;
    const totalBalance = debtAmount + totalPenalty;

    return <FormatBsAlign value={totalBalance} alignRight />;
  };

  const getStatusOptions = () => [
    { id: "ALL", name: "Todos los estados" },
    ...STATUS_FILTER_OPTIONS,
  ];

  const getDistributionOptions = () => [
    { id: "ALL", name: "Todas los tipos" },
    { id: "F", name: "Fijo" },
    { id: "V", name: "Variable" },
    { id: "P", name: "Porcentual" },
    { id: "M", name: "Por m²" },
    { id: "A", name: "Promedio" },
  ];

  const getCategoryOptions = (extraData?: any) => {
    const options = [{ id: "ALL", name: "Todas las categorías" }];

    if (extraData?.categories && Array.isArray(extraData.categories)) {
      extraData.categories.forEach((category: any) => {
        options.push({
          id: category.id.toString(),
          name: category.name,
        });
      });
    }

    return options;
  };

  const getSubcategoryOptions = (extraData?: any) => {
    const options = [{ id: "ALL", name: "Todas las subcategorías" }];

    if (extraData?.categories && Array.isArray(extraData.categories)) {
      extraData.categories.forEach((category: any) => {
        if (category.hijos && Array.isArray(category.hijos)) {
          category.hijos.forEach((subcategory: any) => {
            options.push({
              id: subcategory.id.toString(),
              name: subcategory.name,
            });
          });
        }
      });
    }

    return options;
  };

  const getPeriodOptions = () => [
    { id: "ALL", name: "Todos los periodos" },
    { id: "d", name: "Hoy" },
    { id: "ld", name: "Ayer" },
    { id: "w", name: "Esta semana" },
    { id: "lw", name: "Semana anterior" },
    { id: "m", name: "Este mes" },
    { id: "lm", name: "Mes anterior" },
    { id: "y", name: "Este año" },
    { id: "ly", name: "Año anterior" },
    { id: "custom", name: "Personalizado" },
  ];

  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "due_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const renderTotalWithGreenBorder = (value: number, isHighlighted = false) => (
    <div
      style={{
        fontWeight: "bold",
        fontSize: "14px",
        color: isHighlighted ? "#10b981" : "var(--cWhite)",
        textAlign: "right",
        backgroundColor: isHighlighted
          ? "rgba(16, 185, 129, 0.1)"
          : "var(--cBlackV2)",
        padding: "8px 12px",
        borderRadius: "6px",
        border: "2px solid #10b981",
        minWidth: "80px",
        margin: "4px 0",
      }}
    >
      Bs {formatNumber(value || 0, 2)}
    </div>
  );

  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: 20,
    type: 4,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      begin_at: { rules: ["required"], api: "ae", label: "Fecha de inicio" },
      type: { rules: [], api: "ae", label: "Tipo" },
      description: { rules: [], api: "ae", label: "Descripción" },
      category_id: {
        rules: ["required"],
        api: "ae",
        label: "Categoría",
        filter: {
          label: "Categoría",
          width: "100%",
          options: getCategoryOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      subcategory_id: {
        rules: ["required"],
        api: "ae",
        label: "Subcategoría",
        filter: {
          label: "Subcategoría",
          width: "100%",
          options: getSubcategoryOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      asignar: { rules: ["required"], api: "ae", label: "Asignación" },
      dpto_id: { rules: [], api: "ae", label: "Departamentos" },
      amount_type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo de monto",
        filter: {
          key: "amount_type",
          label: "Tipo",
          width: "100%",
          options: getDistributionOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      amount: { rules: ["required"], api: "ae", label: "Monto" },
      is_advance: { rules: [], api: "ae", label: "Es adelanto" },
      interest: { rules: [], api: "ae", label: "Interés" },
      has_mv: { rules: [], api: "ae", label: "Tiene Mant. Valor" },
      is_forgivable: { rules: [], api: "ae", label: "Es condonable" },
      has_pp: { rules: [], api: "ae", label: "Tiene plan de pago" },
      is_blocking: { rules: [], api: "ae", label: "Es bloqueante" },

      concept: {
        rules: [""],
        api: "",
        label: "Concepto",
        list: {
          onRender: renderConceptCell,
          order: 1,
        },
      },
      category: {
        rules: [""],
        api: "",
        label: "Categoría",
        list: false,
      },
      subcategory: {
        rules: [""],
        api: "",
        label: "Subcategoría",
        list: {
          onRender: renderSubcategoryCell,
          order: 3,
        },
      },
      distribution: {
        rules: [""],
        api: "",
        label: "Distribución",
        list: {
          onRender: renderDistributionCell,
          order: 4,
        },
      },
      status: {
        rules: [""],
        api: "",
        label: (
          <span
            style={{ display: "block", textAlign: "center", width: "100%" }}
          >
            Estado
          </span>
        ),
        list: {
          onRender: renderStatusCell,
          order: 5,
        },
      },
      status_filter: {
        rules: [""],
        api: "",
        label: "Estado",
        list: false,
        filter: {
          order: 1,
          key: "status",
          label: "Estado",
          width: "100%",
          options: getStatusOptions,
        },
      },
      due_at: {
        rules: ["required"],
        api: "ae",
        label: "Vencimiento",
        list: {
          onRender: renderDueDateCell,
          order: 6,
        },
        filter: {
          key: "due_at",
          label: "Periodo",
          width: "100%",
          options: getPeriodOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      debt_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Deuda
          </label>
        ),
        list: {
          onRender: renderDebtAmountCell,
          order: 7,
          sumarize: true,
          onRenderFoot: (item: any, index: number, sumas: any) =>
            renderTotalWithGreenBorder(sumas[item.key]),
        },
      },
      penalty_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Multa
          </label>
        ),
        list: {
          onRender: renderPenaltyAmountCell,
          order: 8,
          sumarize: true,
          onRenderFoot: (item: any, index: number, sumas: any) =>
            renderTotalWithGreenBorder(sumas[item.key]),
        },
      },
      maintenance_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Mant. Valor
          </label>
        ),
        list: hasMaintenanceValue(user)
          ? {
              order: 9,
              onRender: renderMaintenanceAmountCell,
            }
          : false,
      },
      balance_due: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            Monto total
          </label>
        ),
        list: {
          onRender: renderBalanceDueCell,
          order: 9,
          sumarize: false,
          onRenderFoot: (item: any, index: number, sumas: any) => {
            const totalBalance =
              (sumas.debt_amount || 0) + (sumas.penalty_amount || 0);
            return renderTotalWithGreenBorder(totalBalance, true);
          },
        },
      },
    };
  }, []);

  const mod: ModCrudType = {
    modulo: "debt-groups",
    singular: "Deuda Compartida",
    plural: "",
    // S48: kill legacy IconExport (D-38-5 pattern) + slot async pineado.
    // - export: false → kill legacy GET /api/v3/debt-groups?_export=pdf.
    // - exportAsync: {...} → slot async que useCrud auto-renderea via
    //   AsyncExportButton (S36.5 pattern, idéntico a S41 BankAccounts,
    //   S43 Outlays, S45 Areas, S47.5 DebtDpto).
    // - type: "debt-groups" → matchea el DebtGroupReportType pineado en
    //   S48-T01 backend (PR #133, ReportTypeRegistry.auto-discovery,
    //   12 tipos).
    // - extraParams.type: undefined → branch EXPENSE del ReportType
    //   (7 cols agregado por debt_id/year/month). Si el usuario pinea
    //   type=4 (SHARED), el branch cambia automáticamente (S48-T01
    //   detectBranch).
    // - format: "pdf" (S48-T01 pineá PDF only, no XLSX — D-48-3).
    export: false,
    exportAsync: {
      type: "debt-groups",
      format: "pdf",
      label: "Exportar PDF",
    },
    filter: true,
    permiso: "expense",
    extraData: true,
    sumarize: false,
    hideActions: {
      view: true,
      edit: true,
      del: true,
    },
    titleAdd: "Crear",
    renderForm: (props: any) => <RenderForm {...props} />,
  };

  const goToCategories = (type = "") => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push("/categories");
    }
  };

  const extraButtons = [
    <Button
      key="categories-button"
      variant="secondary"
      onClick={() => goToCategories("D")}
      style={{
        padding: "8px 16px",
        width: "auto",
        height: 48,
        display: "flex",
        alignItems: "center",
      }}
    >
      Categorías
    </Button>,
  ];

  const {
    userCan,
    List,
    onEdit,
    onDel,
    extraData,
    onFilter,
    execute,
    reLoad,
    showToast,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
    getFilter: handleGetFilter,
  });

  useEffect(() => {
    if (extraData && onExtraDataChange) {
      onExtraDataChange(extraData);
    }
  }, [extraData, onExtraDataChange]);

  const { onLongPress, selItem } = useCrudUtils({
    onSearch: () => {},
    searchs: {},
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const renderItem = (item: Record<string, any>) => {
    const rawStatus = Number(item?.status);
    const numericStatus = Number.isFinite(rawStatus) && rawStatus > 0 ? rawStatus : DebtStatus.PENDING;
    const dueAtString = item?.due_at;
    const todayString = new Date().toISOString().split("T")[0];
    const displayStatus = dueAtString && dueAtString < todayString && numericStatus === DebtStatus.PENDING
      ? DebtStatus.OVERDUE
      : numericStatus;

    const debtAmount = parseFloat(item?.amount) || 0;
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;
    const totalBalance = debtAmount + totalPenalty;

    return (
      <RenderItem item={item} onClick={() => {}} onLongPress={onLongPress}>
        <ItemList
          title={`${item?.description || "Sin concepto"} - ${getStatusText(displayStatus)}`}
          subtitle={`Deuda: Bs ${debtAmount.toFixed(
            2,
          )} | Multa: Bs ${totalPenalty.toFixed(
            2,
          )} | Total: Bs ${totalBalance.toFixed(2)}`}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  const onClickDetail = (row: any) => {
    if (row?.id) {
      router.push(`/debts_manager/shared-debt-detail/${row.id}`);
    }
  };

  return (
    <>
      <List
        height={"100%"}
        onTabletRow={renderItem}
        onRowClick={onClickDetail}
        emptyMsg="Lista de deudas grupales vacía. Una vez generes las cuotas"
        emptyLine2="grupales las verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={2500}
        sumarize={false}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
          if (!endDate) err.endDate = "La fecha de fin es obligatoria";
          if (startDate && endDate && startDate > endDate)
            err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
          if (
            startDate &&
            endDate &&
            startDate.slice(0, 4) !== endDate.slice(0, 4)
          ) {
            err.startDate =
              "El periodo personalizado debe estar dentro del mismo año";
            err.endDate =
              "El periodo personalizado debe estar dentro del mismo año";
          }
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          const customDateFilterString = `${startDate},${endDate}`;
          onFilter("due_at", customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </>
  );
};

export default SharedDebts;
