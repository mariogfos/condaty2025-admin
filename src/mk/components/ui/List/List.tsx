import { Fragment } from "react";
import styles from "./list.module.css";

type PropsType = {
  data: any[];
  renderItem: (item: any, index: number) => any;
  className?: string;
  emptyLabel?: string;
};
const List = ({
  data,
  renderItem,
  className = "",
  emptyLabel = "Sin datos",
}: PropsType) => {
  return (
    <div className={styles.list + " " + className}>
      {data?.map((item, index) => {
        return <Fragment key={index}>{renderItem(item, index)}</Fragment>;
      })}
      {!data?.length && <div className="center">{emptyLabel}</div>}
    </div>
  );
};

export default List;
