export interface Option {
    id: number;
    option_text: string;
}

export interface BaseQuestion {
    id?: number;
    type: string;
    question_text: string;
    description?: string;
    order?: number;
}

export interface SingleChoiceQuestion extends BaseQuestion {
    type: 'S';
    min_options: number | string;
    max_options: number | string;
    soptions: Option[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
    type: 'M';
    min_options: number | string;
    max_options: number | string;
    soptions: Option[];
}

export interface ScaleQuestion extends BaseQuestion {
    type: 'E';
    min_options: string;
    max_options: string;
    soptions: Option[];
}

export interface TextQuestion extends BaseQuestion {
    type: 'T';
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | ScaleQuestion | TextQuestion;
