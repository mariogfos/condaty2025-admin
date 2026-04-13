import React, { useState } from "react";
import styles from "./Card.module.css";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import {
  IconArrowDown,
  IconArrowUp,
} from "@/components/layout/icons/IconsBiblioteca";

type CardProps = {
  title: string;
  titleRight?: React.ReactNode;
  openable?: boolean;
  show?: boolean;
  children: React.ReactNode;
  variant?: "v1" | "v2";
};

const Card = ({
  title,
  titleRight,
  openable = true,
  show = true,
  children,
  variant = "v1",
}: CardProps) => {
  const [showDetails, setShowDetails] = useState(show);
  return (
    <div className={`${styles.section} ${styles[variant]}`}>
      <div
        className={styles.sectionHeader}
        onClick={() => openable && setShowDetails(!showDetails)}
        style={{ cursor: "pointer" }}
      >
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {titleRight}
          {openable &&
            (showDetails ? (
              <IconArrowUp size={16} />
            ) : (
              <IconArrowDown size={16} />
            ))}
        </div>
      </div>

      {showDetails && (
        <div className={`${styles.card} ${styles[variant]}`}>{children}</div>
      )}
    </div>
  );
};

export default Card;
