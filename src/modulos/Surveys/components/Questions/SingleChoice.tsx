import React from 'react';
import styles from './Questions.module.css';

interface Option {
  id: string | number;
  option_text: string;
}

interface SingleChoiceProps {
  options: Option[];
  value?: string | number | null;
  onChange: (optionId: string | number) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

const SingleChoice: React.FC<SingleChoiceProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  return (
    <div className={styles.optionsList}>
      {options?.map((option) => (
        <div
          key={option.id}
          className={`${styles.option} ${value == option.id ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && !readOnly && onChange(option.id)}
        >
          <div className={styles.radio}>
            {value == option.id && <div className={styles.radioInner} />}
          </div>
          <span>{option.option_text}</span>
        </div>
      ))}
    </div>
  );
};

export default SingleChoice;
