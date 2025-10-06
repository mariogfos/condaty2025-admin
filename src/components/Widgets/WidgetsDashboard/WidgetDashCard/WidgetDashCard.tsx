import React from 'react';
import styles from './WidgetDashCard.module.css';
import { IconAccess, IconInterrogation } from '@/components/layout/icons/IconsBiblioteca';
import Tooltip from '@/mk/components/ui/Tooltip/Tooltip';

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
  tooltipWidth?: number;
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
  tooltipWidth,
  onClick,
  style,
}: ItemProps) => {
  return (
    <div
      className={`${styles.container} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      <div>
        <div className={styles.title}>
          <span className={styles.titleText} title={title}>
            {title}
          </span>
          {tooltip && (
            <Tooltip title={tooltipTitle} position={tooltipPosition} singleLine={false} minWidth={tooltipWidth || 200}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <IconInterrogation color={tooltipColor || 'var(--cWhiteV1)'} size={18} />
              </span>
            </Tooltip>
          )}
        </div>
        {/* <p>{subtitle}</p> */}
        <p className={styles.data} style={color ? { color: color } : undefined}>
          {data}
        </p>
      </div>
      <div className={styles.iconWrap}>{icon}</div>
    </div>
  );
};
