/**
 * Tipos para el módulo de Asambleas
 */

export enum AssemblyStatus {
  Scheduled = "S",
  InProgress = "P",
  Completed = "C",
  Cancelled = "X",
}

export enum AssemblyType {
  Ordinary = "O",
  Extraordinary = "E",
  Informative = "I",
}

export enum AssemblyModality {
  Virtual = "V",
  Presencial = "P",
  Hibrid = "H",
}

export enum TargetAudience {
  AllOwners = "all_owners",
  Residents = "residents",
  Dependents = "dependents",
}

/** Bloque de abstención inyectado en cada pregunta al cerrar la votación de asamblea */
export interface AbstentionStats {
  /** Si true: la abstención aparece como opción en la gráfica con % sobre total_expected */
  count_as_option: boolean;
  /** Unidades (dptos) registradas como asistentes */
  total_expected: number;
  /** Dptos que efectivamente emitieron voto */
  total_voted: number;
  /** Abstenciones = total_expected - total_voted */
  abstentions: number;
  /** % de abstención sobre el universo esperado */
  abstention_rate: number;
  /** % de participación = 100 - abstention_rate */
  participation_rate: number;
}

export interface Assembly {
  id: number;
  client_id: string;
  user_id: string;
  subject: string;
  description?: string;
  type: AssemblyType | string;
  participation?: string;
  start_time: string;
  end_time?: string;
  modality: AssemblyModality | string;
  meeting_url?: string;
  address?: string;
  address_url?: string;
  files?: any[];
  declarations?: string[];
  acta_file?: string;
  acta_uploaded_at?: string;
  status: AssemblyStatus | string;
  cancellation_observation?: string;
  quorum_required?: number;
  anonymous_voting?: boolean;
  target_audience?: TargetAudience;
  /** Si true: la abstención se muestra como opción en las gráficas de votación */
  count_abstention?: boolean;
  created_at?: string;
  updated_at?: string;
  // Relaciones cargadas
  user?: { id: number; name: string };
  attendances_count?: number;
  surveys_count?: number;
  surveys?: AssemblySurvey[];
}

export interface AssemblySurvey {
  id: number;
  title: string;
  status: string;
  order?: number;
  is_mandatory?: boolean | string;
}

export interface AssemblyAttendanceUnit {
  dpto: { id: number; nro: string; is_arrears?: boolean };
  role: string;
}

export interface AssemblyAttendance {
  id: number;
  assembly_id: number;
  owner_id: number;
  client_id: string;
  dpto_id?: number;
  role?: string;
  user_id?: number;
  joined_at: string;
  modality_type: "P" | "V"; // Presencial, Virtual
  represented_roles?: string[];
  // Relaciones cargadas
  owner?: {
    id: number;
    name: string;
    last_name: string;
    dpto_id?: number;
    url_avatar?: string;
    ci?: string;
  };
  dpto?: { id: number; nro: string; is_arrears?: boolean };
  // Agrupación por owner_id (para cuando un owner tiene múltiples unidades)
  units?: AssemblyAttendanceUnit[];
}

export const ROLE_LABELS: Record<string, string> = {
  owner_homeowner: "Propietario",
  owner_tenant: "Inquilino",
  dependent_of_homeowner: "Dependiente de Prop.",
  dependent_of_tenant: "Dependiente de Inq.",
};

export interface AssemblyStats {
  total_attendances: number;
  in_person_attendances: number;
  virtual_attendances: number;
  total_surveys: number;
  active_surveys: number;
  closed_surveys: number;
  quorum: QuorumInfo;
}

export interface QuorumInfo {
  total_units: number;
  attendees: number;
  quorum_percentage: number;
  required_percentage: number;
  quorum_met: boolean;
}

export interface AssemblyConfig {
  quorum_required: number;
  anonymous_voting: boolean;
  target_audience: TargetAudience;
  count_abstention: boolean;
}

/**
 * 🔴 Las etiquetas de estado NO se escriben acá: se re-exportan.
 *
 * Había dos tablas, y decían cosas distintas para el MISMO estado. Ésta decía
 * *"Completada"* y la de `config/assemblies.constants.ts` decía *"Finalizada"*
 * —el cambio de producto se aplicó de un solo lado—. Como cada componente
 * importaba de donde le quedaba más cerca, **la misma asamblea se leía distinta
 * según la pantalla**: "Finalizada" en el detalle y en la lista, "Completada"
 * en la tarjeta del dashboard y en el botón de cambiar estado.
 *
 * ⚠️ Y había un test pineando "Completada", que es la trampa peor: un pin sobre
 * la decisión equivocada hace que corregirla parezca la rotura.
 *
 * `TYPE_LABELS` y `MODALITY_LABELS` vivían acá duplicadas y **no las importaba
 * nadie** —todos los consumidores ya sacaban las suyas de `constants`—, así que
 * se fueron. Una copia sin lector es la próxima divergencia esperando.
 */
export { API_STATUS_LABELS as STATUS_LABELS } from "../config/assemblies.constants";

export const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all_owners: "Todos los propietarios",
  residents: "Solo residentes",
  dependents: "Solo dependientes",
};
