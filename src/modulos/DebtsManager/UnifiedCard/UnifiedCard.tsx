'use client';
import React from 'react';
import styles from './UnifiedCard.module.css';

interface UnifiedCardProps {
  // Para el tipo summary (DebtSummaryCard)
  title?: string;
  amount?: string | React.ReactNode;
  count?: string;
  subtitle?: string;

  // Para el tipo detail (DetailSharedDebts)
  label?: string;
  mainContent?: string | React.ReactNode;

  // Propiedades comunes
  variant?: 'summary' | 'detail';
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  title,
  amount,
  count,
  subtitle,
  label,
  mainContent,
  variant = 'summary',
  isActive = false,
  onClick,
  className = ''
}) => {
  return (
    <div
      className={`${styles.card} ${isActive ? styles.active : ''} ${className}`}
    >
      <div className={styles.header}>
        {variant === 'summary' && title && (
          <h3 className={styles.title}>{title}</h3>
        )}
        {variant === 'detail' && label && (
          <span className={styles.label}>{label}</span>
        )}
      </div>

      <div className={styles.content}>
        {variant === 'summary' && (
          <div className={styles.summaryContent}>
            <div className={styles.amount}>{amount}</div>
            {count && <div className={styles.count}>/{count}</div>}
          </div>
        )}

        {variant === 'detail' && (
          <>
            <div className={styles.mainContent}>{mainContent}</div>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default UnifiedCard;
