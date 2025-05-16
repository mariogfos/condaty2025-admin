/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import TableFinance from "./TableFinance/TableFinance";

interface CategoriaPrincipal { // Tipo para elementos de la prop 'categorias'
  id: string | number;
  name: string;
  // Otros campos si los hubiera
}

interface ItemEgreso { // Tipo para elementos de la prop 'subcategorias'
  categ_id: string | number; // ID del item de egreso en sí
  name: string;
  category_id: string | number | null; // ID de la categoría padre (puede ser null)
  amount: string; // Viene como string desde la API
  mes: number; // Mes del egreso
  // Otros campos si los hubiera
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
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  useEffect(() => {
    let processedData: FormattedCategoryData[] = [];
    let grandTotal = 0;

    // 1. Inicializar la estructura base con las categorías principales
    categorias?.forEach((categoria: CategoriaPrincipal) => {
      processedData.push({
        id: categoria.id,
        name: categoria.name,
        amount: 0,
        sub: [],
        totalMeses: anual ? Array(12).fill(0) : undefined,
      });
    });

    // 2. Procesar cada item de egreso
    subcategorias?.forEach((itemEgreso: ItemEgreso) => {
      let parentCategoryInProcessedData: FormattedCategoryData | undefined;

      if (itemEgreso.category_id !== null) {
        // CASO 1: Es un HIJO. Su category_id apunta al id de la categoría principal.
        parentCategoryInProcessedData = processedData.find(
          (cat) => cat.id == itemEgreso.category_id
        );
      } else {
        // CASO 2: Es un GASTO DIRECTO bajo una categoría principal (o "padre" en tu terminología).
        // Su propio itemEgreso.categ_id es el que coincide con el id de la categoría principal.
        parentCategoryInProcessedData = processedData.find(
          (cat) => cat.id == itemEgreso.categ_id
        );
      }

      // Si no se puede asignar a una categoría principal listada, se omite con advertencia.
      if (!parentCategoryInProcessedData) {
        if (itemEgreso.category_id !== null) {
           console.warn(`EGRESOS: Categoría padre (vía category_id ${itemEgreso.category_id}) no encontrada en la lista de categorías principales para el item ${itemEgreso.name} (ID del item: ${itemEgreso.categ_id})`);
        } else {
           console.warn(`EGRESOS: Categoría principal (vía categ_id ${itemEgreso.categ_id}) no encontrada en la lista de categorías principales para el item directo ${itemEgreso.name}`);
        }
        return;
      }

      const amount = parseFloat(itemEgreso.amount) || 0;
      const monthIndex = itemEgreso.mes - 1; // Asumiendo que 'mes' es 1-12

      // Sumar el monto al total de la categoría principal
      parentCategoryInProcessedData.amount += amount;
      if (anual && parentCategoryInProcessedData.totalMeses && monthIndex >= 0 && monthIndex < 12) {
        parentCategoryInProcessedData.totalMeses[monthIndex] += amount;
      }

      // Agregar o actualizar este itemEgreso en la lista 'sub' de la parentCategoryInProcessedData.
      // El 'id' del item en la lista 'sub' será el itemEgreso.categ_id.
      let existingSubItem = parentCategoryInProcessedData.sub.find(
        (sub: FormattedSubItemData) => sub.id == itemEgreso.categ_id
      );

      if (existingSubItem) {
        // Si ya existe (ej. múltiples transacciones para la misma subcategoría/item directo en diferentes meses o registros)
        existingSubItem.amount += amount;
        if (anual && existingSubItem.totalMeses && monthIndex >= 0 && monthIndex < 12) {
          existingSubItem.totalMeses[monthIndex] += amount;
        }
      } else {
        // Si no existe, crear el nuevo item en la lista 'sub'
        const newSubTotalMeses = anual ? Array(12).fill(0) : undefined;
        if (anual && newSubTotalMeses && monthIndex >= 0 && monthIndex < 12) {
          newSubTotalMeses[monthIndex] = amount;
        }
        parentCategoryInProcessedData.sub.push({
          id: itemEgreso.categ_id,    // ID del item de egreso (ya sea hijo o directo)
          name: itemEgreso.name,      // Nombre del item de egreso
          amount: amount,
          totalMeses: newSubTotalMeses,
        });
      }
      // El grandTotal se sumará aquí y se recalculará después si hay filtros.
      // (La lógica original de grandTotal estaba bien, la mantendré así)
    });

    // Recalcular grandTotal basado en los montos acumulados en processedData
    // Esto es más simple que sumarlo dentro del bucle y luego restarlo si hay filtros.
    grandTotal = processedData.reduce((sum, cat) => sum + cat.amount, 0);


    // 3. Filtrar por categorías seleccionadas si es necesario
    let finalData = processedData;
    if (selectcategorias && selectcategorias.length > 0) {
      finalData = processedData.filter((cat) => selectcategorias.includes(cat.id));
      // Recalcular el total general basado solo en las categorías filtradas
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
    />
  );
};

export default TableEgresos;