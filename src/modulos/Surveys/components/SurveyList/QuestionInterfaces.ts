export interface Option {
    id: number;
    option_text: string;
}

export interface BaseQuestion {
    type: string;
    question_text: string;
    description: string;
}

export interface SingleChoiceQuestion extends BaseQuestion {
    type: 'S';
    nresp: number;
    soptions: Option[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
    type: 'S';
    min_options: string;
    max_options: string;
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
