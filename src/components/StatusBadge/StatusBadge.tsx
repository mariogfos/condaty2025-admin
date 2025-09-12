import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
}

export const StatusBadge = ({ children, backgroundColor, color }: StatusBadgeProps) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        className={styles.statusBadge}
        style={{
          backgroundColor: backgroundColor,
          color: color,
        }}
      >
        {children}
      </div>
    </div>
  );
};
