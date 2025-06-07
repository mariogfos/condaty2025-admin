"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "./DefaultersView.module.css";

import useAxios from "@/mk/hooks/useAxios";
import GraphBase from "@/mk/components/ui/Graphs/GraphBase";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { formatNumber } from "@/mk/utils/numbers";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  IconExport,
  IconBilletera,
  IconMultas,
  IconHandcoin,
  IconMonedas,
  IconHousing,
} from "../../components/layout/icons/IconsBiblioteca";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import WidgetDefaulterResume from "@/components/Widgets/WidgetDefaulterResume/WidgetDefaulterResume";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { WidgetDashCard } from "@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard";

const DefaultersView = () => {
  const { setStore } = useAuth();

  useEffect(() => {});

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
    permiso: "",
    extraData: true,
    export: true,
    hideActions: {
      view: true,
      add: true,
      edit: true,
      del: true,
    },
    filter: true,
    saveMsg: {
      add: "Moroso creado con éxito",
      edit: "Moroso actualizado con éxito",
      del: "Moroso eliminado con éxito",
    },
  };

  // Parámetros iniciales para la carga de datos
  const paramsInitial = {
    fullType: "L",
    page: 1,
    perPage: -1,
  };

  // Definición de campos para el CRUD con filtros
  const fields = useMemo(
    () => ({
      dpto: {
        rules: [],
        api: "ae",
        label: "Unidad",
        width: "170px",
        list: {
          width: "170px",
        },
        /* filter: {
                    label: "Unidad",
                    width: "150px",
                    options: getUnidadOptions
                } */
      },
      titular: {
        rules: [],
        api: "ae",
        label: "Titular",
        list: {
          onRender: (props: any) => {
            const titular = props?.item?.titular?.owner;
            const titularId = titular?.id;

            return (
              <div>
                {titular ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Avatar
                      src={
                        titularId
                          ? getUrlImages(
                              "/OWNER" +
                                "-" +
                                titularId +
                                ".webp" +
                                (titular?.updated_at
                                  ? "?d=" + titular?.updated_at
                                  : "")
                            )
                          : ""
                      }
                      name={getFullName(titular)}
                      w={32}
                      h={32}
                    />
                    {getFullName(titular)}
                  </div>
                ) : (
                  " Sin titular"
                )}
              </div>
            );
          },
        },
      },
      count: {
        rules: [],
        api: "ae",
        label: "Expensas atrasadas",
        list: {
          onRender: (props: any) => {
            const s = props?.item?.count > 1 ? "s" : "";
            return props?.item?.count + " expensa" + s;
          },
        },
        /*  filter: {
                    label: "Expensas",
                    width: "150px",
                    options: getExpensaOptions
                } */
      },
      expensa: {
        rules: [],
        api: "ae",
        label: "Monto por expensa",
        list: {
          onRender: (props: any) => {
            return "Bs " + formatNumber(props?.item?.expensa);
          },
        },
      },
      multa: {
        rules: [],
        api: "ae",
        label: "Multa",
        list: {
          onRender: (props: any) => {
            return "Bs " + formatNumber(props?.item?.multa);
          },
        },
      },

      total: {
        rules: [],
        api: "ae",
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

  // Exportar función para el botón de exportar
  // const exportar = () => {
  //   execute("/defaulters", "GET", { exportar: 1 }, false);
  // };

  // Botones adicionales para la tabla
  // const extraButtons = [
  //   <div key="export-button" onClick={exportar} className={styles.exportButton}>
  //     <IconExport size={32} />
  //   </div>,
  // ];

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
    // extraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    // extraButtons,
  });

  // Estado para controlar el número total de defaulters
  const [defaultersLength, setDefaultersLength] = useState(0);
  const [extraData, setExtraData] = useState<any>({});
  const { data: extraDat } = useAxios(
    "/defaulters",
    "GET",
    {
      fullType: "EXTRA",
    },
    false
  );

  // Actualizar datos cuando cambia extraData
  useEffect(() => {
    if (data?.data) {
      chargeExtraData();
      setDefaultersLength(data.data.length || 0);
    }
  }, [data]);

  const chargeExtraData = async () => {
    if (extraDat) {
      setExtraData(extraDat?.data);
    }
  };
  // console.log(extraData,'extraDat')

  // Calcular el total de morosidad
  const totalMorosidad =
    (extraData?.porCobrarExpensa || 0) + (extraData?.porCobrarMulta || 0);

  // Calcular porcentajes para la gráfica
  const porcentajeExpensas =
    totalMorosidad > 0
      ? Math.round(((extraData?.porCobrarExpensa || 0) / totalMorosidad) * 100)
      : 0;
  const porcentajeMultas =
    totalMorosidad > 0
      ? Math.round(((extraData?.porCobrarMulta || 0) / totalMorosidad) * 100)
      : 0;

  // Componente del panel derecho con gráfico y widgets
  // Actualizar la configuración del gráfico en la función renderRightPanel
  const renderRightPanel = () => {
    // Definir los colores consistentes para los widgets y el gráfico
    const expensaColor = "#f7b267"; // Color naranja para expensas (del IconBilletera)
    const multaColor = "#b996f6"; // Color morado para multas (del IconMultas)
    const totalColor = "#4ED58C"; // Color verde para el total (del IconHandcoin)

    return (
      <div className={styles.rightPanel}>
        <div className={styles.subtitle}>
          Representación gráfica del estado general de morosos{" "}
        </div>
        <div className={styles.widgetsPanel}>
          <section>
            <WidgetDefaulterResume
              title={"Total de expensas"}
              amount={`Bs ${formatNumber(extraData?.porCobrarExpensa || 0)}`}
              pointColor={"var(--cInfo)"}
              icon={
                <IconHandcoin
                  size={26}
                  color={"var(--cWarning)"}
                  style={{ borderColor: "var(--cWarning)", borderWidth: 1 }}
                />
              }
              iconBorderColor="var(--cWarning)"
              backgroundColor={`rgba(${hexToRgb(expensaColor)}, 0.2)`}
              textColor="white"
              style={{ width: "100%", borderColor: "var(--cWarning)" }}
            />

            <WidgetDefaulterResume
              title={"Total de multas"}
              amount={`Bs ${formatNumber(extraData?.porCobrarMulta || 0)}`}
              pointColor={"var(--cError)"}
              icon={<IconMultas size={26} color={"#B382D9"} />}
              iconBorderColor="#B382D9"
              backgroundColor={`rgba(${hexToRgb(multaColor)}, 0.2)`}
              textColor="white"
              style={{ width: "100%", borderColor: "#B382D9" }}
            />
          </section>
        </div>
        <div className={styles.graphPanel}>
          <GraphBase
            data={{
              labels: ["Expensas", "Multas"],
              values: [
                {
                  name: "Expensas",
                  values: [extraData?.porCobrarExpensa || 0],
                },
                {
                  name: "Multas",
                  values: [extraData?.porCobrarMulta || 0],
                },
              ],
            }}
            chartTypes={["donut"]}
            background="darkv2"
            downloadPdf
            options={{
              // title: "Representación gráfica del estado general de morosos",
              subtitle: "",
              label: "Total de morosidad general entre expensas y multas",
              // Usar exactamente los mismos colores que los fondos de los widgets
              colors: [expensaColor, multaColor],
              height: 400,
              width: 400,
              centerText: "Total",
            }}
          />
        </div>
        <div
          style={{
            fontWeight: "Bold",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <div>Total de morosidad general entre expensas y multas: </div>
          <div style={{ fontSize: "var(--spL)" }}>
            Bs {formatNumber(totalMorosidad)}{" "}
          </div>
        </div>
      </div>
    );
  };
  // Función auxiliar para convertir colores hexadecimales a RGB
  const hexToRgb = (hex: any) => {
    // Eliminar el # si existe
    hex = hex.replace(/^#/, "");

    // Convertir hex a RGB
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return `${r}, ${g}, ${b}`;
  };

  return (
    <LoadingScreen>
      <div className={styles.container}>
        <h1 className={styles.title}>Morosos</h1>
        {/* <p className={styles.subtitle}>
          En esta sección tendrás una visión clara y detallada del estado
          financiero.
          <br />
          Podrás mantener un control sobre los pagos atrasados de los residentes
          y tomar medidas para garantizar la estabilidad financiera de tu
          condominio
        </p> */}

        {/* <WidgetDefaulterResume
            title={"Total de unidades morosas"}
            amount={`${defaultersLength}`}
            pointColor={"var(--cSuccess)"}
            icon={<IconHousing reverse size={26} color={'var(--cInfo)'} />}
            iconBorderColor="var(--cInfo)"
            iconColor="white"
            // backgroundColor={`red`}
            style={{maxWidth:250}}
            textColor="white"
          />  */}
        <WidgetDashCard
          title="Total de unidades morosas"
          data={`${defaultersLength}`}
          onClick={() => {}}
          icon={
            <IconHousing
              reverse
              size={32}
              color={"var(--cInfo)"}
              style={{ backgroundColor: "var(--cHoverInfo" }}
              circle
            />
          }
          className={styles.widgetResumeCard}
          style={{ maxWidth: 250 }}
        />

        <div className={styles.listContainer}>
          <List height={"calc(100vh - 370px)"} renderRight={renderRightPanel} />
        </div>
      </div>
    </LoadingScreen>
  );
};

export default DefaultersView;
