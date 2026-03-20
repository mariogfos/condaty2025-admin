'use client';
import React from 'react';
import styles from './SurveySummaryCard.module.css';

interface SurveySummaryCardProps {
  title: string;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
}

const SurveySummaryCard: React.FC<SurveySummaryCardProps> = ({
  title,
  count,
  isActive = false,
  onClick,
}) => {
  return (
    <div 
      className={`${styles.card} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.content}>
        <div className={styles.count}>{count}</div>
        <div className={styles.label}>encuesta{count !== 1 ? 's' : ''}</div>
      </div>
    </div>
  );
};

export default SurveySummaryCard;
