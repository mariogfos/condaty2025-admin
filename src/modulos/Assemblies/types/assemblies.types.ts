/**
 * Tipos para el módulo de Asambleas
 */

export type AssemblyStatus = "S" | "P" | "C" | "X"; // Scheduled, InProgress, Completed, Cancelled
export type AssemblyType = "O" | "E" | "I"; // Ordinary, Extraordinary, Informative
export type AssemblyModality = "V" | "P" | "H"; // Virtual, Presencial, Hybrid
export type TargetAudience = "all_owners" | "residents" | "dependents";

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
  status: AssemblyStatus | string;
  quorum_required?: number;
  anonymous_voting?: boolean;
  target_audience?: TargetAudience;
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
  owner?: { id: number; name: string; dpto_id?: number };
  dpto?: { id: number; number: string };
}

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
}

// Labels para mostrar en UI
export const STATUS_LABELS: Record<AssemblyStatus, string> = {
  S: "Programada",
  P: "En progreso",
  C: "Completada",
  X: "Cancelada",
};

export const TYPE_LABELS: Record<AssemblyType, string> = {
  O: "Ordinaria",
  E: "Extraordinaria",
  I: "Informativa",
};

export const MODALITY_LABELS: Record<AssemblyModality, string> = {
  V: "Virtual",
  P: "Presencial",
  H: "Híbrida",
};

export const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  all_owners: "Todos los propietarios",
  residents: "Solo residentes",
  dependents: "Solo dependientes",
};