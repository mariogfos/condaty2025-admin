"use client";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./EventsAdmin.module.css";
import { useEffect, useMemo, useState } from "react";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Check from "@/mk/components/forms/Check/Check";

import ImportDataModal from "@/mk/components/data/ImportDataModal/ImportDataModal";
import {
  IconComment,
  IconConfirm,
  IconHealthWorkerForm,
  IconLike,
  IconPercentage,
} from "@/components/layout/icons/IconsBiblioteca";
import { formatNumber } from "@/mk/utils/numbers";
import RenderView from "../RenderView/RenderView";
import useCrudUtils from "@/modulos/shared/useCrudUtils";
import DataSearch from "@/mk/components/forms/DataSearch/DataSearch";
import { OPCIONES_DE_DESTINO } from "../eventEnums";

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: "L",
  searchBy: "",
};
// const isHide = (data: {
//   key: string;
//   user?: Record<string, any>;
//   item: Record<string, any>;
// }) => {
//   const level = data.user?.role.level;
//   // const level = 3;
//   if (data.key == "sublema_id") return level > 1;
//   if (data.key == "lista_id") return level > 2;
//   if (data.key == "dpto_id") return level > 4;
//   if (data.key == "local_id") return level > 5;
//   if (data.key == "barrio_id") return level > 6;
//   return false;
// };

