"use client";
import styles from "./Outlays.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import { useMemo, useState } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { formatNumber } from "@/mk/utils/numbers";
import Button from "@/mk/components/forms/Button/Button";
import { useRouter } from "next/navigation";
import { getDateStrMes } from "@/mk/utils/date";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import RenderDel from "./RenderDel/RenderDel";

import { IconIngresos } from "@/components/layout/icons/IconsBiblioteca";
import DateRangeFilterModal from "@/components/DateRangeFilterModal/DateRangeFilterModal";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import PerformBudget from "./PerformBudget/PerformBudget";
import { getExpenseDescriptionSummary } from "./utils/expenseDescription";
import { getOutlaysMod } from "./config/outlaysMod";
import { ExpenseStatus } from "@/modulos/Payments/Type/PaymentType";

const Outlays = () => {
  const router = useRouter();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };
    if (opt === "date_at" && value === "custom") {
      setCustomDateRange({});
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

  // S43: mod extraído a factory `getOutlaysMod()` (patrón S37.5 + S38.5 + S41)
  // para permitir tests unitarios sin renderizar React. Pineá
  // `mod.export: false` + `mod.exportAsync: { type: "expenses", ... }`
  // para migrar al flow async PDF (S32 + S43 backend ExpensesReportType).
  // S41 discovery: Outlays pineá modulo: "v3/expenses" + permiso: "outlays"
  // — es un alias del módulo Expenses canónico. El type "expenses" del
  // slot async matchea el ExpensesReportType pineado en S43 backend.
  const mod = useMemo(() => getOutlaysMod(), []);
  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: "L",
    searchBy: "",
  };
  const goToCategories = (type = "") => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push("/categories");
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

  // 🔴 Acá iban los chars legacy `"A"` y `"X"`, y el filtro MENTÍA (encontrado
  // el 2026-08-05 barriendo los módulos ya migrados, a partir del mismo bug en
  // Áreas).
  //
  // `expenses.status` es `tinyint unsigned` desde S2-T2 (0=CANCELLED,
  // 1=ACTIVE) y `ExpenseController::getModelfilterBy` hace
  // `where('expenses.status', $value[1])` con el valor crudo. MariaDB convierte
  // los DOS chars a 0, así que —medido contra la base local—:
  //
  //   filtrar por "Pagado"  → 21 filas: los ANULADOS
  //   filtrar por "Anulado" → las MISMAS 21 filas
  //   los 1015 pagados      → invisibles en las dos opciones
  //
  // ⚠️ Peor que el de Áreas, que devolvía cero: acá el usuario ve filas y les
  // cree. El render de esta misma pantalla ya se había arreglado a keys
  // numéricas en S140 — el filtro fue el que quedó atrás.
  const getStatusOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: ExpenseStatus.ACTIVE, name: "Pagado" },
    { id: ExpenseStatus.CANCELLED, name: "Anulado" },
  ];

  // ⚠️ Este builder alimenta el filtro `expense_type`, que está COMENTADO más
  // abajo — o sea que hoy no lo usa nadie. Se deja anotado porque tiene el
  // mismo agujero que tenía `getStatusOptions`: `expenses.type` también es
  // `tinyint unsigned`, y `getModelfilterBy` mete el valor crudo en el
  // `where`. Si alguien descomenta ese campo tal como está, el filtro va a
  // devolver basura sin avisar. Antes de descomentarlo, cambiar 'E'/'P' por
  // los valores numéricos del enum del back.
  const getTypeOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: "E", name: "Egreso" },
    { id: "P", name: "Presupuesto" },
  ];

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha de pago",
        form: { type: "date" },
        order: 1,
        list: {
          order: 1,
          onRender: (props: any) => {
            return getDateStrMes(props.item.date_at);
          },
        },
        filter: {
          label: "Periodo",
          options: getPeriodOptions,
        },
      },
      /*       // <- Agregar campo de tipo después de date_at
      expense_type: {
        rules: [],
        api: "e",
        label: "Tipo",
        list: false,
        filter: {
          label: "Tipo",
          width: "150px",
          options: getTypeOptions,
        },
      }, */
      user: {
        api: "",
        label: "Responsable",
      },
      description: {
        rules: ["required"],
        api: "ae",
        label: "Concepto",
        order: 2,
        form: { type: "text" },
        list: {
          order: 2,
          width: 280,
          onRender: (props: any) => {
            const description = getExpenseDescriptionSummary(
              props.item.description,
            );

            return (
              <div
                title={props.item.description || description}
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {description}
              </div>
            );
          },
        },
      },
      category_id: {
        rules: ["required"],
        api: "ae",
        label: "Categoría",
        order: 3,
        form: {
          type: "select",
          options: (items: any) => {
            let data: any = [];
            items?.extraData?.categories
              ?.filter(
                (c: { padre: any; category_id: any }) =>
                  !c.padre && !c.category_id
              )
              ?.map((c: any) => {
                data.push({
                  id: c.id,
                  name: c.name,
                });
              });
            return data;
          },
        },
        filter: {
          label: "Categoría",
          width: "150px",
          options: (extraData: any) => {
            const categories = extraData?.categories || [];
            const categoryOptions = categories.map((category: any) => ({
              id: category.id,
              name: category.name,
            }));
            return [{ id: "ALL", name: "Todos" }, ...categoryOptions];
          },
        },
        list: {
          order: 3,
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
              return `sin datos`;
            }
            if (category.padre && typeof category.padre === "object") {
              return category.padre.name || `(Padre sin nombre)`;
            } else {
              return category.name || `(Sin nombre)`;
            }
          },
        },
      },

      subcategory_id: {
        rules: ["required"],
        api: "ae",
        label: "Subcategoría",
        order: 4,
        form: {
          type: "select",
          disabled: (formState: { category_id: any }) => !formState.category_id,
          options: () => [],
        },
        list: {
          order: 4,
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
              return `sin datos`;
            }
            if (category.padre && typeof category.padre === "object") {
              return category.name || `(Sin nombre)`;
            } else {
              return "-/-";
            }
          },
        },
      },
      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo de pago",
      },
      status: {
        rules: [""],
        api: "ae",
        order: 5,
        label: (
          <span
            style={{ display: "block", textAlign: "center", width: "100%" }}
            title="Estado"
          >
            Estado
          </span>
        ),
        list: {
          order: 5,
          onRender: (props: any) => {
            interface StatusConfig {
              [key: string]: {
                label: string;
                color: string;
                bgColor: string;
              };
            }

            const statusConfig: StatusConfig = {
              // S140 (HALLAZGO-NEW-39 variant): el back pinea `ExpenseStatus`
              // enum numérico (post-S2-T2). Las keys legacy CHAR ('A', 'X')
              // ya no matchean — todo caía en "Desconocido". Fix: pinear
              // keys numéricas que matchean el enum del back
              // (app/Modules/Expenses/Enums/ExpenseStatus.php).
              //
              // Pre-S140 (legacy, char):
              //   A: Pagado
              //   X: Anulado
              //
              // Post-S140 (numeric, post-ExpenseStatus enum):
              //   0 (ExpenseStatus.CANCELLED): Anulado
              //   1 (ExpenseStatus.ACTIVE): Pagado
              0: {
                label: "Anulado",
                color: "var(--cWhite)",
                bgColor: "var(--cHoverCompl1)",
              },
              1: {
                label: "Pagado",
                color: "var(--cSuccess)",
                bgColor: "var(--cHoverCompl2)",
              },
            };

            const defaultConfig = {
              label: "Desconocido",
              color: "var(--cWhite)",
              bgColor: "var(--cHoverCompl1)",
            };

            // Coerce to number (back pinea int, pero el JSON a veces
            // viene como string — defensa en profundidad).
            const rawStatus = props.item.status;
            const status = typeof rawStatus === "string" ? parseInt(rawStatus, 10) : rawStatus;
            const { label, color, bgColor } =
              statusConfig[status] || defaultConfig;

            return (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <StatusBadge color={color} backgroundColor={bgColor}>
                  {label}
                </StatusBadge>
              </div>
            );
          },
          align: "center",
        },
        filter: {
          label: "Estado",
          width: "180px",
          options: getStatusOptions,
        },
      },

      amount: {
        rules: ["required"],
        api: "ae",
        order: 6,
        label: (
          <span
            style={{ display: "block", textAlign: "right", width: "100%" }}
            title="Monto total"
          >
            Monto total
          </span>
        ),
        form: { type: "number" },
        list: {
          order: 6,
          onRender: (props: any) => (
            <div style={{ width: "100%", textAlign: "right" }}>
              {"Bs " + formatNumber(props.item.amount)}
            </div>
          ),
          align: "right",
        },
      },
      client_id: {
        rules: [""],
        api: "ae",
        label: "Cliente",
      },
      user_id: {
        rules: [""],
        api: "ae",
        label: "Usuario",
      },
      avatar: {
        rules: [],
        api: "ae*",
        label: "Archivo",
        form: {
          type: "fileUpload",
          ext: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
          style: { width: "100%" },
        },
      },
      bank_account_id: {
        rules: ["required"],
        api: "ae",
        label: "Cuenta bancaria",
      },
      ext: {
        rules: [""],
        api: "ae",
        label: "Ext",
      },
    };
  }, []);
  const extraButtons = [
    <Button
      key="categories-button"
      variant="secondary"
      onClick={() => goToCategories("E")}
      className={styles.categoriesButton}
    >
      Categorías
    </Button>,

    // <Button
    //   key="budget-button"
    //   onClick={() => setOpenModal(true)}
    //   className={styles.categoriesButton}>
    // >
    //   Ejecutar
    // </Button>,
  ];
  const {
    userCan,
    reLoad,
    List,
    setStore,
    onEdit,
    onDel,
    onSearch,
    searchs,
    onFilter,
    extraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
    getFilter: handleGetFilter,
  });
  useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const [openModal, setOpenModal] = useState(false);

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.outlays}>
      <List
        height={"100%"}
        emptyMsg="Lista de egresos vacía. Cuando ingreses los gastos del condominio, "
        emptyLine2="aparecerán en esta sección."
        emptyIcon={<IconIngresos size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1700}
      />

      {/* Modal para ejecutar presupuesto omentado para cuando se implmente la funcionalidad*/}
      {openModal && (
        <PerformBudget
          reLoad={reLoad}
          open={openModal}
          onClose={() => {
            setOpenModal(false);
          }}
        />
      )}

      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setCustomDateRange({});
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
          if (!endDate) err.endDate = "La fecha de fin es obligatoria";
          if (startDate && endDate && startDate > endDate) {
            err.startDate =
              "La fecha de inicio no puede ser mayor a la fecha fin";
          }
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          const customDateFilterString = `${startDate},${endDate}`;
          onFilter("date_at", customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        initialStartDate={customDateRange.startDate || ""}
        initialEndDate={customDateRange.endDate || ""}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Outlays;
