/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import TableFinance from "./TableFinance/TableFinance";
interface CategoriaPrincipal {
  id: string | number;
  name: string;

}
interface ItemIngreso {
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
  subcategorias: ItemIngreso[];
  title: string;
  title2: string;
  anual?: boolean;
  selectcategorias?: (string | number)[]; // Tipo corregido para selectcategorias
}
const TableIngresos = ({
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
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  useEffect(() => {
    let processedData: FormattedCategoryData[] = [];
    let currentGrandTotal = 0; 
    categorias?.forEach((categoria: CategoriaPrincipal) => {
      processedData.push({
        id: categoria.id,
        name: categoria.name,
        amount: 0,
        sub: [],
        totalMeses: anual ? Array(12).fill(0) : undefined,
      });
    });
    subcategorias?.forEach((itemIngreso: ItemIngreso) => {
      let parentCategoryInProcessedData: FormattedCategoryData | undefined;
      if (itemIngreso.category_id !== null) {
        parentCategoryInProcessedData = processedData.find(
          (cat) => cat.id == itemIngreso.category_id
        );
      } else {
        parentCategoryInProcessedData = processedData.find(
          (cat) => cat.id == itemIngreso.categ_id
        );
      }
      if (!parentCategoryInProcessedData) {
        if (itemIngreso.category_id !== null) {
           console.warn(`INGRESOS: Categoría padre (vía category_id ${itemIngreso.category_id}) no encontrada en la lista de categorías principales para el item ${itemIngreso.name} (ID del item: ${itemIngreso.categ_id})`);
        } else {
           console.warn(`INGRESOS: Categoría principal (vía categ_id ${itemIngreso.categ_id}) no encontrada en la lista de categorías principales para el item directo ${itemIngreso.name}`);
        }
        return;
      }
      const amount = parseFloat(itemIngreso.amount) || 0;
      const monthIndex = itemIngreso.mes - 1; 
      parentCategoryInProcessedData.amount += amount;
      if (anual && parentCategoryInProcessedData.totalMeses && monthIndex >= 0 && monthIndex < 12) {
        parentCategoryInProcessedData.totalMeses[monthIndex] += amount;
      }
      let existingSubItem = parentCategoryInProcessedData.sub.find(
        (sub: FormattedSubItemData) => sub.id == itemIngreso.categ_id
      );
      if (existingSubItem) {
        existingSubItem.amount += amount;
        if (anual && existingSubItem.totalMeses && monthIndex >= 0 && monthIndex < 12) {
          existingSubItem.totalMeses[monthIndex] += amount;
        }
      } else {
        const newSubTotalMeses = anual ? Array(12).fill(0) : undefined;
        if (anual && newSubTotalMeses && monthIndex >= 0 && monthIndex < 12) {
          newSubTotalMeses[monthIndex] = amount;
        }
        parentCategoryInProcessedData.sub.push({
          id: itemIngreso.categ_id,    
          name: itemIngreso.name,     
          amount: amount,
          totalMeses: newSubTotalMeses,
        });
      }
    });
    currentGrandTotal = processedData.reduce((sum, cat) => sum + cat.amount, 0);
    let finalData = processedData;
    if (selectcategorias && selectcategorias.length > 0) {
      finalData = processedData.filter((cat) => 
        Array.isArray(selectcategorias) && selectcategorias.includes(cat.id)
      );
      currentGrandTotal = finalData.reduce((sum, cat) => sum + cat.amount, 0);
    }
    setFormatedData(finalData);
    setTotal(currentGrandTotal);
  }, [categorias, subcategorias, anual, selectcategorias]);
  return (
    <TableFinance
      data={formatedData}
      title={title}
      title2={title2}
      total={total}
      color="text-accent" 
      meses={anual ? meses : []}
      variant="income"
      tooltip="Monto total de ingresos detallado por categorias y subcategorias."
    />
  );
};
export default TableIngresos;