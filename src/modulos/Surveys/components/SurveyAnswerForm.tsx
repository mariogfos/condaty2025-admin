"use client";
import React, { useState } from 'react';
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from '@/mk/components/forms/Button/Button';
import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import useAxios from "@/mk/hooks/useAxios";
import styles from './SurveyAnswerForm.module.css';

interface SurveyAnswerFormProps {
  survey: any;
  onClose: () => void;
  onSuccess: () => void;
}

const SurveyAnswerForm: React.FC<SurveyAnswerFormProps> = ({
  survey,
  onClose,
  onSuccess,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { execute: executeSubmit, loaded } = useAxios(
    "/surveys/answers",
    "POST",
    {},
    true
  );

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

    survey.squestions?.forEach((question: any) => {
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

      const payload = {
        survey_id: survey.id,
        squestions: answersList,
      };

      const response = await executeSubmit('/surveys/answers', 'POST', payload);
      
      if (response?.data?.success) {
        onSuccess();
      } else {
        setErrors({ _general: response?.data?.message || 'Error al enviar respuestas' });
      }
    } catch (err: any) {
      setErrors({ _general: err.message || 'Error al enviar respuestas' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: any) => {
    const error = errors[question.id];

    switch (question.type) {
      case 'S':
        return (
          <div className={styles.optionsList}>
            {question.soptions?.map((option: any) => (
              <div
                key={option.id}
                className={`${styles.option} ${answers[question.id]?.soption_id === option.id ? styles.selected : ''}`}
                onClick={() => handleSingleSelect(question.id, option.id)}
              >
                <div className={styles.radio}>
                  {answers[question.id]?.soption_id === option.id && <div className={styles.radioInner} />}
                </div>
                <span>{option.option_text}</span>
              </div>
            ))}
          </div>
        );

      case 'M':
        return (
          <div className={styles.optionsList}>
            {question.soptions?.map((option: any) => (
              <div
                key={option.id}
                className={`${styles.option} ${answers[question.id]?.soption_ids?.includes(option.id) ? styles.selected : ''}`}
                onClick={() => handleMultiSelect(question.id, option.id, !answers[question.id]?.soption_ids?.includes(option.id))}
              >
                <div className={`${styles.checkbox} ${answers[question.id]?.soption_ids?.includes(option.id) ? styles.checked : ''}`}>
                  {answers[question.id]?.soption_ids?.includes(option.id) && <span className={styles.checkmark}>✓</span>}
                </div>
                <span>{option.option_text}</span>
              </div>
            ))}
          </div>
        );

      case 'E':
        return (
          <div className={styles.scaleContainer}>
            <Input
              name={`question_${question.id}`}
              type="number"
              min={question.min_options || 1}
              max={question.max_options || 5}
              value={answers[question.id]?.answer || ''}
              onChange={(e: any) => handleTextAnswer(question.id, e.target.value)}
              placeholder={`${question.min_options || 1} - ${question.max_options || 5}`}
            />
            <div className={styles.scaleLabels}>
              <span>Mín: {question.min_options || 1}</span>
              <span>Máx: {question.max_options || 5}</span>
            </div>
          </div>
        );

      case 'T':
        return (
          <TextArea
            name={`question_${question.id}`}
            value={answers[question.id]?.answer || ''}
            onChange={(e: any) => handleTextAnswer(question.id, e.target.value)}
            placeholder="Escribe tu respuesta..."
            lines={3}
          />
        );

      default:
        return null;
    }
  };

  return (
    <DataModal
      open={true}
      onClose={onClose}
      title={survey.title}
      style={{ width: '80%' }}
    >
      <div className={styles.content}>
        {survey.description && (
          <p className={styles.description}>{survey.description}</p>
        )}

        {errors._general && (
          <div className={styles.errorGeneral}>{errors._general}</div>
        )}

        <div className={styles.questions}>
          {survey.squestions?.map((question: any, index: number) => (
            <div 
              key={question.id} 
              className={`${styles.question} ${errors[question.id] ? styles.hasError : ''}`}
            >
              <label className={styles.questionLabel}>
                {index + 1}. {question.question_text}
                {question.is_required && <span className={styles.required}>*</span>}
              </label>
              {question.description && (
                <p className={styles.questionDescription}>{question.description}</p>
              )}
              {renderQuestion(question)}
              {errors[question.id] && (
                <span className={styles.error}>{errors[question.id]}</span>
              )}
            </div>
          ))}
        </div>
        
        <div className={styles.actions}>
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar respuestas'}
          </Button>
        </div>
      </div>
    </DataModal>
  );
};

export default SurveyAnswerForm;
