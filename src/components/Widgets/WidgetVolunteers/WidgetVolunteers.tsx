import React from "react";
import styles from "./WidgetVolunteers.module.css";
import WidgetBase from "../WidgetBase/WidgetBase";
import { formatNumber } from "../../../mk/utils/numbers";

interface PropsType {
  widget1?: any;
  lDpto?: Record<any, string>;
  lLocal?: Record<any, string>;
}

const WidgetVolunteers = ({ widget1 }: PropsType) => {
  return (
    <WidgetBase
      subtitle="Cantidad de afiliados"
      className={styles.widgetVolunteers}
    >
      <h1>{formatNumber(widget1?.cant, 0)}</h1>
      <div></div>
      <p>Uruguay</p>
    </WidgetBase>
  );
};

export default WidgetVolunteers;
