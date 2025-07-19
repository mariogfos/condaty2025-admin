import React from 'react';
import styles from './WidgetDashCard.module.css';
import {
  IconAccess,
  IconInterrogation,
} from '@/components/layout/icons/IconsBiblioteca';
import Tooltip from '@/components/Tooltip/Tooltip';

interface ItemProps {
  title: string;
  subtitle?: string;
  className?: string;
  data: string | number;
  onClick?: () => void;
  color?: string;
  icon?: any;
  tooltip?: boolean;
  tooltipTitle?: string;
  tooltipColor?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  style?: React.CSSProperties;
}

export const WidgetDashCard = ({
  title,
  subtitle = '',
  className = styles.flexGrow,
  color,
  data,
  icon,
  tooltip,
  tooltipTitle = '',
  tooltipColor,
  tooltipPosition = 'right',
  onClick,
  style,
}: ItemProps) => {
  return (
    <div
      className={`${styles.container} ${
        onClick ? styles.clickable : ''
      } ${className}`}
      onClick={onClick}
      style={style}
    >
      <div>
        <div className={styles.title}>
          {title}{' '}
          {tooltip && (
            <Tooltip
              title={tooltipTitle}
              position={tooltipPosition}
              maxWidth={556}
              minWidth={356}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  marginLeft: 5,
                }}
              >
                <IconInterrogation
                  color={tooltipColor || 'var(--cWhiteV2)'}
                  size={18}
                />
              </span>
            </Tooltip>
          )}
        </div>
        <p>{subtitle}</p>
        <p className={styles.data} style={color ? { color: color } : undefined}>
          {data}
        </p>
      </div>
      <div> {icon}</div>
    </div>
  );
};
