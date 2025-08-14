import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import KeyValue from "@/mk/components/ui/KeyValue/KeyValue";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import useAxios from "@/mk/hooks/useAxios";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import React, { useEffect, useState } from "react";

interface PropsType {
  id: string | number | null;
  open: boolean;
  onClose: () => void;
  type: "A" | "T" | "I" | "V" | "P" | string;
  invitation?: any;
}
// const typeInvitation: any = {
//   G: "QR grupal",
//   I: "QR individual",
//   F: "QR frecuente",
//   O: "Llave QR",
//   P: "Pedido",
//   C: "Sin QR",
// };
const statusAccess = {
  S: "Por salir",
  C: "Completado",
  I: "Por ingresar",
};
const ModalAccessExpand = ({
  id,
  open,
  onClose,
  type,
  invitation,
}: PropsType) => {
  const [data, setData]: any = useState([]);
  const { execute } = useAxios();
  const [loading, setLoading] = useState(false);

  const getAccess = async () => {
    setLoading(true);
    const { data } = await execute(
      "/accesses",
      "GET",
      {
        perPage: -1,
        page: 1,
        fullType: "DET",
        searchBy: id,
      },
      false,
      true
    );
    setLoading(false);
    if (data?.success == true) {
      setData(data?.data?.[0]);
    }
  };
  useEffect(() => {
    if (type != "I" && type != "P") {
      getAccess();
    }
  }, []);

  const Br = () => {
    return (
      <div
        style={{
          height: 0.5,
          backgroundColor: "var(--cWhiteV1)",
          margin: "8px 0px",
          width: "100%",
        }}
      />
    );
  };

  const getStatus = () => {
    // if (condition) {

    // }
    if (!data?.in_at) {
      return "I";
    }
    if (!data?.out_at) {
      return "S";
    }
    if (data?.out_at) {
      return "C";
    }
    return "I";
  };
  const rendeAccess = () => {
    return (
      <>
        <ItemList
          key={data?.id}
          title={getFullName(data?.visit)}
          subtitle={"C.I:" + data?.visit?.ci}
          left={
            <Avatar
              name={getFullName(data?.visit)}
              hasImage={data?.visit?.has_image}
              src={
                data?.visit?.has_image
                  ? getUrlImages(
                      "/VISIT-" +
                        (data?.visit?.id || data?.visit?.id) +
                        ".webp?" +
                        (data?.visit?.updated_at || data?.visit?.updated_at)
                    )
                  : ""
              }
            />
          }
        />
        <KeyValue title="Estado" value={statusAccess[getStatus()]} />
        {data?.plate && type == "T" && (
          <KeyValue title="Placa" value={data?.plate || "-/-"} />
        )}
        <KeyValue
          title="Fecha y hora de ingreso"
          value={getDateTimeStrMes(data?.in_at)}
        />
        <KeyValue
          title="Fecha y hora de salida"
          value={getDateTimeStrMes(data?.out_at) || "-/-"}
        />
        <KeyValue
          title={
            data?.out_guard || !data?.out_at
              ? "Guardia de ingreso"
              : "Guardia de ingreso y salida"
          }
          value={getFullName(data?.guardia) || "-/-"}
        />
        {data?.out_guard && (
          <KeyValue
            title="Guardia de salida"
            value={getFullName(data?.out_guard)}
          />
        )}
        <KeyValue
          title="Observación de ingreso"
          value={data?.obs_in || "-/-"}
        />
        <KeyValue
          title="Observación de salida"
          value={data?.obs_out || "-/-"}
        />
      </>
    );
  };

  function parseWeekDays(binaryNumber: number): string[] {
    const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const result: string[] = [];

    for (let i = 0; i < 7; i++) {
      if (binaryNumber & (1 << i)) {
        result.push(diasSemana[i]);
      }
    }
    return result;
  }

  const renderInvitation = () => {
    return (
      <>
        <ItemList
          title={getFullName(invitation?.owner)}
          // subtitle={'C.I.' + data?.owner?.ci}
          subtitle={
            "Unidad: " +
            invitation?.owner?.dptos?.[0]?.nro +
            ", " +
            invitation?.owner?.dptos?.[0]?.description
          }
          left={
            <Avatar
              name={getFullName(invitation?.owner)}
              src={getUrlImages(
                "/OWNER-" +
                  invitation?.owner?.id +
                  ".webp?d=" +
                  invitation?.owner?.updated_at
              )}
            />
          }
          style={{ marginBottom: 8 }}
        />
        {invitation.type == "G" && (
          <KeyValue
            title="Nombre del evento"
            value={invitation?.title || "-/-"}
          />
        )}
        {/* <KeyValue
          title="Tipo de invitación"
          value={typeInvitation[invitation.type]}
        /> */}
        {invitation.type != "F" && (
          <>
            <KeyValue
              title="Fecha de invitación"
              value={getDateStrMes(invitation?.date_event)}
            />
            <KeyValue title="Descripción" value={invitation?.obs || "-/-"} />
          </>
        )}
        {invitation.type == "F" && (
          <>
            {invitation?.start_date && (
              <>
                <KeyValue
                  title="Periodo de validez"
                  value={
                    getDateStrMes(invitation?.start_date) +
                    " a " +
                    getDateStrMes(invitation?.end_date)
                  }
                />
              </>
            )}
            <KeyValue title="Indicaciones" value={invitation?.obs || "-/-"} />
            {invitation?.is_advanced == "Y" && (
              <>
                <Br />
                <p
                  style={{
                    fontSize: 16,
                    color: "var(--cWhite)",
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Configuración avanzada
                </p>
                <KeyValue
                  title="Días de acceso"
                  value={
                    parseWeekDays(invitation?.weekday)?.join(", ") || "-/-"
                  }
                />
                <KeyValue
                  title="Horario permitido"
                  value={
                    invitation?.start_time.slice(0, 5) +
                      " - " +
                      invitation?.end_time.slice(0, 5) || "-/-"
                  }
                />
                {invitation?.max_entries && (
                  <KeyValue
                    title="Cantidad de accesos"
                    value={invitation?.max_entries.toString() || "-/-"}
                  />
                )}
              </>
            )}
          </>
        )}
      </>
    );
  };
  const renderPedido = () => {
    return (
      <>
        <ItemList
          title={getFullName(invitation?.owner)}
          // subtitle={'C.I.' + data?.owner?.ci}
          subtitle={
            "Unidad: " +
            invitation?.owner?.dpto?.nro +
            ", " +
            invitation?.owner?.dpto?.description
          }
          left={
            <Avatar
              name={getFullName(invitation?.owner)}
              src={getUrlImages(
                "/OWNER-" +
                  invitation?.owner?.id +
                  ".webp?d=" +
                  invitation?.owner?.updated_at
              )}
            />
          }
          style={{ marginBottom: 8 }}
        />
        {/* <KeyValue
          keys="Tipo de invitación"
          value={typeInvitation[invitation.type]}
        /> */}
        <KeyValue title="Tipo de pedido" value={invitation?.other_type?.name} />
        <KeyValue
          title="Fecha de notificación"
          value={getDateStrMes(invitation?.created_at)}
        />
        <KeyValue title="Descripción" value={invitation?.descrip || "-/-"} />
      </>
    );
  };
  return (
    <DataModal
      style={{ width: 600 }}
      buttonText=""
      buttonCancel=""
      title={
        type === "A"
          ? "Detalle del acompañante"
          : type === "T"
          ? "Detalle del taxista"
          : type === "I" || type === "P"
          ? "Detalle de la invitación"
          : type === "V"
          ? "Detalle del visitante"
          : ""
      }
      open={open}
      onClose={onClose}
    >
      {loading ? (
        <LoadingScreen onlyLoading />
      ) : type === "I" ? (
        renderInvitation()
      ) : type == "P" ? (
        renderPedido()
      ) : (
        rendeAccess()
      )}
    </DataModal>
  );
};

export default ModalAccessExpand;
