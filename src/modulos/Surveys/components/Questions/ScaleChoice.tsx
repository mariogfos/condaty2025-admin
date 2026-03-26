import React from 'react';
import styles from './Questions.module.css';

interface ScaleChoiceProps {
  minOptions: number | string;
  maxOptions: number | string;
  minLabel?: string;
  maxLabel?: string;
  value?: string | number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

const ScaleChoice: React.FC<ScaleChoiceProps> = ({
  minOptions,
  maxOptions,
  minLabel,
  maxLabel,
  value,
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  const min = parseInt(minOptions.toString()) || 1;
  const max = parseInt(maxOptions.toString()) || 5;
  const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className={styles.scaleContainer}>
      {(minLabel || maxLabel) && (
        <div className={styles.scaleLabels}>
          <span>{minLabel || `Mín: ${min}`}</span>
          <span>{maxLabel || `Máx: ${max}`}</span>
        </div>
      )}
      
      <div className={styles.scaleRadios}>
        {range.map((val) => (
          <div
            key={val}
            className={`${styles.scaleItem} ${value == val ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && !readOnly && onChange(val)}
          >
            <div className={styles.scaleRadio}>
              {val}
            </div>
            {/* <span className={styles.scaleValueLabel}>{val}</span> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScaleChoice;
