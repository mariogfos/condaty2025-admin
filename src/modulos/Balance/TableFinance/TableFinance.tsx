import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { formatNumber } from "@/mk/utils/numbers";

import styles from "./TableFinance.module.css";
import {
  IconArrowUp,
  IconArrowDown,
  IconTableHelp,
} from "@/components/layout/icons/IconsBiblioteca";

interface SubItem {
  name: string;
  totalMeses?: (string | number)[];
  amount: number;
}
interface DataItem {
  name: string;
  sub: SubItem[];
  totalMeses?: (string | number)[];
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
  variant?: "income" | "expense" | "summary";
}

const TableFinance = ({
  data,
  title,
  title2,
  total,
  titleTotal,
  meses = [],
  tooltip,
  variant = "income",
}: PropsType) => {
  const [dropStates, setDropStates] = useState<Array<{ drop: boolean }>>([]);
  const isTwoColumnLayout = meses.length === 0;

  useEffect(() => {
    setDropStates(data.map(() => ({ drop: false })));
  }, [data]);

  const handleItemClick = (index: number) => {
    setDropStates(
      dropStates.map((state, i) => {
        if (i === index) {
          return { ...state, drop: !state.drop };
        }

        return state;
      })
    );
  };

  const getContainerClass = () => {
    return styles.tableContainer;
  };

  const getTotalRowVariantClass = () => {
    switch (variant) {
      case "income":
        return styles["totalRow-income"];
      case "expense":
        return styles["totalRow-expense"];
      case "summary":
        return styles["totalRow-summary"];
      default:
        return "";
    }
  };

  const getTotalTextColorClass = () => {
    switch (variant) {
      case "income":
        return styles["text-income"];
      case "expense":
        return styles["text-expense"];
      case "summary":
        return styles["text-summary"];
      default:
        return "";
    }
  };

  const getTotalLabelCellVariantClass = () => {
    switch (variant) {
      case "income":
        return styles["totalLabelCell-income"];
      case "expense":
        return styles["totalLabelCell-expense"];
      case "summary":
        return styles["totalLabelCell-summary"];
      default:
        return "";
    }
  };

  const getTotalAmountCellVariantClass = () => {
    switch (variant) {
      case "income":
        return styles["totalAmountCell-income"];
      case "expense":
        return styles["totalAmountCell-expense"];
      case "summary":
        return styles["totalAmountCell-summary"];
      default:
        return "";
    }
  };

  const getGroupTopClass = () => {
    if (variant === "income") return styles["groupBorder-income-top"];
    if (variant === "expense") return styles["groupBorder-expense-top"];
    return styles["groupBorder-summary-top"];
  };

  const getGroupMidClass = () => {
    if (variant === "income") return styles["groupBorder-income-mid"];
    if (variant === "expense") return styles["groupBorder-expense-mid"];
    return styles["groupBorder-summary-mid"];
  };

  const getGroupBotClass = () => {
    if (variant === "income") return styles["groupBorder-income-bot"];
    if (variant === "expense") return styles["groupBorder-expense-bot"];
    return styles["groupBorder-summary-bot"];
  };

  const tableMinWidth = useMemo(() => {
    if (isTwoColumnLayout) {
      return 560;
    }

    return Math.max(760, 260 + meses.length * 92 + 180);
  }, [isTwoColumnLayout, meses.length]);

  return (
    <div className={styles.tableShell}>
      <div className={styles.scrollHint}>
        Desliza horizontalmente para ver todos los meses →
      </div>
      <div className={styles.tableResponsiveWrapper}>
        <div
          className={getContainerClass() + " " + styles.tableFinance}
          style={
            {
              "--table-finance-min-width": `${tableMinWidth}px`,
            } as CSSProperties
          }
        >
          <div className={styles.tableHeaderRow}>
            <div className={`${styles.headerCell} ${styles.titleHeaderCell}`}>
              <span>{title}</span>
            </div>
            {meses.map((mes, index) => (
              <div
                key={"meses" + index}
                className={`${styles.headerCell} ${styles.monthHeaderCell}`}
              >
                <span>{mes.toUpperCase()}</span>
              </div>
            ))}

            <div
              className={`${styles.headerCell} ${styles.totalHeaderCell} ${
                isTwoColumnLayout ? styles.alignCellContentRight : ""
              }`}
            >
              <span>{title2}</span>
            </div>
          </div>

          {data.map((item, index) => {
            const isOpen = dropStates[index]?.drop;
            const subLength = item.sub?.length || 0;
            return (
              <React.Fragment key={"item" + index}>
                <div
                  className={
                    `${styles.dataRow} ${isOpen ? styles.dataRowActive : ""} ` +
                    (isOpen ? getGroupTopClass() : "")
                  }
                >
                  <div
                    className={`${styles.dataCell} ${styles.categoryNameCell}`}
                    onClick={() => item.sub?.length > 0 && handleItemClick(index)}
                  >
                    {item.sub?.length > 0 && (
                      <span className={styles.expandIcon}>
                        {isOpen ? (
                          <IconArrowUp size={24} />
                        ) : (
                          <IconArrowDown size={24} />
                        )}
                      </span>
                    )}
                    <span>{item.name}</span>
                  </div>
                  {Array.from({ length: meses.length }).map((_, mesIdx) => {
                    const valor = item.totalMeses?.[mesIdx];
                    return (
                      <div
                        key={`item-${index}-mes-${mesIdx}`}
                        className={`${styles.dataCell} ${styles.monthDataCell} ${
                          !valor || valor === "-" ? styles["no-value"] : ""
                        }`}
                      >
                        <span>
                          {valor && valor !== 0 ? formatNumber(valor) : "-"}
                        </span>
                      </div>
                    );
                  })}
                  <div
                    className={`${styles.dataCell} ${styles.totalDataCell} ${
                      isTwoColumnLayout ? styles.alignCellContentRight : ""
                    }`}
                  >
                    <span>Bs {formatNumber(item.amount)}</span>
                  </div>
                </div>
                {isOpen &&
                  item.sub?.map((subItem, subIndex) => {
                    const isLast = subIndex === subLength - 1;
                    return (
                      <div
                        className={
                          `${styles.dataRow} ${styles.subItemRow} ` +
                          (isLast ? getGroupBotClass() : getGroupMidClass())
                        }
                        key={`subitem-${index}-${subIndex}`}
                      >
                        <div
                          className={`${styles.dataCell} ${styles.subCategoryNameCell}`}
                        >
                          <span>{subItem.name}</span>
                        </div>
                        {Array.from({ length: meses.length }).map((_, mesIdx) => {
                          const valor = subItem.totalMeses?.[mesIdx];
                          return (
                            <div
                              key={`subitem-${index}-${subIndex}-mes-${mesIdx}`}
                              className={`${styles.dataCell} ${
                                styles.monthDataCell
                              } ${
                                !valor || valor === "-" ? styles["no-value"] : ""
                              }`}
                            >
                              <span>
                                {valor && valor !== 0
                                  ? formatNumber(valor)
                                  : "-"}
                              </span>
                            </div>
                          );
                        })}
                        <div
                          className={`${styles.dataCell} ${
                            styles.totalDataCell
                          } ${
                            isTwoColumnLayout ? styles.alignCellContentRight : ""
                          }`}
                        >
                          <span>Bs {formatNumber(subItem.amount)}</span>
                        </div>
                      </div>
                    );
                  })}
              </React.Fragment>
            );
          })}
          {typeof total !== "undefined" && (
            <div className={styles.tableTotalRowContainer}>
              <div
                className={`${styles.tableTotalRow} ${getTotalRowVariantClass()} ${
                  styles.totalRowOutside
                }`}
              >
                <div
                  className={`${
                    styles.totalLabelCell
                  } ${getTotalLabelCellVariantClass()} ${getTotalTextColorClass()}`}
                >
                  {tooltip && (
                    <div className={styles.tooltipContainer}>
                      <IconTableHelp className={styles.tooltipIcon} />
                      <span className={styles.tooltip}>{tooltip}</span>
                    </div>
                  )}
                  <span>{titleTotal ?? "Total de " + title}</span>
                </div>
                <div
                  className={`${
                    styles.totalAmountCell
                  } ${getTotalAmountCellVariantClass()} ${getTotalTextColorClass()} ${
                    isTwoColumnLayout ? styles.alignCellContentRight : ""
                  }`}
                >
                  <span>Bs {formatNumber(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableFinance;
