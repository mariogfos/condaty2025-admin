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

  // Para barras de progreso
  total?: number;
  current?: number;
  showProgressBar?: boolean;

  // Propiedades comunes
  variant?: 'summary' | 'detail';
  isActive?: boolean;
  onClick?: () => void; // Nueva prop para manejar clicks
  className?: string;
}

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  title,
  amount,
  count,
  subtitle,
  label,
  mainContent,
  total = 0,
  current = 0,
  showProgressBar = false,
  variant = 'summary',
  isActive = false,
  onClick, // Nueva prop
  className = ''
}) => {
  // Calcular porcentaje para la barra de progreso
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div
      className={`${styles.card} ${isActive ? styles.active : ''} ${className}`}
      onClick={onClick} // Agregar el manejador de click
      style={{ cursor: onClick ? 'pointer' : 'default' }} // Cambiar cursor si es clickeable
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
            <div className={styles.summaryContent}>
              <div className={styles.amount}>{mainContent}</div>
              {subtitle && <div className={styles.count}>/{subtitle}</div>}
            </div>
          </>
        )}

        {/* Barra de progreso */}
        {showProgressBar && (
          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className={styles.progressText}>
              {percentage.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedCard;
