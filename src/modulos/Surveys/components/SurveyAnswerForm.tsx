"use client";
import React, { useState, useEffect } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./SurveyAnswerForm.module.css";
import { useMySurveys } from "../hooks/useMySurveys";
import SurveyQuestion from "./Questions/SurveyQuestion";
import SingleChoice from "./Questions/SingleChoice";
import MultipleChoice from "./Questions/MultipleChoice";
import ScaleChoice from "./Questions/ScaleChoice";
import TextChoice from "./Questions/TextChoice";
import useToast from "@/mk/hooks/useToast";
import { useAuth } from "@/mk/contexts/AuthProvider";

interface SurveyAnswerFormProps {
  survey: any;
  onClose: () => void;
  onSuccess: () => void;
  isMandatory?: boolean;
}

const SurveyAnswerForm: React.FC<SurveyAnswerFormProps> = ({
  survey: initialSurvey,
  onClose,
  onSuccess,
  isMandatory = false,
}) => {
  const [surveyDetail, setSurveyDetail] = useState<any>(initialSurvey);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const { showToast } = useAuth();

  const { fetchSurveyDetail, submitAnswers } = useMySurveys();

  useEffect(() => {
    const loadDetail = async () => {
      if (!initialSurvey.id) return;

      // Solo cargamos si no tenemos las preguntas ya
      if (!initialSurvey.squestions || initialSurvey.squestions.length === 0) {
        setIsLoadingDetail(true);
        const detail = await fetchSurveyDetail(initialSurvey.id);
        if (detail) {
          setSurveyDetail(detail);
        }
        setIsLoadingDetail(false);
      }
    };

    loadDetail();
    setStartTime(new Date().toISOString());
  }, [initialSurvey.id, fetchSurveyDetail]);

  const handleSingleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { squestion_id: questionId, soption_id: optionId },
    }));
    setErrors((prev) => ({ ...prev, [questionId]: "" }));
  };

  const handleMultiSelect = (
    questionId: string,
    optionId: string,
    currentlySelected: boolean,
    maxOptions?: number,
  ) => {
    const current = answers[questionId]?.soption_ids || [];

    // Si estamos seleccionando (no deseleccionando) y ya llegamos al máximo
    if (
      currentlySelected &&
      maxOptions &&
      maxOptions > 0 &&
      current.length >= maxOptions
    ) {
      setErrors((prev) => ({
        ...prev,
        [questionId]: `Máximo ${maxOptions} opciones permitidas`,
      }));
      return;
    }

    const newOptions = currentlySelected
      ? [...current, optionId]
      : current.filter((id: string) => id !== optionId);

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { squestion_id: questionId, soption_ids: newOptions },
    }));
    setErrors((prev) => ({ ...prev, [questionId]: "" }));
  };

  const handleScaleSelect = (
    questionId: string,
    value: number,
    options: any[],
  ) => {
    // Buscar la opción que coincida con el valor seleccionado
    const option = options.find((o) => parseInt(o.option_text) === value);

    if (option) {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          squestion_id: questionId,
          soption_id: option.id,
          answer: value.toString(),
        },
      }));
      setErrors((prev) => ({ ...prev, [questionId]: "" }));
    }
  };

  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { squestion_id: questionId, answer: value },
    }));
    setErrors((prev) => ({ ...prev, [questionId]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    surveyDetail.squestions?.forEach((question: any) => {
      const answer = answers[question.id];
      const selectedCount = answer?.soption_ids?.length || 0;
      const isEmpty =
        !answer?.soption_id && !(selectedCount > 0) && !answer?.answer;

      if (question.is_required && isEmpty) {
        newErrors[question.id] = "Esta pregunta es obligatoria";
        isValid = false;
      } else if (question.type === "M") {
        const min = parseInt(question.min_options);
        const max = parseInt(question.max_options);

        if (min > 0 && selectedCount < min) {
          newErrors[question.id] =
            `Debe seleccionar al menos ${min} ${min === 1 ? "opción" : "opciones"}`;
          isValid = false;
        } else if (max > 0 && selectedCount > max) {
          newErrors[question.id] =
            `Puede seleccionar un máximo de ${max} ${max === 1 ? "opción" : "opciones"}`;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const answersList = Object.values(answers).filter(
        (a: any) =>
          a.soption_id ||
          (a.soption_ids && a.soption_ids.length > 0) ||
          a.answer,
      );

      // En el administrador no enviamos dpto_id
      const endTime = new Date().toISOString();
      const response = await submitAnswers(
        surveyDetail.id,
        "",
        answersList as any,
        startTime || undefined,
        endTime,
      );

      if (response.success) {
        onSuccess();
      } else {
        showToast(
          response?.data?.message ||
            response?.message ||
            "Error al enviar respuestas",
          "error",
        );
        setErrors({
          _general:
            response.message ||
            "Error al enviar respuestas. Inténtelo de nuevo.",
        });
      }
    } catch (err: any) {
      setErrors({ _general: err.message || "Error al enviar respuestas" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: any, index: number) => {
    const error = errors[question.id];

    const getConstraintHint = () => {
      if (question.type !== "M") return null;
      const min = parseInt(question.min_options);
      const max = parseInt(question.max_options);

      if (min > 0 && max > 0) {
        if (min === max)
          return `Seleccione exactamente ${min} ${min === 1 ? "opción" : "opciones"}`;
        return `Seleccione entre ${min} y ${max} opciones`;
      }
      if (min > 0)
        return `Seleccione al menos ${min} ${min === 1 ? "opción" : "opciones"}`;
      if (max > 0) return `Máximo ${max} ${max === 1 ? "opción" : "opciones"}`;
      return null;
    };

    const hint = getConstraintHint();
    const description = question.description
      ? hint
        ? `${question.description} (${hint})`
        : question.description
      : hint
        ? hint
        : "";

    return (
      <SurveyQuestion
        key={question.id}
        index={index}
        label={question.question_text}
        description={description}
        required={question.is_required}
        error={error}
      >
        {(() => {
          switch (question.type) {
            case "S":
              return (
                <SingleChoice
                  options={question.soptions}
                  value={answers[question.id]?.soption_id}
                  onChange={(optionId) =>
                    handleSingleSelect(question.id, optionId as string)
                  }
                  disabled={isSubmitting}
                />
              );
            case "M":
              return (
                <MultipleChoice
                  options={question.soptions}
                  value={answers[question.id]?.soption_ids}
                  onChange={(optionId, isSelected) =>
                    handleMultiSelect(
                      question.id,
                      optionId as string,
                      isSelected,
                      question.max_options,
                    )
                  }
                  disabled={isSubmitting}
                />
              );
            case "E":
              return (
                <ScaleChoice
                  minOptions={question.min_options}
                  maxOptions={question.max_options}
                  minLabel={question.soptions?.[0]?.option_text}
                  maxLabel={
                    question.soptions?.[question.soptions.length - 1]
                      ?.option_text
                  }
                  value={answers[question.id]?.answer}
                  onChange={(val) =>
                    handleScaleSelect(question.id, val, question.soptions || [])
                  }
                  disabled={isSubmitting}
                />
              );
            case "T":
              return (
                <TextChoice
                  name={`question_${question.id}`}
                  value={answers[question.id]?.answer}
                  onChange={(val) => handleTextAnswer(question.id, val)}
                  disabled={isSubmitting}
                />
              );
            default:
              return null;
          }
        })()}
      </SurveyQuestion>
    );
  };

  return (
    <DataModal
      open={true}
      onClose={onClose}
      onSave={handleSubmit}
      title={surveyDetail.title}
      buttonText={isSubmitting ? "Enviando..." : "Enviar respuestas"}
      buttonCancel={isMandatory ? "" : "Cancelar"}
      iconClose={!isMandatory}
      disabled={
        isSubmitting || isLoadingDetail || !surveyDetail.squestions?.length
      }
      style={{ width: "80%" }}
    >
      <div className={styles.content}>
        {isLoadingDetail && <div className={styles.loadingBar} />}

        {surveyDetail.description && (
          <p className={styles.description}>{surveyDetail.description}</p>
        )}

        {errors._general && (
          <div className={styles.errorGeneral}>{errors._general}</div>
        )}

        {surveyDetail.squestions?.length > 0 ? (
          <div className={styles.questions}>
            {surveyDetail.squestions.map((question: any, index: number) =>
              renderQuestion(question, index),
            )}
          </div>
        ) : (
          !isLoadingDetail && (
            <div className={styles.emptyQuestions}>
              No hay preguntas disponibles para esta encuesta.
            </div>
          )
        )}
      </div>
    </DataModal>
  );
};

export default SurveyAnswerForm;
