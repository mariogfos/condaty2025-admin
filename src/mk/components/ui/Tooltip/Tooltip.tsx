import { CSSProperties } from 'react';
import styles from './tooltip.module.css';

type PropsType = {
  title: string;
  children: any;
  position?: 'top' | 'bottom' | 'left' | 'right';
  style?: CSSProperties;
  className?: string;
  singleLine?: boolean;
  maxWidth?: string | number;
  minWidth?: string | number;
};

const Tooltip = ({
  title,
  children,
  position = 'top',
  style,
  className,
  singleLine = true,
  maxWidth,
  minWidth,
}: PropsType) => {
  if (!title || title == '') return children;
  return (
    <div className={`${styles.container} ${className}`} style={style}>
      <span
        className={`${styles.tooltip} ${styles[position]}`}
        style={{
          whiteSpace: singleLine ? 'nowrap' : 'normal',
          maxWidth: maxWidth ? maxWidth : undefined,
          minWidth: minWidth ? minWidth : undefined,
        }}
      >
        {title}
      </span>
      {children}
    </div>
  );
};
export default Tooltip;
