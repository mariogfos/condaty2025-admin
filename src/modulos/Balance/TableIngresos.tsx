/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import TableFinance from "./TableFinance/TableFinance";

interface PropType {
  categorias: any[]; // Es buena práctica tipar más específicamente si es posible
  subcategorias: any[]; // Es buena práctica tipar más específicamente si es posible
  title: string;
  title2: string;
  anual?: boolean;
  selectcategorias?: any; // Asumiendo que los IDs son string o number
}

const TableIngresos = ({
  categorias,
  subcategorias,
  title,
  title2,
  anual = false,
  selectcategorias,
}: PropType) => {
  const [formatedData, setFormatedData] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const meses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];

  useEffect(() => {
    let processedData: any[] = [];
    let grandTotal = 0;

    // 1. Inicializar la estructura base con las categorías padre
    categorias?.forEach((categoria: any) => {
      processedData.push({
        id: categoria.id,
        name: categoria.name,
        amount: 0, // Empezar el total de la categoría en 0
        sub: [],   // Array para las subcategorías hijas
        totalMeses: anual ? Array(12).fill(0) : undefined, // Inicializar meses si es anual
      });
    });

    // 2. Procesar cada entrada de subcategoría (transacción/agregado)
    subcategorias?.forEach((subcategoria: any) => {
      // Encontrar la categoría padre correspondiente en processedData usando category_id
      const parentCategory = processedData.find(
        (cat) => cat.id == subcategoria.category_id // Asumiendo que subcategoria.category_id es el ID del padre
      );

      // Si no se encuentra la categoría padre, saltar esta subcategoría
      if (!parentCategory) {
        console.warn(`Categoría padre con ID ${subcategoria.category_id} no encontrada para subcategoría ${subcategoria.name}`);
        return;
      }

      const amount = parseFloat(subcategoria.amount) || 0; // Convertir a número, default 0
      const monthIndex = subcategoria.mes - 1; // Índice basado en 0 para el array de meses

      // Sumar el monto al total de la categoría padre
      parentCategory.amount += amount;

      // Si es vista anual, sumar al mes correspondiente de la categoría padre
      if (anual && parentCategory.totalMeses && monthIndex >= 0 && monthIndex < 12) {
        parentCategory.totalMeses[monthIndex] += amount;
      }

      // Buscar si esta subcategoría ya existe dentro de la categoría padre
      // Usar subcategoria.categ_id como el ID único de la subcategoría
      let existingSubCategory = parentCategory.sub.find(
        (sub: any) => sub.id == subcategoria.categ_id // Asumiendo que subcategoria.categ_id es el ID de la subcategoría
      );

      if (existingSubCategory) {
        // Si ya existe, sumar el monto a la subcategoría existente
        existingSubCategory.amount += amount;
        // Si es anual, sumar al mes correspondiente de la subcategoría
        if (anual && existingSubCategory.totalMeses && monthIndex >= 0 && monthIndex < 12) {
          existingSubCategory.totalMeses[monthIndex] += amount;
        }
      } else {
        // Si no existe, crear la nueva subcategoría y añadirla
        const newSubTotalMeses = anual ? Array(12).fill(0) : undefined;
        if (anual && newSubTotalMeses && monthIndex >= 0 && monthIndex < 12) {
          newSubTotalMeses[monthIndex] = amount; // Asignar el monto inicial al mes correcto
        }
        parentCategory.sub.push({
          id: subcategoria.categ_id, // ID de la subcategoría
          name: subcategoria.name,    // Nombre de la subcategoría
          amount: amount,            // Monto inicial para esta entrada
          totalMeses: newSubTotalMeses, // Totales por mes para la subcategoría
        });
      }

      // Sumar al total general (esto se hará independientemente del filtro por ahora)
      grandTotal += amount;
    });

    // 3. Filtrar por categorías seleccionadas si es necesario
    let finalData = processedData;
    if (selectcategorias && selectcategorias.length > 0) {
      finalData = processedData.filter((cat) => selectcategorias.includes(cat.id));
      // Recalcular el total general basado solo en las categorías filtradas
      grandTotal = finalData.reduce((sum, cat) => sum + cat.amount, 0);
    }

    setFormatedData(finalData);
    setTotal(grandTotal); // Actualizar el estado con el total general (filtrado si aplica)

  }, [categorias, subcategorias, anual, selectcategorias]); // Dependencias del useEffect

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