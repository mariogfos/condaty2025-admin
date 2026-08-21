import { CSSProperties } from "react";
import styles from "./Tag.module.css";
interface PropsType {
  item: any;
  onClick: any;
  style?: CSSProperties;
}
const Tag = ({ item, onClick, style }: PropsType) => {
  return (
    <div onClick={onClick} style={style} className={styles.container}>
      {item.name}
    </div>
  );
};

export default Tag;
