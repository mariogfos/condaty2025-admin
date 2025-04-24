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

const TableEgresos = ({
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
    let fData: any[] = [];
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

      fData.push(data);
    });

    subcategorias?.map((subcategoria: any) => {
      const categ = fData.find(
        (categoria: any) => categoria.id == subcategoria.categ_id
      );
      if (!categ) return; // Protección contra valores nulos
      
      const subCateg = categ.sub.find((e: any) => e.id == subcategoria.categ_id);
      if (subCateg) {
        subCateg.amount += parseFloat(subcategoria.amount);
        if (anual && subCateg.totalMeses) {
          subCateg.totalMeses[subcategoria.mes - 1] += parseFloat(
            subcategoria.amount
          );
        }
        categ.amount =
          parseFloat(categ.amount) + parseFloat(subcategoria.amount);
        total += parseFloat(subcategoria.amount);
      } else {
        const totalMeses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const monthIndex = subcategoria.mes - 1;
        totalMeses[monthIndex] += parseFloat(subcategoria.amount);

        let data = {
          id: subcategoria.categ_id,
          name: subcategoria.name,
          amount: parseFloat(subcategoria.amount),
          totalMeses: anual ? totalMeses : undefined,
        };

        categ.sub.push(data);
        categ.amount += parseFloat(subcategoria.amount);
        total += parseFloat(subcategoria.amount);
      }
    });

    if (selectcategorias?.length > 0) {
      fData = fData.filter((e) => selectcategorias.includes(e.id));
    }

    setFormatedData(fData);
    setTotal(total);
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