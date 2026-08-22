"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./ExpensesDetailsView.module.css";
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
} from "@/components/layout/icons/IconsBiblioteca";
import RenderView from "./RenderView/RenderView";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import FormatBsAlign from "@/mk/utils/FormatBsAlign";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { hasMaintenanceValue, isPastDue } from "@/mk/utils/utils";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { DebtStatus, DEBT_STATUS_TEXT, getDebtStatusText } from "@/types/PaymentType";

import { DebtType } from "@/types/PaymentType";
const renderUnitCell = ({ item }: { item: any }) => (
  <div>{item?.dpto?.nro}</div>
);

const renderAddressCell = ({ item }: { item: any }) => (
  <div>{item?.dpto?.description || "-/-"}</div>
);

const renderPaidAtCell = ({ item }: { item: any }) => (
  <div>{getDateStrMes(item?.paid_at) || "-/-"}</div>
);

const renderDueAtCell = ({ item }: { item: any }) => (
  <div>{getDateStrMes(item?.due_at) || "-/-"}</div>
);

const renderAmountCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={item?.amount} alignRight />
);

const renderPenaltyAmountCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={item?.penalty_amount} alignRight />
);
const renderMaintenanceAmountCell = ({ item }: { item: any }) => (
  <FormatBsAlign value={item?.maintenance_amount} alignRight />
);

const renderStatusCell = (
  { item }: { item: any },
  getDisplayStatus: Function,
) => {
  const statusConfig: { [key: number]: { color: string; bgColor: string } } = {
    [DebtStatus.PENDING]: { color: "var(--cInfo)", bgColor: "var(--cHoverCompl3)" }, // Por cobrar
    [DebtStatus.PAID]: { color: "var(--cSuccess)", bgColor: "var(--cHoverCompl2)" }, // Cobrada
    [DebtStatus.SUBMITTED]: { color: "var(--cWarning)", bgColor: "var(--cHoverCompl4)" }, // Por confirmar
    [DebtStatus.REJECTED]: { color: "var(--cMediumAlert)", bgColor: "var(--cMediumAlertHover)" }, // Rechazado
    [DebtStatus.OVERDUE]: { color: "var(--cError)", bgColor: "var(--cHoverError)" }, // En mora
    [DebtStatus.FORGIVEN]: { color: "var(--cInfo)", bgColor: "var(--cHoverCompl3)" }, // Condonada
    // ⚠️ Los cuatro que faltaban. Sin ellos el fallback pintaba una expensa en
    // PARTIAL con el celeste de "Por cobrar": el texto decía una cosa y el
    // color otra.
    [DebtStatus.PARTIAL]: { color: "var(--cWarning)", bgColor: "var(--cHoverCompl4)" }, // Pago parcial
    [DebtStatus.WORKFLOW_PENDING]: { color: "var(--cMediumAlert)", bgColor: "var(--cMediumAlertHover)" }, // En flujo externo
    [DebtStatus.CANCELLED]: { color: "var(--cError)", bgColor: "var(--cHoverError)" }, // Anulada
    [DebtStatus.AWAITING_VOUCHER]: { color: "var(--cWarning)", bgColor: "var(--cHoverCompl4)" }, // Por subir comprobante
  };

  const displayStatus = getDisplayStatus(item);
  const { color, bgColor } = statusConfig[displayStatus.code] || statusConfig[DebtStatus.PENDING];

  return (
    <StatusBadge color={color} backgroundColor={bgColor}>
      {displayStatus.text}
    </StatusBadge>
  );
};

