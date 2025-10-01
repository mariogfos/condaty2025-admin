"use client";
import { useEffect, useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Documents.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";
import RenderView from "./RenderView/RenderView";
import { IconDocs } from "@/components/layout/icons/IconsBiblioteca";

const lOptions = [
  { id: "ALL", name: "Todos" },
  { id: "O", name: "Residentes" },
  { id: "G", name: "Guardias" },
];

const Documents = () => {
  const { setStore } = useAuth();

  const mod = {
    modulo: "documents",
    singular: "Documento",
    plural: "Documentos",
    permiso: "",
    extraData: true,
    loadView: {
      fullType: "DET",
    },
    filter: true,
    export: true,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
      extraData?: Record<string, any>;
      noWaiting?: boolean;
      reLoad?: any;
    }) => <RenderView {...props} />,
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
        label: "Nombre",
        form: { type: "text" },
        list: {},
      },
      ext: {
        rules: [],
        api: "ae",
        label: "Extensión",
        list: false,
      },
      descrip: {
        rules: ["required"],
        api: "ae*",
        label: "Descripción",
        form: { type: "text" },
        list: {},
      },
      for_to: {
        rules: ["required"],
        api: "ae*",
        label: "Destino",
        form: { type: "select", options: lOptions },
        list: false,
        filter: {
          options: () => lOptions,
        },
      },
      doc: {
        rules: ["required"],
        api: "ae*",
        label: "Archivo",
        form: {
          type: "fileUpload",
          ext: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png"],
          style: { width: "100%" },
        },
        onRender: ({ item }: any) => {
          return (
            <a
              target="_blank"
              href={getUrlImages(
                "/DOC-" +
                  item.id +
                  "." +
                  (item.doc?.ext || item.ext) +
                  "?d=" +
                  item.updated_at
              )}
              rel="noopener noreferrer"
            >
              <p className={styles.viewButton}>Ver archivo</p>
            </a>
          );
        },
      },
    }),
    []
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
        height={"calc(100vh - 330px)"}
        emptyMsg="Lista de documentos vacía. Los documentos del condominio"
        emptyLine2="serán reflejados aquí, una vez sean cargados."
        emptyIcon={<IconDocs size={80} color="var(--cWhiteV1)" />}
      />
    </div>
  );
};

export default Documents;
