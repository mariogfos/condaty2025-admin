// src/modulos/Assemblies/config/assemblies.constants.ts
import { AssemblyStatus, AssemblyType, AssemblyModality, TargetAudience } from "../types/assemblies.types";

export const API_STATUS_LABELS: Record<string, string> = {
  S: "Programada",
  P: "En progreso",
  C: "Finalizada", // Cambiado de Completada a Finalizada según diseño
  X: "Cancelada",
};

export const STATUS_STYLE: Record<string, { color: string; backgroundColor: string }> = {
  S: { color: "var(--cWarning)", backgroundColor: "var(--cHoverCompl4)" },
  P: { color: "#FFCF4A", backgroundColor: "rgba(255, 207, 74, 0.15)" },
  C: { color: "var(--cSuccess)", backgroundColor: "var(--cHoverSuccess)" },
  X: { color: "var(--cError)", backgroundColor: "var(--cHoverError)" },
};

export const STATUS_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: "S", name: "Programada" },
  { id: "P", name: "En progreso" },
  { id: "C", name: "Finalizada" },
  { id: "X", name: "Cancelada" },
];

export const TYPE_OPTIONS = [
  { id: "O", name: "Ordinaria" },
  { id: "E", name: "Extraordinaria" },
  { id: "I", name: "Informativa" },
];

export const MODALITY_OPTIONS = [
  { id: "V", name: "Virtual" },
  { id: "P", name: "Presencial" },
  { id: "H", name: "Híbrida" },
];

export const AUDIENCE_OPTIONS = [
  { id: "all_owners", name: "Todos los propietarios" },
  { id: "residents", name: "Solo residentes" },
  { id: "dependents", name: "Solo dependientes" },
];

export const STATUS_LABELS: Record<string, string> = API_STATUS_LABELS;

export const TYPE_LABELS: Record<string, string> = {
  O: "Asamblea Ordinaria",
  E: "Asamblea Extraordinaria",
  I: "Asamblea Informativa",
};

export const MODALITY_LABELS: Record<string, string> = {
  V: "Virtual",
  P: "Presencial",
  H: "Híbrida",
};
