/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { formatNumber } from "@/mk/utils/numbers";

import styles from "./TableFinance.module.css";
import { IconArrowUp, IconArrowDown, IconTableHelp } from "@/components/layout/icons/IconsBiblioteca";

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
  variant?: 'income' | 'expense' | 'summary';
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
  variant = 'income',
}: PropsType) => {
  const [dropStates, setDropStates] = useState<Array<{ drop: boolean }>>([]);
  const isTwoColumnLayout = meses.length === 0;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setDropStates(data.map(() => ({ drop: false })));
  }, [data]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1536);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    switch (variant) {
      case 'income':
        return `${styles.tableContainer} ${styles['tableContainer-income']}`;
      case 'expense':
        return `${styles.tableContainer} ${styles['tableContainer-expense']}`;
      case 'summary':
        return `${styles.tableContainer} ${styles['tableContainer-summary']}`;
      default:
        return styles.tableContainer;
    }
  };

  const getTotalRowVariantClass = () => {

    switch (variant) {
      case 'income':
        return styles['totalRow-income'];
      case 'expense':
        return styles['totalRow-expense'];
      case 'summary':
        return styles['totalRow-summary'];
      default:
        return "";
    }
  };
  
  const getTotalTextColorClass = () => {

     switch (variant) {
      case 'income':
        return styles['text-income'];
      case 'expense':
        return styles['text-expense'];
      case 'summary':
        return styles['text-summary'];
      default:
        return "";
    }
  }

  const getTotalLabelCellVariantClass = () => {
    switch (variant) {
      case 'income':
        return styles['totalLabelCell-income'];
      case 'expense':
        return styles['totalLabelCell-expense'];
      case 'summary':
        return styles['totalLabelCell-summary'];
      default:
        return "";
    }
  };

  const getTotalAmountCellVariantClass = () => {
    switch (variant) {
      case 'income':
        return styles['totalAmountCell-income'];
      case 'expense':
        return styles['totalAmountCell-expense'];
      case 'summary':
        return styles['totalAmountCell-summary'];
      default:
        return "";
    }
  };

  return (
    <div className={styles.tableResponsiveWrapper}>
      <div className={styles.scrollHint}>Desliza horizontalmente para ver todos los meses →</div>
      <div className={getContainerClass() + ' ' + styles.tableFinance}>
        {/* Encabezado de la Tabla */}
        <div className={styles.tableHeaderRow}>
          <div className={`${styles.headerCell} ${styles.titleHeaderCell}`}>
            <span>{title}</span>
          </div>
          {meses.map((mes, index) => (
            <div key={index} className={`${styles.headerCell} ${styles.monthHeaderCell}`}>
              <span>{mes.toUpperCase()}</span>
            </div>
          ))}

          <div className={`${styles.headerCell} ${styles.totalHeaderCell} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>

            <span>{title2}</span>
          </div>
        </div>


        {data.map((item, index) => {
          const isOpen = dropStates[index]?.drop;
          const subLength = item.sub?.length || 0;
          const getGroupTopClass = () =>
            variant === 'income'
              ? styles['groupBorder-income-top']
              : variant === 'expense'
              ? styles['groupBorder-expense-top']
              : styles['groupBorder-summary-top'];
          const getGroupMidClass = () =>
            variant === 'income'
              ? styles['groupBorder-income-mid']
              : variant === 'expense'
              ? styles['groupBorder-expense-mid']
              : styles['groupBorder-summary-mid'];
          const getGroupBotClass = () =>
            variant === 'income'
              ? styles['groupBorder-income-bot']
              : variant === 'expense'
              ? styles['groupBorder-expense-bot']
              : styles['groupBorder-summary-bot'];

          return (
            <React.Fragment key={`item-${index}`}>
              <div
                className={
                  `${styles.dataRow} ${isOpen ? styles.dataRowActive : ''} ` +
                  (isOpen ? getGroupTopClass() : '')
                }
              >
                <div
                  className={`${styles.dataCell} ${styles.categoryNameCell}`}
                  onClick={() => item.sub && item.sub.length > 0 && handleItemClick(index)}
                >
                  {item.sub && item.sub.length > 0 && (
                    <span className={styles.expandIcon}>
                      {isOpen ? <IconArrowUp size={24} /> : <IconArrowDown size={24} />}
                    </span>
                  )}
                  <span>{item.name}</span>
                </div>
                {Array.from({ length: meses.length }).map((_, mesIdx) => (
                  <div key={`item-${index}-mes-${mesIdx}`} className={`${styles.dataCell} ${styles.monthDataCell}`}>
                    <span>{item.totalMeses && item.totalMeses[mesIdx] ? formatNumber(item.totalMeses[mesIdx]) : "-"}</span>
                  </div>
                ))}
                <div className={`${styles.dataCell} ${styles.totalDataCell} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
                  <span>Bs {formatNumber(item.amount)}</span>
                </div>
              </div>
              {isOpen && item.sub && item.sub.map((subItem, subIndex) => {
                const isLast = subIndex === subLength - 1;
                return (
                  <div
                    className={
                      `${styles.dataRow} ${styles.subItemRow} ` +
                      (isLast ? getGroupBotClass() : getGroupMidClass())
                    }
                    key={`subitem-${index}-${subIndex}`}
                  >
                    <div className={`${styles.dataCell} ${styles.subCategoryNameCell}`}>
                      <span>{subItem.name}</span>
                    </div>
                    {Array.from({ length: meses.length }).map((_, mesIdx) => (
                      <div key={`subitem-${index}-${subIndex}-mes-${mesIdx}`} className={`${styles.dataCell} ${styles.monthDataCell}`}>
                        <span>{subItem.totalMeses && subItem.totalMeses[mesIdx] ? formatNumber(subItem.totalMeses[mesIdx]) : "-"}</span>
                      </div>
                    ))}
                    <div className={`${styles.dataCell} ${styles.totalDataCell} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
                      <span>Bs {formatNumber(subItem.amount)}</span>
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
        {/* Fila de Total General SOLO en móvil */}
        {isMobile && typeof total !== 'undefined' && (
          <div className={`${styles.tableTotalRow} ${getTotalRowVariantClass()} ${styles.totalRowOutside}`}>
            <div className={`${styles.totalLabelCell} ${getTotalLabelCellVariantClass()} ${getTotalTextColorClass()}`}>
              {tooltip && (
                <div className={styles.tooltipContainer}>
                  <IconTableHelp className={styles.tooltipIcon} />
                  <span className={styles.tooltip}>
                    {tooltip}
                  </span>
                </div>
              )}
              <span>{titleTotal || "Total de " + title}</span>
            </div>
            <div className={`${styles.totalAmountCell} ${getTotalAmountCellVariantClass()} ${getTotalTextColorClass()} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
              <span>Bs {formatNumber(total)}</span>
            </div>
          </div>
        )}
      </div>
      {/* Fila de Total General SOLO en desktop */}
      {!isMobile && typeof total !== 'undefined' && (
        <div className={styles.tableTotalRowContainer}>
          <div className={`${styles.tableTotalRow} ${getTotalRowVariantClass()} ${styles.totalRowOutside}`}>
            <div className={`${styles.totalLabelCell} ${getTotalLabelCellVariantClass()} ${getTotalTextColorClass()}`}>
              {tooltip && (
                <div className={styles.tooltipContainer}>
                  <IconTableHelp className={styles.tooltipIcon} />
                  <span className={styles.tooltip}>
                    {tooltip}
                  </span>
                </div>
              )}
              <span>{titleTotal || "Total de " + title}</span>
            </div>
            <div className={`${styles.totalAmountCell} ${getTotalAmountCellVariantClass()} ${getTotalTextColorClass()} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
              <span>Bs {formatNumber(total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFinance;