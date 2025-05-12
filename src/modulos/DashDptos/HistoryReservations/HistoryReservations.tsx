import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Table from "@/mk/components/ui/Table/Table";
import useAxios from "@/mk/hooks/useAxios";
import { getDateStrMes } from "@/mk/utils/date";
import React from "react";
interface Props {
  open: boolean;
  onClose: any;
  id?: any;
}
const HistoryReservations = ({ open, onClose, id }: Props) => {
  const { data } = useAxios("/reservations", "GET", {
    fullType: "L",
    dpto_id: id,
  });
  console.log(data);
  const header = [
    {
      key: "paid_at",
      label: "Fecha de pago",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return getDateStrMes(item?.paid_at) || "-";
      },
    },
    {
      key: "categorie",
      label: "Categoría",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return item?.payment?.categoryP?.name || "-";
      },
    },
    {
      key: "sub_categorie",
      label: "Sub Categoría",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return item?.payment?.category?.name || "-";
      },
    },
    {
      key: "amount",
      label: "Monto",
      responsive: "desktop",

      onRender: ({ item }: any) => {
        return item?.amount && item?.penalty_amount
          ? `Bs ${parseFloat(item?.amount) + parseFloat(item?.penalty_amount)}`
          : "-";
      },
    },

    // {
    //   key: "status",
    //   label: "Estado",
    //   responsive: "desktop",
    //   onRender: ({ item }: any) => {
    //     return (
    //       <span
    //         className={`${styles.status} ${styles[`status${item?.status}`]}`}
    //       >
    //         {getStatus(item?.status)}
    //       </span>
    //     );
    //   },
    // },
  ];
  return (
    <DataModal
      title="Historial de reservas"
      open={open}
      onClose={onClose}
      onSave={() => {}}
      buttonText=""
      buttonCancel=""
      //   fullScreen={true}
    >
      <Table data={data?.data} header={header} />
    </DataModal>
  );
};

export default HistoryReservations;
