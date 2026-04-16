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
  is_mandatory?: boolean | string;
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
  dpto?: { id: number; nro: string };
}

export const ROLE_LABELS: Record<string, string> = {
  owner_titular: "Titular",
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
