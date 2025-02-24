"use client";
import { useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Documents.module.css";
import useCrudUtils from "../shared/useCrudUtils";
import { getUrlImages } from "@/mk/utils/string";
import DataModal from "@/mk/components/ui/DataModal/DataModal";

// Definición de tipos para TypeScript
interface DocumentFile {
  ext: string;
}


interface DocumentItem {
  id: number | string;
  name: string;
  descrip: string;
  for_to: string;
  doc?: DocumentFile;
  ext?: string;
  position: number | string;
  created_at: string;
  updated_at: string;
}

interface DetailViewProps {
  open: boolean;
  onClose: () => void;
  item: any;
  execute: (url: string, method: string, data: any, refresh?: boolean, noWaiting?: boolean) => Promise<any>;
  extraData: Record<string, any>;
  onEdit?: (item: DocumentItem) => void;
  onDel?: (item: DocumentItem) => void;
}

// Componente de vista detallada personalizado según el diseño original
const DocumentDetailView = ({ open, onClose, item, execute, extraData, onEdit, onDel }: DetailViewProps) => {
    console.log(item,'item desde detail view');



    console.log('extra data desde detail view')
  return (
    <DataModal
      open={open}
      onClose={onClose}
      title={"Información del Documento"}
      buttonText=""
      buttonCancel=""
    >
      <div className={styles.detailContainer}>
        <div className={styles.fieldTitle}>Nombre del documento</div>
        <div className={styles.fieldValue}>{item.name}</div>
        
        <div className={styles.documentActions}>
          <a
            target="_blank"
            href={getUrlImages(
              "/DOC-" + item.data.id + "." + (item.data.doc?.ext || item.data.ext) + "?d=" + item.data.updated_at
            )}
            rel="noopener noreferrer"
          >
            <p className={styles.viewButton}>Ver archivo</p>
          </a>
        </div>
        
        <div className={styles.fieldTitle}>
          Descripción
          {!item.descrip ? (
            <div className={styles.emptyField}>Sin registrar</div>
          ) : (
            <div className={styles.fieldDescription}>{item.descrip}</div>
          )}
        </div>
        
        <div className={styles.fieldTitle}>
          Destino
          <div className={styles.fieldValue}>
            {item.for_to === "O" ? "Residentes" : 
             item.for_to === "G" ? "Guardias" : 
             item.for_to === "A" ? "Todos" : item.for_to}
          </div>
        </div>
        
        <div className={styles.fieldTitle}>
          Posición
          <div className={styles.fieldValue}>{item.position}</div>
        </div>
      </div>
    </DataModal>
  );
};

const options = [
  { id: "O", name: "Residentes" },
  { id: "G", name: "Guardias" },
  { id: "A", name: "Todos" },
];

const Documents = () => {
  // Esta función se usará para renderizar la vista de detalle personalizada
  const renderDocumentView = (props: DetailViewProps) => {
    return (
      <DocumentDetailView
        open={props.open}
        onClose={props.onClose}
        item={props.item}
        execute={props.execute}
        extraData={props.extraData}
        onEdit={props.onEdit}
        onDel={props.onDel}
      />
    );
  };

  const mod = {
    modulo: "documents",
    singular: "Documento",
    plural: "Documentos",
    permiso: "",
    extraData: true,
    renderView: renderDocumentView,
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
        form: { type: "select", options: options },
        list: { width: "120px" },
        onRender: (props: { item: DocumentItem }) => {
          const destinoMap: Record<string, string> = {
            "O": "Residentes",
            "G": "Guardias",
            "A": "Todos"
          };
          return destinoMap[props.item.for_to] || props.item.for_to;
        },
      },
      doc: {
        rules: ["required"],
        api: "ae*",
        label: "Archivo",
        form: { type: "fileUpload", ext: ["pdf", "doc", "docx", "xls", "xlsx","jpg","jpeg","png"], style: { width: "100%" } },
      },
      position: {
        rules: ["required"],
        api: "ae*",
        label: "Orden",
        form: { type: "text" },
      },
    }),
    []
  );

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
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });
  
  const { onLongPress, selItem } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  
  return (
    <div className={styles.style}>
      <List />
    </div>
  );
};

export default Documents;