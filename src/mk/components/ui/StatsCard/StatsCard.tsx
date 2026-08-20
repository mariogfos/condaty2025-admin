import React from "react";
import style from "./StatsCard.module.css";

interface StatsCardProps {
  icon: React.ReactNode;
  title: string; 
  value: number | string; 
  className?: string; 
}

const StatsCard: React.FC<StatsCardProps> = ({ icon, title, value, className }) => {
  return (
    <div className={`${style.cardEvent} ${style.cardEventContainer} ${className || ""}`}>
      <div className={`${style.textBlackV2} ${style.titleAndIcon}`}>
        {icon}
        {title}
      </div>
      <div className={style.number}>{value}</div>
    </div>
  );
};

export default StatsCard;
