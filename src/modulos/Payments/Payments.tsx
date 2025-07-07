"use client";
import React, { useState, useMemo, useEffect } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Payments.module.css";
import {
  getDateStrMes,
  getDateDesdeHasta,
} from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useRouter } from "next/navigation";
import WidgetGrafIngresos from "@/components/Widgets/WidgetGrafIngresos/WidgetGrafIngresos";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import Input from "@/mk/components/forms/Input/Input";
import { RenderAnularModal } from "./RenderDel/RenderDel";
import { IconIngresos } from "@/components/layout/icons/IconsBiblioteca";
import { formatBs } from "@/mk/utils/numbers";
interface FormStateFilter {
  filter_date?: string;
  filter_category?: string | number;
  filter_mov?: string;
  paid_at?: string;
}

const Payments = () => {
  const router = useRouter();
  const [openGraph, setOpenGraph] = useState<boolean>(false);
  const [dataGraph] = useState<any>({});
  const [formStateFilter] = useState<FormStateFilter>({});
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const mod = {
    modulo: "payments",
    singular: "Ingreso",
    plural: "Ingresos",
    permiso: "",
    extraData: true,
    renderForm: RenderForm,
    renderView: (props: any) => (
      <RenderView {...props} payment_id={props?.item?.id} />
    ),
    renderDel: RenderAnularModal,
    loadView: { fullType: "DET" },
    hideActions: {
      view: false,
      add: false,
      edit: true,
      del: true,
    },
    filter: true,
    export: true,
  };

  const getPeriodOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: "ld", name: "Ayer" },
    { id: "w", name: "Esta semana" },
    { id: "lw", name: "Semana pasada" },
    { id: "m", name: "Este mes" },
    { id: "lm", name: "Mes anterior" },
    { id: "y", name: "Este año" },
    { id: "ly", name: "Año anterior" },
    { id: "custom", name: "Personalizado" }, 
  ];

  const getPaymentTypeOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: "T", name: "Transferencia" },
    { id: "E", name: "Efectivo" },
    { id: "C", name: "Cheque" },
    { id: "Q", name: "QR" },
    { id: "O", name: "Pago en oficina" },
  ];

  const getStatusOptions = () => [
    { id: "ALL", name: "Todos" },
    { id: "P", name: "Cobrado" },
    { id: "S", name: "Por confirmar" },
    { id: "R", name: "Rechazado" },
    { id: "X", name: "Anulado" },
  ];
  const removeCommas = (text: string | number): string => {
    return String(text).replace(/[,]/g, "");
  };

  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: "L",
    searchBy: "",
  };

  const convertFilterDate = () => {
    let periodo = "m";
    if (formStateFilter.filter_date === "month") periodo = "m";
    if (formStateFilter.filter_date === "lmonth") periodo = "lm";
    if (formStateFilter.filter_date === "year") periodo = "y";
    if (formStateFilter.filter_date === "lyear") periodo = "ly";
    // Si es personalizado, ya tiene el formato 'c:...'
    if (formStateFilter.paid_at?.startsWith("c:"))
      return formStateFilter.paid_at;
    return periodo;
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      dptos: {
        api: "ae",
        label: "Unidad",
        list: {
          onRender: (props: any) => {
            return <div>{removeCommas(props.item.dptos)}</div>;
          },
        },
      },
      paid_at: {
        rules: [],
        api: "ae",
        label: "Fecha de Cobro",
        form: {
          type: "date",
        },
        list: {
          onRender: (props: any) => {
            return (
              <div>{getDateStrMes(props.item.paid_at) || "No pagado"}</div>
            );
          },
        },
        filter: {
          key: "paid_at",
          label: "Periodo",

          options: getPeriodOptions,
        },
      },

      category_id: {
        rules: ["required"],
        api: "ae",
        label: "Categoría",
        form: {
          type: "select",
          optionsExtra: "categories",
          placeholder: "Seleccione una categoría",
        },
        list: {
          onRender: (props: any) => {
            return (
              <div>
                {props.item.category?.padre?.name || "Sin categoría padre"}
              </div>
            );
          },
        },
        filter: {
          label: "Categoría",
          options: (extraData: any) => {
            const categories = extraData?.categories || [];
            const categoryOptions = categories.map((category: any) => ({
              id: category.id,
              name: category.name,
            }));
            return [{ id: "ALL", name: "Todos" }, ...categoryOptions];
          },

        },
      },
      subcategory_id: {

        rules: ["required"], 
        label: "Subcategoría",
        form: {
          type: "select",
          disabled: (formState: { category_id: any }) => !formState.category_id,
          options: () => [], // Se maneja en RenderForm
        },
        list: {

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
        label: "Forma de pago",
        form: {
          type: "select",
          options: [
            { id: "T", name: "Transferencia" },
            { id: "E", name: "Efectivo" },
            { id: "C", name: "Cheque" },
          ],
        },
        list: {
          onRender: (props: any) => {
            const typeMap: Record<string, string> = {
              T: "Transferencia bancaria",
              E: "Efectivo",
              C: "Cheque",
              Q: "Pago QR",
              O: "Pago en oficina",
            };
            return <div>{typeMap[props.item.type] || props.item.type}</div>;
          },
        },
        filter: {
          label: "Forma de pago",

          options: getPaymentTypeOptions,
        },
      },
      status: {
        rules: [],
        api: "ae",
        label: "Estado",
        list: {
          onRender: (props: any) => {
            const statusMap: Record<string, string> = {
              P: "Cobrado",
              S: "Por confirmar",
              R: "Rechazado",
              E: "Por subir comprobante",
              A: "Por pagar",
              M: "Moroso",
              X: "Anulado",
            };
            return (
              <div
                className={`${styles.statusBadge} ${
                  styles[`status${props.item.status}`]
                }`}
              >
                {statusMap[props.item.status] || props.item.status}
              </div>
            );
          },
        },
        filter: {
          label: "Estado del ingreso",

          options: getStatusOptions,
        },
      },
      amount: {
        rules: ["required", "number"],
        api: "ae",
        label: "Monto Total",
        form: {
          type: "number",
          placeholder: "Ej: 100.00",
        },
        list: {
          onRender: (props: any) => {
            return <div>{formatBs(props.item.amount)}</div>;
          },
        },
      },
    }),
    []
  );


  const goToCategories = (type = "") => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push("/categories");
    }
  };

  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: "Ingresos" });
  }, []);

  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "paid_at" && value === "custom") {
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
    onFilter("paid_at", customDateFilterString);

    setOpenCustomFilter(false);
    setCustomDateErrors({});
  };
  const extraButtons = [
    <Button
      key="categories-button"
      onClick={() => goToCategories("I")}
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
    extraData,
    onFilter,
    showToast,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
    getFilter: handleGetFilter, 
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      {/* <h1 className={styles.title}>Ingresos</h1>
      <p className={styles.subtitle}>
        Administre, agregue y elimine todos los ingresos
      </p> */}

      <List
        height={"calc(100vh - 330px)"}
        emptyMsg="Lista de ingresos vacía. Cuando empieces a registrar los pagos"
        emptyLine2="de expensas y otros ingresos, los verás aquí."
        emptyIcon={<IconIngresos size={80} color="var(--cWhiteV1)" />}
      />

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
            <WidgetGrafIngresos
              ingresos={dataGraph?.data?.ingresosHist || []}
              chartTypes={["pie"]}
              h={360}
              title={"Resumen de Ingresos por categorías"}
              subtitle={
                "Ingresos perteneciente en fecha " +
                getDateDesdeHasta(convertFilterDate())
              }
            />
          </>
        </DataModal>
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

export default Payments;
