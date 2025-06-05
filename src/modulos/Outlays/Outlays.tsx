/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Outlays.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import { useEffect, useMemo, useState } from "react";
import NotAccess from "@/components/layout/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { formatNumber } from "@/mk/utils/numbers";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import { useRouter } from "next/navigation";
import { getDateDesdeHasta, getDateStrMes } from "@/mk/utils/date";
import WidgetGrafEgresos from "@/components/Widgets/WidgetGrafEgresos/WidgetGrafEgresos";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import PerformBudget from "./PerformBudget/PerformBudget";
import Input from "@/mk/components/forms/Input/Input";
import { RenderAnularModal } from "./RenderDel/RenderDel";

interface FormStateFilter {
  filter_date?: string;
  filter_category?: string | number;
  filter_mov?: string;
}

const Outlays = () => {
  const router = useRouter();
  const [openGraph, setOpenGraph] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [dataGraph, setDataGraph] = useState<any>({});
  const [formStateFilter, setFormStateFilter] = useState<FormStateFilter>({});
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

  const mod: ModCrudType = {
    modulo: "expenses",
    singular: "Egreso",
    plural: "Egresos",
    filter: true,
    export: true,
    permiso: "",
    extraData: true,
    renderForm: RenderForm, // Usar nuestro componente de formulario personalizado
    renderView: (props: any) => (
      <RenderView // Usa el nuevo componente
        {...props}
        outlay_id={props?.item?.id} // Pasa el ID del egreso
        extraData={extraData} // Pasa extraData para las categorías
      />
    ),
    renderDel: RenderAnularModal,
    hideActions: {
      edit: true,
      del: true,
    },
    loadView: { fullType: "DET" },
    saveMsg: {
      add: "Egreso creado con éxito",
      edit: "Egreso actualizado con éxito",
      del: "Egreso anulado con éxito",
    },
  };
  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: "L",
    searchBy: "",
  };

  // Función para convertir el filtro de fecha
  const convertFilterDate = () => {
    let periodo = "m";
    if (formStateFilter.filter_date === "ld") periodo = "ld";
    if (formStateFilter.filter_date === "w") periodo = "w";
    if (formStateFilter.filter_date === "lw") periodo = "lw";
    if (formStateFilter.filter_date === "m") periodo = "m";
    if (formStateFilter.filter_date === "lm") periodo = "lm";
    if (formStateFilter.filter_date === "y") periodo = "y";
    if (formStateFilter.filter_date === "ly") periodo = "ly";
    return periodo;
  };

  // Función para navegar a la página de categorías
  const goToCategories = (type = "") => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push("/categories");
    }
  };

  // Opciones para los filtros
  const getPeriodOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: "ld", name: "Ayer" },
    { id: "w", name: "Esta semana" },
    { id: "lw", name: "Semana pasada" },
    { id: "m", name: "Este mes" },
    { id: "lm", name: "Mes anterior" },
    { id: "y", name: "Este año" },
    { id: "ly", name: "Año anterior" },
    { id: "custom", name: "Personalizado" }, // Opción añadida
  ];

  const getCategoryOptions = () => [
    { id: "ALL", name: "Todos" },
    // Aquí se podrían agregar dinámicamente las categorías desde extraData
  ];

  const getStatusOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: "A", name: "Pagado" },
    { id: "X", name: "Anulado" },
  ];

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha",
        form: { type: "date" },
        list: {
          onRender: (props: any) => {
            return getDateStrMes(props.item.date_at);
          },
        },
        filter: {
          label: "Periodo",
          width: "150px",
          options: getPeriodOptions,
        },
      },
      category_id: {
        // <--- Columna "Categoría"
        rules: ["required"],
        api: "ae",
        label: "Categoria",
        form: {
          type: "select",
          options: (items: any) => {
            let data: any = [];
            // Filtrar por los que no tienen objeto padre (o category_id es null)
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
          // extraData: "categories",
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
          // <--- Lógica de renderizado para la columna "Categoría"
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
              return `sin datos`;
            }
            // *** CORRECCIÓN LÓGICA ***
            // Verificar si el objeto 'padre' existe y NO es null
            if (category.padre && typeof category.padre === "object") {
              // Si existe el objeto padre, esta es una subcategoría. Mostramos el nombre del padre.
              return category.padre.name || `(Padre sin nombre)`;
            } else {
              // Si NO existe el objeto padre (es null o no está), esta es la categoría principal. Mostramos su nombre.
              return category.name || `(Sin nombre)`;
            }
          },
        },
      },

      subcategory_id: {
        // <--- Columna "Subcategoría"
        rules: ["required"], // Considera si realmente es requerido
        api: "ae",
        label: "Subcategoria",
        form: {
          type: "select",
          disabled: (formState: { category_id: any }) => !formState.category_id,
          options: () => [], // Se maneja en RenderForm
        },
        list: {
          // <--- Lógica de renderizado para la columna "Subcategoría"
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
              return `sin datos`;
            }
            // *** CORRECCIÓN LÓGICA ***
            // Verificar si el objeto 'padre' existe y NO es null
            if (category.padre && typeof category.padre === "object") {
              // Si existe el objeto padre, la categoría actual es la subcategoría. Mostramos su nombre.
              return category.name || `(Sin nombre)`;
            } else {
              // Si NO existe el objeto padre, no hay subcategoría aplicable.
              return "-/-";
            }
          },
        },
      },
      description: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        form: { type: "text" },
      },
      status: {
        rules: [""],
        api: "ae",
        label: "Estado",
        list: {
          onRender: (props: any) => {
            return (
              <div
                className={`${styles.statusBadge} ${
                  styles[`status${props.item.status}`]
                }`}
              >
                {props.item.status === "A" ? "Pagado" : "Anulado"}
              </div>
            );
          },
        },
        filter: {
          label: "Estado del egreso",
          width: "180px",
          options: getStatusOptions,
        },
      },
      amount: {
        rules: ["required"],
        api: "ae",
        label: "Monto",
        form: { type: "number" },
        list: {
          onRender: (props: any) => {
            return "Bs " + formatNumber(props.item.amount);
          },
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
      file: {
        rules: ["required"],
        api: "ae*",
        label: "Archivo",
        form: {
          type: "fileUpload",
          ext: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
          style: { width: "100%" },
        },
      },
      ext: {
        rules: [""],
        api: "ae",
        label: "Ext",
      },
    };
  }, []);

  const onImport = () => {
    setOpenImport(true);
  };

  // Definición de botones extras para enviar al useCrud
  const extraButtons = [
    <Button
      key="presupuesto-button"
      // onClick={() => goToCategories("E")}
      onClick={() => setOpenModal(true)}
      className={styles.categoriesButton}
    >
      Ejecutar presupuesto
    </Button>,
    <Button
      key="categories-button"
      onClick={() => goToCategories("E")}
      className={styles.categoriesButton}
    >
      Categorías
    </Button>,
  ];

  const {
    userCan,
    List,
    onView,
    onEdit,
    onDel,
    reLoad,
    onAdd,
    execute,
    params,
    setParams,
    onFilter,
    extraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
    getFilter: handleGetFilter,
  });

  const [openImport, setOpenImport] = useState(false);

  // Función para cargar y mostrar el gráfico
  const onClickGraph = async () => {
    try {
      const periodo = convertFilterDate();
      const response = await execute("/balances", "GET", {
        ...formStateFilter,
        filter_date: periodo,
        filter_mov: "E",
        filter_categ: formStateFilter.filter_category
          ? [formStateFilter.filter_category]
          : [],
      });

      if (response && response.data) {
        setDataGraph(response.data);
        setOpenGraph(true);
      }
    } catch (error) {
      console.error("Error al cargar datos del gráfico:", error);
    }
  };

  const onSaveCustomFilter = () => {
    let err: { startDate?: string; endDate?: string } = {};
    if (!customDateRange.startDate) {
      err.startDate = "La fecha de inicio es obligatoria";
    }
    if (!customDateRange.endDate) {
      err.endDate = "La fecha de fin es obligatoria";
    }
    if (
      customDateRange.startDate &&
      customDateRange.endDate &&
      customDateRange.startDate > customDateRange.endDate
    ) {
      err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
    }
    if (Object.keys(err).length > 0) {
      setCustomDateErrors(err);
      return;
    }

    const customDateFilterString = `${customDateRange.startDate},${customDateRange.endDate}`;
    onFilter("date_at", customDateFilterString);

    setOpenCustomFilter(false);
    setCustomDateErrors({});
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.outlays}>
      <h1 className={styles.title}>Egresos</h1>
      <p className={styles.subtitle}>
        Administre, agregue y elimine todos los egresos
      </p>
      {/*  
      <div className={styles.buttonsContainer}>
        <Button onClick={onClickGraph} className={styles.graphButton}>
          Ver gráfica
        </Button>
      </div> */}

      <List height={"calc(100vh - 360px)"} />

      {/* Modal para mostrar el gráfico */}
      {openGraph && (
        <DataModal
          open={openGraph}
          onClose={() => {
            setOpenGraph(false);
          }}
          title=""
          buttonText=""
          buttonCancel=""
        >
          <>
            <WidgetGrafEgresos
              egresos={dataGraph?.data?.egresosHist || []}
              chartTypes={["pie"]}
              h={360}
              title={"Resumen de Egresos por categorías"}
              subtitle={
                "Egresos perteneciente en fecha " +
                getDateDesdeHasta(convertFilterDate())
              }
            />
          </>
        </DataModal>
      )}
      {/* Modal para ejecutar presupuesto */}
      {openModal && (
        <PerformBudget
          reLoad={reLoad}
          open={openModal}
          onClose={() => {
            setOpenModal(false);
          }}
        />
      )}

      <DataModal
        open={openCustomFilter}
        title="Seleccionar Rango de Fechas"
        onSave={onSaveCustomFilter}
        onClose={() => {
          setCustomDateRange({});
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        buttonText="Aplicar Filtro"
        buttonCancel="Cancelar"
      >
        <Input
          type="date"
          label="Fecha de inicio"
          name="startDate"
          error={customDateErrors.startDate}
          value={customDateRange.startDate || ""}
          onChange={(e) => {
            setCustomDateRange({
              ...customDateRange,
              startDate: e.target.value,
            });
            if (customDateErrors.startDate)
              setCustomDateErrors((prev) => ({
                ...prev,
                startDate: undefined,
              }));
          }}
          required
        />
        <Input
          type="date"
          label="Fecha de fin"
          name="endDate"
          error={customDateErrors.endDate}
          value={customDateRange.endDate || ""}
          onChange={(e) => {
            setCustomDateRange({
              ...customDateRange,
              endDate: e.target.value,
            });
            if (customDateErrors.endDate)
              setCustomDateErrors((prev) => ({ ...prev, endDate: undefined }));
          }}
          required
        />
      </DataModal>
    </div>
  );
};

export default Outlays;