const EventsAdmin = () => {
  // const { user } = useAuth();
  const mod: ModCrudType = {
    modulo: "v3/events",
    singular: "evento",
    plural: "Eventos",
    permiso: "events",
    extraData: true,
    // S66.5 (HALLAZGO-NEW-64): migrado al slot async S36.5.
    // S66 pineó EventsReportType backend (PR #151).
    export: false,
    // Fase 6 (2026-08-05): Eventos migró al motor declarativo.
    //
    // 🔴 `endpoint` y `supportedFormats` van JUNTOS: `useCrud` elige el botón
    // mirando `supportedFormats` y el botón viejo no recibe `endpoint`, así que
    // poner uno solo deja el export yendose por el motor viejo sin diferencia
    // visible en pantalla.
    exportAsync: {
      type: "events",
      format: "pdf",
      label: "Exportar",
      supportedFormats: ["pdf", "xlsx", "csv"],
      endpoint: "/v3/events", // sin `/api/`: el baseURL ya lo trae.
    },
    onHideActions: (item: any) => {
      return {
        hideEdit: item?.attendance_count > 0,

        hideDel: item?.attendance_count > 0,
      };
    },
    // import: true,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
    }) => <RenderView {...props} />,
    loadView: { fullType: "DET", extraData: 1 },
    saveMsg: {
      add: "Evento creado con éxito",
      edit: "Evento actualizado con éxito",
      del: "Evento eliminado con éxito",
    },
  };
  const onTop = (data: {
    user?: Record<string, any>;
    item: Record<string, any>;
    extraData: any;
    action: any;
  }) => {
    const extraData = data?.extraData;
    // 🔴 Acá había una cascada de destinos SEGMENTADOS —listas, departamentos,
    // municipios, barrios— y estaba muerta desde siempre. Se sacó con el flip
    // de `destiny` a numérico (api#458), y no por prolijidad: **el flip la
    // despertaba hasta el crash**.
    //
    // Cuatro evidencias de que nunca corrió:
    //
    //  1. comparaba `destiny == 2 | 3 | 4 | 5` mientras el `Select` de esta
    //     misma pantalla ofrecía `{id: "T" | "D" | "G" | "R"}`. Dos vocabularios
    //     en el mismo archivo: ninguna comparación dio verdadera jamás;
    //  2. leía `extraData.listas`, `.dptos`, `.muns` y `.barrios`, que los
    //     tendría que mandar una rama `EXTRA` del controller — **que no existe**;
    //  3. recorría `item.edestinies`, y la relación `edestinies()` del modelo
    //     está **comentada**: devuelve `null`;
    //  4. en producción no hay **una sola fila** de `events`.
    //
    // Con `destiny` ya numérico, `destiny == 2` pasaba a ser cierta y asignaba
    // `selDestinies = undefined`; el `.map()` de abajo reventaba la pantalla.
    const selDestinies: any[] = [];
    const lDestinies: any = data?.item?.lDestiny || [];

    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {selDestinies
          ?.filter((d: any) => lDestinies?.includes(d.id))
          .map((d: any, index: number, array: any[]) => (
            <p
              key={d.id}
              // className={styles.subtitle}
              style={{ color: "var(--cInfo)", marginTop: 4 }}
            >
              {d.name}
              {index < array.length - 1 ? "," : ""}
            </p>
          ))}
      </div>
    );
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      date: {
        // rules: ["required"],
        api: "ae",
        label: "Fecha",
        list: false,
        // list: { width: "420px" },
        // onRender: (item: any) => {
        //   return item?.item?.date_at;
        // },
      },
      destiny: {
        rules: ["required"],
        api: "ae",
        label: "Destino",
        // list: {
        //   width: "100px",
        //   onRender: (item: any) => {
        //     let destinys = ["", "", "Lista", "Departamento", "Municipio"];
        //     if (item?.item?.destiny == 0 || item?.item?.destiny == 1) {
        //       return "Todos";
        //     }
        //     if (user?.role.level == 3 && item?.item?.destiny == 2) {
        //       return "Mi lista";
        //     }
        //     if (user?.role.level == 3 && item?.item?.destiny == 3) {
        //       return "Mi departamento";
        //     }
        //     if (user?.role.level == 4 && item?.item?.destiny == 4) {
        //       return "Mi municipio";
        //     }
        //     // if (user?.role.level == 4 && item?.item?.destiny == 4) {
        //     //   return "Mi localidad";
        //     // }
        //     if (user?.role.level == 5 && item?.item?.destiny == 5) {
        //       return "Mi barrio";
        //     }
        //     return destinys[item?.item?.destiny];
        //   },
        // },
        list: false,
        form: {
          type: "select",
          options: OPCIONES_DE_DESTINO,
          // onLeft: leftDestiny,
          onTop: onTop,
          precarga: 0,
        },
      },
      // lDestiny: {
      //   rules: [],
      //   api: "ae",
      //   label: "",
      //   list: false,
      //   form: false,
      // },
      // candidate_id: {
      //   rules: ["required"],
      //   api: "ae",
      //   label: "Candidato",
      //   list: false,
      //   form: {
      //     type: "select",
      //     filter: true,
      //     options: ({ extraData }: any) => {
      //       let data: any = [];
      //       extraData?.candidates.map((c: any) => {
      //         if (c.status == "A")
      //           data.push({
      //             id: c.id,
      //             name:
      //               getFullName(c) +
      //               " - " +
      //               extraData?.typeCands?.find(
      //                 (t: any) => t.id == c.typecand_id
      //               )?.name,
      //           });
      //       });
      //       return data;
      //     },
      //   },
      // },

      date_at: {
        rules: ["required", "date"],
        api: "ae",
        label: "Fecha evento",
        // onHide: isHide,
        list: { width: "160px" },
        onRender: (item: any) => {
          return item?.item?.date_at;
        },
        form: {
          type: "datetime-local",
        },
      },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre del evento",
        list: true,
        form: { type: "text" },
      },
      description: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        list: false,
        form: { type: "textArea", lines: 6, isLimit: true, maxLength: 5000 },
      },
      reaction: {
        api: "ae",
        label: "Interacciones",
        list: { width: "120px" },
        style: { display: "flex", justifyContent: "center" },
        form: false,
        onRender: (item: any) => {
          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 14,
                gap: 24,
              }}
            >
              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <IconLike size={24} color={"var(--cInfo)"} />
                </div>
                {formatNumber(item?.item?.likes, 0)}
              </section>
              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <IconComment size={24} />
                </div>
                {formatNumber(item?.item?.comments_count, 0)}
              </section>
            </div>
          );
        },
      },
      attendance_count: {
        api: "",
        label: "Desempeño",
        list: { width: "260" },
        // list: true,
        style: { display: "flex", justifyContent: "center" },
        form: false,
        onRender: (item: any) => {
          const percentage =
            item?.item?.assists > 0
              ? (item?.item?.attendance_count / item?.item?.assists) * 100
              : 0;

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                fontSize: 14,
                gap: 24,
              }}
            >
              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <IconConfirm color={"var(--cSuccess)"} />
                </div>
                <div style={{ fontSize: "var(--sS)", marginBottom: 4 }}>
                  {formatNumber(item?.item?.assists, 0)}
                </div>
                <div>Asistirán</div>
              </section>{" "}
              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <IconHealthWorkerForm size={24} color={"var(--cAccent)"} />
                </div>
                <div style={{ fontSize: "var(--sS)", marginBottom: 4 }}>
                  {formatNumber(item?.item?.attendance_count, 0)}{" "}
                </div>
                <div>Asistieron</div>
              </section>
              <section
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 14,
                  }}
                >
                  <IconPercentage size={24} />
                </div>
                <div style={{ fontSize: "var(--sS)", marginBottom: 4 }}>
                  {formatNumber(percentage.toFixed(2), 0)}
                </div>
                <div>Asistencia</div>
              </section>
            </div>
          );
        },
      },
      address: {
        rules: ["required"],
        api: "ae",
        label: "Lugar del evento",
        list: false,
        form: {
          type: "text",
          label: "Lugar del evento",
        },
      },
      // location: {
      //   rules: ["required", "googleMapsLink"],
      //   api: "ae",
      //   label: "Link de ubicación",
      //   list: false,
      //   form: {
      //     type: "text",
      //     label: "Link de ubicación",
      //   },
      // },
      avatar: {
        rules: ["requiredFile*a"],
        api: "a*e*",
        label: "Suba una Imagen",
        list: false,
        form: {
          type: "imageUpload",
          prefix: "EVENT",
          style: { width: "100%" },
          // onRigth: rigthAvatar,
        },
      },
    }),
    []
  );

  const _onChange = (
    e: any,
    item: any,
    setItem: Function,
    setShowExtraModal: Function,
    action: any
  ) => {
    const { name, value } = e.target;
    let selDestinies: any = [];
    if (name.indexOf("destiny_") == 0) {
      const id = parseInt(name.replace("destiny_", ""));
      if (value) {
        setItem({
          ...item,
          lDestiny: [...item.lDestiny, id],
        });
      } else {
        setItem({
          ...item,
          lDestiny: item.lDestiny.filter((d: number) => d != id),
        });
      }

      return true;
    }

    // 🔴 La misma cascada muerta que en `onTop`, con la misma evidencia — y acá
    // era peor: abría un `ModalDestiny` con `extraData.listas` indefinido.
    let lDestiny = item.lDestiny || [];
    if (name == "destiny") {
      if (value != item.destiny) {
        setItem({ ...item, lDestiny: [] });
        lDestiny = [];
      }

      // ⚠️ Acá se abría el `ModalDestiny` con la lista segmentada. Sin esa
      // lista —que el back nunca mandó— el modal no tiene qué mostrar.
      setShowExtraModal(null);
    }
    return false;
  };
    // 🔴 Acá vivía `ModalDestiny`, el selector de destinos segmentados. Se
    // fue con las dos cascadas que lo abrían (api#458): nunca se pudo mostrar
    // —el back no manda las listas y la relación `edestinies()` del modelo está
    // comentada— y quedó sin un solo llamador. Se saca en vez de dejarlo
    // huérfano: un componente muerto invita a que alguien lo reconecte.


  // const onImport = () => {
  //   setOpenImport(true);
  // };

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    extraData,
    findOptions,
    showToast,
    execute,
    reLoad,
    getExtraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
    _onChange,
    // _onImport: onImport,
  });
  const { searchState, setSearchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
    title: "Eventos",
  });

  // const [openImport, setOpenImport] = useState(false);
  // useEffect(() => {
  //   setOpenImport(searchState == 3);
  // }, [searchState]);

  // F3: onResponse fue removido — llamaba a /events-automatic, endpoint
  // que NO existe en el API. Era código muerto (solo se invocaba desde
  // un <IconLike onClick={...} /> comentado en la línea que sigue).
  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  return (
    <div className={styles.roles}>
      {/* <IconLike onClick={() => onResponse()} /> */}
      <List actionsWidth="300px" />
      {/* {openImport && (
        <ImportDataModal
          open={openImport}
          onClose={() => {
            setSearchState(0);
            setOpenImport(false);
          }}
          mod={mod}
          showToast={showToast}
          reLoad={reLoad}
          execute={execute}
          getExtraData={getExtraData}
          // requiredCols="DEPARTAMENTO, HABITANTES, HABILITADOS, ESCANOS, CODE"
        />
      )} */}
    </div>
  );
};

export default EventsAdmin;
