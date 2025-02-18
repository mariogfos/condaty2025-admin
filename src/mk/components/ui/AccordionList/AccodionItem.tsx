import React, { useState, ReactNode } from "react";
import styles from "./accordionList.module.css";

interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  setId: any;
  item: any;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  children,
  setId,
  item,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setId(item?.affiliate_id);
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.accordionItem}>
      <div className={styles.accordionHeader} onClick={toggleAccordion}>
        <h3>{title}</h3>
        <span>{isOpen ? "-" : "+"}</span>
      </div>
      {isOpen && <div className={styles.accordionContent}>{children}</div>}
    </div>
  );
};

export default AccordionItem;
