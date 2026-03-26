"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./Defaulters.module.css";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { MONTHS_S } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { formatNumber } from "@/mk/utils/numbers";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { IconExport } from "../../components/layout/icons/IconsBiblioteca";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import useCrud from "@/mk/hooks/useCrud/useCrud";

const Defaulters = () => {
  const { setStore } = useAuth();

  // Definir opciones para los filtros
  const getUnidadOptions = () => [
    { id: "", name: "Todas" },
    { id: "A", name: "Bloque A" },
    { id: "B", name: "Bloque B" },
    { id: "C", name: "Bloque C" },
  ];

  const getExpensaOptions = () => [
    { id: "", name: "Todas" },
    { id: "1", name: "1 expensa" },
    { id: "2", name: "2 expensas" },
    { id: "3", name: "3 o más" },
  ];

  // Definir el módulo para useCrud
  const mod = {
    modulo: "defaulters",
    singular: "Moroso",
    plural: "Morosos",
    permiso: "defaulters",
    extraData: true,
    hideActions: {
      view: true,
      add: false,
      edit: false,
      del: false,
    },
    filter: true,
    saveMsg: {
      add: "Moroso creado con éxito",
      edit: "Moroso actualizado con éxito",
      del: "Moroso eliminado con éxito",
    },
  };

  // Parámetros iniciales para la carga de datos - AÑADIDOS PARÁMETROS DE PAGINACIÓN
  const paramsInitial = {
    fullType: "L",
  };

  // Definición de campos para el CRUD con filtros
  const fields = useMemo(
    () => ({
      dpto: {
        rules: [],
        api: "ae", // Cambiado de "r" a "ae" para alinearse con el componente Payments
        label: "Unidad",
        width: "170px",
        list: {
          width: "170px",
        },
        filter: {
          label: "Unidad",
          width: "150px",
          options: getUnidadOptions,
        },
      },
      titular: {
        rules: [],
        api: "ae", // Cambiado de "r" a "ae"
        label: "Titular",
        list: {
          onRender: (props: any) => {
            return getFullName(props?.item?.titular?.owner);
          },
        },
      },
      count: {
        rules: [],
        api: "ae", // Cambiado de "r" a "ae"
        label: "Expensa atrasada",
        list: {
          onRender: (props: any) => {
            const s = props?.item?.count > 1 ? "s" : "";
            return props?.item?.count + " expensa" + s;
          },
        },
        filter: {
          label: "Expensas",
          width: "150px",
          options: getExpensaOptions,
        },
      },
      multa: {
        rules: [],
        api: "ae", // Cambiado de "r" a "ae"
        label: "Multa",
        list: {
          onRender: (props: any) => {
            return "Bs " + formatNumber(props?.item?.multa);
          },
        },
      },
      total: {
        rules: [],
        api: "ae", // Cambiado de "r" a "ae"
        label: "Total",
        list: {
          onRender: (props: any) => {
            return (
              "Bs " + formatNumber(props?.item?.expensa + props?.item?.multa)
            );
          },
        },
      },
    }),
    []
  );

  // Datos para los widgets
  const [porCobrarExpensa, setPorCobrarExpensa] = useState(0);
  const [porCobrarMulta, setPorCobrarMulta] = useState(0);
  const [morososMultaCount, setMorososMultaCount] = useState(0);
  const [defaultersLength, setDefaultersLength] = useState(0);

  // Exportar función para el botón de exportar
  const exportar = () => {
    execute("/defaulters", "GET", { exportar: 1 }, false);
  };

  // Botones adicionales para la tabla
  const extraButtons = [
    <div
      key="export-button"
      onClick={exportar}
      className={styles.exportButton}
      role="button"
    >
      <IconExport size={30} />
    </div>,
  ];

  // Uso del hook useCrud con la configuración definida
  const {
    userCan,
    List,
    onView,
    onEdit,
    onDel,
    reLoad,
    onAdd,
    execute,
    setParams,
    data,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
  });

  // Obtener datos resumidos para widgets
  const fetchDefaultersSummary = async () => {
    try {
      // Usamos el mismo endpoint que useCrud usa para obtener los datos
      const { data: response } = await execute(
        "/defaulters",
        "GET",
        {
          fullType: "DET",
        },
        false
      );

      if (response?.success && response?.data) {
        setPorCobrarExpensa(response.data.porCobrarExpensa || 0);
        setPorCobrarMulta(response.data.porCobrarMulta || 0);
        setMorososMultaCount(response.data.morososMultaCount || 0);
        setDefaultersLength(response.data.defaulters?.length || 0);
      }
    } catch (error) {
      console.error("Error al obtener resumen de morosos:", error);
    }
  };

  useEffect(() => {
    setStore({ title: "Morosos" });
    fetchDefaultersSummary();

    // Log para depuración
    console.log("Parámetros iniciales:", paramsInitial);
  }, []);

  // Añadir un useEffect para ver los datos cuando cambien
  useEffect(() => {
    if (data) {
      console.log("Datos recibidos:", data);
    }
  }, [data]);

  return (
    <LoadingScreen>
      <div className={styles.container}>
        <h1 className={styles.title}>Morosos</h1>
        <p className={styles.subtitle}>
          En esta sección tendrás una visión clara y detallada del estado
          financiero.
          <br />
          Podrás mantener un control sobre los pagos atrasados de los residentes
          y tomar medidas para garantizar la estabilidad financiera de tu
          condominio
        </p>

        <div className={styles.widgetsContainer}>
          <GraphBase
            data={{
              labels: MONTHS_S.slice(1, 13),
              values: [
                {
                  name: "Expensas",
                  values: [porCobrarExpensa],
                },
                {
                  name: "Multas",
                  values: [porCobrarMulta],
                },
              ],
            }}
            chartTypes={["pie"]}
            background="darkv2"
            downloadPdf
            options={{
              title: "",
              subtitle: "",
              label: "",
              colors: ["#4C98DF", "#FF5B4D"],
              height: 350,
              width: 350,
            }}
          />
        </div>

        <div className={styles.listContainer}>
          <List />
        </div>
      </div>
    </LoadingScreen>
  );
};

export default Defaulters;
