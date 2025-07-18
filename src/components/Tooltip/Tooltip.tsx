import { CSSProperties } from 'react';
import styles from './Tooltip.module.css';

type PropsType = {
  title: string;
  children: any;
  position?: 'top' | 'bottom' | 'left' | 'right';
  style?: CSSProperties;
  className?: string;
  visible?: boolean; // Nuevo: mostrar siempre el tooltip si es true
};

const Tooltip = ({
  title,
  children,
  position = 'left',
  style,
  className,
  visible,
}: PropsType) => {
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <span
        className={`${styles.tooltip} ${styles[position]}${
          visible ? ' ' + styles.visible : ''
        }`}
        style={visible ? { visibility: 'visible' } : {}}
      >
        {title}
      </span>
      {children}
    </div>
  );
};

export default Tooltip;
