/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { formatNumber } from "@/mk/utils/numbers";

import styles from "./TableFinance.module.css";
import colorStyles from "./TableFinanceColors.module.css"; // Import the new color styles
import { IconArrowUp, IconArrowDown, IconTableHelp } from "@/components/layout/icons/IconsBiblioteca";

interface SubItem {
  name: string;
  totalMeses?: string[];
  amount: number;
}

interface DataItem {
  name: string;
  sub: SubItem[];
  totalMeses?: string[];
  amount: number;
}

interface PropsType {
  data: DataItem[];
  title: string;
  title2: string;
  total?: number;
  color?: string;
  titleTotal?: string;
  meses?: string[];
  tooltip?: string;
  variant?: 'income' | 'expense' | 'summary'; // New prop for table variant
}

const TableFinance = ({
  data,
  title,
  title2,
  total,
  color = "text-white",
  titleTotal,
  meses = [],
  tooltip,
  variant = 'income', // Default to income if not specified
}: PropsType) => {
  const [dropStates, setDropStates] = useState<Array<{ drop: boolean }>>([]);

  useEffect(() => {
    setDropStates(data.map(() => ({ drop: false })));
  }, [data]);

  const handleItemClick = (index: number) => {
    setDropStates(
      dropStates.map((state, i) => ({
        drop: i === index ? !state.drop : false,
      }))
    );
  };

  // Get the appropriate container class based on the variant
  const getContainerClass = () => {
    switch (variant) {
      case 'income':
        return `${styles.tableContainer} ${colorStyles['tableContainer-income']}`;
      case 'expense':
        return `${styles.tableContainer} ${colorStyles['tableContainer-expense']}`;
      case 'summary':
        return `${styles.tableContainer} ${colorStyles['tableContainer-summary']}`;
      default:
        return styles.tableContainer;
    }
  };

  // Get the appropriate total row class based on the variant
  const getTotalRowClass = () => {
    switch (variant) {
      case 'income':
        return `${styles.totalRow} ${colorStyles['totalRow-income']} ${color}`;
      case 'expense':
        return `${styles.totalRow} ${colorStyles['totalRow-expense']} ${color}`;
      case 'summary':
        return `${styles.totalRow} ${colorStyles['totalRow-summary']} ${color}`;
      default:
        return `${styles.totalRow} ${color}`;
    }
  };

  return (
    <div className={getContainerClass()}>
      <div className={styles.tableHeader}>
        <div className={styles.headerRow}>
          <p className={styles.titleText}>{title}</p>
          {meses &&
            meses.map((mes, index) => (
              <p key={index} className={styles.monthCell}>
                {mes}
              </p>
            ))}
          <p className={styles.totalHeader}>
            {title2}
          </p>
        </div>
        {data.map((item, index) => (
          <div key={index}>
            <div
              className={`${styles.itemRow} ${
                dropStates[index] && dropStates[index].drop
                  ? styles.itemRowActive
                  : styles.lightText
              } ${index === data.length - 1 ? styles.roundedBottom : ""}`}
            >
              <div
                className={styles.itemNameContainer}
                onClick={() => handleItemClick(index)}
              >
                {item?.sub?.length > 0 &&
                  (dropStates[index] && dropStates[index].drop ? (
                    <div className={styles.iconContainer}>
                      <IconArrowUp size={20} className={styles.lightText} />
                    </div>
                  ) : (
                    <div className={styles.iconContainer}>
                      <IconArrowDown size={20} className={styles.lightText} />
                    </div>
                  ))}

                <p>{item.name}</p>
              </div>
              {item?.totalMeses &&
                item.totalMeses.map((mes, mesIndex) => (
                  <div
                    key={mesIndex}
                    className={styles.itemMonthCell}
                  >
                    <p className={styles.centerText}>{mes}</p>
                  </div>
                ))}
              <div className={styles.itemTotalCell}>
                <p>Bs {formatNumber(item.amount) || 0}</p>
              </div>
            </div>
            {dropStates[index] &&
              dropStates[index].drop &&
              item.sub.map((subItem, subIndex) => (
                <div
                  key={subIndex}
                  className={styles.subItemRow}
                >
                  <div className={styles.subItemNameContainer}>
                    <p>{subItem.name}</p>
                  </div>
                  {subItem?.totalMeses &&
                    subItem.totalMeses.map((mes, mesIndex) => (
                      <div
                        key={mesIndex}
                        className={styles.subItemMonthCell}
                      >
                        <p>{mes}</p>
                      </div>
                    ))}
                  <div className={styles.subItemTotalCell}>
                    <p className={styles.totalValue}>Bs {formatNumber(subItem.amount)}</p>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
      <div className={styles.totalContainer}>
        <div className={getTotalRowClass()}>
          <p className={styles.totalLabel}>{titleTotal || "Total de " + title}</p>
          <div className={styles.tooltipContainer}>
            <IconTableHelp className={styles.tooltipIcon} />
            <span className={styles.tooltip}>
              {tooltip || "Total de " + title + " en el periodo"}
            </span>
          </div>

          <p className={styles.grandTotalCell}>
            Bs {formatNumber(total || 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TableFinance;