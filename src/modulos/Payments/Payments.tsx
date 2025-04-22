"use client";
import React, { useState, useMemo, useEffect } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Payments.module.css";
import { getUrlImages } from "@/mk/utils/string";
import {
  getDateStrMes,
  getDateTimeStrMesShort,
  getDateDesdeHasta,
} from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useRouter } from "next/navigation";
import WidgetGrafIngresos from "@/components/ Widgets/WidgetGrafIngresos/WidgetGrafIngresos";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";
import { useAuth } from "@/mk/contexts/AuthProvider";
import dptos from "@/app/dptos/page";

interface FormStateFilter {
  filter_date?: string;
  filter_category?: string | number;
  filter_mov?: string;
}

const Payments = () => {
  const router = useRouter();
  const [openGraph, setOpenGraph] = useState<boolean>(false);
  const [dataGraph, setDataGraph] = useState<any>({});
  const [formStateFilter, setFormStateFilter] = useState<FormStateFilter>({});

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
    loadView: { fullType: "DET" },
    hideActions: {
      view: false,
      add: false,
      edit: true,
      del: true,
    },
    filter: true,
    saveMsg: {
      add: "Ingreso creado con éxito",
      edit: "Ingreso actualizado con éxito",
      del: "Ingreso eliminado con éxito",
    },
  };
  const getPeriodOptions = () => [
    { id: "", name: "Todos" },
    { id: "month", name: "Este mes" },
    { id: "lmonth", name: "Mes anterior" },
    { id: "year", name: "Este año" },
    { id: "lyear", name: "Año anterior" },
  ];

  const getPaymentTypeOptions = () => [
    { id: "", name: "Todos" },
    { id: "T", name: "Transferencia" },
    { id: "E", name: "Efectivo" },
    { id: "C", name: "Cheque" },
    { id: "Q", name: "QR" },
    { id: "O", name: "Pago en oficina" },
  ];

  const getStatusOptions = () => [
    { id: "", name: "Todos" },
    { id: "P", name: "Pagado" },
    { id: "S", name: "Por confirmar" },
    { id: "R", name: "Rechazado" },
    { id: "E", name: "Por subir comprobante" },
    { id: "A", name: "Por pagar" },
    { id: "M", name: "Moroso" },
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
    return periodo;
  };

  // Definición de campos para el CRUD
  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      paid_at: {
        rules: [],
        api: "ae",
        label: "Fecha de Pago",
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
          label: "Periodo",
          width: "150px",
          options: getPeriodOptions, // Referencia a la función, no llamada a la función
        },
      },
      dptos: {
        api: "ae",
        label: "Unidad",
        list: {
          onRender: (props: any) => {
            return <div>{removeCommas(props.item.dptos)}</div>;
          },
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
      },

      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo de pago",
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
              T: "Transferencia",
              E: "Efectivo",
              C: "Cheque",
              Q: "QR",
              O: "Pago en oficina",
            };
            return <div>{typeMap[props.item.type] || props.item.type}</div>;
          },
        },
        filter: {
          label: "Tipo de pago",
          width: "150px",
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
              P: "Pagado",
              S: "Por confirmar",
              R: "Rechazado",
              E: "Por subir comprobante",
              A: "Por pagar",
              M: "Moroso",
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
          width: "180px",
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
            return <div>Bs.{props.item.amount}</div>;
          },
        },
      },
    }),
    []
  );

  // Función para cargar y mostrar el gráfico
  const onClickGraph = async () => {
    try {
      const periodo = convertFilterDate();
      const response = await execute("/balances", "GET", {
        ...formStateFilter,
        filter_date: periodo,
        filter_mov: "I",
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

  // Función para navegar a la página de categorías de ingresos
  const goToCategories = (type = "") => {
    // Si es de ingresos, pasa "I" como parámetro, si no, no pasa nada o pasa vacío
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push("/categories");
    }
  };

  const { setStore } = useAuth();
  useEffect(() => {
    setStore({ title: "INGRESOS" });
  }, []);

  // Definición de botones extras
  const extraButtons = [
    <Button
      key="categories-button"
      onClick={() => goToCategories("I")}
      className={styles.categoriesButton}
    >
      Categorías
    </Button>,
  ];
  // Uso del hook useCrud con los botones extras
  const { userCan, List, onView, onEdit, onDel, reLoad, onAdd, execute } =
    useCrud({
      paramsInitial,
      mod,
      fields,
      extraButtons, // Pasando los botones extras al hook
    });
  // Verificación de permisos
  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ingresos</h1>
      <p className={styles.subtitle}>
        Administre, agregue y elimine todos los ingresos
      </p>

      {/* <div className={styles.buttonsContainer}>
        <Button
          onClick={onClickGraph}
          className={styles.graphButton}
        >
          Ver gráfica
        </Button>

        <Button
          onClick={() => goToCategories("I")}
          className={styles.categoriesButton}
        >
          Administrar categorías
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
    </div>
  );
};

export default Payments;
