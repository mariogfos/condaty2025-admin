import { Card } from "@/mk/components/ui/Card/Card";
import HeaderBack from "@/mk/components/ui/HeaderBack/HeaderBack";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import { getUrlImages } from "@/mk/utils/string";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { formatNumber } from "../../../mk/utils/numbers";
import {
  IconArrowLeft,
  IconArrowRight,
} from "@/components/layout/icons/IconsBiblioteca";

const RenderView = ({
  open,
  item,
  extraData,
  onClose,
  setOpenList,
  openList,
}: any) => {
  useEffect(() => {
    setOpenList(false);
  }, [openList]);
  const [indexVisible, setIndexVisible] = useState(0);
  const nextIndex = () => {
    setIndexVisible((prevIndex) => (prevIndex + 1) % item?.images?.length);
  };
  const prevIndex = () => {
    setIndexVisible((prevIndex) =>
      prevIndex === 0 ? item?.images?.length - 1 : prevIndex - 1
    );
  };

  return (
    <div>
      <HeaderBack label="Volver a lista de áreas sociales" onClick={onClose} />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {item?.images?.length > 1 && (
          <div
            style={{
              display: "flex",
              position: "absolute",
              justifyContent: "space-between",
              padding: "0px 16px",
              alignItems: "center",
              width: "100%",
              gap: 24,
            }}
          >
            <div
              style={{
                backgroundColor: "#11111166",
                padding: "6px",
                borderRadius: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={prevIndex}
            >
              <IconArrowLeft />
            </div>
            <div
              style={{
                backgroundColor: "#11111166",
                padding: "6px",
                borderRadius: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={nextIndex}
            >
              <IconArrowRight />
            </div>
          </div>
        )}
        {item?.images?.[indexVisible]?.id && (
          <img
            alt=""
            style={{
              resize: "inherit",
              objectFit: "contain",
              display: "block",
            }}
            width={300}
            height={300}
            src={getUrlImages(
              "/AREA-" +
                item?.id +
                "-" +
                item?.images?.[indexVisible]?.id +
                ".webp" +
                "?" +
                item?.updated_at
            )}
          />
        )}
      </div>
      <h1>{item?.title}</h1>
      <p>{item?.description}</p>
      <Card>
        <KeyValue
          title={"Policia de cancelación"}
          value={item?.cancellation_policy}
        />
        <KeyValue
          title={"Capacidad máxima"}
          value={item?.max_capacity + " personas"}
        />
        <KeyValue
          title={"Máximo de reservas por semana"}
          value={item?.max_reservations_per_week + " reservas"}
        />
        <KeyValue
          title={"Porcentaje de comisión en caso de cancelación"}
          value={formatNumber(item?.penalty_fee, 0) + "%"}
        />
        <KeyValue
          title={"Precio por reserva"}
          value={formatNumber(item?.price, 0) + "Bs"}
        />
        <KeyValue title={"Reglas de uso"} value={item?.usage_rules} />
      </Card>
    </div>
  );
};

export default RenderView;
