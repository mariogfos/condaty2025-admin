import React, { useEffect, useState } from "react";
import TableFinance from "./TableFinance/TableFinance";
import t from "../../mk/utils/traductor";

interface PropType {
  subcategoriasE: any;
  subcategoriasI: any;
  saldoInicial: any;
  title: string;
  title2: string;
  titleTotal?: string;
}
const TableResumenGeneral = ({
  title,
  titleTotal,
  subcategoriasE,
  subcategoriasI,
  title2,
  saldoInicial,
}: PropType) => {
  const [formatedData, setFormatedData]: any = useState([]);
  const [total, setTotal]: any = useState(0);

  useEffect(() => {
    let totalEgresos = 0;
    let totalIngresos = 0;

    subcategoriasE?.map((subcategoria: any) => {
      totalEgresos += Number(subcategoria.amount);
    });
    subcategoriasI?.map((subcategoria: any) => {
      totalIngresos += Number(subcategoria.amount);
    });
    // totalIngresos =
    //   Number(ingresos?.total_amount) + Number(ingresos?.total_penaltyAmount) ||
    //   0;

    setFormatedData([
      { name: "Saldo Inicial", amount: saldoInicial, sub: [] },
      { name: "Total de Ingresos", amount: totalIngresos, sub: [] },
      { name: "Total de Egresos", amount: totalEgresos, sub: [] },
      { name: "Total de Saldo Acumulado", amount: totalIngresos - totalEgresos, sub: [] },
    ]);
    setTotal(totalIngresos - totalEgresos + Number(saldoInicial));
  }, [subcategoriasE, subcategoriasI]);

  return (
    <TableFinance
      data={formatedData}
      title={title}
      title2={title2}
      total={total || 0}
      color={`${total < 0 ? "text-error " : "text-accent"}`}
      titleTotal={titleTotal}
      variant="summary"
    />
  );
};

export default TableResumenGeneral;
