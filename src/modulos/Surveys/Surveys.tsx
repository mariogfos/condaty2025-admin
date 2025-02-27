/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Surveys.module.css";
import { ReactNode, useMemo } from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateStrMes, GMT, compareDate } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { useRouter } from "next/navigation";
import useCrudUtils from "../shared/useCrudUtils";
import RenderItem from "../shared/RenderItem";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import RenderForm from "./RenderForm/RenderForm";
import RenderView from "./RenderView/RenderView";

interface SurveyItem {
  id?: string | number;
  name?: string;
  description?: string;
  status?: string;
  begin_at?: string | null; 
  end_at?: string | null;  
  destiny?: string;
  is_mandatory?: string;
  squestions?: any[];
  sanswerscount?: number;
  user?: any;
  [key: string]: any;
}

const paramsInitial = {
  fullType: "L",
  perPage: 10,
  page: 1,
  searchBy: "",
};

const Surveys = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const onHideActions = (item: SurveyItem) => {
    let hoy = new Date();
    hoy.setHours(hoy.getHours() - GMT);
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    if (item?.end_at && new Date(item?.end_at) < hoy) {
      return { hideEdit: true, hideDel: true };
    }
    if (item?.sanswerscount == 0) return { hideEdit: false, hideDel: false };
    if (item?.end_at && new Date(item?.end_at) < new Date())
      return { hideEdit: true, hideDel: true };
    if (item?.begin_at && new Date(item?.begin_at) <= new Date())
      return { hideEdit: false, hideDel: true };
    if (!item?.begin_at) return { hideEdit: true, hideDel: true };
    
    return {};
  };

  const mod: ModCrudType = {
    modulo: "surveys",
    singular: "Encuesta",
    plural: "Encuestas",
    saveMsg: {
      add: "Encuesta creada con éxito",
      edit: "Encuesta actualizada con éxito",
    },
    messageDel: (
      <p>
        ¿Estás seguro de eliminar esta encuesta?
        <br />
        Al momento de eliminarla, los afiliados ya no podrán responder y los
        resultados de esta encuesta se perderán
      </p>
    ),
    filter: true,
    permiso: "",
    extraData: true,

    hideActions: {
      view: false,
      add: false,
      edit: false,
      del: false
    },
    search: true,
    renderForm: (props: { onClose: any; open: any; item: any; setItem: any; errors: any; extraData: any; user: any; execute: any; setErrors: any; action: any; }) => {
      return (
        <RenderForm
          onClose={props.onClose}
          open={props.open}
          item={props.item}
          setItem={props.setItem}
          errors={props.errors}
          extraData={props.extraData}
          user={props.user}
          execute={props.execute}
          setErrors={props.setErrors}
          reLoad={reLoad}
          action={props.action}
        />
      );
    },
    renderView: (props: { open: boolean; onClose: any; item: Record<string, any>; onConfirm?: Function; onEdit?: Function; extraData?: any; }) => <RenderView {...props} />,
    loadView: { fullType: "DET" },
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      "A": "Activa",
      "I": "Inactiva",
      "F": "Finalizada",
      "D": "Borrador"
    };
    return statusMap[status] || status;
  };

  const getDestinyLabel = (destiny: string): string => {
    const destinyMap: Record<string, string> = {
      "T": "Todos",
      "P": "Propietarios",
      "R": "Residentes",
      "A": "Administradores"
    };
    return destinyMap[destiny] || destiny;
  };
  
  const renderState = (props: { item: SurveyItem }) => {
    let color = "var(--cWhite)";
    let texto = "Vigente";

    let hoy = new Date();
    hoy.setHours(hoy.getHours() - GMT);
    hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    if (props.item?.begin_at) {
      color = "var(--cWarning)";
      texto = "Programada";
    }
    if (props.item?.begin_at && new Date(props.item?.begin_at) <= hoy) {
      color = "var(--cInfo)";
      texto = "En curso";
    }
    if (props.item?.end_at && new Date(props.item?.end_at) < hoy) {
      color = "var(--cSuccess)";
      texto = "Finalizada";
    }
    return <div style={{ color }}>{texto}</div>;
  };

  const renderType = (props: { item: SurveyItem }) => {
    let text = "";
    if (props.item.begin_at && props.item.end_at) text = "Programada";
    if (!props.item.begin_at && !props.item.end_at) text = "Indefinida";

    return (
      <div>
        <p>{text}</p>
        {props.item.is_mandatory === "Y" && (
          <p style={{ color: "var(--cError)", fontSize: "var(--sS)" }}>
            (Obligatoria)
          </p>
        )}
      </div>
    );
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { 
          label: "Escribe tu pregunta",
          type: "text",
          disabled: (item: SurveyItem) => {
            let hoy = new Date();
            hoy.setHours(hoy.getHours() - GMT);
            hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            return (
              (item?.begin_at && new Date(item?.begin_at) <= hoy) ||
              (item?.sanswerscount && item?.sanswerscount > 0)
            );
          },
          onTop: () => {
            return (
              <div
                style={{
                  color: "white",
                  fontSize: "var(--sL)",
                  fontWeight: 600,
                  marginBottom: "var(--spXs)",
                }}
              >
                Título de la pregunta
              </div>
            );
          },
        },
        list: { 
          onRender: (props: { item: SurveyItem }) => {
            return <div className={styles.surveyName}>{props.item.name}</div>;
          }
        },
      },
      
      description: {
        rules: ["required"],
        api: "ae",
        label: "Descripción",
        form: { type: "textarea" },
        list: { 
          width: "300px",
          onRender: (props: { item: SurveyItem }) => {
            return <div className={styles.surveyDescription}>{props.item.description}</div>;
          }
        },
      },
      
      status: {
        rules: ["required"],
        api: "ae",
        label: "Estado",
        form: { 
          type: "select",
          options: [
            { id: "A", name: "Activa" },
            { id: "I", name: "Inactiva" },
            { id: "F", name: "Finalizada" },
            { id: "D", name: "Borrador" }
          ]
        },
        list: { 
          width: "100px",
          onRender: (props: { item: SurveyItem }) => {
            if (!props.item.status) return null;
            return (
              <div className={`${styles.statusBadge} ${styles[`status${props.item.status}`]}`}>
                {getStatusLabel(props.item.status)}
              </div>
            );
          }
        },
      },
      
      switch: {
        rules: [],
        api: "ae",
        list: false,
        form: {
          precarga: "N",
          edit: {
            precarga: (data: { data: { begin_at: any; }; }) => {
              return data.data?.begin_at ? "Y" : "N";
            },
          },
        },
      },
      
      begin_at: {
        rules: ["validateIf:switch,Y", "required", "greaterDate"],
        api: "ae",
        label: "Fecha inicio",
        form: { 
          onTop: () => {
            return (
              <p style={{ fontSize: 14, color: "var(--cBlackV2)" }}>
                Define el inicio y final de la encuesta para controlar cuándo
                estará disponible para los afiliados
              </p>
            );
          },
          type: "date",
          onHide: (data: { item: { switch: string; }; }) => !data.item.switch || data.item.switch === "N",
          disabled: (item: SurveyItem) => {
            let hoy = new Date();
            hoy.setHours(hoy.getHours() - GMT);
            hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            return !!(item?.begin_at && new Date(item?.begin_at) <= hoy);
          },
        },
        list: { 
          width: "120px",
          onRender: (props: { item: SurveyItem }) => {
            return <div>{getDateStrMes(props.item.begin_at)}</div>;
          }
        },
      },
      
      end_at: {
        rules: [
          "validateIf:switch,Y",
          "greaterDate",
          "greaterDate:begin_at",
          "required",
        ],
        api: "ae",
        label: "Fecha fin",
        form: { 
          type: "date",
          onHide: (data: { item: { switch: string; }; }) => !data.item.switch || data.item.switch === "N",
          keyLeft: "begin_at",
          disabled: (item: SurveyItem) => 
            !!(item.end_at && compareDate(item.end_at, new Date(), "<")),
        },
        list: { 
          width: "120px",
          onRender: (props: { item: SurveyItem }) => {
            return <div>{getDateStrMes(props.item.end_at)}</div>;
          }
        },
      },
      
      destiny: {
        rules: ["required"],
        api: "ae",
        label: "Destinatarios",
        form: { 
          type: "select",
          options: [
            { id: "T", name: "Todos" },
            { id: "P", name: "Propietarios" },
            { id: "R", name: "Residentes" },
            { id: "A", name: "Administradores" }
          ]
        },
        list: { 
          width: "120px",
          onRender: (props: { item: SurveyItem }) => {
            if (!props.item.destiny) return null;
            return <div>{getDestinyLabel(props.item.destiny)}</div>;
          }
        },
      },
      
      is_mandatory: {
        rules: ["required"],
        api: "ae",
        label: "Obligatoria",
        form: { 
          type: "select",
          options: [
            { id: "Y", name: "Sí" },
            { id: "N", name: "No" }
          ]
        },
        list: { 
          width: "100px",
          onRender: (props: { item: SurveyItem }) => {
            return <div>{props.item.is_mandatory === "Y" ? "Sí" : "No"}</div>;
          }
        },
      },
      
      squestions_count: {
        rules: [""],
        api: "",
        label: "Preguntas",
        list: { 
          width: "100px",
          onRender: (props: { item: SurveyItem }) => {
            return <div>{props.item.squestions?.length || 0} preguntas</div>;
          }
        },
      },
      
      votes: {
        label: "Votos",
        list: {
          width: 180,
          onRender: (props: { item: SurveyItem }) => {
            if (props.item?.sanswerscount === 1)
              return props.item?.sanswerscount + " afiliado votó";
            return props.item?.sanswerscount + " afiliados votaron";
          },
        },
      },
      
      type: {
        label: "Tipo",
        list: {
          width: "100",
          onRender: renderType,
        },
      },

      state: {
        label: "Estado",
        list: {
          width: 100,
          onRender: renderState,
        },
      },
      
      creator: {
        rules: [""],
        api: "",
        label: "Creado por",
        list: { 
          width: "180px",
          onRender: (props: { item: SurveyItem }) => {
            return <div>{props.item.user ? getFullName(props.item.user) : "Sin usuario"}</div>;
          }
        },
      },
      
      questions: {
        rules: [],
        api: "ae",
        list: false,
        // This is handled in the RenderForm component
      },
    };
  }, []);

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    onView,
    reLoad,
    execute,
    extraData
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  const { onLongPress, selItem, searchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const handleRowClick = (item: SurveyItem) => {
    onView(item);
  };

  const renderItem = (
    item: SurveyItem,
    i: number,
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={item.name}
          subtitle={`${item.description} - ${item.status ? getStatusLabel(item.status) : ''}`}
          variant="V1"
          active={selItem && selItem.id === item.id}
        />
      </RenderItem>
    );
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;
  
  return (
    <div className={styles.surveysContainer}>
      <h1 className={styles.title}>Encuestas</h1>
      <List 
        onTabletRow={renderItem}
        onRowClick={handleRowClick} 
      />
    </div>
  );
};

export default Surveys;