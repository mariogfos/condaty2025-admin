import { SurveyItemData } from "../types/surveys.types";

export const SURVEY_STATUSES = [
  { value: "D", label: "Borrador" },
  { value: "S", label: "Programada" },
  { value: "A", label: "Activa" },
  { value: "P", label: "Pausada" },
  { value: "C", label: "Cerrada" },
  { value: "X", label: "Deshabilitada" },
];

export const QUESTION_TYPES = [
  { value: "S", label: "Opción Única" },
  { value: "M", label: "Opción Múltiple" },
  { value: "E", label: "Escala (1-5/1-10)" },
  { value: "T", label: "Texto Abierto" },
];

export const getStatusLabel = (status: string): string => {
  const found = SURVEY_STATUSES.find((s) => s.value === status);
  return found ? found.label : status;
};

export const getQuestionTypeLabel = (type: string): string => {
  const found = QUESTION_TYPES.find((q) => q.value === type);
  return found ? found.label : type;
};

export const getDestinyLabel = (destiny: string): string => {
  const destinyMap: Record<string, string> = {
    T: "Todos",
    P: "Propietarios",
    R: "Residentes",
    A: "Administradores",
    D: "Departamento",
  };
  return destinyMap[destiny] || destiny;
};