const ExpensesDetails = ({ data, setOpenDetail }: any) => {
  const [statsData, setStatsData] = useState({
    totalUnits: 0,
    paidUnits: 0,
    overdueUnits: 0,
    totalAmount: 0,
    paidAmount: 0,
    penaltyAmount: 0,
    pendingAmount: 0,
  });
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const { user } = useAuth();
  const getDisplayStatus = (item: any) => {
    const numericStatus = Number(item?.status);
    // La regla de mora es UNA sola y vive en `isPastDue`: acá estaba copiada y
    // leía el vencimiento en UTC, así que la que vencía HOY salía "En mora" las
    // 24 horas del día (CDT-44).
    if (numericStatus === DebtStatus.PENDING && isPastDue(item?.due_at)) {
      return { text: "En mora", code: DebtStatus.OVERDUE };
    }

    // 🔴 Acá había un `switch` con 5 de los 10 estados y un `default` que
    // devolvía `String(item.status)`: las 257 expensas en PARTIAL salían en
    // pantalla como un "3" pelado. El nombre lo pone la tabla completa.
    return { text: getDebtStatusText(numericStatus), code: numericStatus };
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
      currentFilters[opt] = "ALL"; // Enviamos 'ALL' explícitamente // esto?
      // 🔴 Los tres valores explícitos y no `!value`: un estado que vale 0 es
      // una opción elegida, no "sin filtro". Con el chequeo de verdad la clave
      // se borraba y el back devolvía la lista SIN filtrar, sin ningún error
      // (es lo que pasó en Egresos, CDT-38). Hoy ningún `DebtStatus` vale 0,
      // pero el próximo enum que se agregue acá no tiene por qué saberlo.
    } else if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const mod: ModCrudType = {
    modulo: "v3/debt-dptos",
    // Titula los modales de editar y eliminar ("Editar expensa de la unidad").
    singular: "expensa de la unidad",
    plural: "",
    filter: true,
    export: false,
    // 🔴 2026-08-06 (lo pidió Mario): esta pantalla NUNCA tuvo export. El
    // comentario que estaba acá decía que "el export nunca funcionó
    // productivamente" y lo dejaba apagado; ahora sale por el motor nuevo.
    //
    // `debt_id` + `type: DebtType.EXPENSE` viajan en los params de la lista, así que el
    // reporte trae exactamente las expensas del periodo que está en pantalla
    // —y el título del archivo lleva el periodo, que lo resuelve el back.
    exportAsync: {
      type: "expenses-periodo",
      format: "pdf",
      label: "Exportar",
      supportedFormats: ["pdf", "xlsx", "csv"],
      endpoint: "/v3/debt-dptos",
    },
    permiso: "expenses",
    // 🔴 CDT-50: acá se editaba y se borraba el PERIODO ENTERO desde la
    // pantalla anterior, y esta —la única que muestra la deuda de CADA
    // unidad— no tenía ninguna acción. La única forma de sacar la expensa de
    // UNA unidad era borrar el mes completo.
    //
    // Ahora el lápiz y el tacho de la fila van a `PUT`/`DELETE
    // /v3/debt-dptos/{id}`, que es lo que `useCrud` arma con `mod.modulo`.
    // `add` sigue oculto: las expensas de un periodo las genera el back al
    // crear el grupo, no se agregan de a una desde acá.
    //
    // No hay `onHideActions` que adivine si la deuda tiene pagos: la regla es
    // "ningún pago vivo, ni parcial ni sin confirmar" y vive en
    // `DebtDptoController::beforeUpdate`/`beforeDelete` (CDT-45). Copiarla acá
    // la dejaría en dos lenguajes esperando a separarse; el back rechaza con
    // su texto y ese texto es el que ve el usuario.
    hideActions: {
      add: true,
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
        props.reLoad(null, mod?.noWaiting); // Recargar datos antes de cerrar // esto?
        props.onClose(); // Cerrar la vista // esto?
      };
      return <RenderView {...props} onClose={handleClose} />;
    },
    extraData: true,
  };

  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: 20,
    // 🔴 2026-08-06: acá iba `debt_id: data.id`. La fila del listado dejó de
    // ser un `debt_id` —cada corrida del generador minteaba uno nuevo, y abril
    // de 2026 tenía 81 para 491 filas— y pasó a ser el PERIODO. Ahora el
    // detalle pide el periodo, que es lo que el usuario clickeó.
    year: data.year,
    month: data.month,
    type: DebtType.EXPENSE,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      /**
       * 🔴 Va en el `PUT` aunque no se vea ni se edite.
       *
       * `DebtDptoController::beforeUpdate` rutea por `type`: sin él,
       * `(int) null` es 0 —NORMAL— y entonces exige `begin_at`, `due_at`,
       * `subcategory_id`, `amount` y `dpto_id`, que esta pantalla no tiene.
       * El valor sale de la fila (`debt_dptos.type`); todas son EXPENSE
       * porque la lista se pide con `type: DebtType.EXPENSE`.
       *
       * Sin `form` a propósito: `useCrud` sólo dibuja los campos que lo
       * declaran, así que no ocupa una celda del grid del formulario.
       */
      type: { rules: [], api: "e" },
      unit: {
        rules: [""],
        api: "",
        label: "Unidad",
        list: {
          onRender: renderUnitCell,
        },
      },
      address: {
        rules: [""],
        api: "",
        label: "Dirección",
        list: {
          onRender: renderAddressCell,
        },
      },
      paid_at: {
        rules: [""],
        api: "",
        label: "Fecha de pago",
        list: {
          onRender: renderPaidAtCell,
        },
        filter: {
          key: "paid_at",
          label: "Periodo",
          options: getPeriodOptions,
        },
      },
      due_at: {
        rules: [""],
        api: "",
        label: "Fecha de plazo",
        list: {
          onRender: renderDueAtCell,
        },
      },
      amount: {
        rules: ["required", "number", "positive"],
        api: "e",
        label: (
          <span style={{ display: "block", textAlign: "right", width: "100%" }}>
            Expensa
          </span>
        ),
        list: {
          onRender: renderAmountCell,
        },
        form: {
          type: "number",
          label: "Monto",
        },
      },
      obs: {
        rules: ["required"],
        api: "e",
        label: "Motivo del cambio",
        form: {
          type: "text",
          label: "Motivo del cambio",
        },
      },
      /**
       * 🔴 `required` de este lado no es cosmético: el back valida
       * `penalty_amount => required|numeric|min:0` para EXPENSE y responde
       * **422**. Un 422 hace que axios tire, así que `execute` vuelve con
       * `data: null` y el toast de error de `useCrud` saldría VACÍO — el
       * usuario no vería nada. Con la regla acá el formulario ni sale.
       *
       * Cero es un valor válido (la regla `required` de `mk` acepta 0 y "0"):
       * una expensa sin multa se guarda con 0, no se deja vacía.
       */
      penalty_amount: {
        rules: ["required", "number", "positive"],
        api: "e",
        label: (
          <span style={{ display: "block", textAlign: "right", width: "100%" }}>
            Multa
          </span>
        ),
        list: {
          onRender: renderPenaltyAmountCell,
        },
        form: {
          type: "number",
          label: "Multa",
        },
      },
      maintenance_amount: {
        rules: [""],
        api: "",
        label: (
          <span style={{ display: "block", textAlign: "right", width: "100%" }}>
            Mant. de valor
          </span>
        ),
        list: hasMaintenanceValue(user)
          ? {
              onRender: renderMaintenanceAmountCell,
            }
          : false,
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
        },
        filter: {
          label: "Estado",
          width: "278px",
          options: () => {
            // 🔴 Lo pidió Mario: faltaba "Pago parcial". Las 257 expensas en
            // ese estado se veían en la lista pero no se podían filtrar.
            // Los nombres salen de la misma tabla que la celda: si el filtro
            // dice una palabra y la columna otra, nadie encuentra sus filas.
            return [
              { id: "ALL", name: "Todos" },
              ...[
                DebtStatus.PENDING,
                DebtStatus.OVERDUE,
                DebtStatus.PARTIAL,
                DebtStatus.SUBMITTED,
                DebtStatus.PAID,
                DebtStatus.FORGIVEN,
              ].map((estado) => ({ id: estado, name: DEBT_STATUS_TEXT[estado] })),
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
    if (extraData) {
      setStatsData({
        totalUnits: extraData.assignedUnits || 0,
        paidUnits: extraData.paidUnits || 0,
        overdueUnits: extraData.overdueUnits || 0,
        totalAmount: extraData.expenseAmount || 0,
        paidAmount: extraData.paidAmount || 0,
        penaltyAmount: extraData.penaltyAmount || 0,
        pendingAmount: extraData.pendingAmount || 0,
      });
    }
  }, [extraData]);

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
          <p>Volver a sección expensas</p>
        </button>
      </div>

      <LoadingScreen>
        <h1 className={styles.dashboardTitle}>
          Expensas de {MONTHS[data?.month]} {data?.year}
        </h1>
        <div className={styles.allStatsRow}>
          {/* Tarjeta 1 (antes en grupo izquierdo)  */}
          <WidgetDashCard
            data={statsData.totalUnits}
            title="Total"
            tooltip={true}
            tooltipTitle="Total de unidades asignadas"
            tooltipPosition="right"
            icon={
              <IconUnidades
                color={
                  !statsData.totalUnits || statsData.totalUnits === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cWhite)"
                }
                style={{
                  backgroundColor:
                    !statsData.totalUnits || statsData.totalUnits === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl1)",
                }}
                circle
                size={16}
              />
            }
          />
          {/* Tarjeta 2 (antes en grupo izquierdo) */}
          <WidgetDashCard
            data={statsData.paidUnits}
            title="Al día"
            tooltip={true}
            tooltipTitle="Unidades que han pagado a tiempo"
            tooltipPosition="right"
            icon={
              <IconUnidades
                color={
                  !statsData.paidUnits || statsData.paidUnits === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cSuccess)"
                }
                style={{
                  backgroundColor:
                    !statsData.paidUnits || statsData.paidUnits === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl2)",
                }}
                circle
                size={16}
              />
            }
          />
          {/* Tarjeta 3 (antes en grupo izquierdo) */}
          <WidgetDashCard
            data={statsData.overdueUnits}
            title="Morosas"
            tooltip={true}
            tooltipTitle="Unidades con pagos vencidos"
            tooltipPosition="right"
            icon={
              <IconUnidades
                color={
                  !statsData.overdueUnits || statsData.overdueUnits === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cError)"
                }
                style={{
                  backgroundColor:
                    !statsData.overdueUnits || statsData.overdueUnits === 0
                      ? "var(--cHover)"
                      : "var(--cHoverError)",
                }}
                circle
                size={16}
              />
            }
          />

          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.totalAmount)}
            title="Expensa"
            tooltip={true}
            tooltipTitle="Monto total de expensas del período"
            tooltipPosition="left"
            icon={
              <IconMonedas
                color={
                  !statsData.totalAmount || statsData.totalAmount === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cCompl4)"
                }
                style={{
                  backgroundColor:
                    !statsData.totalAmount || statsData.totalAmount === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl7)",
                }}
                circle
                size={18}
              />
            }
          />

          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.paidAmount)}
            title="Cobrado"
            tooltip={true}
            tooltipTitle="Monto total cobrado hasta la fecha"
            tooltipPosition="left"
            icon={
              <IconWallet
                color={
                  !statsData.paidAmount || statsData.paidAmount === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cSuccess)"
                }
                style={{
                  backgroundColor:
                    !statsData.paidAmount || statsData.paidAmount === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl2)",
                }}
                circle
                size={16}
              />
            }
          />
          {/* Tarjeta 6 (antes en grupo derecho) */}

          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.penaltyAmount)}
            title="Multas"
            tooltip={true}
            tooltipTitle="Monto total de multas aplicadas"
            tooltipPosition="left"
            icon={
              <IconMultas
                color={
                  !statsData.penaltyAmount || statsData.penaltyAmount === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cAlert)"
                }
                style={{
                  backgroundColor:
                    !statsData.penaltyAmount || statsData.penaltyAmount === 0
                      ? "var(--cHover)"
                      : "var(--cHoverCompl9)",
                }}
                circle
                size={18}
              />
            }
          />
          {/* Tarjeta 7 (antes en grupo derecho) */}

          <WidgetDashCard
            data={"Bs " + formatNumber(statsData.pendingAmount)}
            title="Pendiente"
            tooltip={true}
            tooltipTitle="Monto pendiente por cobrar"
            tooltipPosition="left"
            icon={
              <IconHandcoin
                color={
                  !statsData.pendingAmount || statsData.pendingAmount === 0
                    ? "var(--cWhiteV1)"
                    : "var(--cError)"
                }
                style={{
                  backgroundColor:
                    !statsData.pendingAmount || statsData.pendingAmount === 0
                      ? "var(--cHover)"
                      : "var(--cHoverError)",
                }}
                circle
                size={18}
              />
            }
          />
          {/* Fin de las tarjetas */}
        </div>
        <List height={"100%"} />
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

export default ExpensesDetails;
