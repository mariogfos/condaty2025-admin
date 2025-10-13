import styles from './StatusBadge.module.css';
import { CSSProperties } from 'react';

interface StatusBadgeProps {
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  style?: CSSProperties; // Nueva prop para estilos personalizados
  containerStyle?: CSSProperties; // Nueva prop para estilos del contenedor
}

export const StatusBadge = ({
  children,
  backgroundColor,
  color,
  style,
  containerStyle
}: StatusBadgeProps) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center", // Por defecto center
        alignItems: "center",
        width: "100%",
        height: "100%",
        ...containerStyle, // Permitir sobrescribir estilos del contenedor
      }}
    >
      <div
        className={styles.statusBadge}
        style={{
          backgroundColor: backgroundColor,
          color: color,
          ...style, // Permitir sobrescribir estilos del badge
        }}
      >
        {children}
      </div>
    </div>
  );
};
