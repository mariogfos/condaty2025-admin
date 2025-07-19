import { CSSProperties } from 'react';
import styles from './Tooltip.module.css';

type PropsType = {
  title: string;
  children: any;
  position?: 'top' | 'bottom' | 'left' | 'right';
  style?: CSSProperties;
  className?: string;
  visible?: boolean; // Nuevo: mostrar siempre el tooltip si es true
  maxWidth?: string | number; // Nuevo: ancho máximo opcional
  noWrap?: boolean; // Nuevo: forzar una sola línea opcional
  minWidth?: string | number; // Nuevo: ancho mínimo opcional
};

const Tooltip = ({
  title,
  children,
  position = 'left',
  style,
  className,
  visible,
  maxWidth, // Nuevo
  noWrap, // Nuevo
  minWidth, // Nuevo
}: PropsType) => {
  if (!title || title == '') return children;
  // Preparar estilos en línea para el tooltip
  const tooltipStyle: CSSProperties = {
    ...(visible ? { visibility: 'visible' } : {}),
    ...(maxWidth
      ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth }
      : {}),
    ...(minWidth
      ? { minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth }
      : {}),
  };
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <span
        className={`${styles.tooltip} ${styles[position]}${
          visible ? ' ' + styles.visible : ''
        }${noWrap ? ' ' + styles.nowrap : ''}`}
        style={tooltipStyle}
      >
        {title}
      </span>
      {children}
    </div>
  );
};

export default Tooltip;
