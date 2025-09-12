'use client';
import React from 'react';
import styles from './DebtSummaryCard.module.css';

interface DebtSummaryCardProps {
  title: string;
  amount: string;
  count: string;
  isActive?: boolean;
  onClick?: () => void;
}

const DebtSummaryCard: React.FC<DebtSummaryCardProps> = ({
  title,
  amount,
  count,
  isActive = false,
  onClick
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
        <div className={styles.amount}>{amount}</div>
        <div className={styles.count}>/{count}</div>
      </div>
    </div>
  );
};

export default DebtSummaryCard;
