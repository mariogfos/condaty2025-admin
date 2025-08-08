// @ts-nocheck
import React from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import useAxios from "@/mk/hooks/useAxios";
import InvitationsDetail from "../../InvitationsDetail/InvitationsDetail";
import PedidosDetail from "../../PedidosDetail/PedidosDetail";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import Br from "@/components/Detail/Br";

interface AccessRenderViewProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
}

interface LabelValueProps {
  value: string;
  label: string;
  colorValue?: string;
}
const LabelValue = ({ value, label, colorValue }: LabelValueProps) => {
  return (
    <div className={styles.LabelValue}>
      <p>{label}</p>
      <p
        style={{
          color: colorValue ? colorValue : "var(--cWhite)",
        }}
      >
        {value}
      </p>
    </div>
  );
};
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

  const getStatus = () => {
    let status = "";
    if (item?.out_at) {
      status = "Completado";
    } else if (item?.in_at) {
      status = "Por salir";
    } else if (!item?.confirm_at) {
      status = "Por confirmar";
    } else if (item?.confirm == "Y") {
      status = "Por entrar";
    } else {
      status = "Denegado";
    }
    return status;
  };

  const accessDetail = data?.data[0] || {};
  const {
    visit,
    in_at,
    out_at,
    guardia,
    out_guard,
    obs_in,
    obs_out,
    owner,
    accesses,
    plate,
  } = accessDetail;

  const typeMap: Record<string, string> = {
    C: "Sin Qr",
    G: "Qr Grupal",
    I: "Qr Individual",
    P: "Pedido",
    O: "Llave QR",
    F: "Qr Frecuente",
  };

  const getTypeAccess = (type: string, param: any) => {
    if (type === "P") {
      return "Pedido/" + param?.other?.other_type?.name;
    }
    return typeMap[type];
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
            <p>Visitante</p>
            {item?.type === "O" ? (
              <section className={styles.headerSection}>
                <Avatar
                  hasImage={!!owner?.has_image}
                  name={getFullName(owner)}
                  src={getUrlImages(
                    "/OWNER-" + owner?.id + ".webp?" + owner?.updated_at
                  )}
                  style={{ marginBottom: "var(--spM)" }}
                />
                <div className={styles.amountDisplay}>{getFullName(owner)}</div>
                <div className={styles.dateDisplay}>
                  C.I. : {owner?.ci} {plate ? `- Placa: ${plate}` : ""}
                </div>
              </section>
            ) : (
              <section className={styles.headerSection}>
                <Avatar
                  hasImage={!!visit?.has_image}
                  name={getFullName(visit)}
                  src={getUrlImages(
                    "/VISIT-" + visit?.id + ".webp?" + visit?.updated_at
                  )}
                  style={{ marginBottom: "var(--spM)" }}
                />
                <div className={styles.amountDisplay}>{getFullName(visit)}</div>
                <div className={styles.dateDisplay}>
                  C.I. : {visit?.ci} {plate ? `- Placa: ${plate}` : ""}
                </div>
              </section>
            )}

            <hr className={styles.sectionDivider} />

            <section className={styles.detailsSection}>
              {/* Columna Izquierda */}
              <div className={styles.detailsColumn}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Tipo de acceso</span>
                  <span className={styles.infoValue}>
                    {getTypeAccess(item?.type, item)}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>
                    Hora y fecha de ingreso
                  </span>
                  <span className={styles.infoValue}>
                    {getDateTimeStrMesShort(in_at) || "-/-"}
                  </span>
                </div>
                {accesses?.length > 0 && (
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Acompañantes</span>
                    <span className={styles.infoValue}>
                      {accesses.map((access: any, i: number) => (
                        <span key={i} style={{ display: "block" }}>
                          {getFullName(access?.visit)}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                {item?.type !== "O" && (
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Visitó a</span>
                    <span className={styles.infoValue}>
                      {getFullName(item?.owner) || "-/-"}
                    </span>
                  </div>
                )}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Guardia de ingreso</span>
                  <span className={styles.infoValue}>
                    {getFullName(guardia) || "-/-"}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>
                    Observación de entrada
                  </span>
                  <span className={styles.infoValue}>{obs_in || "-/-"}</span>
                </div>
              </div>

              <div className={styles.detailsColumn}>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Estado</span>
                  <span
                    className={styles.infoValue}
                    // style={{ color: item?.out_at ? "var(--cWhite)" : "" }}
                  >
                    {getStatus()}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>
                    Hora y fecha de salida
                  </span>
                  <span className={styles.infoValue}>
                    {getDateTimeStrMesShort(out_at) || "-/-"}
                  </span>
                </div>
                {accesses?.length > 0 && (
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>
                      Carnet de identidad
                    </span>
                    <span className={styles.infoValue}>
                      {accesses.map((access: any, i: number) => (
                        <span key={i} style={{ display: "block" }}>
                          {access?.visit?.ci || "-/-"}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Unidad</span>
                  <span className={styles.infoValue}>
                    {owner?.dpto[0]?.nro || "-/-"}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Guardia de salida</span>
                  <span className={styles.infoValue}>
                    {getFullName(out_guard) || "-/-"}
                  </span>
                </div>

                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>
                    Observación de salida
                  </span>
                  <span className={styles.infoValue}>{obs_out || "-/-"}</span>
                </div>
              </div>
            </section>

            {item.type !== "O" && item?.type !== "C" && (
              <>
                <Br />

                <div
                  onClick={openDetailsModal}
                  className="link"
                  style={{
                    margin: "0 0 auto",
                    width: "fit-content",
                  }}
                >
                  Ver detalles de la invitación
                </div>
              </>
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
