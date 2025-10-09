"use client";
import React, { useState } from "react";
import styles from "./InfoCard.module.css";
import { IconInterrogation } from "@/components/layout/icons/IconsBiblioteca";
import Tooltip from "@/components/Tooltip/Tooltip";

const InfoCard = ({ label, value, tooltipText = "" }: any) => {
  return (
    <div className={styles["infoCard"]}>
      <div className={styles["infoCardChildren1"]}>
        {label}{" "}
        <Tooltip
          title={tooltipText}
          position="top"
          style={{ textAlign: "start" }}
          className={styles.tooltip}
        >
          <IconInterrogation
            size={24}
            style={{ display: "flex", textAlign: "left" }}
          />
        </Tooltip>
      </div>
      <div>{value}</div>
    </div>
  );
};

export default InfoCard;
