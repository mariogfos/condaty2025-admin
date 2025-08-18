import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
}

export const StatusBadge = ({ children, backgroundColor, color }: StatusBadgeProps) => {
  return (
    <div
      className={styles.statusBadge}
      style={{
        backgroundColor: backgroundColor,
        color: color,
      }}
    >
      {children}
    </div>
  );
};
