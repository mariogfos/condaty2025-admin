"use client";
import { useEffect, useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Documents.module.css";
import { getUrlImages } from "@/mk/utils/string";
import { useAuth } from "@/mk/contexts/AuthProvider";

const lOptions = [
  { id: "O", name: "Residentes" },
  { id: "G", name: "Guardias" },
  { id: "A", name: "Todos" },
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
  };

  const paramsInitial = {
    perPage: 10,
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
        list: { width: "240px" },
      },
      descrip: {
        rules: ["required"],
        api: "ae*",
        label: "Descripción",
        form: { type: "text" },
        list: { width: "100%" },
      },
      for_to: {
        rules: ["required"],
        api: "ae*",
        label: "Destino",
        form: { type: "select", options: lOptions },
        list: { width: "120px" },
      },
      position: {
        rules: ["required"],
        api: "ae*",
        label: "Posición",
        form: { 
          type: "text" ,
          label: "Introduce un número del 0 al 5 para ordenar el documento",
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
    setStore({ title: mod.plural.toUpperCase() });
  }, []);

  const { userCan, List } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.style}>
      <List />
    </div>
  );
};

export default Documents;
