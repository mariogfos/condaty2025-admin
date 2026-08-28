import { AssemblyStatus } from "../types/assemblyStatus";

/**
 * 🔴 Las claves son NÚMEROS desde el flip del 2026-08-27 (api#439).
 *
 * Van por el enum y no por el literal a propósito: un `Record<number, string>`
 * escrito a mano se desincroniza en silencio, y el estado que falte no se ve
 * como un error — se ve como una celda vacía.
 */
export const API_STATUS_LABELS: Record<number, string> = {
  [AssemblyStatus.Scheduled]: "Programada",
  [AssemblyStatus.InProgress]: "En progreso",
  [AssemblyStatus.Completed]: "Finalizada", // Cambiado de Completada a Finalizada según diseño
  [AssemblyStatus.Cancelled]: "Cancelada",
};

export const STATUS_STYLE: Record<
  number,
  { color: string; backgroundColor: string }
> = {
  [AssemblyStatus.Scheduled]: { color: "#A78BFA", backgroundColor: "rgba(167, 139, 250, 0.15)" }, // Púrpura
  [AssemblyStatus.InProgress]: { color: "#FFCF4A", backgroundColor: "rgba(255, 207, 74, 0.15)" }, // Oro/Amarillo
  [AssemblyStatus.Completed]: { color: "var(--cSuccess)", backgroundColor: "var(--cHoverSuccess)" }, // Verde
  [AssemblyStatus.Cancelled]: { color: "var(--cError)", backgroundColor: "var(--cHoverError)" }, // Rojo
};

export const STATUS_OPTIONS = [
  { id: "ALL", name: "Todos" },
  { id: AssemblyStatus.Scheduled, name: "Programada" },
  { id: AssemblyStatus.InProgress, name: "En progreso" },
  { id: AssemblyStatus.Completed, name: "Finalizada" },
  { id: AssemblyStatus.Cancelled, name: "Cancelada" },
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

export const COLOR_BARS = [
  "linear-gradient(90deg, #4F46E5, #818CF8)", // Índigo a azul claro
  "linear-gradient(90deg, #EC4899, #F472B6)", // Rosa a rosa claro
  "linear-gradient(90deg, #10B981, #34D399)", // Esmeralda a verde claro
  "linear-gradient(90deg, #F59E0B, #FBBF24)", // Ámbar a amarillo
  "linear-gradient(90deg, #EF4444, #F87171)", // Rojo a rojo claro
  "linear-gradient(90deg, #6366F1, #A5B4FC)", // Azul medio a lavanda
  "linear-gradient(90deg, #14B8A6, #5EEAD4)", // Turquesa a menta
  "linear-gradient(90deg, #8B5CF6, #C4B5FD)", // Púrpura a violeta claro
  "linear-gradient(90deg, #F97316, #FDBA74)", // Naranja a durazno
  "linear-gradient(90deg, #06B6D4, #67E8F9)", // Cian a celeste
];
