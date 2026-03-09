import React, { useEffect, useState } from "react";
import {
  Question,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  ScaleQuestion,
  TextQuestion,
} from "./QuestionInterfaces";
import {
  SingleChoiceQuestionComponent,
  MultipleChoiceQuestionComponent,
  TextQuestionComponent,
  ScaleQuestionComponent,
} from "./QuestionComponents";
import styles from "./SurveyList.module.css";
import SurveySingleChoice from "../SurveyFactory/SurveySingleChoice/SurveySingleChoice";
import SurveyMultipleChoice from "../SurveyFactory/SurveyMultipleChoice/SurveyMultipleChoice";
import SurveyOpenTextChoice from "../SurveyFactory/SurveyOpenTextChoice/SurveyOpenTextChoice";
import SurveyScaleChoice from "../SurveyScaleChoice/SurveyScaleChoice";
import {
  IconArrowDown,
  IconArrowUp,
} from "@/components/layout/icons/IconsBiblioteca";

interface SurveyListProps {
  formState: {
    questions: Question[];
  };
  setFormState: React.Dispatch<React.SetStateAction<{ questions: Question[] }>>;
}

const isSingleChoiceQuestion = (
  question: Question
): question is SingleChoiceQuestion => {
  return question.type === "S" && "nresp" in question;
};

const isMultipleChoiceQuestion = (
  question: Question
): question is MultipleChoiceQuestion => {
  return question.type === "S" && "min" in question && "max" in question;
};

const isScaleQuestion = (question: Question): question is ScaleQuestion => {
  return question.type === "E";
};

const isTextQuestion = (question: Question): question is TextQuestion => {
  return question.type === "T";
};

const SurveyList: React.FC<SurveyListProps> = ({ formState, setFormState }) => {
  // const [questions, setQuestions] :any= useState(formState);
  useEffect(() => {
    const _questions = formState?.questions;
    // console.log("useeffect entro");
    if (_questions) {
      // console.log("useeffect entro2");
      _questions.sort((a: any, b: any) => a.order - b.order);
      setFormState({ ...formState, questions: _questions });
    }
  }, []);

  const [editingQuestionIndex, setEditingQuestionIndex] = useState<
    number | null
  >(null);
  const [editingQuestionType, setEditingQuestionType] = useState<string>("");

  const onDeleteQuestion = (index: number) => {
    const newQuestions = [...formState?.questions];
    newQuestions.splice(index, 1);
    setFormState({ ...formState, questions: newQuestions });
  };

  const onEditQuestion = (index: number, type: string) => {
    setEditingQuestionIndex(index);
    setEditingQuestionType(type);
  };

  if (!Array.isArray(formState?.questions)) {
    return <div></div>;
  }

  const upOrder = (index: number) => {
    const newQuestions: any = [...formState?.questions];
    console.log("upOrder", index);
    if (index > 0) {
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[index - 1];
      newQuestions[index - 1] = temp;
      newQuestions.map((q: any, i: number) => (q.order = i));
      setFormState({ ...formState, questions: newQuestions });
      console.log("newQuestions", newQuestions);
    }
  };

  const downOrder = (index: number) => {
    const newQuestions: any = [...formState?.questions];
    console.log("downOrder", index);
    if (index < newQuestions.length - 1) {
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[index + 1];
      newQuestions[index + 1] = temp;
      newQuestions.map((q: any, i: number) => (q.order = i));
      setFormState({ ...formState, questions: newQuestions });
      console.log("newQuestions", newQuestions);
      // const temp = newQuestions[index + 1].order || 0;
      // newQuestions[index + 1].order = newQuestions[index].order || 1;
      // newQuestions[index].order = temp;
      // newQuestions.sort((a: any, b: any) => a.order - b.order);
      // setFormState({ ...formState, questions: newQuestions });
      // console.log("newQuestions", newQuestions);
    }
  };

  return (
    <>
      <div className={styles.surveylist}>
        {formState?.questions.map((question: any, index: number) => (
          <div style={{ position: "relative" }} key={index + "quetions"}>
            {isSingleChoiceQuestion(question) && (
              <SingleChoiceQuestionComponent
                key={index}
                question={question}
                onDelete={() => onDeleteQuestion(index)}
                onEdit={() => onEditQuestion(index, "SingleChoice")}
              />
            )}
            {isMultipleChoiceQuestion(question) && (
              <MultipleChoiceQuestionComponent
                key={index}
                question={question}
                onDelete={() => onDeleteQuestion(index)}
                onEdit={() => onEditQuestion(index, "MultipleChoice")}
              />
            )}
            {isScaleQuestion(question) && (
              <ScaleQuestionComponent
                key={index}
                question={question}
                onDelete={() => onDeleteQuestion(index)}
                onEdit={() => onEditQuestion(index, "Scale")}
              />
            )}
            {isTextQuestion(question) && (
              <TextQuestionComponent
                key={index}
                question={question}
                onDelete={() => onDeleteQuestion(index)}
                onEdit={() => onEditQuestion(index, "Text")}
              />
            )}
            {index < formState?.questions.length - 1 && (
              <IconArrowDown
                style={{
                  position: "absolute",
                  right: 16,
                  top: 16,
                  cursor: "pointer",
                }}
                onClick={() => downOrder(index)}
              />
            )}
            {index > 0 && (
              <IconArrowUp
                style={{
                  position: "absolute",
                  right: index < formState?.questions.length - 1 ? 44 : 16,
                  top: 16,
                  cursor: "pointer",
                }}
                onClick={() => upOrder(index)}
              />
            )}
          </div>
        ))}
      </div>
      {editingQuestionIndex !== null &&
        (() => {
          const questionToEdit = formState?.questions[editingQuestionIndex];
          switch (editingQuestionType) {
            case "SingleChoice":
              return (
                <SurveySingleChoice
                  formState={formState}
                  setFormState={setFormState}
                  setType={() => {
                    setEditingQuestionIndex(null);
                    setEditingQuestionType("");
                  }}
                  editingQuestion={questionToEdit as SingleChoiceQuestion}
                  editingIndex={editingQuestionIndex}
                />
              );
            case "MultipleChoice":
              return (
                <SurveyMultipleChoice
                  formState={formState}
                  setFormState={setFormState}
                  setType={() => {
                    setEditingQuestionIndex(null);
                    setEditingQuestionType("");
                  }}
                  editingQuestion={questionToEdit as MultipleChoiceQuestion}
                  editingIndex={editingQuestionIndex}
                />
              );
            case "Scale":
              return (
                <SurveyScaleChoice
                  formState={formState}
                  setFormState={setFormState}
                  setType={() => {
                    setEditingQuestionIndex(null);
                    setEditingQuestionType("");
                  }}
                  editingQuestion={questionToEdit as ScaleQuestion}
                  editingIndex={editingQuestionIndex}
                />
              );
            case "Text":
              return (
                <SurveyOpenTextChoice
                  formState={formState}
                  setFormState={setFormState}
                  setType={() => {
                    setEditingQuestionIndex(null);
                    setEditingQuestionType("");
                  }}
                  editingQuestion={questionToEdit as TextQuestion}
                  editingIndex={editingQuestionIndex}
                />
              );
            default:
              return null;
          }
        })()}
    </>
  );
};

export default SurveyList;
