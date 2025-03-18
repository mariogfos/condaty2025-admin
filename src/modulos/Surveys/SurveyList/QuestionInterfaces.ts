export interface Option {
    id: number;
    name: string;
}

export interface BaseQuestion {
    type: string;
    name: string;
    description: string;
}

export interface SingleChoiceQuestion extends BaseQuestion {
    type: 'S';
    nresp: number;
    options: Option[];
    soptions?: Option[];
}

export interface MultipleChoiceQuestion extends BaseQuestion {
    type: 'S';
    min: string;
    max: string;
    options: Option[];
    soptions?: Option[];
}

export interface ScaleQuestion extends BaseQuestion {
    type: 'E';
    min: string;
    max: string;
    options: Option[];
    soptions?: Option[];
}

export interface TextQuestion extends BaseQuestion {
    type: 'T';
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | ScaleQuestion | TextQuestion;
