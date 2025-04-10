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
      <IconArrowLeft onClick={onClick} />
      <p>{label}</p>
    </div>
  );
};

export default HeaderBack;
