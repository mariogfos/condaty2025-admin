/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import TableFinance from "./TableFinance/TableFinance";

interface PropType {
  categorias: any;
  subcategorias: any;
  title: string;
  title2: string;
  anual?: boolean;
  selectcategorias?: any;
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
    let fDataI: any[] = [];
    let total = 0;
    
    categorias?.map((categoria: any) => {
      const totalMeses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const subcategoriasDeCategoria = subcategorias.filter(
        (subcategoria: any) => subcategoria.category_id === categoria.id
      );

      // Calculamos el total de amount por mes
      subcategoriasDeCategoria.forEach((subcategoria: any) => {
        const monthIndex = subcategoria.mes - 1;
        totalMeses[monthIndex] += parseFloat(subcategoria.amount);
      });

      let data = {
        id: categoria.id,
        name: categoria.name,
        amount: 0,
        sub: [],
        totalMeses: anual ? totalMeses : undefined,
      };

      fDataI.push(data);
    });

    subcategorias?.forEach((subcategoria: any) => {
      const categ = fDataI.find(
        (categoria: any) => categoria.id == subcategoria.category_id
      );
      
      if (!categ) return; // Skip if category not found
      
      const subCateg = categ.sub.find((e: { id: any; }) => e.id == subcategoria.categ_id);

      if (subCateg) {
        subCateg.amount += parseFloat(subcategoria.amount) || 0;
        
        if (anual && subCateg.totalMeses) {
          subCateg.totalMeses[subcategoria.mes - 1] +=
            parseFloat(subcategoria.amount) || 0;
        }
        
        categ.amount =
          parseFloat(categ.amount) + parseFloat(subcategoria.amount);
        total += parseFloat(subcategoria.amount) || 0;
        console.log(total, "Total1");
      } else {
        const totalMeses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const monthIndex = subcategoria.mes - 1;
        totalMeses[monthIndex] += parseFloat(subcategoria.amount);

        let data = {
          id: subcategoria.categ_id,
          name: subcategoria.name,
          amount: parseFloat(subcategoria.amount) || 0,
          totalMeses: anual ? totalMeses : undefined,
        };

        categ.sub.push(data);
        categ.amount += parseFloat(subcategoria.amount);
        total += parseFloat(subcategoria.amount) || 0;
        console.log(subcategoria.amount, "Subcategoria");
      }
    });

    if (selectcategorias?.length > 0) {
      fDataI = fDataI.filter((e: { id: any; }) => selectcategorias.includes(e.id));
    }
    console.log(total, "Total");

    setFormatedData(fDataI);
    setTotal(total);
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
    />
  );
};

export default TableIngresos;