"use client";
import { useEffect, useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Documents.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderView from "./RenderView/RenderView";
import { IconDocs } from "@/components/layout/icons/IconsBiblioteca";
import RenderForm from "./RenderForm/RenderForm";
import { lOptionsFortoDocument } from "./types/documentAudience";

export { lOptionsFortoDocument };


const Documents = () => {
  const { setStore } = useAuth();

  const mod = {
    modulo: "v3/documents",
    singular: "documento",
    plural: "documentos",
    permiso: "documents",
    titleAdd: "Nuevo",
    extraData: true,
    textSaveButtom: "Subir documento",
    loadView: {
      fullType: "DET",
    },
    filter: true,
    // `export: false` apaga el botón viejo; `exportAsync` es el del motor
    // declarativo del API (`Documents/Export/DocumentsExportConfig`), que el
    // job arma con los mismos `searchBy`/`filterBy` del listado.
    export: false,
    // Fase 6 (2026-08-05): Documentos migró al motor declarativo.
    //
    // 🔴 `endpoint` y `supportedFormats` son UNA sola cosa: `useCrud` elige
    // qué botón renderiza mirando `supportedFormats`, y el botón viejo no
    // recibe `endpoint`. Con uno solo, el export se sigue yendo por el motor
    // viejo sin ninguna diferencia visible.
    exportAsync: {
      type: "documents",
      format: "pdf",
      label: "Exportar",
      supportedFormats: ["pdf", "xlsx", "csv"],
      endpoint: "/v3/documents", // sin `/api/`: el baseURL ya lo trae.
    },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      noWaiting?: boolean;
      reLoad?: any;
    }) => <RenderView {...props} />,
    renderForm: (props: any) => <RenderForm {...props} />,
  };

  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: "L",
    searchBy: "",
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: "e" },
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre del documento",
        form: { type: "text" },
        list: { width: "280" },
      },
      for_to: {
        rules: ["required"],
        api: "ae*",
        label: "Visible para",
        form: { type: "select", options: lOptionsFortoDocument },
        list: { width: "280" },
        filter: {
          options: () => [
            { id: "ALL", name: "Todos" },
            ...lOptionsFortoDocument,
          ],
        },
      },
      descrip: {
        rules: ["required"],
        api: "ae*",
        label: "Descripción",
        form: { type: "textArea" },
        list: {},
      },
    }),
    [],
  );

  useEffect(() => {
    setStore({ title: "Documentos" });
  }, []);

  const { userCan, List } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.style}>
      <List
        height={"100%"}
        emptyMsg="Lista de documentos vacía. Los documentos del condominio"
        emptyLine2="serán reflejados aquí, una vez sean cargados."
        emptyIcon={<IconDocs size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};

export default Documents;
