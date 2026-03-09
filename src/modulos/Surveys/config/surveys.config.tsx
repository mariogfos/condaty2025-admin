import React from "react";
import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import RenderForm from "../components/RenderForm/RenderForm";
import RenderView from "../components/RenderView/RenderView";
import { getStatusLabel, getDestinyLabel, SURVEY_STATUSES } from "./surveys.constants";

import styles from "../Surveys.module.css";

export const getSurveyConfig = (
  reLoad: any,
): { mod: ModCrudType; fields: any } => {
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
      del: false,
    },
    search: true,
    renderForm: (props: any) => {
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
    renderView: (props: any) => <RenderView {...props} />,
    loadView: { fullType: "DET" },
  };


  const fields = {
    id: { rules: [], api: "e" },

    created_at: {
      rules: [],
      api: "ae",
      label: "Fecha creación",
      list: {
        onRender: (props: any) => (
          <div>{getDateStrMes(props.item.created_at)}</div>
        ),
      },
    },
    scheduled_at: {
      rules: ["validateIf:switch,Y", "required", "greaterDate"],
      api: "ae",
      label: "Fecha inicio2",

    },
    expires_at: {
      rules: [
        "validateIf:switch,Y",
        "greaterDate",
        "greaterDate:begin_at",
        "required",
      ],
      api: "ae",
      label: "Fecha fin",

    },
    title: {
      rules: ["required"],
      api: "ae",
      label: "Título",

      list: {
        onRender: (props: any) => (
          <div className={styles.surveyName}>{props.item.title}</div>
        ),
      },
    },
    description: {
      rules: ["required"],
      api: "ae",
      label: "Descripción",

    },
    switch: {
      rules: [],
      api: "ae",
      list: false,

    },
    created_by_name: {
      rules: [""],
      api: "",
      label: "Creado por",
      list: true
    },
    destiny: {
      rules: ["required"],
      api: "ae",
      label: "Destinatarios",

      list: {
        width: "120px",
        onRender: (props: any) => {
          if (!props.item.destiny) return null;
          return <div>{getDestinyLabel(props.item.destiny)}</div>;
        },
      },
    },
    is_mandatory: {
      rules: ["required"],
      api: "ae",
      label: "Obligatoria",

      list: {
        width: "100px",
        onRender: (props: any) => (
          <div>{props.item.is_mandatory === "Y" ? "Sí" : "No"}</div>
        ),
      },
    },
    questions_count: {
      rules: [""],
      api: "",
      label: "Preguntas",
      list: true,
    },
    votes: {
      label: "Votos",
    },
    type: {
      label: "Tipo",
    },
    status: {
      rules: ["required"],
      api: "ae",
      label: "Estado",

      list: {
        width: "100px",
        onRender: (props: any) => {
          if (!props.item.status) return null;
          return (
            <div
              className={`${styles.statusBadge} ${styles[`status${props.item.status}`]}`}
            >
              {getStatusLabel(props.item.status)}
            </div>
          );
        },
      },
    },
    questions: {
      rules: [],
      api: "ae",
      list: false,
    },
  };

  return { mod, fields };
};
