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
import { getDateDesdeHasta } from "@/mk/utils/date";
import WidgetGrafEgresos from "@/components/ Widgets/WidgetGrafEgresos/WidgetGrafEgresos";
import RenderForm from "./RenderForm/RenderForm";

interface FormStateFilter {
  filter_date?: string;
  filter_category?: string | number;
  filter_mov?: string;
}

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Outlays = () => {
  const router = useRouter();
  const [openGraph, setOpenGraph] = useState(false);
  const [dataGraph, setDataGraph] = useState<any>({});
  const [formStateFilter, setFormStateFilter] = useState<FormStateFilter>({});

  const mod: ModCrudType = {
    modulo: "expenses",
    singular: "Egreso",
    plural: "Egresos",
    filter: true,
    export: true,
    permiso: "",
    extraData: true,
    renderForm: RenderForm, // Usar nuestro componente de formulario personalizado
    saveMsg: {
      add: "Egreso creado con éxito",
      edit: "Egreso actualizado con éxito",
      del: "Egreso eliminado con éxito",
    },
  };

  // Función para convertir el filtro de fecha
  const convertFilterDate = () => {
    let periodo = "m";
    if (formStateFilter.filter_date === "month") periodo = "m";
    if (formStateFilter.filter_date === "lmonth") periodo = "lm";
    if (formStateFilter.filter_date === "year") periodo = "y";
    if (formStateFilter.filter_date === "lyear") periodo = "ly";
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
    { id: "", name: "Todos" },
    { id: "month", name: "Este mes" },
    { id: "lmonth", name: "Mes anterior" },
    { id: "year", name: "Este año" },
    { id: "lyear", name: "Año anterior" },
  ];

  const getCategoryOptions = () => [
    { id: "", name: "Todos" },
    // Aquí se podrían agregar dinámicamente las categorías desde extraData
  ];

  const getStatusOptions = () => [
    { id: "", name: "Todos" },
    { id: "A", name: "Pagado" },
    { id: "C", name: "Anulado" },
  ];

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      date_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha",
        form: { type: "date" },
        list: {},
        filter: {
          label: "Periodo",
          width: "150px",
          options: getPeriodOptions,
        },
      },
      category_id: { // <--- Columna "Categoría"
        rules: ["required"],
        api: "ae",
        label: "Categoria",
        form: {
          type: "select",
          options: (items: any) => {
            let data: any = [];
            // Filtrar por los que no tienen objeto padre (o category_id es null)
            items?.extraData?.categories
              ?.filter((c: { padre: any; category_id: any }) => !c.padre && !c.category_id)
              ?.map((c: any) => {
                data.push({
                  id: c.id,
                  name: c.name,
                });
              });
            return data;
          },
        },
        list: { // <--- Lógica de renderizado para la columna "Categoría"
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
              return `sin datos`;
            }
            // *** CORRECCIÓN LÓGICA ***
            // Verificar si el objeto 'padre' existe y NO es null
            if (category.padre && typeof category.padre === 'object') {
              // Si existe el objeto padre, esta es una subcategoría. Mostramos el nombre del padre.
              return category.padre.name || `(Padre sin nombre)`;
            } else {
              // Si NO existe el objeto padre (es null o no está), esta es la categoría principal. Mostramos su nombre.
              return category.name || `(Sin nombre)`;
            }
          },
        },
        filter: {
          label: "Categoría",
          width: "150px",
          extraData: "categories",
        },
      },

      subcategory_id: { // <--- Columna "Subcategoría"
        rules: ["required"], // Considera si realmente es requerido
        api: "ae",
        label: "Subcategoria",
        form: {
          type: "select",
          disabled: (formState: { category_id: any }) => !formState.category_id,
          options: () => [], // Se maneja en RenderForm
        },
        list: { // <--- Lógica de renderizado para la columna "Subcategoría"
          onRender: (props: any) => {
            const category = props.item.category;
            if (!category) {
               return `sin datos`;
            }
            // *** CORRECCIÓN LÓGICA ***
            // Verificar si el objeto 'padre' existe y NO es null
            if (category.padre && typeof category.padre === 'object') {
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
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    showToast,
    execute,
    reLoad,
    getExtraData,
    extraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    _onImport: onImport,
    extraButtons, // Pasando los botones extras al hook
  });

  const { onLongPress, selItem, searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const [openImport, setOpenImport] = useState(false);

  useEffect(() => {
    setOpenImport(searchState == 3);
  }, [searchState]);

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

      <List />

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
    </div>
  );
};

export default Outlays;
