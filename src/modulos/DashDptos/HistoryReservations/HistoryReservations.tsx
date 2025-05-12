import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import SkeletonAdapterComponent from "@/mk/components/ui/LoadingScreen/SkeletonAdapter";
import Table from "@/mk/components/ui/Table/Table";
import useAxios from "@/mk/hooks/useAxios";
import { getDateStrMes } from "@/mk/utils/date";
import { getUrlImages } from "@/mk/utils/string";
import React from "react";
interface Props {
  open: boolean;
  onClose: any;
  id?: any;
}
const HistoryReservations = ({ open, onClose, id }: Props) => {
  const { data, loaded } = useAxios("/reservations", "GET", {
    fullType: "L",
    dpto_id: id,
    perPage: 10,
    page: 1,
  });
  const header = [
    {
      key: "date_at",
      label: "Fecha de evento",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return getDateStrMes(item?.date_at) || "-";
      },
    },
    {
      key: "avatar",
      label: "Área social",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--cWhite)",
            }}
          >
            <Avatar
              src={getUrlImages(
                "/AREA-" +
                  item?.area?.id +
                  "-" +
                  item?.area?.images?.[0]?.id +
                  ".webp?d="
              )}
              name={item?.area?.title}
            />
            <p>{item?.area?.title}</p>
          </div>
        );
      },
    },
    {
      key: "obs",
      label: "Descripción",
      responsive: "desktop",
      onRender: ({ item }: any) => {
        return item?.obs || "-";
      },
    },
    // {
    //   key: "amount",
    //   label: "Monto",
    //   responsive: "desktop",

    //   onRender: ({ item }: any) => {
    //     return item?.amount && item?.penalty_amount
    //       ? `Bs ${parseFloat(item?.amount) + parseFloat(item?.penalty_amount)}`
    //       : "-";
    //   },
    // },

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
      {data?.data?.length == 0 && <p>No hay reservas</p>}
      {!loaded && <SkeletonAdapterComponent type="TableSkeleton" />}
      {data?.data?.length > 0 && <Table data={data?.data} header={header} />}
    </DataModal>
  );
};

export default HistoryReservations;
