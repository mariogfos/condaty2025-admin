import React from "react";
import SurveySingleChoice from "./SurveySingleChoice/SurveySingleChoice";
import SurveyMultipleChoice from "./SurveyMultipleChoice/SurveyMultipleChoice";
import SurveyOpenTextChoice from "./SurveyOpenTextChoice/SurveyOpenTextChoice";
import SurveyScaleChoice from "../SurveyScaleChoice/SurveyScaleChoice";
export type SurveyType = "S" | "N" | "E" | "T";

export interface SurveyOption {
  id: string;
  label: string;
  value: string;
}

interface ModalProps {
  type: string;
  setType: any;
  formState: any;
  setFormState: (value: any) => void;
}

// Factory function
const SurveyModalFactory: React.FC<ModalProps> = ({
  formState,
  setFormState,
  setType,
  type,
}) => {
  switch (type) {
    case "S": // Single choice (opción única)
      return (
        <SurveySingleChoice
          formState={formState}
          setFormState={setFormState}
          setType={setType}
        />
      );
    case "N":
      return (
        <SurveyMultipleChoice
          formState={formState}
          setFormState={setFormState}
          setType={setType}
        />
      );
    case "E": // Escala
      return (
        <SurveyScaleChoice
          formState={formState}
          setFormState={setFormState}
          setType={setType}
        />
      );
    case "T": // Texto
      return (
        <SurveyOpenTextChoice
          formState={formState}
          setFormState={setFormState}
          setType={setType}
        />
      );
    default:
      return <div>Tipo de encuesta no reconocido</div>;
  }
};

export default SurveyModalFactory;
