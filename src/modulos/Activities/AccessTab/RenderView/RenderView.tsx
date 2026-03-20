import React, { useEffect, useState } from "react";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import styles from "./RenderView.module.css";
import { getFullName } from "@/mk/utils/string";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
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

  const accessDetail = data?.data?.[0] || {};
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
        <Avatar name={text} src={src} w={34} h={34} />
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
    item?.type === "O"
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
    item?.type === "O" ? getFullName(owner) : getFullName(visit);
  const displayCi = item?.type === "O" ? owner?.ci : visit?.ci;
  const status = getStatus();
  const statusClassName =
    status === "Completado"
      ? styles.statusOk
      : status === "Rechazado"
        ? styles.statusError
        : styles.statusPending;
  const approvalLabel =
    item?.type === "C"
      ? confirm === "N"
        ? "Rechazado por"
        : "Aprobado por"
      : "Aprobado por";
  const approvedByGuard = confirm == "G" || item?.rejected_guard_id !== null;
  const approvalName = approvedByGuard
    ? getFullName(guardia)
    : getFullName(owner);
  const approvalRole = approvedByGuard ? "(Guardia)" : "(Propietario)";
  const reasonLabel =
    item?.rejected_guard_id !== null
      ? item?.confirm !== "N"
        ? "Motivo de aprobación"
        : "Motivo de rechazo"
      : item?.confirm === "N"
        ? "Motivo de rechazo"
        : "Motivo";

  return (
    <>
      <DetailModal
        open={open}
        onClose={onClose}
        title={
          <p className={styles.modalTitle}>
            <span className={styles.modalTitleMain}>Acceso </span>
            <span className={styles.modalTitleId}>
              #{item?.access_id || item?.id || "-/-"}
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
                    {item?.type === "P" ? "entregó a " : "visitó a "}
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
                  {getDateTimeStrMesShort(in_at || begin_at) || "-/-"}
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
                  value={getTypeAccess(item?.type, item)}
                />
                {item?.type == "G" && (
                  <Row
                    label="Evento"
                    value={item?.invitation?.title || "-/-"}
                  />
                )}
                {item?.type == "G" && (
                  <Row
                    label="Cantidad de invitados"
                    value={accessDetail?.invitation?.guests?.length || "-/-"}
                  />
                )}
                <Row
                  label={
                    item?.type == "C" && confirm == "N"
                      ? "Hora y fecha de petición"
                      : "Hora y fecha de ingreso"
                  }
                  value={
                    item?.type == "C" && confirm == "N"
                      ? getDateTimeStrMesShort(begin_at) || "-/-"
                      : getDateTimeStrMesShort(in_at) || "-/-"
                  }
                />
                <Row
                  label={
                    item?.type == "C" && confirm == "N"
                      ? "Hora y fecha de rechazo"
                      : "Hora y fecha de salida"
                  }
                  value={
                    item?.type == "C" && confirm == "N"
                      ? getDateTimeStrMesShort(confirm_at) || "-/-"
                      : getDateTimeStrMesShort(out_at) || "-/-"
                  }
                />
                {item?.type !== "O" && (
                  <Row
                    label={item?.type != "P" ? "Visitó a" : "Entregó a"}
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
                <Row label={reasonLabel} value={item?.obs_confirm || "-/-"} />
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
                  value={item?.type === "O" ? "Residente" : "Visitante"}
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
                  value={getTypeAccess(item?.type, item)}
                />
                <Row label="Motivo" value={item?.obs_confirm || "-/-"} />
                <Row
                  label="Tipo de usuario"
                  value={item?.type === "O" ? "Residente" : "Visitante"}
                />
              </div>
            </section>

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
