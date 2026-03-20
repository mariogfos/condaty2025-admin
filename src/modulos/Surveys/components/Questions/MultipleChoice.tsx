import React from 'react';
import styles from './Questions.module.css';

interface Option {
  id: string | number;
  option_text: string;
}

interface MultipleChoiceProps {
  options: Option[];
  value?: (string | number)[];
  onChange: (optionId: string | number, isSelected: boolean) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  options,
  value = [],
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  return (
    <div className={styles.optionsList}>
      {options?.map((option) => {
        const isSelected = value.includes(option.id);
        return (
          <div
            key={option.id}
            className={`${styles.option} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && !readOnly && onChange(option.id, !isSelected)}
          >
            <div className={`${styles.checkbox} ${isSelected ? styles.checked : ''}`}>
              {isSelected && <span className={styles.checkmark}>✓</span>}
            </div>
            <span>{option.option_text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default MultipleChoice;
