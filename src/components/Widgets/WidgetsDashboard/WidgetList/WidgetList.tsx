
import React, { Fragment } from "react";
import styles from "./WidgetList.module.css";
interface PropsType {
  data: any;
  renderItem: (item: any) => any;
  children?: any;
  sepList?: (item: any) => any;
  keyExtractor?: (item: any) => any;
  title: string;
  className?: any;
  message?: string;
}


export const WidgetList = ({
  data,
  renderItem,
  children,
  sepList,
  keyExtractor,
  title,
  className,
  message,
}: PropsType) => {
  return (
    <div className={styles.widgetList + " " + className}>
      <div>{title}</div>
      {data?.map((item: any, idx: number) => (
        <Fragment key={keyExtractor ? keyExtractor(item) : item.id || idx}>
          {sepList && sepList(item)}
          {renderItem(item)}
        </Fragment>
      ))}
      {data?.length == 0 && (
        <p>{message}</p>
      )}
    </div>
  );
};
