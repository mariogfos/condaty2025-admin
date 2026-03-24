import React, { useEffect, useState } from "react";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import styles from "./RenderView.module.css";
import { getFullName } from "@/mk/utils/string";
import { formatToDayFdMYH } from "@/mk/utils/date";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Image } from "@/mk/components/ui/Image/Image";
import useAxios from "@/mk/hooks/useAxios";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import Br from "@/components/Detail/Br";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconExpand,
  IconPhone,
} from "@/components/layout/icons/IconsBiblioteca";
import ModalAccessExpand from "../ModalAccessExpand/ModalAccessExpand";

interface AccessRenderViewProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  extraData?: any;
}

const Row = ({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) => {
  return (
    <>
      <div className={styles.rowLabel}>{label}</div>
      <div className={`${styles.rowValue} ${valueClassName}`}>{value}</div>
    </>
  );
};

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
    true,
  );

  const accessDetail = data?.data?.access || data?.data?.[0] || {};
  const accessDevices =
    data?.data?.accessDevices || data?.data?.access_devices || [];
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
    begin_at,
    plate,
  } = accessDetail;
  const accessType = accessDetail?.type || item?.type;

  const getStatus = () => {
    if (out_at) return "Completado";
    if (in_at) return "Por salir";
    if (!confirm_at) return "Por confirmar";
    if (confirm === "Y") return "Por entrar";
    return "Rechazado";
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
    if (type === "P") return "Pedido/" + param?.other?.other_type?.name;
    return typeMap[type] || "-/-";
  };

  const getAcomData = () =>
    accesses?.filter((it: any) => it.taxi !== "C") || [];
  const getTaxiData = () =>
    accesses?.filter((it: any) => it.taxi === "C") || [];

  const cleanUrl = (value: any) => {
    if (!value) return "";
    const sanitized = String(value).replace(/[`"']/g, "").trim();
    if (!sanitized || sanitized.includes("undefined")) return "";
    return sanitized;
  };

  const normalizeImageUrls = (arr: any) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(cleanUrl).filter(Boolean);
  };

  const getEntityAvatar = (entity: any) => {
    const fromAvatar = cleanUrl(entity?.url_avatar);
    if (fromAvatar) return fromAvatar;
    const fromArray = normalizeImageUrls(entity?.url_image_a)?.[0];
    if (fromArray) return fromArray;
    const fromRear = cleanUrl(entity?.url_image_r);
    if (fromRear) return fromRear;
    return "";
  };

  const PersonValue = ({
    person,
    text,
    roleText = "",
  }: {
    person: any;
    text: string;
    roleText?: string;
  }) => {
    const src = getEntityAvatar(person);
    return (
      <div className={styles.personValue}>
        <Avatar name={text} src={src} w={24} h={24} />
        <span>
          {text || "-/-"}
          {roleText ? (
            <span className={styles.personRole}> {roleText}</span>
          ) : null}
        </span>
      </div>
    );
  };

  const accessImages = [
    ...normalizeImageUrls((accessDetail as any)?.url_image_p),
    ...normalizeImageUrls((accessDetail as any)?.url_image),
  ];

  const entityImages =
    accessType === "O"
      ? [
          ...normalizeImageUrls((owner as any)?.url_image_a),
          ...normalizeImageUrls((owner as any)?.url_image_r),
        ]
      : [
          ...normalizeImageUrls((visit as any)?.url_image_a),
          ...normalizeImageUrls((visit as any)?.url_image_r),
        ];

  const images = Array.from(
    new Set([...(entityImages || []), ...(accessImages || [])]),
  );
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const check = () => setShowControls(el.scrollWidth > el.clientWidth + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [images]);

  const displayName =
    accessType === "O" ? getFullName(owner) : getFullName(visit);
  const displayCi = accessType === "O" ? owner?.ci : visit?.ci;
  const status = getStatus();
  const statusClassName =
    status === "Completado"
      ? styles.statusOk
      : status === "Rechazado"
        ? styles.statusError
        : styles.statusPending;
  const approvalLabel =
    accessType === "C"
      ? confirm === "N"
        ? "Rechazado por"
        : "Aprobado por"
      : "Aprobado por";
  const approvedByGuard =
    confirm == "G" || accessDetail?.rejected_guard_id !== null;
  const approvalName = approvedByGuard
    ? getFullName(guardia)
    : getFullName(owner);
  const approvalRole = approvedByGuard ? "(Guardia)" : "(Propietario)";
  const reasonLabel =
    accessDetail?.rejected_guard_id !== null
      ? accessDetail?.confirm !== "N"
        ? "Motivo de aprobación"
        : "Motivo de rechazo"
      : accessDetail?.confirm === "N"
        ? "Motivo de rechazo"
        : "Motivo";
  const getActionNameEs = (actionName: string) => {
    if (actionName === "In") return "Entrada";
    if (actionName === "Out") return "Salida";
    return actionName || "-/-";
  };
  const formatDetailDate = (dateStr: string | null = "") => {
    const formatted = formatToDayFdMYH(dateStr, true, true, false) || "";
    if (!formatted) return "-/-";
    return formatted.replace(/ del (\d{4}) - /, ", $1 - ");
  };

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={
          <p className={styles.modalTitle}>
            <span className={styles.modalTitleMain}>Acceso </span>
            <span className={styles.modalTitleId}>
              #{accessDetail?.id || item?.access_id || item?.id || "-/-"}
            </span>
          </p>
        }
        buttonText=""
        buttonCancel=""
        maxWidth={840}
      >
        <LoadingScreen
          onlyLoading={Object.keys(accessDetail).length === 0}
          type="CardSkeleton"
        >
          <div className={styles.container}>
            <section className={styles.summaryCard}>
              <div className={styles.summaryIcon}>
                <IconCheck size={24} color="var(--cAccent)" />
              </div>
              <div className={styles.summaryTextWrap}>
                <p className={styles.summaryTitle}>
                  <span className={styles.summaryStrong}>
                    {displayName || "Sin nombre"}
                  </span>{" "}
                  <span className={styles.summarySoft}>
                    {accessType === "P" ? "entregó a " : "visitó a "}
                  </span>
                  <span className={styles.summaryStrong}>
                    {getFullName(owner) || "-/-"}
                  </span>{" "}
                  <span className={styles.summarySoft}>de la </span>
                  <span className={styles.summaryStrong}>
                    {owner?.dpto?.[0]?.nro
                      ? `Casa ${owner?.dpto?.[0]?.nro}`
                      : "Unidad -/-"}
                  </span>
                </p>
                <p className={styles.summaryDate}>
                  {formatDetailDate(in_at || begin_at)}
                </p>
              </div>
            </section>

            <section className={styles.sectionBlock}>
              <p className={styles.sectionTitle}>Detalles del acceso</p>
              <div className={styles.detailsGrid}>
                <Row
                  label="Estado"
                  value={
                    <span
                      className={`${styles.statusBadge} ${statusClassName}`}
                    >
                      {status}
                    </span>
                  }
                />
                <Row
                  label="Tipo de acceso"
                  value={getTypeAccess(accessType, accessDetail)}
                />
                {accessType == "G" && (
                  <Row
                    label="Evento"
                    value={item?.invitation?.title || "-/-"}
                  />
                )}
                {accessType == "G" && (
                  <Row
                    label="Cantidad de invitados"
                    value={accessDetail?.invitation?.guests?.length || "-/-"}
                  />
                )}
                <Row
                  label={
                    accessType == "C" && confirm == "N"
                      ? "Hora y fecha de petición"
                      : "Hora y fecha de ingreso"
                  }
                  value={
                    accessType == "C" && confirm == "N"
                      ? formatDetailDate(begin_at)
                      : formatDetailDate(in_at)
                  }
                />
                <Row
                  label={
                    accessType == "C" && confirm == "N"
                      ? "Hora y fecha de rechazo"
                      : "Hora y fecha de salida"
                  }
                  value={
                    accessType == "C" && confirm == "N"
                      ? formatDetailDate(confirm_at)
                      : formatDetailDate(out_at)
                  }
                />
                {accessType !== "O" && (
                  <Row
                    label={accessType != "P" ? "Visitó a" : "Entregó a"}
                    value={
                      <PersonValue
                        person={item?.owner || owner}
                        text={getFullName(item?.owner || owner)}
                      />
                    }
                  />
                )}
                <Row label="Unidad" value={owner?.dpto?.[0]?.nro || "-/-"} />
                <Row
                  label="Guardia de ingreso"
                  value={
                    <PersonValue person={guardia} text={getFullName(guardia)} />
                  }
                />
                <Row
                  label="Guardia de salida"
                  value={
                    out_at ? (
                      <PersonValue
                        person={out_guard || guardia}
                        text={getFullName(out_guard || guardia)}
                      />
                    ) : (
                      "-/-"
                    )
                  }
                />
                <Row label="Observación de entrada" value={obs_in || "-/-"} />
                <Row label="Observación de salida" value={obs_out || "-/-"} />
                <Row
                  label={approvalLabel}
                  value={
                    approvalName ? (
                      <PersonValue
                        person={approvedByGuard ? guardia : owner}
                        text={approvalName}
                        roleText={approvalRole}
                      />
                    ) : (
                      "-/-"
                    )
                  }
                />
                <Row
                  label={reasonLabel}
                  value={accessDetail?.obs_confirm || "-/-"}
                />
              </div>
            </section>

            <div className={styles.separator} />

            <section className={styles.sectionBlock}>
              <p className={styles.sectionTitle}>Visitante</p>
              <div className={styles.detailsGrid}>
                <Row label="Nombre completo" value={displayName || "-/-"} />
                <Row label="Nro de documento" value={displayCi || "-/-"} />
                <Row
                  label="Método de ingreso"
                  value={
                    plate || getTaxiData().length > 0 ? "Vehículo" : "Peatonal"
                  }
                />
                <Row label="Placa" value={plate || "-/-"} />
                <Row
                  label="Tipo de usuario"
                  value={accessType === "O" ? "Residente" : "Visitante"}
                />
              </div>
            </section>

            <div className={styles.separator} />

            <section className={styles.sectionBlock}>
              <p className={styles.sectionTitle}>Ingreso</p>
              <div className={styles.detailsGrid}>
                <Row label="Nombre completo" value={displayName || "-/-"} />
                <Row
                  label="Tipo de acceso"
                  value={getTypeAccess(accessType, accessDetail)}
                />
                <Row
                  label="Motivo"
                  value={accessDetail?.obs_confirm || "-/-"}
                />
                <Row
                  label="Tipo de usuario"
                  value={accessType === "O" ? "Residente" : "Visitante"}
                />
              </div>
            </section>

            {accessDevices.length > 0 && (
              <>
                <div className={styles.separator} />
                <section className={styles.sectionBlock}>
                  <p className={styles.sectionTitle}>
                    Dispositivos de registro
                  </p>
                  <div className={styles.devicesContainer}>
                    {accessDevices.map((group: any, idx: number) => (
                      <div
                        className={styles.deviceCard}
                        key={(group?.guard_id || "guard") + idx}
                      >
                        <div className={styles.deviceHeader}>
                          <span className={styles.deviceGuard}>
                            {group?.guard_name || "Guardia"}
                          </span>
                        </div>
                        {(group?.devices || []).map((dev: any, i: number) => (
                          <div
                            className={styles.deviceBlock}
                            key={`${group?.guard_id || "g"}-d-${i}`}
                          >
                            <div className={styles.detailsGrid}>
                              <div className={styles.rowLabel}>Dispositivo</div>
                              <div className={styles.rowValue}>
                                <div className={styles.deviceNameWrap}>
                                  <span className={styles.deviceIcon}>
                                    <IconPhone
                                      size={14}
                                      color="var(--cAccent)"
                                    />
                                  </span>
                                  <span>
                                    {dev?.device_name || "Dispositivo"}
                                  </span>
                                </div>
                              </div>
                              <div className={styles.rowLabel}>
                                Marca / modelo
                              </div>
                              <div className={styles.rowValue}>
                                {(dev?.brand || "-/-") +
                                  " / " +
                                  (dev?.model || "-/-")}
                              </div>
                              <div className={styles.rowLabel}>Sistema</div>
                              <div className={styles.rowValue}>
                                {(dev?.os || "-/-") +
                                  " " +
                                  (dev?.os_version || "")}
                              </div>
                              <div className={styles.rowLabel}>Red</div>
                              <div className={styles.rowValue}>
                                {"IP " +
                                  (dev?.ip_address || "-/-") +
                                  " · " +
                                  (dev?.carrier && dev?.carrier !== "unknown"
                                    ? dev?.carrier
                                    : "")}
                              </div>
                              <div className={styles.rowLabel}>App</div>
                              <div className={styles.rowValue}>
                                {"v" +
                                  (dev?.app_version || "-/-") +
                                  " (" +
                                  (dev?.build_number || "-/-") +
                                  ")"}
                              </div>
                              <div className={styles.rowLabel}>Emulador</div>
                              <div className={styles.rowValue}>
                                {dev?.is_emulator ? "Sí" : "No"}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className={styles.actionList}>
                          {(group?.actions || []).map(
                            (action: any, i: number) => (
                              <div
                                className={styles.actionRow}
                                key={`${group?.guard_id || "g"}-a-${i}`}
                              >
                                <span className={styles.actionBadge}>
                                  {getActionNameEs(action?.action_name)}
                                </span>
                                <span className={styles.actionText}>
                                  {(action?.description || "Sin descripción") +
                                    " · " +
                                    formatDetailDate(action?.date_at)}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {images.length > 0 && (
              <>
                <div className={styles.separator} />
                <section className={styles.sectionBlock}>
                  <p className={styles.sectionTitle}>Imágenes</p>
                  <div className={styles.imagesCarousel}>
                    {showControls && (
                      <button
                        className={styles.carouselBtn}
                        onClick={() =>
                          rowRef.current?.scrollBy({
                            left: -240,
                            behavior: "smooth",
                          })
                        }
                      >
                        <IconArrowLeft color="var(--cWhite)" />
                      </button>
                    )}
                    <div className={styles.imagesRow} ref={rowRef}>
                      {images.map((src, i) => (
                        <Image
                          key={src + i}
                          src={src}
                          alt="img"
                          h={90}
                          w={120}
                          expandable
                          square
                        />
                      ))}
                    </div>
                    {showControls && (
                      <button
                        className={styles.carouselBtn}
                        onClick={() =>
                          rowRef.current?.scrollBy({
                            left: 240,
                            behavior: "smooth",
                          })
                        }
                      >
                        <IconArrowRight color="var(--cWhite)" />
                      </button>
                    )}
                  </div>
                </section>
              </>
            )}

            {getAcomData()?.length > 0 && (
              <>
                <Br />
                <p className={styles.sectionTitle}>Acompañantes</p>
                <div className={styles.listContainer}>
                  {getAcomData()?.map((acc: any) => (
                    <ItemList
                      variant="V3"
                      key={acc.id}
                      title={getFullName(acc.visit || visit)}
                      subtitle={"C.I: " + acc?.visit?.ci}
                      left={<Avatar name={getFullName(acc.visit || visit)} />}
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
                <p className={styles.sectionTitle}>Taxista</p>
                <div className={styles.listContainer}>
                  {getTaxiData()?.map((acc: any) => (
                    <ItemList
                      variant="V3"
                      key={acc.id}
                      title={getFullName(acc.visit || visit)}
                      subtitle={"C.I: " + acc?.visit?.ci}
                      left={<Avatar name={getFullName(acc.visit || visit)} />}
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
          </div>
        </LoadingScreen>
      </DetailModal>

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
    </>
  );
};

export default RenderView;
