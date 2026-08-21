import React, { useEffect, useState } from "react";
import TableFinance from "./TableFinance/TableFinance";
import { idCategoriaPadre } from "./categoriaPadre";

interface CategoriaPrincipal {
  id: string | number;
  name: string;
}
interface ItemEgreso {
  categ_id: string | number;
  name: string;
  category_id: string | number | null;
  amount: string;
  mes: number;
}
interface FormattedCategoryData {
  id: string | number;
  name: string;
  amount: number;
  sub: FormattedSubItemData[];
  totalMeses?: number[];
}
interface FormattedSubItemData {
  id: string | number;
  name: string;
  amount: number;
  totalMeses?: number[];
}
interface PropType {
  categorias: CategoriaPrincipal[];
  subcategorias: ItemEgreso[];
  title: string;
  title2: string;
  anual?: boolean;
  selectcategorias?: (string | number)[];
}
const TableEgresos = ({
  categorias,
  subcategorias,
  title,
  title2,
  anual = false,
  selectcategorias,
}: PropType) => {
  const [formatedData, setFormatedData] = useState<FormattedCategoryData[]>([]);
  const [total, setTotal] = useState<number>(0);
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  useEffect(() => {
    let processedData: FormattedCategoryData[] = [];
    let grandTotal = 0;
    categorias?.forEach((categoria: CategoriaPrincipal) => {
      processedData.push({
        id: categoria.id,
        name: categoria.name,
        amount: 0,
        sub: [],
        totalMeses: anual ? Array(12).fill(0) : undefined,
      });
    });
    subcategorias?.forEach((itemEgreso: ItemEgreso) => {
      const idPadre = idCategoriaPadre(itemEgreso);
      const parentCategoryInProcessedData = processedData.find(
        (cat) => cat.id == idPadre
      );
      if (!parentCategoryInProcessedData) {
        console.warn(
          `EGRESOS: Categoría padre ${idPadre} no encontrada en la lista de categorías principales para el item ${itemEgreso.name} (ID del item: ${itemEgreso.categ_id})`
        );
        return;
      }
      const amount = parseFloat(itemEgreso.amount) || 0;
      const monthIndex = itemEgreso.mes - 1;
      parentCategoryInProcessedData.amount += amount;
      if (
        anual &&
        parentCategoryInProcessedData.totalMeses &&
        monthIndex >= 0 &&
        monthIndex < 12
      ) {
        parentCategoryInProcessedData.totalMeses[monthIndex] += amount;
      }
      let existingSubItem = parentCategoryInProcessedData.sub.find(
        (sub: FormattedSubItemData) => sub.id == itemEgreso.categ_id
      );

      if (existingSubItem) {
        existingSubItem.amount += amount;
        if (
          anual &&
          existingSubItem.totalMeses &&
          monthIndex >= 0 &&
          monthIndex < 12
        ) {
          existingSubItem.totalMeses[monthIndex] += amount;
        }
      } else {
        const newSubTotalMeses = anual ? Array(12).fill(0) : undefined;
        if (anual && newSubTotalMeses && monthIndex >= 0 && monthIndex < 12) {
          newSubTotalMeses[monthIndex] = amount;
        }
        parentCategoryInProcessedData.sub.push({
          id: itemEgreso.categ_id,
          name: itemEgreso.name,
          amount: amount,
          totalMeses: newSubTotalMeses,
        });
      }
    });
    grandTotal = processedData.reduce((sum, cat) => sum + cat.amount, 0);
    let finalData = processedData;
    if (selectcategorias && selectcategorias.length > 0) {
      finalData = processedData.filter((cat) =>
        selectcategorias.includes(cat.id)
      );
      grandTotal = finalData.reduce((sum, cat) => sum + cat.amount, 0);
    }
    setFormatedData(finalData);
    setTotal(grandTotal);
  }, [categorias, subcategorias, anual, selectcategorias]);
  return (
    <TableFinance
      data={formatedData}
      title={title}
      title2={title2}
      total={total}
      color="text-red-500"
      meses={anual ? meses : []}
      variant="expense"
      tooltip="Monto total de egresos detallado por categorias y subcategorias."
    />
  );
};
export default TableEgresos;
