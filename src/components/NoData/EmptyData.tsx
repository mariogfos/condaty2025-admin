import styles from "./EmptyData.module.css";
import { IconTableEmpty } from "../layout/icons/IconsBiblioteca";
import { FC, ReactNode } from "react";

interface EmptyDataProps {
  icon?: ReactNode;
  message?: string;
  line2?: string;
  className?: string;
  h?: number | string;
  centered?: boolean;
  size?: number | string;
  fontSize?: number | string;
}

const EmptyData: FC<EmptyDataProps> = ({
  message,
  line2,
  className = "",
  h = "100%",
  centered = true,
  icon,
  size = "52",
  fontSize,
}) => {
  const containerStyle = {
    height: h,
  };

  const containerClass = `${styles.container} ${
    centered ? styles.centered : ""
  } ${className}`;

  return (
    <div className={containerClass} style={containerStyle}>
      <div className={styles.icon}>
        {icon ?? <IconTableEmpty className={styles.icon} size={size} />}
      </div>
      <div
        className={styles.message}
        style={fontSize ? { fontSize } : undefined}
      >
        {message ?? "No Hay elementos"}
      </div>
      <div
        className={styles.line2}
        style={fontSize ? { fontSize } : undefined}
      >
        {line2 ?? null}
      </div>
    </div>
  );
};

export default EmptyData;
