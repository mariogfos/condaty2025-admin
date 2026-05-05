export enum SurveyStatus {
  Draft = "D",
  Voting = "V", // Visible, participants can see but NOT vote
  Scheduled = "S",
  Active = "A",
  Paused = "P",
  Closed = "C",
  Disabled = "X",
}
export type QuestionType = "S" | "M" | "E" | "T"; // Single, Multiple, Scale, Text

export interface TargetCriteria {
  roles: Record<string, string>;
  unit_types: string[];
  only_arrears: boolean;
  only_current: boolean; // Nuevo: filtrar solo los que están al día
  vote_per_unit: boolean;
}

export interface SurveyQuestion {
  id?: number;
  survey_id?: number;
  question_text: string;
  description?: string;
  type: QuestionType | string;
  min_options?: number;
  max_options?: number;
  order: number;
  is_required: boolean;
  options?: SurveyOption[];
}

export interface SurveyOption {
  id?: number;
  survey_id?: number;
  squestion_id?: number;
  option_text: string;
  description?: string;
  order: number;
}

export interface SurveyConfig {
  id?: number;
  title: string;
  description?: string;
  target_criteria: TargetCriteria;
  status?: SurveyStatus;
  expires_at?: string | null;
  scheduled_at?: string | null;
  created_by?: string;
  published_at?: string | null;
  closed_at?: string | null;
  questions: SurveyQuestion[];
}

// Interfaz para la data de la tabla según como la trae el hook
export interface SurveyItemData extends SurveyConfig {
  destiny?: string;
  is_mandatory?: string;
  name?: string; // Para retrocompatibilidad
  squestions?: any[];
  sanswerscount?: number;
  created_by_id?: number | string;
  [key: string]: any;
}
