import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getUrlImages } from "@/mk/utils/string";
import { useEffect, useState } from "react";
import style from "./EventsRenderView.module.css";
import {
  IconClarityForm,
  IconComment,
  IconLike,
  IconLocation,
  IconScanLine,
  IconUserAddline,
} from "@/components/layout/icons/IconsBiblioteca";
import WidgetBase from "@/components/Widgets/WidgetBase/WidgetBase";
import WidgetDonut from "@/components/Widgets/WidgetDonut/WidgetDonut";
import WidgetEducation from "@/components/Widgets/WidgetEducation/WidgetEducation";
import WidgetAge from "@/components/Widgets/WidgetAge/WidgetAge";
import Table from "@/mk/components/ui/Table/Table";
import HorizontalProgresiveBar from "@/mk/components/ui/HorizontalProgresiveBar/HorizontalProgresiveBar";
import { lComDestinies, RandomsColors } from "@/mk/utils/utils";
import {
  GMT,
  getDateStrMes,
  getDateTimeStrMes,
  getUTCNow,
} from "@/mk/utils/date";
import StatsCard from "@/mk/components/ui/StatsCard/StatsCard";
import EventStatsCard from "@/mk/components/ui/EventsStatsCard/EventStatsCards";
import ComparisonBar from "@/mk/components/ui/ComparisonBar/ComparisonBar";
import { formatNumber } from "@/mk/utils/numbers";

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}) => {
  const { data } = props?.item;
  const extraData = props?.extraData;
  const entidad = ["", "", "Lista", "Departamento", "Municipio", "Barrio"];

  let hoy: any = new Date();
  hoy.setHours(hoy.getHours() - GMT);
  hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const [sexGraphData, setSexGraphData] = useState<any>({
    labels: [],
    values: [],
  });
  const [assistGraphData, setAssistGraphData] = useState<any>({
    labels: [],
    values: [],
  });

  const {
    m = 0,
    f = 0,
    x = 0,
    0: incomplete = 0,
  } = props?.item?.metrics?.gender || {};
  const allGendersCountZero = m === 0 && f === 0 && x === 0 && incomplete === 0;
  const { withQr, withoutQr, newAff } = props?.item;
  const allQrsCountZero = withQr === 0 && withoutQr === 0 && newAff === 0;

  const header: any = [
    {
      key: "index",
      label: "Nº",
      width: "170px",
      onRender: (item: any) => item.i,
    },
    {
      key: "name",
      label: "Departamento",
    },
    {
      key: "afiliados",
      label: "Cantidad de afiliados",
      responsive: "onlyDesktop",
      style: { justifyContent: "flex-end", textAlign: "right" },
    },
    {
      key: "percentage_hab",
      label: "Porcentaje de asistencias",
      responsive: "onlyDesktop",
      style: { textAlign: "right", display: "block" },

      onRender: (item: any) => {
        const totalAfiliados = getTotalAfiliados(data, props?.item?.dptos);
        return (
          <HorizontalProgresiveBar
            total={totalAfiliados}
            current={item.item?.afiliados}
            height={24}
            color={RandomsColors[item.i]}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (props?.item?.metrics) {
      const { m, f, x, 0: incomplete } = props?.item?.metrics?.gender;
      const hombres = typeof m === "number" ? m : 0;
      const mujeres = typeof f === "number" ? f : 0;
      const prefieroNoDecirlo = typeof x === "number" ? x : 0;
      const incompleto = typeof incomplete === "number" ? incomplete : 0;
      const sexLabels = [
        "Hombres",
        "Mujeres",
        "Prefiero no decirlo",
        "No indicado",
      ];
      const sexValues = [
        { name: "Hombres", values: [hombres] },
        { name: "Mujeres", values: [mujeres] },
        { name: "Prefiero no decirlo", values: [prefieroNoDecirlo] },
        { name: "No indicado", values: [incompleto] },
      ];
      const newSexGraphData: any = {
        labels: sexLabels,
        values: sexValues,
      };
      setSexGraphData(newSexGraphData);

      const { withQr, withoutQr, newAff } = data;
      const assistLabels = ["Con QR", "Sin QR", "Nuevos registros"];
      const assistValues = [
        { name: "Con QR", values: [withQr] },
        { name: "Sin QR", values: [withoutQr] },
        { name: "Nuevos registros", values: [newAff] },
      ];
      const newAssistGraphData: any = {
        labels: assistLabels,
        values: assistValues,
      };
      setAssistGraphData(newAssistGraphData);
    }
  }, [props.item]);
  const getTotalAfiliados = (data: any, _dptos: any) => {
    let total = 0;

    const dptos = props?.item?.data?.dptos || props.item?.dptos;
    if (dptos?.forEach) {
      dptos?.data?.forEach((item: any) => {
        const d = props?.item?.data?.dptos[item?.id];
        if (d !== undefined) {
          total += d;
        }
      });
    } else {
      for (const key in dptos) {
        if (Object.hasOwnProperty.call(dptos, key)) {
          const element = dptos[key];
          const name = props?.extraData?.dptos?.find(
            (p: any) => p.id == key
          )?.name;

          if (element !== undefined) {
            total += element;
          }
        }
      }
    }

    return total;
  };
  const dataFormattedDptos = () => {
    let newData: any = [];
    const dptos = props?.item?.data?.dptos || props.item?.dptos;
    if (dptos?.forEach) {
      dptos?.forEach((item: any, i: number) => {
        const d = dptos[item?.id];
        const name =
          item?.name ||
          props?.extraData?.dptos?.find((p: any) => p.id == item?.id)?.name;

        newData.push({
          id: item?.id,
          name: name,
          afiliados: d,
        });
      });
    } else {
      for (const key in dptos) {
        if (Object.hasOwnProperty.call(dptos, key)) {
          const element = dptos[key];
          const name = props?.extraData?.dptos?.find(
            (p: any) => p.id == key
          )?.name;
          newData.push({
            id: key,
            name: name,
            afiliados: element,
          });
        }
      }
    }
    return newData;
  };
  const handleTableRowClick = (type: string, value: any) => {
    // setFilters((prevFilters) => ({
    //   ...prevFilters,
    //   [type]: value,
    // }));
  };

  // const getDestinys = () => {
  //   let lEntidad: any = [];
  //   data.edestinies.map((item: any, index: number) => {
  //     if (data.destiny == 2) {
  //       lEntidad.push({
  //         id: item.lista_id,
  //         name: extraData.listas.find((lista: any) => lista.id == item.lista_id)
  //           ?.name,
  //       });
  //     }
  //     if (data.destiny == 3) {
  //       lEntidad.push({
  //         id: item.dpto_id,
  //         name: extraData.dptos.find((dpto: any) => dpto.id == item.dpto_id)
  //           ?.name,
  //       });
  //     }
  //     if (data.destiny == 4) {
  //       lEntidad.push({
  //         id: item.mun_id,
  //         name: extraData.muns.find((mun: any) => mun.id == item.mun_id)?.name,
  //       });
  //     }
  //     if (data.destiny == 5) {
  //       lEntidad.push({
  //         id: item.barrio_id,
  //         name: extraData.barrios.find(
  //           (barrio: any) => barrio.id == item.barrio_id
  //         )?.name,
  //       });
  //     }
  //   });
  //   return lEntidad;
  // };
  console.log(
    lComDestinies.find((i: any) => i.id === data.destiny),
    "asas"
  );
  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title={"Detalle del evento"}
      buttonText=""
      buttonCancel=""
      fullScreen={true}
    >
      <div className={style["eventsContainer"]}>
        {data?.destiny != 0 && (
          <p style={{ marginBottom: 12, color: "var(--cInfo)" }}>
            Destino:{" "}
            {lComDestinies.find((i: any) => i.id === data.destiny)?.name}
          </p>
        )}
        <WidgetBase
          title={
            <div className={style["flexAndGap"]}>
              <h3 style={{ color: "var(--cWhite)" }}>
                Resumen general del evento{" "}
              </h3>
            </div>
          }
          subtitle={`Estadísticas generales del evento hasta el ${getDateStrMes(
            getUTCNow()
          )}`}
        >
          <section className={style["firstWidget"]}>
            <div
              className={style["cardEvent"]}
              style={{
                minWidth: 300,
                width: "50%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{ backgroundColor: "transparent", gap: 16 }}
                className={style["cardEventContainer"]}
              >
                <div>
                  <img
                    style={{
                      maxWidth: 360,
                      height: 280,
                      minWidth: 167,
                      width: "100%",
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                    src={getUrlImages(
                      "/EVENT-" +
                        data?.id +
                        "." +
                        data?.ext +
                        "?" +
                        data?.updated_at
                    )}
                  />
                </div>
                <div style={{ alignSelf: "normal" }}>
                  <section
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div
                      style={{
                        fontSize: "var(--sM) ",
                        color: "var(--cWhite)",
                        marginBottom: "var(--spM)",
                      }}
                    >
                      Fecha del evento: {getDateTimeStrMes(data?.date_at)}
                    </div>
                    {/* {
                differenceInDays( hoy,data?.date_at) < 0?
              <TagLabel
                label={"Finalizado"}
                styles={{
                  backgroundColor: "#00AF9033",
                  color: "var(--cSuccess)",
                  borderRadius: 4,
                }}
                icon={<IconCircleCheck size={10} color={"var(--cSuccess)"} />}
              />:  
              <TagLabel
              label={"En curso"}
              styles={{
                backgroundColor: "#39ACEC33",
                color: "var(--cInfo)",
                borderRadius: 4,
              }}
              icon={<IconFluentRecord size={10} color={"var(--cInfo)"} />}
            />
            
            } */}
                  </section>
                  <div className="tTitle" style={{ marginBottom: 8 }}>
                    {data?.name}
                  </div>
                  <div
                    // className="tSubtitle"
                    style={{
                      marginBottom: 8,
                      maxHeight: "100px",
                      overflowY: "auto",
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {data?.description}
                  </div>
                  {/* <div className={style["flexAndGap"]}>
                    <IconLocation />
                    <a
                      target="_blank"
                      href={data?.location}
                      className="tSubtitle"
                      style={{ color: "var(--cInfo)" }}
                    >
                      {data?.address || data?.location}
                    </a>
                  </div> */}
                </div>
              </div>
            </div>
            <div style={{ width: "100%" }}>
              <div className={style["flexAndGap"]}>
                <div className={style["cardEvent"]} style={{ maxWidth: 108 }}>
                  <h4 className={style["textBlackV2"]}>Reacciones</h4>

                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <section className={style["commentsAndLike"]}>
                      <IconLike color="var(--cInfo)" />
                      {formatNumber(data?.likes, 0)}
                    </section>
                    <section className={style["commentsAndLike"]}>
                      <IconComment />
                      {formatNumber(data?.comments?.length, 0)}
                    </section>
                  </div>
                </div>

                <EventStatsCard
                  value={formatNumber(data?.assists, 0)}
                  description="Personas que indicaron que iban a asistir"
                />
                <EventStatsCard
                  value={formatNumber(data?.attendances, 0)}
                  description="Personas que asistieron al evento"
                />
              </div>

              <div
                className={style["flexAndGap"]}
                style={{ marginTop: "var(--spM)" }}
              >
                <StatsCard
                  icon={
                    <IconScanLine
                      color={"var(--cAccent)"}
                      size={32}
                      style={{
                        backgroundColor: "var(--cHoverAccent)",
                        padding: 4,
                        borderRadius: "50%",
                        marginRight: 4,
                      }}
                    />
                  }
                  title="Registrados con QR"
                  value={formatNumber(data?.withQr, 0)}
                />
                <StatsCard
                  icon={
                    <IconClarityForm
                      color={"var(--cSuccess)"}
                      size={32}
                      style={{
                        backgroundColor: "var(--cHoverSuccess)",
                        padding: 4,
                        borderRadius: "50%",
                        marginRight: 4,
                      }}
                    />
                  }
                  title="Registrados sin QR"
                  value={formatNumber(data?.withoutQr, 0)}
                />
                <StatsCard
                  icon={
                    <IconUserAddline
                      color={"var(--cInfo)"}
                      size={32}
                      style={{
                        backgroundColor: "var(--cHoverInfo)",
                        padding: 4,
                        borderRadius: "50%",
                        marginRight: 4,
                      }}
                    />
                  }
                  title="Nuevos registros"
                  value={formatNumber(data?.newAff, 0)}
                />
              </div>

              <div
                className={style["flexAndGap"]}
                style={{ marginTop: "var(--spM)" }}
              >
                <section
                  className={`${style["cardEvent"]} ${style["flexAndGap"]}`}
                >
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ComparisonBar
                      data={{
                        total: data?.attendances,
                        progress: data?.assists,
                      }}
                      labels={{
                        totalLabel: "Personas que asistieron al evento",
                        progressLabel:
                          "Personas que indicaron que iban a asistir",
                      }}
                      colors={{
                        totalColor: "var(--cHoverError)",
                        progressColor: "var(--cError)",
                      }}
                      range={true}
                      height={300}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ComparisonBar
                      data={{
                        total: data?.assists,
                        progress: data?.assistsConfirm,
                      }}
                      labels={{
                        progressLabel:
                          "Personas que indicaron que iban a asistir",
                        totalLabel:
                          "Personas que indicaron que iban a asistir y si asistieron",
                      }}
                      colors={{
                        totalColor: "var(--cHoverWarning)",
                        progressColor: "var(--cWarning)",
                      }}
                      range={true}
                      height={300}
                    />
                  </div>
                </section>
                {/* <WidgetDonut
                  title={""}
                  emptyTitle={"No hay estadísticas"}
                  allCountZero={allQrsCountZero}
                  graphData={assistGraphData}
                  style={{ width: "50%", marginTop: 0 }}
                /> */}
              </div>
            </div>
          </section>
        </WidgetBase>
        <div
          style={{ marginTop: 12, display: "flex", flexDirection: "column" }}
        >
          <section style={{ display: "flex", width: "100%", gap: 12 }}>
            {/* <div style={{ width: "50%" }}>
              <WidgetAge
                widget2={props?.item?.metrics?.age}
                title={"Estadística por edad"}
              />
            </div> */}
            {/* <div style={{ width: "50%" }}>
              <WidgetBase
                title={`Cantidad de afiliados que asistieron `}
                style={{ marginBottom: "var(--sL)" }}
              >
                <Table
                  data={dataFormattedDptos()}
                  header={header}
                  className="striped"
                  sumarize={true}
                 
                />
              </WidgetBase>
            </div> */}
          </section>

          {/* <section style={{ display: "flex", width: "100%", gap: 12 }}>
            <section style={{ display: "flex", width: "50%" }}>
              <WidgetDonut
                title={"Estadísticas de sexo"}
                emptyTitle={"No hay estadísticas"}
                allCountZero={allGendersCountZero}
                graphData={sexGraphData}
                style={{ backgroundColor: "var(--cBlackV1)" }}
              />
            </section>
            <div style={{ width: "50%" }}>
              <WidgetEducation
                widget4={props?.item?.metrics?.education}
                title={"Estadística por educación"}
                educations={props?.extraData?.educations}
                className={style["widgetEducation"]}
              />
            </div>
          </section> */}
        </div>
      </div>
    </DataModal>
  );
};

export default RenderView;
