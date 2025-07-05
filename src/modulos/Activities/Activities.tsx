// Activities.tsx - Componente principal
"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./Activities.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getNow } from "@/mk/utils/date";
import { getUrlImages } from "@/mk/utils/string";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import InvitacionInfo from "./QrTab/RenderView/RenderView";
import { IconDownload } from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import AccessesTab from "./AccessTab/AccessTab";
import PedidosTab from "./PedidosTab/PedidosTab";
import QRTab from "./QrTab/QrTab";
import InvitationsDetail from "./InvitationsDetail/InvitationsDetail";
import PedidosDetail from "./PedidosDetail/PedidosDetail";

type TabType = {
  value: string;
  text: string;
};

const tabs: TabType[] = [
  { value: "A", text: "Accesos" },
  { value: "Q", text: "QR" },
  { value: "P", text: "Pedidos" },
];

// Parámetros iniciales para cada tipo
const paramsInitialAccess = {
  fullType: "L",
  perPage: 20,
  page: 1,
};

const paramsInitialPedidos = {
  fullType: "L",
  page: 1,
  perPage: 20,
};

const paramsInitialQR = {
  fullType: "L",
  page: 1,
  perPage: 20,
};

const Activities = () => {
  const { user, showToast, setStore } = useAuth();
  const [typeSearch, setTypeSearch] = useState<string>("A");
  const [openInvitationInfo, setOpenInvitationInfo] = useState<boolean>(false);
  const [selectedInvitation, setSelectedInvitation] = useState<any | null>(
    null
  );
  const [openReport, setOpenReport] = useState<boolean>(false);
  const linkDownload = useRef<string>("");
  const { execute } = useAxios("", "GET", {});

  // useEffect(() => {
  //   setStore({ title: "ACTIVIDADES" });
  // }, []);

  // Manejo de invitaciones
  const handleItemClick = (item: any) => {
    setSelectedInvitation(item);
    setOpenInvitationInfo(true);
  };

  // Función para exportar datos según el tipo seleccionado
  const onExport = async (type: string) => {
    const modMap: Record<string, any> = {
      A: {
        modulo: "accesses",

        params: paramsInitialAccess,
      },
      P: {
        modulo: "others",

        params: paramsInitialPedidos,
      },
      Q: {
        modulo: "invitations",

        params: paramsInitialQR,
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

  return (
    <div className={styles.container1}>
      {/* Tabs de navegación */}
      {/* <TabsButtons tabs={tabs} sel={typeSearch} setSel={setTypeSearch} /> */}

      {/* Contenedor principal */}
      <div className={styles.contentContainer2}>
        {/* Contenido según pestaña activa */}
        <div className={styles.listWrapper}>
          <AccessesTab
            paramsInitial={paramsInitialAccess}
            onRowClick={handleItemClick}
          />

          {/* {typeSearch === "Q" && (
            <QRTab
              paramsInitial={paramsInitialQR}
              onRowClick={handleItemClick}
            />
          )}

          {typeSearch === "P" && (
            <PedidosTab
              paramsInitial={paramsInitialPedidos}
              onRowClick={handleItemClick}
            />
          )} */}
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
      {/* <InvitationsDetail
        open={true}
        onClose={() => setOpenInvitationInfo(false)}
      /> */}
      {/* <PedidosDetail open={true} onClose={() => setOpenInvitationInfo(false)} /> */}
    </div>
  );
};

export default Activities;
