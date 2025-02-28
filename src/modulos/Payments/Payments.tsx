"use client";
import { useMemo } from "react";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./Payments.module.css";
import { getUrlImages } from "@/mk/utils/string";

import { getDateStrMes, getDateTimeStrMesShort } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";


const mod = {
  modulo: "payments",
  singular: "Ingreso",
  plural: "Ingresos",

  permiso: "",

  extraData: true,
  hideActions: {
    view: false,
    add: false,
    edit: false,
    del: false
  },
  saveMsg: {
    add: "Ingreso creado con éxito",
    edit: "Ingreso actualizado con éxito",
    del: "Ingreso eliminado con éxito"
  }
};

const paramsInitial = {
  perPage: 10,
  page: 1,
  fullType: "L",
  searchBy: "",
};

const Payments = () => {
  const fields = useMemo(
    () => ({

      id: { rules: [], api: "e" },  
      paid_at: {
        rules: [],
        api: "ae",
        label: "Fecha de Pago",
        form: {
          type: "date",
        },
        list: { 
          onRender: (props: any) => {
            return <div>{ getDateStrMes(props.item.paid_at) || "No pagado"}</div>;
          }
        },
      },

      category_id: {
        rules: ["required"],
        api: "ae",
        label: "Categoría",
        form: {
          type: "select",
          optionsExtra: "categories",
          placeholder: "Seleccione una categoría"
        },
        list: { 

          onRender: (props: any) => {
            return <div>{props.item.category?.name || `ID: ${props.item.category_id}`}</div>;
          }
        },
      },

      dptos: {
        rules: ["required"],
        api: "ae",
        label: "Unidad",
        form: {
          type: "select",
          options: (props: any) => props.extraData?.dptos.map((d: any) => ({ id: d.id, name: `${d.nro} - ${d.description}` })),
          placeholder: "Seleccione una unidad"

        },
        list: { 
          onRender: (props: any) => {
            // Buscar el objeto dpto correspondiente
            const dpto = props.extraData?.dptos?.find((d: any) => d.id === props.item.dptos);
            return <div>{dpto ? `${dpto.nro} - ${dpto.description}` : `ID: ${props.item.dptos}`}</div>;
          }
        },
      },
      type: {
        rules: ["required"],
        api: "ae",
        label: "Tipo de pago",

        form: {
          type: "select",
          options: [
            { id: "T", name: "Transferencia" },
            { id: "E", name: "Efectivo" },
            { id: "C", name: "Cheque" },
          ]
        },
        list: { 

          

          onRender: (props: any) => {
            const typeMap: Record<string, string> = {
              "T": "Transferencia",
              "E": "Efectivo",
              "C": "Cheque"
            };
            return <div>{typeMap[props.item.type] || props.item.type}</div>;
          }
        },
      },
      
      nro_id: {
        rules: [],
        api: "ae",
        label: "Número de Referencia",
        form: {
          type: "text",
          placeholder: "Ej: EDSFSDFSD"
        },


      },
      
      voucher: {
        rules: [],
        api: "ae",
        label: "Comprobante",
        form: {
          type: "text",
          placeholder: "Ej: c100"



      },
      
      obs: {
        rules: [],
        api: "ae",
        label: "Observaciones",
        form: {
          type: "textarea",
          placeholder: "Ej: descripcion test"

        }

        },
      },
      
file: {
  rules: [],
  api: "ae*",
  label: "Archivo",
  form: {
    type: "fileUpload",
    ext: ["pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "webp"],
    style: { width: "100%" },
  },
  onRenderView: ({ item, extraData }: any) => {
    if (!item.ext) return <div>Sin archivo</div>;
    return (
      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <Button 
          variant="primary" 
          onClick={() => {
            window.open(
              getUrlImages(
                "/DOC-" +
                  item.id +
                  "." +
                  item.ext +
                  "?d=" +
                  item.updated_at
              ),
              "_blank"
            );
          }}
        >
          Descargar comprobante
        </Button>
      </div>
    );
  },
  onRender: ({ item }: any) => {
    if (!item.ext) return <div>Sin archivo</div>;
    return (
    <a  
      target="_blank"
        href={getUrlImages(
          "/DOC-" +
            item.id +
            "." +
            item.ext +
            "?d=" +
            item.updated_at
        )}
        rel="noopener noreferrer"
      >
        <p className={styles.viewButton}>Ver archivo</p>
      </a>
    );
  },


        /*  
        list: { 
>>>>>>> marvin
          width: "120px",
          onRender: ({ item }: any) => {
            if (!item.ext) return <div>Sin archivo</div>;
            return (
              <a
                target="_blank"
                href={getUrlImages(
                  "/DOC-" +
                    item.id +
                    "." +
                    item.ext +
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

        */
        

      },
      
      status: {
        rules: [],
        api: "ae",
        label: "Estado",
        form: {
          type: "select",
          options: [
            { id: "P", name: "Pendiente" },
            { id: "C", name: "Completado" },
            { id: "R", name: "Rechazado" },
          ]
        },
        list: { 
          width: "120px",
          onRender: (props: any) => {
            const statusMap: Record<string, string> = {
              "P": "Pendiente",
              "C": "Completado",
              "R": "Rechazado"
            };
            return <div>{statusMap[props.item.status] || props.item.status}</div>;
          }
        },
      },
      

      amount: {
        rules: ["required", "number"],
        api: "ae",
        label: "Monto Total",
        form: { 
          type: "number",
          placeholder: "Ej: 100.00"
        },
        list: { 
          width: "120px",
          onRender: (props: any) => {
            return <div>${props.item.amount}</div>;

          }
        },
      },
    }),
    []
  );

  const {
    userCan,
    List,
    onView,
    onEdit,
    onDel,
    reLoad,
    onAdd
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Ingresos</h1>
      <List />
    </div>
  );
};

export default Payments;