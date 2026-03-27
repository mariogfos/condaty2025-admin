import { SurveyItemData } from "../types/surveys.types";

export const SURVEY_STATUSES: Record<string, string> = {
  D: "Borrador",
  S: "Programada",
  A: "Activa",
  P: "Pausada",
  C: "Cerrada",
  X: "Deshabilitada",
};

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
