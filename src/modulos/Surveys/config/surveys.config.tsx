import React from "react";
import { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import { GMT, compareDate, getDateStrMes } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import RenderForm from "../components/RenderForm/RenderForm";
import RenderView from "../components/RenderView/RenderView";
import {
  getStatusLabel,
  getDestinyLabel,
  SURVEY_STATUSES,
} from "./surveys.constants";
import { SurveyItemData } from "../types/surveys.types";
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
    scheduled_at: {
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
        onHide: (data: any) => !data.item.switch || data.item.switch === "N",
        disabled: (item: SurveyItemData) => {
          let hoy = new Date();
          hoy.setHours(hoy.getHours() - GMT);
          hoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
          return !!(item?.begin_at && new Date(item?.begin_at) <= hoy);
        },
      },
    },
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
        onHide: (data: any) => !data.item.switch || data.item.switch === "N",
        keyLeft: "begin_at",
        disabled: (item: SurveyItemData) =>
          !!(item.end_at && compareDate(item.end_at, new Date(), "<")),
      },
    },
    title: {
      rules: ["required"],
      api: "ae",
      label: "Título",
      form: {
        label: "Escribe el título de la encuesta",
        type: "text",
        disabled: (item: SurveyItemData) => {
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
        onRender: (props: any) => (
          <div className={styles.surveyName}>{props.item.title}</div>
        ),
      },
    },
    description: {
      rules: ["required"],
      api: "ae",
      label: "Descripción",
      form: { type: "textarea" },
    },
    switch: {
      rules: [],
      api: "ae",
      list: false,
      form: {
        precarga: "N",
        edit: {
          precarga: (data: any) => (data.data?.begin_at ? "Y" : "N"),
        },
      },
    },
    creator: {
      rules: [""],
      api: "",
      label: "Creado por",
      list: {
        onRender: (props: any) => (
          <div>
            {props.item.created_by ? props.item.created_by : "Sin usuario"}
          </div>
        ),
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
          { id: "A", name: "Administradores" },
          { id: "D", name: "Departamento" },
        ],
      },
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
      form: {
        type: "select",
        options: [
          { id: "Y", name: "Sí" },
          { id: "N", name: "No" },
        ],
      },
      list: {
        width: "100px",
        onRender: (props: any) => (
          <div>{props.item.is_mandatory === "Y" ? "Sí" : "No"}</div>
        ),
      },
    },
    squestions_count: {
      rules: [""],
      api: "",
      label: "Preguntas",
      list: {
        width: "150px",
        onRender: (props: any) => (
          <div>{props.item.squestions?.length || 0} preguntas</div>
        ),
      },
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
      form: {
        type: "select",
        options: SURVEY_STATUSES.filter((s) => s.value !== "X").map((s) => ({
          id: s.value,
          name: s.label,
        })),
      },
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
