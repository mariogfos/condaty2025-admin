/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Surveys.module.css";
import { useMemo } from "react";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { useRouter } from "next/navigation";
import useCrudUtils from "../shared/useCrudUtils";
import RenderItem from "../shared/RenderItem";
import ItemList from "@/mk/components/ui/ItemList/ItemList";

const paramsInitial = {
  fullType: "L",
  perPage: 10,
  page: 1,
  searchBy: "",
};

const Surveys = () => {
  const router = useRouter();
  const { user } = useAuth();
  
  const mod: ModCrudType = {
    modulo: "surveys",
    singular: "Encuesta",
    plural: "Encuestas",
    filter: true,
    permiso: "",
    extraData: false,
    hideActions: {
      view: false,
      add: false,
      edit: false,
      del: false
    },
    search: true
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "A": "Activa",
      "I": "Inactiva",
      "F": "Finalizada",
      "D": "Borrador"
    };
    return statusMap[status] || status;
  };

  const getDestinyLabel = (destiny: string) => {
    const destinyMap: Record<string, string> = {
      "T": "Todos",
      "P": "Propietarios",
      "R": "Residentes",
      "A": "Administradores"
    };
    return destinyMap[destiny] || destiny;
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: "e" },
      
      name: {
        rules: ["required"],
        api: "ae",
        label: "Nombre",
        form: { type: "text" },
        list: { 
          
          onRender: (props: any) => {
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
          onRender: (props: any) => {
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
          onRender: (props: any) => {
            return (
              <div className={`${styles.statusBadge} ${styles[`status${props.item.status}`]}`}>
                {getStatusLabel(props.item.status)}
              </div>
            );
          }
        },
      },
      
      begin_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha inicio",
        form: { type: "date" },
        list: { 
          width: "120px",
          onRender: (props: any) => {
            return <div>{getDateStrMes(props.item.begin_at)}</div>;
          }
        },
      },
      
      end_at: {
        rules: ["required"],
        api: "ae",
        label: "Fecha fin",
        form: { type: "date" },
        list: { 
          width: "120px",
          onRender: (props: any) => {
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
          onRender: (props: any) => {
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
          onRender: (props: any) => {
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
          onRender: (props: any) => {
            return <div>{props.item.squestions?.length || 0} preguntas</div>;
          }
        },
      },
      
      creator: {
        rules: [""],
        api: "",
        label: "Creado por",
        list: { 
          width: "180px",
          onRender: (props: any) => {
            return <div>{props.item.user ? getFullName(props.item.user) : "Sin usuario"}</div>;
          }
        },
      }
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
    onView
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

  const handleRowClick = (item: any) => {
    onView(item);
  };

  const renderItem = (
    item: Record<string, any>,
    i: number,
    onClick: Function
  ) => {
    return (
      <RenderItem item={item} onClick={onClick} onLongPress={onLongPress}>
        <ItemList
          title={item.name}
          subtitle={`${item.description} - ${getStatusLabel(item.status)}`}
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