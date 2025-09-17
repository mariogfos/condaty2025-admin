"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./DebtsManagerDetailView.module.css";
import { useMemo, useState, useEffect } from "react";
import { getDateStrMes, MONTHS } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import {
  IconArrowLeft,
  IconHandcoin,
  IconMonedas,
  IconMultas,
  IconUnidades,
  IconWallet,
} from '@/components/layout/icons/IconsBiblioteca';
import RenderView from './RenderView/RenderView';
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';
import { WidgetDashCard } from '@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';

// Datos mockeados para el detalle
const mockDetailData = {
  data: [
    {
      id: 1,
      unit: "2-B",
      description: "Monto fijo por unidad",
      subcategory: "Daños y perjuicios",
      dueDate: "2025-04-18",
      debt: 500.00,
      penalty: 50.00,
      totalAmount: 550.00,
      status: "M", // En mora
      dpto: { nro: "2-B", description: "Apartamento 2-B" },

      amount: 500.00,
      penalty_amount: 50.00
    },
    {
      id: 2,
      unit: "3-B",
      description: "Dividido por igual",
      subcategory: "Servicios básicos",
      dueDate: "2025-04-18",
      debt: 100.00,
      penalty: 0.00,
      totalAmount: 100.00,
      status: "P", // Por cobrar
      dpto: { nro: "3-B", description: "Apartamento 3-B" },

      amount: 100.00,
      penalty_amount: 0.00
    },
    {
      id: 3,
      unit: "4-B",
      description: "Dividido por igual",
      subcategory: "Servicios básicos",
      dueDate: "2025-04-18",
      debt: 80.00,
      penalty: 0.00,
      totalAmount: 30.00,
      status: "PP", // Parcialmente pagado
      dpto: { nro: "4-B", description: "Apartamento 4-B" },

      amount: 80.00,
      penalty_amount: 0.00
    },
    {
      id: 4,
      unit: "5-B",
      description: "Monto fijo por unidad",
      subcategory: "Daños y perjuicios",
      dueDate: "2025-04-18",
      debt: 1800.00,
      penalty: 0.00,
      totalAmount: 0.00,
      status: "C", // Cobrado
      dpto: { nro: "5-B", description: "Apartamento 5-B" },

      amount: 1800.00,
      penalty_amount: 0.00
    },
    {
      id: 5,
      unit: "6-B",
      description: "Monto fijo por unidad",
      subcategory: "Daños y perjuicios",
      dueDate: "2025-04-18",
      debt: 500.00,
      penalty: 0.00,
      totalAmount: 0.00,
      status: "C", // Cobrado
      dpto: { nro: "6-B", description: "Apartamento 6-B" },

      amount: 500.00,
      penalty_amount: 0.00
    }
  ],
  total: 5,
  message: { total: 5 },
  extraData: {
    totalDebts: 6,
    totalRegisteredAmount: 6490.00,
    paidDebts: 2550.00,
    overdueDebts: 580.00,
    currentDebts: 1210.00,
    delinquentDebts: 550.00,
    partiallyPaid: 1110.00
  }
};

const renderUnitCell = ({ item }: { item: any }) => (
  <div>{item?.unit || item?.dpto?.nro}</div>
);

const renderDescriptionCell = ({ item }: { item: any }) => (
  <div>{item?.description}</div>
);

const renderSubcategoryCell = ({ item }: { item: any }) => (
  <div>{item?.subcategory}</div>
);

const renderDueDateCell = ({ item }: { item: any }) => (
  <div>{getDateStrMes(item?.due_at || item?.due_at) || '-/-'}</div>
);

const renderDebtCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={item?.debt || item?.amount || 0} alignRight />
);

const renderPenaltyCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={item?.penalty || item?.penalty_amount || 0} alignRight />
);

const renderTotalAmountCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={item?.totalAmount || (item?.debt + item?.penalty) || 0} alignRight />
);

const renderStatusCell = ({ item }: { item: any }, getDisplayStatus: Function) => {
  const statusConfig: { [key: string]: { color: string; bgColor: string } } = {
    M: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' }, // En mora
    P: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' }, // Por cobrar
    C: { color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' }, // Cobrado
    PP: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl4)' }, // Parcialmente pagado
  };

  const displayStatus = getDisplayStatus(item);
  const { color, bgColor } = statusConfig[displayStatus.code] || statusConfig.P;

  return (
    <StatusBadge
      color={color}
      backgroundColor={bgColor}
    >
      {displayStatus.text}
    </StatusBadge>
  );
};

