"use client";
import { useMemo, useEffect, useState } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "../../../shared/useCrudUtils";
import { getDateStrMesShort } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import PartialPaymentsRenderView from "@/modulos/PartialPayments/RenderView/RenderView";
import { IconCategories } from "@/components/layout/icons/IconsBiblioteca";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import RenderItem from "../../../shared/RenderItem";
import { useAuth } from "@/mk/contexts/AuthProvider";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { formatBs } from "@/mk/utils/numbers";
import {
  getStatusText as getStatusTextConst,
  getStatusConfig as getStatusConfigConst,
} from "../constants";
import {
  DEBT_TABLE_COLUMNS,
  getDebtCategoryLabel,
  getDebtConceptPeriodLabel,
  getDebtFinancialSummary,
  getDebtSubcategoryLabel,
  getDebtTypeLabel,
} from "./debtListPresentation";

interface AllDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
  onExtraDataChange?: (extraData: any) => void;
}

const AllDebts: React.FC<AllDebtsProps> = ({ onExtraDataChange }) => {
  const { setStore, user } = useAuth();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const renderUnitCell = ({ item }: { item: any }) => (
    <div>{item?.dpto?.nro || item?.dpto_id}</div>
  );

  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{getDebtCategoryLabel(item)}</div>
  );

  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{getDebtSubcategoryLabel(item)}</div>
  );

  const renderDebtTypeCell = ({ item }: { item: any }) => (
    <div>{getDebtTypeLabel(item)}</div>
  );

  const renderConceptPeriodCell = ({ item }: { item: any }) => (
    <div>{getDebtConceptPeriodLabel(item)}</div>
  );

  const renderStatusCell = ({ item }: { item: any }) => {
    let finalStatus = item?.status;
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const dueAtString = item?.due_at;
    if (dueAtString && dueAtString < todayString && item?.status === "A") {
      finalStatus = "M";
    }
    const statusText = getStatusTextConst(finalStatus);
    const { color, bgColor } = getStatusConfigConst(finalStatus, dueAtString);
    return (
      <StatusBadge color={color} backgroundColor={bgColor}>
        {statusText}
      </StatusBadge>
    );
  };

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-/-</div>;
    return <div>{getDateStrMesShort(item.due_at)}</div>;
  };

  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={getDebtFinancialSummary(item).debt} alignRight />
  );

  const renderPenaltyAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={getDebtFinancialSummary(item).penalty} alignRight />
  );

  const renderTotalAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={getDebtFinancialSummary(item).total} alignRight />
  );

  const renderPaidAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={getDebtFinancialSummary(item).paid} alignRight />
  );

  const renderRemainingAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={getDebtFinancialSummary(item).remaining} alignRight />
  );

  const getStatusOptions = () => [
    { id: "ALL", name: "Todos los estados" },
    { id: "A", name: "Por cobrar" },
    { id: "P", name: "Cobrada" },
    { id: "F", name: "Condonada" },
    { id: "S", name: "Por confirmar" },
    { id: "M", name: "En mora" },
    { id: "C", name: "Cancelada" },
    { id: "X", name: "Anulada" },
  ];

  const getDebtTypeOptions = () => [
    { id: "ALL", name: "Todas las deudas" },
    { id: "0", name: "Individual" },
    { id: "1", name: "Expensas" },
    { id: "2", name: "Reservas" },
    { id: "3", name: "Cancelación" },
    { id: "4", name: "Compartida" },
    { id: "5", name: "Condonación" },
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

  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: 20,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      unit: {
        rules: [""],
        api: "",
        label: DEBT_TABLE_COLUMNS.unit.label,
        list: {
          onRender: renderUnitCell,
          order: DEBT_TABLE_COLUMNS.unit.order,
        },
      },
      type: {
        rules: [""],
        api: "",
        label: DEBT_TABLE_COLUMNS.type.label,
        list: {
          onRender: renderDebtTypeCell,
          order: DEBT_TABLE_COLUMNS.type.order,
        },
        filter: {
          key: "type",
          label: "Tipo",
          width: "100%",
          options: getDebtTypeOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      category_id: {
        rules: [""],
        api: "",
        label: DEBT_TABLE_COLUMNS.category.label,
        list: {
          onRender: renderCategoryCell,
          order: DEBT_TABLE_COLUMNS.category.order,
        },
        filter: {
          label: "Categoría",
          width: "100%",
          options: getCategoryOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      subcategory_id: {
        rules: [""],
        api: "",
        label: DEBT_TABLE_COLUMNS.subcategory.label,
        list: {
          onRender: renderSubcategoryCell,
          order: DEBT_TABLE_COLUMNS.subcategory.order,
        },
        filter: {
          label: "Subcategoría",
          width: "100%",
          options: getSubcategoryOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      concept_period: {
        rules: [""],
        api: "",
        label: DEBT_TABLE_COLUMNS.conceptPeriod.label,
        list: {
          onRender: renderConceptPeriodCell,
          order: DEBT_TABLE_COLUMNS.conceptPeriod.order,
        },
      },
      status: {
        rules: [""],
        api: "",
        label: (
          <span
            style={{ display: "block", textAlign: "center", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.status.label}
          </span>
        ),
        list: {
          onRender: renderStatusCell,
          order: DEBT_TABLE_COLUMNS.status.order,
        },
        filter: {
          key: "status",
          label: "Estado",
          width: "100%",
          options: getStatusOptions,
          optionLabel: "name",
          optionValue: "id",
        },
      },
      due_at: {
        rules: [""],
        api: "",
        label: DEBT_TABLE_COLUMNS.dueAt.label,
        list: {
          onRender: renderDueDateCell,
          order: DEBT_TABLE_COLUMNS.dueAt.order,
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
      amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.debt.label}
          </label>
        ),
        list: {
          onRender: renderDebtAmountCell,
          order: DEBT_TABLE_COLUMNS.debt.order,
        },
      },
      penalty_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.penalty.label}
          </label>
        ),
        list: {
          onRender: renderPenaltyAmountCell,
          order: DEBT_TABLE_COLUMNS.penalty.order,
        },
      },
      total_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.total.label}
          </label>
        ),
        list: {
          onRender: renderTotalAmountCell,
          order: DEBT_TABLE_COLUMNS.total.order,
        },
      },
      paid_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.paid.label}
          </label>
        ),
        list: {
          onRender: renderPaidAmountCell,
          order: DEBT_TABLE_COLUMNS.paid.order,
        },
      },
      remaining_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.remaining.label}
          </label>
        ),
        list: {
          onRender: renderRemainingAmountCell,
          order: DEBT_TABLE_COLUMNS.remaining.order,
        },
      },
    };
  }, []);

  const mod: ModCrudType = {
    modulo: "debt-dptos",
    singular: "Deuda",
    plural: "",
    export: false,
    filter: true,
    permiso: "expense",
    extraData: true,
    sumarize: false,
    hideActions: {
      add: true,
      view: false,
      edit: true,
      del: true,
    },
    renderView: (props: any) => {
      if (props.item?.status === "I") {
        return (
          <PartialPaymentsRenderView
            open={props.open}
            onClose={props.onClose}
            item={props.item}
            extraData={props.extraData}
            user={user}
            onEdit={props.onEdit}
            onDel={props.onDel}
            execute={props.execute}
            reLoad={props.reLoad}
            showToast={props.showToast}
          />
        );
      }
      return (
        <RenderView
          open={props.open}
          onClose={props.onClose}
          item={props.item}
          extraData={props.extraData}
          user={user}
          onEdit={props.onEdit}
          onDel={props.onDel}
        />
      );
    },
    renderForm: (props: any) => (
      <RenderForm
        open={props.open}
        onClose={props.onClose}
        item={props.item}
        setItem={props.setItem}
        execute={props.execute}
        extraData={props.extraData}
        user={user}
        reLoad={props.reLoad}
        errors={props.errors}
        setErrors={props.setErrors}
        onSave={props.onSave}
        action={props.action}
      />
    ),
  };

  const { List, onEdit, onDel, onView, extraData, onFilter } = useCrud(
    {
      paramsInitial,
      mod,
      fields,
      getFilter: handleGetFilter,
    },
  );

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
    const getStatusText = (status: string) => {
      return getStatusTextConst(status);
    };

    let finalStatus = item?.status;

    // Obtener fecha actual solo como string YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    const dueAtString = item?.due_at;
    if (dueAtString && dueAtString < todayString && item?.status === "A") {
      finalStatus = "M";
    }

    const { debt: debtAmount, penalty: penaltyAmount, total: totalBalance } =
      getDebtFinancialSummary(item);

    return (
      <RenderItem
        item={item}
        onClick={() => onView(item)}
        onLongPress={onLongPress}
      >
        <ItemList
          title={`Unidad ${item?.dpto?.nro || item?.dpto_id} - ${getStatusText(finalStatus)}`}
          subtitle={`Deuda: ${formatBs(debtAmount)} | Multa: ${formatBs(penaltyAmount)} | Total: ${formatBs(totalBalance)}`}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  const onClickDetail = (row: any) => {
    onView(row);
  };

  return (
    <>
      <List
        height={"100%"}
        onTabletRow={renderItem}
        onRowClick={onClickDetail}
        emptyMsg="Lista de todas las deudas vacía. Una vez generes las cuotas"
        emptyLine2="de los residentes las verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={2500}
        sumarize={false}
      />
      {openCustomFilter && (
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
              err.startDate =
                "La fecha de inicio no puede ser mayor a la de fin";
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
      )}
    </>
  );
};

export default AllDebts;
