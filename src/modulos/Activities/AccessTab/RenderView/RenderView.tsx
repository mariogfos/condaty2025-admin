import React, { useState } from "react";
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
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { IconExpand } from "@/components/layout/icons/IconsBiblioteca";
import ModalAccessExpand from "../ModalAccessExpand/ModalAccessExpand";

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
}) => {
  const [openExpand, setOpenExpand]: any = useState({
    open: false,
    id: null,
    type: "",
    invitation: null,
  });

  const { data } = useAxios(
    "/accesses",
    "GET",
    {
      searchBy: item?.access_id || item?.id,
      fullType: "DET",
      perPage: -1,
      page: 1,
    },
    true
  );
  const [openInvitation, setOpenInvitation] = useState(false);
  const [openOrders, setOpenOrders] = useState(false);

  const accessDetail = data?.data[0] || {};
  const {
    visit,
    in_at,
    out_at,
    guardia,
    out_guard,
    obs_in,
    obs_out,
    confirm_at,
    confirm,
    owner,
    accesses,
    plate,
  } = accessDetail;

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
    if (out_at) {
      status = "Completado";
    } else if (in_at) {
      status = "Por salir";
    } else if (!confirm_at) {
      status = "Por confirmar";
    } else if (confirm == "Y") {
      status = "Por entrar";
    } else {
      status = "Denegado";
    }
    return status;
  };

  const typeMap: Record<string, string> = {
    C: "Sin QR",
    I: "QR Individual",
    G: "QR Grupal",
    F: "QR Frecuente",
    P: "Pedido",
    O: "Llave QR",
  };

  const getTypeAccess = (type: string, param: any) => {
    if (type === "P") {
      return "Pedido/" + param?.other?.other_type?.name;
    }
    return typeMap[type];
  };
  const getAcomData = () => {
    return accesses?.filter((item: any) => item.taxi != "C");
  };
  const getTaxiData = () => {
    return accesses?.filter((item: any) => item.taxi == "C");
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
                  hasImage={owner?.has_image}
                  name={getFullName(owner)}
                  src={getUrlImages(
                    "/OWNER-" + owner?.id + ".webp?" + owner?.updated_at
                  )}
                  style={{ marginBottom: "var(--spM)" }}
                />
                <div className={styles.amountDisplay}>{getFullName(owner)}</div>
                <div className={styles.dateDisplay}>
                  C.I. : {owner?.ci}{" "}
                  {plate && getTaxiData().length == 0
                    ? `- Placa: ${plate}`
                    : ""}
                </div>
              </section>
            ) : (
              <section className={styles.headerSection}>
                <Avatar
                  hasImage={visit?.has_image}
                  name={getFullName(visit)}
                  src={getUrlImages(
                    "/VISIT-" + visit?.id + ".webp?" + visit?.updated_at
                  )}
                  style={{ marginBottom: "var(--spM)" }}
                />
                <div className={styles.amountDisplay}>{getFullName(visit)}</div>
                <div className={styles.dateDisplay}>
                  C.I. : {visit?.ci}{" "}
                  {plate && getTaxiData()?.length == 0
                    ? `- Placa: ${plate}`
                    : ""}
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
                {item?.type == "G" && (
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>Evento</span>
                    <span className={styles.infoValue}>
                      {item?.invitation?.title}
                    </span>
                  </div>
                )}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>
                    Hora y fecha de ingreso
                  </span>
                  <span className={styles.infoValue}>
                    {getDateTimeStrMesShort(in_at) || "-/-"}
                  </span>
                </div>
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
                {item?.type == "G" && (
                  <div className={styles.infoBlock}>
                    <span className={styles.infoLabel}>
                      Cantidad de invitados
                    </span>
                    <span className={styles.infoValue}>
                      {accessDetail?.invitation?.guests?.length || "-/-"}
                    </span>
                  </div>
                )}
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>
                    Hora y fecha de salida
                  </span>
                  <span className={styles.infoValue}>
                    {getDateTimeStrMesShort(out_at) || "-/-"}
                  </span>
                </div>

                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Unidad</span>
                  <span className={styles.infoValue}>
                    {owner?.dpto[0]?.nro || "-/-"}
                  </span>
                </div>
                <div className={styles.infoBlock}>
                  <span className={styles.infoLabel}>Guardia de salida</span>
                  <span className={styles.infoValue}>
                    {out_at ? getFullName(out_guard || guardia) : "-/-"}
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
            {getAcomData()?.length > 0 && (
              <>
                <Br />
                <p>Acompañantes</p>
                <div className={styles.listContainer}>
                  {getAcomData()?.map((acc: any) => (
                    <ItemList
                      variant="V3"
                      key={acc.id}
                      title={getFullName(acc.visit || visit)}
                      subtitle={"C.I: " + acc?.visit?.ci}
                      left={
                        <Avatar
                          hasImage={
                            acc.visit ? acc.visit?.has_image : visit?.has_image
                          }
                          src={getUrlImages(
                            "/VISIT-" +
                              (acc?.visit?.id || visit?.id) +
                              ".webp?" +
                              (acc?.visit?.updated_at || visit?.updated_at)
                          )}
                          name={getFullName(acc.visit || visit)}
                        />
                      }
                      right={
                        <IconExpand
                          color="var(--cWhiteV1)"
                          onClick={() =>
                            setOpenExpand({
                              open: true,
                              id: acc.id,
                              type: "A",
                              invitation: null,
                            })
                          }
                        />
                      }
                    />
                  ))}
                </div>
              </>
            )}
            {getTaxiData()?.length > 0 && (
              <>
                <Br />
                <p>Taxista</p>
                <div className={styles.listContainer}>
                  {getTaxiData()?.map((acc: any) => (
                    <ItemList
                      variant="V3"
                      key={acc.id}
                      title={getFullName(acc.visit || visit)}
                      subtitle={"C.I: " + acc?.visit?.ci}
                      left={
                        <Avatar
                          hasImage={
                            acc.visit ? acc.visit?.has_image : visit?.has_image
                          }
                          src={getUrlImages(
                            "/VISIT-" +
                              (acc?.visit?.id || visit?.id) +
                              ".webp?" +
                              (acc?.visit?.updated_at || visit?.updated_at)
                          )}
                          name={getFullName(acc.visit || visit)}
                        />
                      }
                      right={
                        <IconExpand
                          color="var(--cWhiteV1)"
                          onClick={() =>
                            setOpenExpand({
                              open: true,
                              id: acc.id,
                              type: "T",
                              invitation: null,
                            })
                          }
                        />
                      }
                    />
                  ))}
                </div>
              </>
            )}

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

      {openExpand?.open && (
        <ModalAccessExpand
          open={openExpand?.open}
          onClose={() =>
            setOpenExpand({ open: false, id: null, type: "", invitation: null })
          }
          id={openExpand?.id}
          type={openExpand?.type}
        />
      )}

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
