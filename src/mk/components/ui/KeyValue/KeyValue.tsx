import styles from "./keyValue.module.css";
type PropsType = {
  title?: any;
  value?: any;
  colorKey?: string;
  colorValue?: string;
  size?: string;
  bottom?: any;
};
const KeyValue = ({
  title,
  value,
  colorKey,
  colorValue,
  size,
  bottom,
}: PropsType) => {
  return (
    <div className={styles.keyValue}>
      <section>
        <div
          style={
            colorKey
              ? { color: colorKey, fontSize: `${size}px` }
              : { fontSize: `${size}px` }
          }
        >
          {title}
        </div>
        <div
          style={
            colorValue
              ? { color: colorValue, fontSize: `${size}px` }
              : { fontSize: `${size}px` }
          }
        >
          {value}
        </div>
      </section>
      {bottom && <div>{bottom}</div>}
    </div>
  );
};

export default KeyValue;
