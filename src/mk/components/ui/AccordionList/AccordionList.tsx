import React from "react";

import styles from "./accordionList.module.css";
import AccordionItem from "./AccodionItem";

interface AccordionData {
  title: string;
  content: React.ReactNode;
}

interface AccordionListProps {
  items: AccordionData[];
  setId: any;
}

const AccordionList: React.FC<AccordionListProps> = ({ items, setId }) => {
  return (
    <div className={styles.accordionList}>
      {items?.map((item, index) => (
        <AccordionItem key={index} title={item.title} setId={setId} item={item}>
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default AccordionList;
