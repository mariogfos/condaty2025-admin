/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import styles from "./Activities.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateStrMes, getNow } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import useCrudUtils from "../shared/useCrudUtils";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import InvitacionInfo from "./InvitacionInfo/InvitacionInfo";
import {
  IconDownload,
  IconGroupsQr,
  IconSingleQr,
} from "@/components/layout/icons/IconsBiblioteca";
import Dropdown from "@/mk/components/ui/Dropdown/Dropdown";
import useAxios from "@/mk/hooks/useAxios";

type TabType = {
  value: string;
  text: string;
};

const tabs: TabType[] = [
  { value: "A", text: "Accesos" },
  { value: "Q", text: "QR" },
  { value: "P", text: "Pedidos" },
];

// Parámetros iniciales simplificados
const paramsInitialAccess = {
  fullType: "L",
  perPage: 10,
  page: 1,
};

const paramsInitialPedidos = {
  fullType: "L",
  page: 1,
  perPage: 10,
};

const paramsInitialQR = {
  fullType: "L",
  page: 1,
  perPage: 10,
  sortBy: "invitations.date_event,invitations.created_at",
  orderBy: "desc,desc",
  joins: "visits|owners",
  relations:
    "access|access.guardia|access.out_guard|access.visit:id,name,middle_name,last_name,mother_last_name,ci,phone|guests:id,invitation_id,visit_id,access_id,status|owner:id,ci,name,middle_name,last_name,mother_last_name,phone|guests.visit:id,name,middle_name,last_name,mother_last_name,ci|guests.access:id,invitation_id,visit_id,in_at,out_at,obs_in,obs_out,plate",
  searchBy: "|__date__date_event,<=," + getNow() + ",,,",
};

