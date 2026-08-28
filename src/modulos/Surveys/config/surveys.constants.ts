import {
  SurveyItemData,
  SurveyStatus,
  SurveyStatusMap,
} from "../types/surveys.types";

/**
 * Status labels.
 *
 * This used to be a second, hand-written copy of `SurveyStatusMap` keyed by the
 * old letters and typed `Record<string, string>`. Two copies of the same map is
 * where a value goes missing, and the loose type is what stops `tsc` from
 * pointing at the call sites when the values change.
 */
export const SURVEY_STATUSES: Record<SurveyStatus, string> = SurveyStatusMap;

export const QUESTION_TYPES: Record<string, string> = {
  S: "Opción Única",
  M: "Opción Múltiple",
  E: "Escala (1-5/1-10)",
  T: "Texto Abierto",
};

export const DESTINY_TYPES: Record<string, string> = {
  T: "Todos",
  P: "Propietarios",
  R: "Residentes",
  A: "Administradores",
  D: "Departamento",
};
