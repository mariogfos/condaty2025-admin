// condaty-admin/src/modulos/Surveys/types/mySurveys.types.ts

export type SurveyFilterType = 'P' | 'R' | 'E'; // Pending, Responded, Expired

export interface MySurveyCount {
  P: number;
  R: number;
  E: number;
}

export interface SurveyQuestion {
  id: string;
  question_text: string;
  description?: string;
  type: 'S' | 'M' | 'E' | 'T';
  min_options?: number;
  max_options?: number;
  is_required: boolean;
  order: number;
  soptions?: SurveyOption[];
}

export interface SurveyOption {
  id: string;
  option_text: string;
  description?: string;
  order: number;
}

export interface SurveyDetail {
  id: string;
  title: string;
  description?: string;
  status: 'D' | 'S' | 'A' | 'P' | 'C' | 'X';
  is_mandatory: boolean;
  expires_at?: string;
  questions_count: number;
  squestions: SurveyQuestion[];
}

export interface SurveyListItem {
  id: string;
  title: string;
  description?: string;
  status: 'A' | 'C';
  is_mandatory: boolean;
  expires_at?: string;
  questions_count: number;
  can_respond: boolean;
  has_responded: boolean;
  estimated_audience?: number;
  participation_percentage?: number;
}

export interface SurveyAnswer {
  squestion_id: string;
  soption_id?: string;
  soption_ids?: string[];
  answer?: string;
}
