"use client";
import { useEffect, useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Documents.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderView from "./RenderView/RenderView";
import { IconDocs } from "@/components/layout/icons/IconsBiblioteca";
import RenderForm from "./RenderForm/RenderForm";

export const lOptionsFortoDocument = [
  { id: "A", name: "Guardias y residentes" },
  { id: "O", name: "Residentes" },
  { id: "G", name: "Guardias" },
];

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
    // S57.5: kill legacy IconExport (D-38-5 pattern) + slot async pineado.
    // - export: false → kill legacy IconExport.
    // - exportAsync: { type: "documents", ... } → slot async que useCrud
    //   auto-renderea via AsyncExportButton (S36.5 pattern, idéntico a
    //   S52.5 Users + S54.5 Binnacle + S55.5 Alerts).
    // - type: "documents" → matchea el DocumentReportType pineado en S57
    //   backend (ReportTypeRegistry.auto-discovery).
    // - format: "pdf" → ReportGenerator chunked (S32). XLSX también soportado
    //   (S57 pineá excelRowProvider).
    // - auto-pasa searchBy + filterBy del store actual al Report.
    // Factory NO aplicada (D-45-3, binding): Documents pineá renderView +
    // renderForm con closures inline (RenderView/RenderForm). Cambio
    // mínimo inline es la opción correcta.
    export: false,
    exportAsync: {
      type: "documents",
      format: "pdf",
      label: "Exportar PDF",
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
      // ext: {
      //   rules: [],
      //   api: "a*e*",
      //   label: "Extensión",
      //   list: false,
      // },

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
      doc: {
        rules: ["required"],
        api: "ae*",
        label: "Archivo",
        prefix: "DOC-",
        form: {
          onchange: "",
          type: "fileUpload",
          ext: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
          maxSize: 30,
          style: { width: "100%" },
        },
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
