import React from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateStr, getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import {
  IconArrowRight,
  IconArrowLeft,
  IconVehicle,
  IconFoot,
  IconOwner,
} from "@/components/layout/icons/IconsBiblioteca";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import useAxios from "@/mk/hooks/useAxios";
import InvitationsDetail from "../../InvitationsDetail/InvitationsDetail";
import PedidosDetail from "../../PedidosDetail/PedidosDetail";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import LabelValueDetail from "@/components/Detail/LabelValueDetail";
import ContainerDetail from "@/components/Detail/ContainerDetail";
import Br from "@/components/Detail/Br";

interface AccessRenderViewProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}

const RenderView: React.FC<AccessRenderViewProps> = ({
  open,
  onClose,
  item,
  onConfirm,
  extraData,
}) => {
  const { data } = useAxios(
    "/accesses",
    "GET",
    {
      searchBy: item.id,
      fullType: "DET",
      perPage: -1,
      page: 1,
    },
    true
  );
  const [openInvitation, setOpenInvitation] = React.useState(false);
  const [openOrders, setOpenOrders] = React.useState(false);
  // const [openQrKey, setOpenQrKey] = React.useState(false);

  const openDetailsModal = () => {
    if (item?.type === "P") {
      setOpenOrders(true);
    }
    if (
      item?.type === "I" ||
      item?.type === "G" ||
      item?.type === "C" ||
      item?.type === "F"
    ) {
      setOpenInvitation(true);
    }
    if (item?.type === "O") {
      setOpenInvitation(true);
    }
  };

  const statusAccess: any = {
    A: "En espera de confirmación",
    Y: "Ingresado",
    O: "Completado",
    N: "No autorizado",
  };
  const getStatus = () => {
    let status = "";
    if (item?.out_at) {
      status = "Completado";
    } else if (item?.in_at) {
      status = "Por Salir";
    } else if (!item?.confirm_at) {
      status = "Por confirmar";
    } else if (item?.confirm == "Y") {
      status = "Por entrar";
    } else {
      status = "Denegado";
    }
    return status;
  };
  // Desestructuración de data?.data[0]
  const accessDetail = data?.data[0] || {};
  const {
    visit,
    in_at,
    out_at,
    guardia,
    out_guard,
    obs_in,
    obs_out,
    status,
    owner,
    accesses,
    plate,
  } = accessDetail;
  console.log(accessDetail, "accs");

  // Manejar la entrada de un visitante
  const handleEntrada = () => {
    if (onConfirm) {
      onConfirm(item, "entrada");
    }
  };

  // Manejar la salida de un visitante
  const handleSalida = () => {
    if (onConfirm) {
      onConfirm(item, "salida");
    }
  };

  // Determinar el icono a mostrar según el tipo de acceso
  const getAccessIcon = () => {
    if (item?.type === "O") {
      return <IconOwner className={styles.accessIcon} />;
    } else if (item?.plate) {
      return <IconVehicle className={styles.accessIcon} />;
    } else {
      return <IconFoot className={styles.accessIcon} />;
    }
  };

  // Determinar el tipo de acceso como texto
  // const getAccessType = () => {
  //   const typeMap: Record<string, string> = {
  //     C: "Control",
  //     G: "Grupo",
  //     I: "Individual",
  //     P: "Pedido",
  //     O: "Llave Virtual QR"
  //   };

  //   return typeMap[item?.type] || "Acceso";
  // };
  const getTypeAccess = (type: string, param: any) => {
    if (type === "P") {
      return "Pedido:" + param?.other?.other_type?.name;
    }

    return typeMap[type];
  };
  const typeMap: Record<string, string> = {
    C: "Sin Qr",
    G: "Qr Grupal",
    I: "Qr Individual",
    P: "Pedido",
    O: "Llave QR",
    F: "Qr Frecuente",
  };

  return (
    <>
      <DataModal
        open={open}
        onClose={onClose}
        title="Detalle del acceso"
        buttonText=""
        buttonCancel=""
      >
        <LoadingScreen
          onlyLoading={Object.keys(accessDetail).length === 0}
          type="CardSkeleton"
        >
          <div className={styles.container}>
            {item?.type === "O" ? (
              <section>
                <Avatar
                  name={getFullName(owner)}
                  src={getUrlImages(
                    "/OWNER-" + owner?.id + ".webp?" + owner?.updated_at
                  )}
                  style={{ marginBottom: "var(--spL)" }}
                />
                <div>{getFullName(owner)}</div>
                <div>
                  C.I. : {owner?.ci} {plate ? `- Placa: ${plate}` : ""}{" "}
                </div>
              </section>
            ) : (
              <section>
                <Avatar
                  name={getFullName(visit)}
                  src={getUrlImages(
                    "/VISIT-" + visit?.id + ".webp?" + visit?.updated_at
                  )}
                  style={{ marginBottom: "var(--spL)" }}
                />
                <div>{getFullName(visit)}</div>
                <div>
                  C.I. : {visit?.ci} {plate ? `- Placa: ${plate}` : ""}{" "}
                </div>
              </section>
            )}
            <Br />

            <ContainerDetail>
              {/* <div className={styles.textsDiv}>
                  <div>Tipo de acceso</div>
                  <div>{getTypeAccess(item?.type, item)} </div>
                </div> */}
              <LabelValueDetail
                value={getTypeAccess(item?.type, item)}
                label="Tipo de acceso"
              />
              {/* <div className={styles.textsDiv}>
                  <div>Estado</div>
                  <div style={{ color: item?.out_at ? "var(--cAccent)" : "" }}>
                    {getStatus()}
                  </div>
                </div> */}
              <LabelValueDetail
                value={getStatus()}
                label="Estado"
                colorValue={item?.out_at ? "var(--cAccent)" : ""}
              />
              {/* <div className={styles.textsDiv}>
                  <div>Fecha y hora de ingreso</div>
                  <div>{getDateTimeStrMes(in_at)} </div>
                </div> */}
              <LabelValueDetail
                value={getDateTimeStrMes(in_at)}
                label="Fecha y hora de ingreso"
              />
              {/* <div className={styles.textsDiv}>
                  <div>Fecha y hora de salida</div>
                  <div>{getDateTimeStrMes(out_at) || "No registrada"}</div>
                </div> */}
              <LabelValueDetail
                value={getDateTimeStrMes(out_at) || "-/-"}
                label="Fecha y hora de salida"
              />
              {accesses?.length > 0 && (
                // <div className={styles.textsDiv}>
                //   <div>Acompañante</div>
                //   {accesses.map((access: any, i: number) => (
                //     <div key={i} style={{ color: "var(--cWhite" }}>
                //       {getFullName(access?.visit)}
                //     </div>
                //   ))}
                // </div>
                <LabelValueDetail
                  // value={accesses
                  //   .map((access: any, i: number) => (
                  //     <div key={i} style={{ color: "var(--cWhite" }}>
                  //       {getFullName(access?.visit)}
                  //     </div>
                  //   ))
                  //   .join(", ")}
                  value={accesses.map((access: any, i: number) => (
                    <div key={i} style={{ color: "var(--cWhite" }}>
                      {getFullName(access?.visit)}
                    </div>
                  ))}
                  label="Acompañantes"
                />
              )}
              {item?.type !== "O" && (
                // <div className={styles.textsDiv}>
                //   <div>Visitó a</div>
                //   <div>{getFullName(item?.owner) || "No especificado"}</div>
                // </div>
                <LabelValueDetail
                  value={getFullName(item?.owner) || "-/-"}
                  label="Visitó a"
                />
              )}
              {/* <div className={styles.textsDiv}>
                  <div>Guardia de ingreso</div>
                  <div>{getFullName(guardia) || "No especificado"}</div>
                </div> */}
              <LabelValueDetail
                value={getFullName(guardia) || "-/-"}
                label="Guardia de ingreso"
              />
              {/* <div className={styles.textsDiv}>
                  <div>Observación de entrada</div>
                  <div>{obs_in || "-/-"}</div>
                </div> */}
              <LabelValueDetail
                value={obs_in || "-/-"}
                label="Observación de entrada"
              />

              {item?.type !== "O" && (
                // <div className={styles.textsDiv}>
                //   <div>Carnet de identidad</div>
                //   <div>{visit?.ci || "No especificado"}</div>
                // </div>
                <LabelValueDetail
                  value={visit?.ci || "-/-"}
                  label="Carnet de identidad"
                />
              )}

              {/* <div className={styles.textsDiv}>
                  <div>Unidad</div>
                  <div>{owner?.dpto[0]?.nro || "No especificada"}</div>
                </div> */}
              <LabelValueDetail
                value={owner?.dpto[0]?.nro || "-/-"}
                label="Unidad"
              />
              {/* <div className={styles.textsDiv}>
                  <div>Guardia de salida</div>
                  <div>{getFullName(out_guard) || "No especificado"}</div>
                </div> */}
              <LabelValueDetail
                value={getFullName(out_guard) || "-/-"}
                label="Guardia de salida"
              />
              {/* <div className={styles.textsDiv}>
                  <div>Observación de salida</div>
                  <div>{obs_out || "-/-"}</div>
                </div> */}
              <LabelValueDetail
                value={obs_out || "-/-"}
                label="Observación de salida"
              />
            </ContainerDetail>
            <Br />

            {item.type !== "O" && (
              <div
                onClick={openDetailsModal}
                className="link"
                style={{ marginTop: "var(--spS)" }}
              >
                Ver detalles de la invitación
              </div>
            )}
          </div>
        </LoadingScreen>
      </DataModal>
      {openInvitation && (
        <InvitationsDetail
          open={openInvitation}
          onClose={() => setOpenInvitation(false)}
          item={accessDetail}
        />
      )}
      {openOrders && (
        <PedidosDetail
          open={openOrders}
          onClose={() => setOpenOrders(false)}
          item={accessDetail}
        />
      )}
    </>
  );
};

export default RenderView;
