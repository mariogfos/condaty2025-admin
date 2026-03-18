import React from "react";
import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import RenderForm from "../components/RenderForm/RenderForm";
import RenderView from "../components/RenderView/RenderView";
import { SURVEY_STATUSES } from "./surveys.constants";
import { getPeriodOptions } from "@/mk/utils/periodFilterOptions";

import styles from "../Surveys.module.css";
import { getArrayFromObject } from "@/mk/utils/array";

const lSurveyStatus = () =>
  getArrayFromObject(SURVEY_STATUSES, [
    { id: "ALL", name: "Todos los estados" },
  ]);

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
    permiso: "surveys",
    onHideActions: (item: any) => {
      return {
        hideDel: item.status == SURVEY_STATUSES.CLOSED || item.total_voters > 0,
        hideEdit:
          item.status == SURVEY_STATUSES.CLOSED || item.total_voters > 0,
      };
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
          reLoad={props.reLoad}
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
      label: "Fecha",
      list: {
        width: "160px",
        onRender: (props: any) => (
          <div>{getDateTimeStrMes(props.item.created_at)}</div>
        ),
      },
      filter: {
        key: "created_at",
        label: "Período",
        options: getPeriodOptions,
      },
    },
    scheduled_at: {
      rules: ["validateIf:switch,Y", "required", "greaterDate"],
      api: "ae",
      label: "Fecha inicio",
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

      list: true,
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
      list: false,
    },
    target_criteria: {
      rules: ["required"],
      api: "ae",
      label: "Destinatarios",
      list: false,
    },
    is_mandatory: {
      rules: ["required"],
      api: "ae",
      label: "Obligatoria",

      list: false,
      //  {
      //   width: "100px",
      //   onRender: (props: any) => (
      //     <div>{props.item.is_mandatory === "Y" ? "Sí" : "No"}</div>
      //   ),
      // },
    },
    questions_count: {
      rules: [""],
      api: "",
      label: "Preguntas",
      list: {
        width: "100px",
      },
    },
    votes: {
      label: "Votos",
      list: {
        width: "100px",
        onRender: (props: any) => (
          <div>
            {props.item.total_voters}/{props.item.estimated_audience}
          </div>
        ),
      },
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
              {SURVEY_STATUSES[props.item.status]}
            </div>
          );
        },
      },
      filter: {
        label: "Estado",
        options: lSurveyStatus,
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
