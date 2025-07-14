import { IconArrowLeft } from "@/components/layout/icons/IconsBiblioteca";
import React from "react";
import styles from "./HeaderBack.module.css";
interface Props {
  label: string;
  onClick: any;
}

const HeaderBack = ({ label, onClick }: Props) => {
  return (
    <div className={styles.HeaderBack}>
      <IconArrowLeft onClick={onClick} style={{ cursor: "pointer" }} />
      <p onClick={onClick} style={{ cursor: "pointer" }}>
        {label}
      </p>
    </div>
  );
};

export default HeaderBack;