const DebtsManagerDetail = ({ data, setOpenDetail }: any) => {
  const [statsData, setStatsData] = useState({
    totalDebts: 6,
    totalRegisteredAmount: 6490.00,
    paidDebts: 2550.00,
    overdueDebts: 580.00,
    currentDebts: 1210.00,
    delinquentDebts: 550.00,
    partiallyPaid: 1110.00,
  });
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const getDisplayStatus = (item: any) => {
    switch (item.status) {
      case 'M':
        return { text: 'En mora', code: 'M' };
      case 'P':
        return { text: 'Por cobrar', code: 'P' };
      case 'C':
        return { text: 'Cobrado', code: 'C' };
      case 'PP':
        return { text: 'Parcialmente pagado', code: 'PP' };
      default:
        return { text: item.status || "Desconocido", code: item.status || "" };
    }
  };

  const getPeriodOptions = () => [
    { id: "ALL", name: "Todos" },
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

    if (opt === "paid_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "ALL") {
      currentFilters[opt] = "ALL";
    } else if (!value) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const mod: ModCrudType = {
    modulo: "debt-dptos",
    singular: "",
    plural: "",
    filter: true,
    export: true,
    permiso: "expenses",
    hideActions: {
      add: true,
      edit: true,
      del: true,
    },
    loadView: {},
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      execute: Function;
      reLoad: Function;
    }) => {
      const handleClose = () => {
        props.reLoad(null, mod?.noWaiting);
        props.onClose();
      };
      return <RenderView {...props} onClose={handleClose} />;
    },
    extraData: true,
    noWaiting: true, // Para usar datos mockeados
  };

  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: 20,
    debt_id: data.id,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      unit: {
        rules: [""],
        api: "",
        label: "Unidad",
        list: {
          onRender: renderUnitCell,
          order: 1,
        },
      },
      description: {
        rules: [""],
        api: "",
        label: "Descripción",
        list: {
          onRender: renderDescriptionCell,
          order: 2,
        },
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
      dueDate: {
        rules: [""],
        api: "",
        label: "Vencimiento",
        list: {
          onRender: renderDueDateCell,
          order: 4,
        },
        filter: {
          key: "paid_at",
          label: "Periodo",
          options: getPeriodOptions,
        },
      },
      debt: {
        rules: ["required"],
        api: "e",
        label: (
          <span style={{ display: "block", textAlign: "right", width: "100%" }}>
            Deuda
          </span>
        ),
        list: {
          onRender: renderDebtCell,
          order: 5,
        },
      },
      penalty: {
        rules: [""],
        api: "",
        label: (
          <span style={{ display: "block", textAlign: "right", width: "100%" }}>
            Multa
          </span>
        ),
        list: {
          onRender: renderPenaltyCell,
          order: 6,
        },
      },
      totalAmount: {
        rules: [""],
        api: "",
        label: (
          <span style={{ display: "block", textAlign: "right", width: "100%" }}>
            Monto Total
          </span>
        ),
        list: {
          onRender: renderTotalAmountCell,
          order: 7,
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
          onRender: (props: any) => renderStatusCell(props, getDisplayStatus),
          order: 8,
        },
        filter: {
          label: "Estado",
          width: "278px",
          options: () => {
            return [
              { id: 'ALL', name: 'Todos' },
              { id: 'M', name: 'En mora' },
              { id: 'P', name: 'Por cobrar' },
              { id: 'C', name: 'Cobrado' },
              { id: 'PP', name: 'Parcialmente pagado' },
            ];
          },
          optionLabel: "name",
        },
      },
    };
  }, []);

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    extraData,
    onFilter,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });

  useEffect(() => {
    // Usar datos mockeados
    setStatsData({
      totalDebts: mockDetailData.extraData.totalDebts,
      totalRegisteredAmount: mockDetailData.extraData.totalRegisteredAmount,
      paidDebts: mockDetailData.extraData.paidDebts,
      overdueDebts: mockDetailData.extraData.overdueDebts,
      currentDebts: mockDetailData.extraData.currentDebts,
      delinquentDebts: mockDetailData.extraData.delinquentDebts,
      partiallyPaid: mockDetailData.extraData.partiallyPaid,
    });
  }, []);

  useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.ExpensesDetailsView}>
      <div className={styles.backButton}>
        <button
          type="button"
          className={styles.backButtonContent}
          onClick={() => setOpenDetail(false)}
        >
          <IconArrowLeft />
          <p>Volver a gestor de deudas</p>
        </button>
      </div>

      <LoadingScreen>
        <h1 className={styles.dashboardTitle}>
          Deudas de {MONTHS[data?.month]} {data?.year}
        </h1>
        <div className={styles.allStatsRow}>
          {/* Total de deudas */}
          <WidgetDashCard
            data={statsData.totalDebts}
            title="Total de deudas"
            tooltip={true}
            tooltipTitle="Número total de deudas registradas"
            tooltipPosition="right"
            icon={
              <IconUnidades
                color={
                  !statsData.totalDebts || statsData.totalDebts === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cWhite)"
                }
                style={{
                  backgroundColor:
                    !statsData.totalDebts || statsData.totalDebts === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl1)",
                }}
                circle
                size={16}
              />
            }
          />

          {/* Monto total registrado */}
          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.totalRegisteredAmount)}
            title="Monto total registrado"
            tooltip={true}
            tooltipTitle="Monto total de todas las deudas registradas"
            tooltipPosition="right"
            icon={
              <IconMonedas
                color={
                  !statsData.totalRegisteredAmount || statsData.totalRegisteredAmount === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cCompl4)"
                }
                style={{
                  backgroundColor:
                    !statsData.totalRegisteredAmount || statsData.totalRegisteredAmount === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl7)",
                }}
                circle
                size={18}
              />
            }
          />

          {/* Deudas pagadas */}
          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.paidDebts)}
            title="Deudas pagadas"
            tooltip={true}
            tooltipTitle="Monto total de deudas completamente pagadas"
            tooltipPosition="right"
            icon={
              <IconWallet
                color={
                  !statsData.paidDebts || statsData.paidDebts === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cSuccess)"
                }
                style={{
                  backgroundColor:
                    !statsData.paidDebts || statsData.paidDebts === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl2)",
                }}
                circle
                size={16}
              />
            }
          />

          {/* Deudas vencidas */}
          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.overdueDebts)}
            title="Deudas vencidas"
            tooltip={true}
            tooltipTitle="Monto de deudas que han vencido"
            tooltipPosition="left"
            icon={
              <IconMultas
                color={
                  !statsData.overdueDebts || statsData.overdueDebts === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cAlert)"
                }
                style={{
                  backgroundColor:
                    !statsData.overdueDebts || statsData.overdueDebts === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl9)",
                }}
                circle
                size={18}
              />
            }
          />

          {/* Deudas vigentes */}
          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.currentDebts)}
            title="Deudas vigentes"
            tooltip={true}
            tooltipTitle="Monto de deudas aún vigentes"
            tooltipPosition="left"
            icon={
              <IconMonedas
                color={
                  !statsData.currentDebts || statsData.currentDebts === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cInfo)"
                }
                style={{
                  backgroundColor:
                    !statsData.currentDebts || statsData.currentDebts === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl3)",
                }}
                circle
                size={18}
              />
            }
          />

          {/* Deudas en mora */}
          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.delinquentDebts)}
            title="Deudas en mora"
            tooltip={true}
            tooltipTitle="Monto de deudas en estado de mora"
            tooltipPosition="left"
            icon={
              <IconHandcoin
                color={
                  !statsData.delinquentDebts || statsData.delinquentDebts === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cError)"
                }
                style={{
                  backgroundColor:
                    !statsData.delinquentDebts || statsData.delinquentDebts === 0
                      ? "var(--cHover)"
                      : "var(--cHoverError)",
                }}
                circle
                size={18}
              />
            }
          />

          {/* Parcialmente pagadas */}
          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.partiallyPaid)}
            title="Parcialmente pagadas"
            tooltip={true}
            tooltipTitle="Monto de deudas parcialmente pagadas"
            tooltipPosition="left"
            icon={
              <IconWallet
                color={
                  !statsData.partiallyPaid || statsData.partiallyPaid === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cWarning)"
                }
                style={{
                  backgroundColor:
                    !statsData.partiallyPaid || statsData.partiallyPaid === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl4)",
                }}
                circle
                size={16}
              />
            }
          />
        </div>
        <List
          height={"calc(100vh - 480px)"}
          mockData={mockDetailData}
        />
      </LoadingScreen>

      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          const errors: { startDate?: string; endDate?: string } = {};

          if (!startDate) {
            errors.startDate = "La fecha de inicio es obligatoria";
          }
          if (!endDate) {
            errors.endDate = "La fecha de fin es obligatoria";
          }
          if (startDate && endDate && startDate > endDate) {
            errors.startDate =
              "La fecha de inicio no puede ser mayor a la de fin";
          }
          if (
            startDate &&
            endDate &&
            startDate.slice(0, 4) !== endDate.slice(0, 4)
          ) {
            errors.startDate =
              "El periodo personalizado debe estar dentro del mismo año";
            errors.endDate =
              "El periodo personalizado debe estar dentro del mismo año";
          }

          if (Object.keys(errors).length > 0) {
            setCustomDateErrors(errors);
            return;
          }

          const customDateFilterString = `${startDate},${endDate}`;
          onFilter("paid_at", customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default DebtsManagerDetail;
