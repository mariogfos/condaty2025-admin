import React from "react";
import style from "./EventStatsCard.module.css";

interface EventStatsCardProps {
  value: number | string; 
  description: string;
  className?: string; 
}

const EventStatsCard: React.FC<EventStatsCardProps> = ({ value, description, className }) => {
  return (
    <div className={`${style.cardEvent} ${style.cardEventContainer} ${className || ""}`}>
      <div className={style.bigNumber}>{value}</div>
      <div className={style.textWhiteV1}>{description}</div>
    </div>
  );
};

export default EventStatsCard;
