/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import { formatNumber } from "@/mk/utils/numbers";

import styles from "./TableFinance.module.css";
import { IconArrowUp, IconArrowDown, IconTableHelp } from "@/components/layout/icons/IconsBiblioteca";

interface SubItem {
  name: string;
  totalMeses?: (string | number)[]; // Permitir números para formato
  amount: number;
}

interface DataItem {
  name: string;
  sub: SubItem[];
  totalMeses?: (string | number)[]; // Permitir números para formato
  amount: number;
}

interface PropsType {
  data: DataItem[];
  title: string; // Ej. "Ingresos"
  title2: string; // Ej. "Total Anual" o simplemente "Total"
  total?: number; // Gran total para la tabla
  color?: string; // Clase de color para el texto del total (ej. text-income)
  titleTotal?: string; // Ej. "Total de Ingresos"
  meses?: string[]; // Array de nombres de meses para el encabezado, ej. ["ENE", "FEB", ...]
  tooltip?: string;
  variant?: 'income' | 'expense' | 'summary';
}

const TableFinance = ({
  data,
  title,
  title2,
  total,
  color = "text-white", // Se usará junto con la variante para el texto del total
  titleTotal,
  meses = [], // ["ENE", "FEB", ...]
  tooltip,
  variant = 'income',
}: PropsType) => {
  const [dropStates, setDropStates] = useState<Array<{ drop: boolean }>>([]);
  const isTwoColumnLayout = meses.length === 0;

  useEffect(() => {
    setDropStates(data.map(() => ({ drop: false })));
  }, [data]);

  const handleItemClick = (index: number) => {
    setDropStates(
      dropStates.map((state, i) => ({
        drop: i === index ? !state.drop : false, // Colapsa otros al abrir uno
      }))
    );
  };

  const getContainerClass = () => {
    // Esta función ya la tenías y aplica clases de TableFinanceColors.module.css
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
    // Esta función ya la tenías
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
    // Esta función ya la tenías para el texto del total
     switch (variant) {
      case 'income':
        return styles['text-income'];
      case 'expense':
        return styles['text-expense'];
      case 'summary':
        return styles['text-summary'];
      default:
        return ""; // O un color por defecto
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
    <>
      <div className={getContainerClass()}>
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
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          <div className={`${styles.headerCell} ${styles.totalHeaderCell} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
          {/* --- FIN DE LA MODIFICACIÓN --- */}
            <span>{title2}</span>
          </div>
        </div>

        {/* Filas de Datos (Categorías Principales) */}
        {data.map((item, index) => (
          <React.Fragment key={`item-${index}`}>
            <div className={`${styles.dataRow} ${dropStates[index]?.drop ? styles.dataRowActive : ''}`}>
              <div 
                className={`${styles.dataCell} ${styles.categoryNameCell}`}
                onClick={() => item.sub && item.sub.length > 0 && handleItemClick(index)}
              >
                {item.sub && item.sub.length > 0 && (
                  <span className={styles.expandIcon}>
                    {dropStates[index]?.drop ? <IconArrowUp size={24} /> : <IconArrowDown size={24} />}
                  </span>
                )}
                <span>{item.name}</span>
              </div>
              {Array.from({ length: meses.length }).map((_, mesIdx) => (
                <div key={`item-${index}-mes-${mesIdx}`} className={`${styles.dataCell} ${styles.monthDataCell}`}>
                  <span>{item.totalMeses && item.totalMeses[mesIdx] ? formatNumber(item.totalMeses[mesIdx]) : "-"}</span>
                </div>
              ))}
              {/* --- INICIO DE LA MODIFICACIÓN --- */}
              <div className={`${styles.dataCell} ${styles.totalDataCell} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
              {/* --- FIN DE LA MODIFICACIÓN --- */}
                <span>Bs {formatNumber(item.amount)}</span>
              </div>
            </div>

            {dropStates[index]?.drop && item.sub && item.sub.map((subItem, subIndex) => (
              <div className={`${styles.dataRow} ${styles.subItemRow}`} key={`subitem-${index}-${subIndex}`}>
                <div className={`${styles.dataCell} ${styles.subCategoryNameCell}`}>
                  <span>{subItem.name}</span>
                </div>
                {Array.from({ length: meses.length }).map((_, mesIdx) => (
                  <div key={`subitem-${index}-${subIndex}-mes-${mesIdx}`} className={`${styles.dataCell} ${styles.monthDataCell}`}>
                    <span>{subItem.totalMeses && subItem.totalMeses[mesIdx] ? formatNumber(subItem.totalMeses[mesIdx]) : "-"}</span>
                  </div>
                ))}
                {/* --- INICIO DE LA MODIFICACIÓN --- */}
                <div className={`${styles.dataCell} ${styles.totalDataCell} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
                {/* --- FIN DE LA MODIFICACIÓN --- */}
                  <span>Bs {formatNumber(subItem.amount)}</span>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>

      {/* Fila de Total General */}
      {typeof total !== 'undefined' && (
        <div className={`${styles.tableTotalRow} ${getTotalRowVariantClass()} ${styles.totalRowOutside}`}>
          <div className={`${styles.totalLabelCell} ${getTotalLabelCellVariantClass()} ${getTotalTextColorClass()}`}>
            <span>{titleTotal || "Total de " + title}</span>
            {tooltip && (
              <div className={styles.tooltipContainer}>
                <IconTableHelp className={styles.tooltipIcon} />
                <span className={styles.tooltip}>
                  {tooltip}
                </span>
              </div>
            )}
          </div>
          {/* Si no hay meses, totalEmptyMonthCells tendrá flexGrow: 0, lo que es correcto */}
          <div className={styles.totalEmptyMonthCells} style={{ flexGrow: meses.length }}></div>
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          <div className={`${styles.totalAmountCell} ${getTotalAmountCellVariantClass()} ${getTotalTextColorClass()} ${isTwoColumnLayout ? styles.alignCellContentRight : ''}`}>
          {/* --- FIN DE LA MODIFICACIÓN --- */}
            <span>Bs {formatNumber(total)}</span>
          </div>
        </div>
      )}
    </> 
  );
};

export default TableFinance;