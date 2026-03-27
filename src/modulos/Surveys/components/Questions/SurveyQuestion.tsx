import React from 'react';
import styles from './Questions.module.css';

interface SurveyQuestionProps {
  label: string;
  index?: number;
  description?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

const SurveyQuestion: React.FC<SurveyQuestionProps> = ({
  label,
  index,
  description,
  required,
  error,
  children,
  className = "",
  actions,
}) => {
  return (
    <div className={`${styles.surveyQuestion} ${error ? styles.hasError : ''} ${className}`}>
      <label className={styles.label}>
        {index !== undefined ? `${index + 1}. ` : ''}{label}
        {required && <span className={styles.required}>*</span>}
      </label>
      
      {description && (
        <p className={styles.description}>{description}</p>
      )}

      {children}

      {error && (
        <span className={styles.error}>{error}</span>
      )}

      {actions && (
        <div className={styles.questionActions}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default SurveyQuestion;
