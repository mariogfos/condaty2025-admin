/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import TableFinance from "./TableFinance/TableFinance";

// Interfaces para un tipado más claro
interface CategoriaPrincipal {
  id: string | number;
  name: string;
  // Otros campos si los hubiera en tus datos de 'categorias'
}

interface ItemIngreso {
  categ_id: string | number; // ID del item de ingreso en sí
  name: string;
  category_id: string | number | null; // ID de la categoría padre (puede ser null)
  amount: string; // Los montos vienen como string de la API
  mes: number; // Mes del ingreso (asumiendo 1-12)
  // Otros campos si los hubiera en tus datos de 'subcategorias'
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
    let currentGrandTotal = 0; // Renombrado para evitar confusión con 'total' del estado

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

    // 2. Procesar cada item de ingreso
    subcategorias?.forEach((itemIngreso: ItemIngreso) => {
      let parentCategoryInProcessedData: FormattedCategoryData | undefined;

      if (itemIngreso.category_id !== null) {
        // CASO 1: Es un HIJO. Su category_id apunta al id de la categoría principal.
        parentCategoryInProcessedData = processedData.find(
          (cat) => cat.id == itemIngreso.category_id
        );
      } else {
        // CASO 2: Es un INGRESO DIRECTO bajo una categoría principal.
        // Su propio itemIngreso.categ_id es el que coincide con el id de la categoría principal.
        parentCategoryInProcessedData = processedData.find(
          (cat) => cat.id == itemIngreso.categ_id
        );
      }

      // Si no se puede asignar a una categoría principal listada, se omite con advertencia.
      if (!parentCategoryInProcessedData) {
        if (itemIngreso.category_id !== null) {
           console.warn(`INGRESOS: Categoría padre (vía category_id ${itemIngreso.category_id}) no encontrada en la lista de categorías principales para el item ${itemIngreso.name} (ID del item: ${itemIngreso.categ_id})`);
        } else {
           console.warn(`INGRESOS: Categoría principal (vía categ_id ${itemIngreso.categ_id}) no encontrada en la lista de categorías principales para el item directo ${itemIngreso.name}`);
        }
        return;
      }

      const amount = parseFloat(itemIngreso.amount) || 0;
      const monthIndex = itemIngreso.mes - 1; // Asumiendo que 'mes' es 1-12

      // Sumar el monto al total de la categoría principal
      parentCategoryInProcessedData.amount += amount;
      if (anual && parentCategoryInProcessedData.totalMeses && monthIndex >= 0 && monthIndex < 12) {
        parentCategoryInProcessedData.totalMeses[monthIndex] += amount;
      }

      // Agregar o actualizar este itemIngreso en la lista 'sub' de la parentCategoryInProcessedData.
      // El 'id' del item en la lista 'sub' será el itemIngreso.categ_id.
      let existingSubItem = parentCategoryInProcessedData.sub.find(
        (sub: FormattedSubItemData) => sub.id == itemIngreso.categ_id
      );

      if (existingSubItem) {
        // Si ya existe (ej. múltiples transacciones para la misma subcategoría/item directo)
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
          id: itemIngreso.categ_id,    // ID del item de ingreso (ya sea hijo o directo)
          name: itemIngreso.name,      // Nombre del item de ingreso
          amount: amount,
          totalMeses: newSubTotalMeses,
        });
      }
    });

    // Recalcular currentGrandTotal basado en los montos acumulados en processedData
    currentGrandTotal = processedData.reduce((sum, cat) => sum + cat.amount, 0);

    // 3. Filtrar por categorías seleccionadas si es necesario
    let finalData = processedData;
    if (selectcategorias && selectcategorias.length > 0) {
      finalData = processedData.filter((cat) => 
        // Asegurarse de que selectcategorias es un array antes de llamar a .includes
        Array.isArray(selectcategorias) && selectcategorias.includes(cat.id)
      );
      // Recalcular el total general basado solo en las categorías filtradas
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
      color="text-accent" // Color específico para ingresos
      meses={anual ? meses : []}
      variant="income"
    />
  );
};

export default TableIngresos;