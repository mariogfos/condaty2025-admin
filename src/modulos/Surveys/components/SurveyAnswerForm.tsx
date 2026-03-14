"use client";
import React, { useState, useEffect } from 'react';
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from '@/mk/components/forms/Button/Button';
import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import styles from './SurveyAnswerForm.module.css';
import { useMySurveys } from '../hooks/useMySurveys';
import SurveyQuestion from './Questions/SurveyQuestion';
import SingleChoice from './Questions/SingleChoice';
import MultipleChoice from './Questions/MultipleChoice';
import ScaleChoice from './Questions/ScaleChoice';
import TextChoice from './Questions/TextChoice';

interface SurveyAnswerFormProps {
  survey: any;
  onClose: () => void;
  onSuccess: () => void;
}

const SurveyAnswerForm: React.FC<SurveyAnswerFormProps> = ({
  survey: initialSurvey,
  onClose,
  onSuccess,
}) => {
  const [surveyDetail, setSurveyDetail] = useState<any>(initialSurvey);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

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
  }, [initialSurvey.id, fetchSurveyDetail]);

  const handleSingleSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { squestion_id: questionId, soption_id: optionId }
    }));
    setErrors(prev => ({ ...prev, [questionId]: '' }));
  };

  const handleMultiSelect = (questionId: string, optionId: string, currentlySelected: boolean) => {
    const current = answers[questionId]?.soption_ids || [];
    const newOptions = currentlySelected
      ? [...current, optionId]
      : current.filter((id: string) => id !== optionId);
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: { squestion_id: questionId, soption_ids: newOptions }
    }));
    setErrors(prev => ({ ...prev, [questionId]: '' }));
  };

  const handleTextAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { squestion_id: questionId, answer: value }
    }));
    setErrors(prev => ({ ...prev, [questionId]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    surveyDetail.squestions?.forEach((question: any) => {
      const answer = answers[question.id];
      const isEmpty = !answer?.soption_id && 
        !(answer?.soption_ids && answer.soption_ids.length > 0) && 
        !answer?.answer;

      if (question.is_required && isEmpty) {
        newErrors[question.id] = 'Esta pregunta es obligatoria';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const answersList = Object.values(answers).filter((a: any) => 
        a.soption_id || (a.soption_ids && a.soption_ids.length > 0) || a.answer
      );

      // En el administrador no enviamos dpto_id
      const success = await submitAnswers(surveyDetail.id, "", answersList as any);
      
      if (success) {
        onSuccess();
      } else {
        setErrors({ _general: 'Error al enviar respuestas. Inténtelo de nuevo.' });
      }
    } catch (err: any) {
      setErrors({ _general: err.message || 'Error al enviar respuestas' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: any, index: number) => {
    const error = errors[question.id];
    
    return (
      <SurveyQuestion
        key={question.id}
        index={index}
        label={question.question_text}
        description={question.description}
        required={question.is_required}
        error={error}
      >
        {(() => {
          switch (question.type) {
            case 'S':
              return (
                <SingleChoice
                  options={question.soptions}
                  value={answers[question.id]?.soption_id}
                  onChange={(optionId) => handleSingleSelect(question.id, optionId as string)}
                  disabled={isSubmitting}
                />
              );
            case 'M':
              return (
                <MultipleChoice
                  options={question.soptions}
                  value={answers[question.id]?.soption_ids}
                  onChange={(optionId, isSelected) => handleMultiSelect(question.id, optionId as string, isSelected)}
                  disabled={isSubmitting}
                />
              );
            case 'E':
              return (
                <ScaleChoice
                  minOptions={question.min_options}
                  maxOptions={question.max_options}
                  minLabel={question.soptions?.[0]?.option_text}
                  maxLabel={question.soptions?.[question.soptions.length - 1]?.option_text}
                  value={answers[question.id]?.answer}
                  onChange={(val) => handleTextAnswer(question.id, val.toString())}
                  disabled={isSubmitting}
                />
              );
            case 'T':
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
      buttonCancel="Cancelar"
      disabled={isSubmitting || isLoadingDetail || !surveyDetail.squestions?.length}
      style={{ width: '80%' }}
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
               renderQuestion(question, index)
            )}
          </div>
        ) : !isLoadingDetail && (
          <div className={styles.emptyQuestions}>No hay preguntas disponibles para esta encuesta.</div>
        )}
      </div>
    </DataModal>
  );
};

export default SurveyAnswerForm;

