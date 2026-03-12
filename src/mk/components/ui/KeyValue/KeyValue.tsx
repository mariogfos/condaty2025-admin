import { CSSProperties } from "react";
import styles from "./keyValue.module.css";
type PropsType = {
  title?: any;
  value?: any;
  colorKey?: string;
  colorValue?: string;
  size?: number;
  bottom?: any;
  styleTitle?: CSSProperties;
  styleValue?: CSSProperties;
};
const KeyValue = ({
  title,
  value,
  colorKey,
  colorValue,
  size = 14,
  bottom,
  styleTitle,
  styleValue,
}: PropsType) => {
  return (
    <div className={styles.keyValue}>
      <section>
        <div
          style={{
            ...styleTitle,
            color: colorKey ? colorKey : "var(--cWhiteV1)",
            fontSize: `${size}px`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            ...styleValue,
            color: colorValue ? colorValue : "var(--cWhite)",
            fontSize: `${size}px`,
          }}
        >
          {value}
        </div>
      </section>
      {bottom && <div>{bottom}</div>}
    </div>
  );
};

export default KeyValue;
