/**
 * En que situacion esta una encuesta.
 *
 * Numeric since 1 (flip 2026-08-28, api#444). It used to be char-backed
 * (D/V/S/A/P/C/X). The order follows the survey lifecycle -- draft, visible,
 * scheduled, active, paused, closed, disabled -- not the old letters.
 *
 * `Visible` means participants can SEE the survey but cannot vote yet; the one
 * that accepts votes is `Active`.
 */
export enum SurveyStatus {
  Draft = 1,
  Visible = 2, // Visible, participants can see but NOT vote
  Scheduled = 3,
  Active = 4,
  Paused = 5,
  Closed = 6,
  Disabled = 7,
}

/**
 * Labels, typed by the enum on purpose.
 *
 * A `Record<string, string>` here would let any key index the map, which is
 * exactly what keeps `tsc` from finding the call sites when the values change.
 */
export const SurveyStatusMap: Record<SurveyStatus, string> = {
  [SurveyStatus.Draft]: "Borrador",
  [SurveyStatus.Visible]: "Visible",
  [SurveyStatus.Scheduled]: "Programada",
  [SurveyStatus.Active]: "Activa",
  [SurveyStatus.Paused]: "Pausada",
  [SurveyStatus.Closed]: "Cerrada",
  [SurveyStatus.Disabled]: "Deshabilitada",
};

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
