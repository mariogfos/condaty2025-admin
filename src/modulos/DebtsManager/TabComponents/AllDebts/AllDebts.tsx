"use client";
import { useMemo, useEffect, useState } from "react";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "../../../shared/useCrudUtils";
import { getDateStrMesShort, getNow } from "@/mk/utils/date";
// 🔴 CDT-52: el RenderForm propio de esta pestaña pegaba a
// `PUT /debt-groups/{id}`, ruta que CDT-50 retiró (en `debt-groups` sólo
// quedan `POST ''` y `GET ''`). Se borró. Lo único que "Todas" edita es la
// deuda individual —`getAvailableActions` sólo ofrece Editar para `DebtType.NORMAL`—
// y esa es exactamente la que edita el formulario de Individuales, contra
// `PUT /v3/debt-dptos/{id}`.
import RenderForm from "../IndividualDebts/RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import { IconCategories } from "@/components/layout/icons/IconsBiblioteca";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { hasMaintenanceValue } from "@/mk/utils/utils";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { DebtStatus } from "@/types/PaymentType";
import {
  getStatusText as getStatusTextConst,
  getStatusConfig as getStatusConfigConst,
} from "../constants";
import {
  DEBT_TABLE_COLUMNS,
  getDebtAmounts,
  getDebtCategoryLabel,
  getDebtConceptPeriodLabel,
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
  const { setStore, store, user } = useAuth();
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
    const rawStatus = Number(item?.status);
    const numericStatus = Number.isFinite(rawStatus) && rawStatus > 0 ? rawStatus : DebtStatus.PENDING;
    const dueAtString = item?.due_at;
    // getStatusConfig applies the overdue rule internally
    const { color, bgColor } = getStatusConfigConst(numericStatus, dueAtString);
    const statusText = getStatusTextConst(numericStatus);
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

  // 🔴 Todas las celdas de plata salen de UNA cuenta (`getDebtAmounts`), y el
  // mantenimiento entra sólo si el condominio lo habilita: si no, ni se
  // muestra ni se suma. Lo pagado y el saldo los calcula el API.
  const renderMoneyCell =
    (key: "debt" | "penalty" | "maintenance" | "total" | "paid" | "balance") =>
    ({ item }: { item: any }) => {
      const value = getDebtAmounts(item, hasMaintenanceValue(user))[key];
      if (value === null)
        return <div style={{ width: "100%", textAlign: "center" }}>-/-</div>;
      return <FormatBsAlign value={value} alignRight />;
    };

  const getStatusOptions = () => [
    { id: "ALL", name: "Todos los estados" },
    { id: DebtStatus.PENDING,   name: "Por cobrar" },
    { id: DebtStatus.PAID,      name: "Cobrada" },
    { id: DebtStatus.FORGIVEN,  name: "Condonada" },
    { id: DebtStatus.SUBMITTED, name: "Por confirmar" },
    { id: DebtStatus.OVERDUE,   name: "En mora" },
    { id: DebtStatus.CANCELLED, name: "Anulada" },
    { id: DebtStatus.PARTIAL,   name: "Pago parcial" },
    { id: DebtStatus.AWAITING_VOUCHER, name: "Por subir comprobante" },
    { id: DebtStatus.REJECTED,  name: "Rechazado" },
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
    const showMaintenance = hasMaintenanceValue(user);

    return {
      id: { rules: [], api: "e" },
      // 🔴 Las llaves que viajan en el `PUT` las elige `getParamFields` mirando
      // el `api` de CADA campo: lo que no está declarado acá no sale, aunque el
      // formulario lo tenga cargado. Sin estas ocho, "Editar" desde el detalle
      // mandaba un `PUT` con el `id` y nada más. Son las mismas de Individuales
      // —es el mismo formulario y el mismo endpoint—; van con `api: "e"` porque
      // en esta pestaña el alta está oculta (`hideActions.add`).
      begin_at: { rules: ["required"], api: "e", label: "Fecha de inicio" },
      description: { rules: [], api: "e", label: "Descripción" },
      dpto_id: { rules: ["required"], api: "e", label: "Unidad" },
      interest: { rules: [], api: "e", label: "Interés" },
      has_mv: { rules: [], api: "e", label: "Tiene Mant. Valor" },
      is_forgivable: { rules: [], api: "e", label: "Es condonable" },
      has_pp: { rules: [], api: "e", label: "Tiene plan de pago" },
      is_blocking: { rules: [], api: "e", label: "Es bloqueante" },
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
        rules: [],
        api: "e",
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
        rules: ["required"],
        api: "e",
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
        rules: ["required"],
        api: "e",
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
        rules: ["required"],
        api: "e",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.debt.label}
          </label>
        ),
        list: {
          onRender: renderMoneyCell("debt"),
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
          onRender: renderMoneyCell("penalty"),
          order: DEBT_TABLE_COLUMNS.penalty.order,
        },
      },
      maintenance_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.maintenance.label}
          </label>
        ),
        list: showMaintenance
          ? {
              onRender: renderMoneyCell("maintenance"),
              order: DEBT_TABLE_COLUMNS.maintenance.order,
            }
          : false,
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
          onRender: renderMoneyCell("total"),
          order: DEBT_TABLE_COLUMNS.total.order,
        },
      },
      confirmed_paid_amount: {
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
          onRender: renderMoneyCell("paid"),
          order: DEBT_TABLE_COLUMNS.paid.order,
        },
      },
      total_remaining_amount: {
        rules: [""],
        api: "",
        label: (
          <label
            style={{ display: "block", textAlign: "right", width: "100%" }}
          >
            {DEBT_TABLE_COLUMNS.balance.label}
          </label>
        ),
        list: {
          onRender: renderMoneyCell("balance"),
          order: DEBT_TABLE_COLUMNS.balance.order,
        },
      },
    };
  }, []);

  const mod: ModCrudType = {
    modulo: "v3/debt-dptos",
    singular: "Deuda",
    plural: "",
    // 🔴 `endpoint` y `supportedFormats` viajan juntos: `useCrud` elige el
    // botón mirando `supportedFormats`, y el botón viejo no recibe `endpoint`.
    // Sin los dos quedaba el par legacy —"Exportar PDF" + "Historial"— que
    // Mario ya rechazó en Expensas.
    //
    // Con ellos el pedido va por `GET /v3/debt-dptos?_export={formato}` y lo
    // atiende `DeudasExportConfig`, que declara sus PROPIAS columnas: el
    // reporte viejo imprimía seis y se comía Deuda, Multa y Mant. Valor.
    // Trae «Deuda total», «Monto pagado» y «Saldo restante» como la tabla; lo
    // único que la tabla tiene y el export no es «Concepto/Periodo».
    export: false,
    exportAsync: {
      type: "debt_dptos",
      format: "pdf",
      label: "Exportar",
      supportedFormats: ["pdf", "xlsx", "csv"],
      endpoint: "/v3/debt-dptos",
    },
    filter: true,
    permiso: "expense",
    extraData: true,
    sumarize: false,
    // 🔴 CDT-52, decisión de producto: en "Todas" el lápiz y el tacho de la
    // fila NO van. Acá conviven deudas de los seis tipos y la regla de quién se
    // edita vive en UN solo lado —el back, `DebtDptoController::beforeUpdate` y
    // `beforeDelete`—; una segunda copia en el front es lo que se desincroniza.
    // La acción alcanzable es el detalle: `view: false` deja que el click de
    // fila caiga en `onView`, y adentro del modal están Editar y Anular con la
    // regla de `getAvailableActions`.
    //
    // ⚠️ `edit` y `del` en true son los que hacen que `useCrud` mande
    // `onButtonActions: undefined` y la tabla ni monte la columna de acciones.
    // Sacarlos repone la columna.
    hideActions: {
      add: true,
      view: false,
      edit: true,
      del: true,
    },
    renderView: (props: any) => (
      <RenderView
        open={props.open}
        onClose={props.onClose}
        item={props.item}
        extraData={props.extraData}
        user={user}
        onEdit={props.onEdit}
        onDel={props.onDel}
      />
    ),
    renderForm: (props: any) => <RenderForm {...props} />,
  };

  const {
    userCan,
    List,
    onEdit,
    onDel,
    onView,
    onSearch,
    searchs,
    extraData,
    onFilter,
    reLoad,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });

  useEffect(() => {
    if (extraData && onExtraDataChange) {
      onExtraDataChange(extraData);
    }
  }, [extraData, onExtraDataChange]);

  // 🔴 CDT-52: `onSearch` y `searchs` alimentan la lupa del header
  // (`Layout` → `Header`). Con el no-op de antes, escribir ahí no mandaba nada
  // al servidor: la lupa se abría, aceptaba texto y no pasaba nada.
  useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  return (
    <>
      {/* 🔴 Sin `onRowClick`: `useCrud` le gana a `runtime.onView` con
          cualquier `props.onRowClick`, y el que había era un no-op. Ahora el
          click de fila abre el detalle. */}
      <List
        height={"100%"}
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
