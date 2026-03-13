"use client";
import React, { useState } from 'react';
import { Card } from '@/mk/components/ui/Card/Card';
import Button from '@/mk/components/forms/Button/Button';
import Input from '@/mk/components/forms/Input/Input';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import { SurveyDetail, SurveyAnswer } from '../types/mySurveys.types';
import styles from './SurveyAnswerForm.module.css';

interface SurveyAnswerFormProps {
  survey: SurveyDetail;
  onSubmit: (answers: SurveyAnswer[]) => Promise<void>;
  onCancel: () => void;
}

// Componentes simples de radio/checkbox para opciones
const SingleChoiceOption = ({ option, selected, onSelect }: { 
  option: { id: string; option_text: string }; 
  selected: boolean; 
  onSelect: (id: string) => void 
}) => (
  <div 
    className={`${styles.option} ${selected ? styles.selected : ''}`}
    onClick={() => onSelect(option.id)}
  >
    <div className={styles.radio}>
      {selected && <div className={styles.radioInner} />}
    </div>
    <span>{option.option_text}</span>
  </div>
);

const MultipleChoiceOption = ({ option, selected, onToggle }: { 
  option: { id: string; option_text: string }; 
  selected: boolean; 
  onToggle: (id: string, sel: boolean) => void 
}) => (
  <div 
    className={`${styles.option} ${selected ? styles.selected : ''}`}
    onClick={() => onToggle(option.id, !selected)}
  >
    <div className={`${styles.checkbox} ${selected ? styles.checked : ''}`}>
      {selected && <span className={styles.checkmark}>✓</span>}
    </div>
    <span>{option.option_text}</span>
  </div>
);

export const SurveyAnswerForm: React.FC<SurveyAnswerFormProps> = ({ 
  survey, 
  onSubmit, 
  onCancel 
}) => {
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      : current.filter(id => id !== optionId);
    
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

    survey.squestions.forEach(question => {
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
      const answersList = Object.values(answers).filter(a => 
        a.soption_id || (a.soption_ids && a.soption_ids.length > 0) || a.answer
      );
      await onSubmit(answersList);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyDetail['squestions'][0]) => {
    const error = errors[question.id];

    switch (question.type) {
      case 'S': // Single choice
        return (
          <div className={styles.optionsList}>
            {question.soptions?.map(option => (
              <SingleChoiceOption
                key={option.id}
                option={option}
                selected={answers[question.id]?.soption_id === option.id}
                onSelect={(id: string) => handleSingleSelect(question.id, id)}
              />
            ))}
          </div>
        );

      case 'M': // Multiple choice
        return (
          <div className={styles.optionsList}>
            {question.soptions?.map(option => (
              <MultipleChoiceOption
                key={option.id}
                option={option}
                selected={answers[question.id]?.soption_ids?.includes(option.id) || false}
                onToggle={(id: string, sel: boolean) => handleMultiSelect(question.id, id, sel)}
              />
            ))}
          </div>
        );

      case 'E': // Scale
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

      case 'T': // Text
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
    <Card className={styles.formCard}>
      <div className={styles.header}>
        <h2 className={styles.title}>{survey.title}</h2>
        {survey.description && (
          <p className={styles.description}>{survey.description}</p>
        )}
      </div>
      
      <div className={styles.questions}>
        {survey.squestions.map((question, index) => (
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
          onClick={onCancel} 
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
    </Card>
  );
};