const Activities = () => {
  const router = useRouter();
  const { user, showToast } = useAuth();
  const [typeSearch, setTypeSearch] = useState<string>("A");
  const [openInvitationInfo, setOpenInvitationInfo] = useState<boolean>(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any | null>(
    null
  );
  const [openReport, setOpenReport] = useState<boolean>(false);
  const linkDownload = useRef<string>("");
  const { execute } = useAxios("", "GET", {});

  const { setStore } = useAuth();
  useEffect(() => {
    setStore({ title: "ACTIVIDADES" });
  }, []);

  // Definición de los módulos para cada tipo de datos
  const modAccess: ModCrudType = useMemo(() => {
    return {
      modulo: "accesses",
      singular: "Acceso",
      plural: "Accesos",
      filter: true,
      permiso: "",
      export: true,
      extraData: false,
      hideActions: {
        view: true,
        add: true,
        edit: true,
        del: true,
      },
      search: true,
    };
  }, []);

  const modQR: ModCrudType = useMemo(() => {
    return {
      modulo: "invitations",
      singular: "Invitación",
      plural: "Invitaciones QR",
      filter: true,
      permiso: "",
      export: true,
      extraData: false,
      hideActions: {
        view: true,
        add: true,
        edit: true,
        del: true,
      },
      search: true,
    };
  }, []);

  const modPedidos: ModCrudType = useMemo(() => {
    return {
      modulo: "others",
      singular: "Pedido",
      plural: "Pedidos",
      filter: true,
      permiso: "",
      extraData: false,
      export: true,
      hideActions: {
        view: true,
        add: true,
        edit: true,
        del: true,
      },
      search: true,
    };
  }, []);

  // Definición de campos para los accesos - CORREGIDO
  const fieldsAccess = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      visit_id: {
        rules: [""],
        api: "",
        label: "Visitante",
        list: {
          onRender: (props: any) => {
            return getFullName(props.item.visit);
          },
        },
      },

      in_at: {
        rules: [""],
        api: "",
        label: "Entrada",
        list: {
          onRender: (props: any) => {
            return <div>{getDateStrMes(props.item.in_at || "")}</div>;
          },
        },
      },

      out_at: {
        rules: [""],
        api: "",
        label: "Salida",
        list: {
          width: "140px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.out_at
                  ? getDateStrMes(props.item.out_at)
                  : "No registrada"}
              </div>
            );
          },
        },
      },

      plate: {
        rules: [""],
        api: "",
        label: "Placa",
        list: {
          width: "100px",
          onRender: (props: any) => {
            return <div>{props.item.plate || "Sin placa"}</div>;
          },
        },
      },

      owner_id: {
        rules: [""],
        api: "",
        label: "Residente",
        list: {
          width: "180px",
          onRender: (props: any) => {
            return getFullName(props.item.owner);
          },
        },
      },

      guard_id: {
        rules: [""],
        api: "",
        label: "Guardia",
        list: {
          onRender: (props: any) => {
            return getFullName(props.item.guardia);
          },
        },
      },

      type: {
        rules: [""],
        api: "",
        label: "Tipo",
        list: {
          width: "100px",
          onRender: (props: any) => {
            const typeMap: Record<string, string> = {
              C: "Control",
              G: "Grupo",
              I: "Individual",
              P: "Pedido",
            };
            return (
              <div>
                {typeMap[props.item.type] || props.item.type || "Sin tipo"}
              </div>
            );
          },
        },
      },
    };
  }, []);

  // Definición de campos para las invitaciones QR
  const fieldsQR = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      date_event: {
        rules: [""],
        api: "",
        label: "Fecha",
        list: {
          onRender: (props: any) => {
            return <div>{getDateStrMes(props.item.date_event || "")}</div>;
          },
        },
      },

      owner: {
        rules: [""],
        api: "",
        label: "Residente",
        list: {
          width: "180px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.owner
                  ? getFullName(props.item.owner)
                  : "Sin residente"}
              </div>
            );
          },
        },
      },

      title: {
        rules: [""],
        api: "",
        label: "Título",
        list: {
          width: "180px",
          onRender: (props: any) => {
            return (
              <div className={styles.invitationTitle}>
                {props.item.title || "Sin título"}
              </div>
            );
          },
        },
      },

      type: {
        rules: [""],
        api: "",
        label: "Tipo",
        list: {
          width: "80px",
          onRender: (props: any) => {
            return (
              <div className={styles.invitationTypeIcon}>
                {props.item.type === "G" ? (
                  <IconGroupsQr className={styles.groupIcon} />
                ) : (
                  <IconSingleQr className={styles.singleIcon} />
                )}
              </div>
            );
          },
        },
      },

      status: {
        rules: [""],
        api: "",
        label: "Estado",
        list: {
          width: "100px",
          onRender: (props: any) => {
            let statusLabel = "Activa";
            let statusClass = "statusA";

            if (props.item.status === "X") {
              statusLabel = "Anulada";
              statusClass = "statusX";
            } else if (props.item.access && props.item.access.length === 0) {
              statusLabel = "Expirada";
              statusClass = "statusE";
            }

            return (
              <div className={`${styles.statusBadge} ${styles[statusClass]}`}>
                {statusLabel}
              </div>
            );
          },
        },
      },

      guests_count: {
        rules: [""],
        api: "",
        label: "Invitados",
        list: {
          width: "100px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.guests ? props.item.guests.length : 0} invitados
              </div>
            );
          },
        },
      },
    };
  }, []);

  // Definición de campos para los pedidos
  const fieldsPedidos = useMemo(() => {
    return {
      id: { rules: [], api: "e" },

      descrip: {
        rules: [""],
        api: "",
        label: "Descripción",
        list: {
          onRender: (props: any) => {
            return (
              <div className={styles.pedidoDescripcion}>
                {props.item.descrip || "Sin descripción"}
              </div>
            );
          },
        },
      },

      otherType: {
        rules: [""],
        api: "",
        label: "Tipo",
        list: {
          width: "120px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.otherType ? props.item.otherType.name : "Sin tipo"}
              </div>
            );
          },
        },
      },

      owner: {
        rules: [""],
        api: "",
        label: "Residente",
        list: {
          width: "180px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.owner
                  ? getFullName(props.item.owner)
                  : "Sin residente"}
              </div>
            );
          },
        },
      },

      access: {
        rules: [""],
        api: "",
        label: "Entrada",
        list: {
          width: "140px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.access?.in_at
                  ? getDateStrMes(props.item.access.in_at)
                  : "No registrada"}
              </div>
            );
          },
        },
      },

      access_out: {
        rules: [""],
        api: "",
        label: "Salida",
        list: {
          width: "140px",
          onRender: (props: any) => {
            return (
              <div>
                {props.item.access?.out_at
                  ? getDateStrMes(props.item.access.out_at)
                  : "No registrada"}
              </div>
            );
          },
        },
      },
    };
  }, []);

  // Instancias de useCrud para cada tipo de datos
  const {
    userCan: userCanAccess,
    List: ListAccess,

    onSearch: onSearchAccess,
    searchs: searchsAccess,
    data: accessData,
    reLoad: reLoadAccess,
    params: paramsAccess,
    setParams: setParamsAccess,
  } = useCrud({
    paramsInitial: paramsInitialAccess,
    mod: modAccess,
    fields: fieldsAccess,
  });

  const {
    userCan: userCanQR,
    List: ListQR,

    onSearch: onSearchQR,
    searchs: searchsQR,
    data: qrData,
    reLoad: reLoadQR,
    params: paramsQR,
    setParams: setParamsQR,
  } = useCrud({
    paramsInitial: paramsInitialQR,
    mod: modQR,
    fields: fieldsQR,
  });

  const {
    userCan: userCanPedidos,
    List: ListPedidos,

    onSearch: onSearchPedidos,
    searchs: searchsPedidos,
    data: pedidosData,
    reLoad: reLoadPedidos,
    params: paramsPedidos,
    setParams: setParamsPedidos,
  } = useCrud({
    paramsInitial: paramsInitialPedidos,
    mod: modPedidos,
    fields: fieldsPedidos,
  });

  // Manejo de invitaciones
  const handleQRClick = (invitation: any) => {
    setSelectedInvitation(invitation);
    setOpenInvitationInfo(true);
  };

  // Función para exportar datos
  const onExport = async (type: string) => {
    const modMap: Record<string, any> = {
      A: {
        modulo: "accesses",
        exportCols:
          "visit.name,in_at,out_at,plate,owner.name,guardia.name,out_guard.name",
        exportTitulo: "Historial de Accesos",
        exportTitulos:
          "Visitante,Entrada,Salida,Placa,Residente,Guardia,G.Salida",
        params: paramsAccess,
      },
      P: {
        modulo: "others",
        exportCols:
          "descrip,access.in_at,access.out_at,owner.name,access.guardia.name,access.out_guard.name",
        exportTitulo: "Historial de Pedidos",
        exportTitulos: "Pedido,Ingreso,Salida,Residente,Guardia,G.Salida",
        params: paramsPedidos,
      },
      Q: {
        modulo: "invitations",
        exportCols:
          "_text|aa [1]|(_if|(_count|access)|>|0|(_count|access)|(_text|Expirado))",
        exportTitulo: "Historial de Invitaciones QR",
        exportTitulos: "Fecha,Visita,Residente,Acceso,Guardia",
        params: paramsQR,
      },
    };

    const currentMod = modMap[typeSearch];

    const { data: file } = await execute("/" + currentMod.modulo, "GET", {
      ...currentMod.params,
      _export: type,
      exportCols: currentMod.exportCols || "",
      exportTitulo: currentMod.exportTitulo,
      exportTitulos: currentMod.exportTitulos || "",
      exportAnchos: currentMod.exportAnchos || "",
    });

    if (file?.success === true) {
      linkDownload.current = getUrlImages("/" + file?.data?.path);
      setOpenReport(true);
    } else {
      showToast("No hay datos para exportar", "warning");
    }
  };

  // Efectos para manejar las rutas de los dropdowns
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        if (hash === "#pdf") onExport("pdf");
        else if (hash === "#xls") onExport("xls");
        else if (hash === "#csv") onExport("csv");

        // Limpiar el hash después de procesarlo
        setTimeout(() => {
          window.location.hash = "";
        }, 100);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [typeSearch]);

  // Validaciones de permisos
  const canAccess = userCanAccess(modAccess.permiso, "R");
  const canQR = userCanQR(modQR.permiso, "R");
  const canPedidos = userCanPedidos(modPedidos.permiso, "R");

  if (typeSearch === "A" && !canAccess) return <NotAccess />;
  if (typeSearch === "Q" && !canQR) return <NotAccess />;
  if (typeSearch === "P" && !canPedidos) return <NotAccess />;

  return (
    <div className={styles.container}>
      {/* Tabs de navegación */}
      <TabsButtons tabs={tabs} sel={typeSearch} setSel={setTypeSearch} />

      {/* Contenedor principal */}
      <div className={styles.contentContainer}>
        {/* Acciones generales */}
        {/* <div className={styles.actionsRow}>
          <div className={styles.exportContainer}>
            <Dropdown
              trigger={<IconDownload className={styles.exportIcon} />}
              items={[
                { name: "PDF", route: "#pdf" },
                { name: "Excel", route: "#xls" },
                { name: "CSV", route: "#csv" }
              ]}
            />
          </div>
        </div> */}

        {/* Contenido según pestaña activa */}
        <div className={styles.listWrapper}>
          {typeSearch === "A" && canAccess && (
            <ListAccess onRowClick={handleQRClick} />
          )}

          {typeSearch === "Q" && canQR && <ListQR onRowClick={handleQRClick} />}

          {typeSearch === "P" && canPedidos && (
            <ListPedidos onRowClick={handleQRClick} />
          )}
        </div>
      </div>

      {/* Modal para reportes */}
      <DataModal
        open={openReport}
        onClose={() => setOpenReport(false)}
        title="Reporte de descargas"
        buttonText=""
        buttonCancel=""
      >
        <div className={styles.downloadContainer}>
          <a
            href={linkDownload.current}
            className={styles.downloadLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IconDownload size={48} className={styles.downloadIcon} />
            Click para descargar
          </a>
        </div>
      </DataModal>

      {/* Modal para detalles de invitación */}
      {selectedInvitation && openInvitationInfo && (
        <InvitacionInfo
          open={openInvitationInfo}
          onClose={() => setOpenInvitationInfo(false)}
          data={selectedInvitation}
          onOut={null}
          onIn={null}
        />
      )}
    </div>
  );
};

export default Activities;
