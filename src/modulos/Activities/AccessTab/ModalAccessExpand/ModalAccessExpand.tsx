import React, { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import useAxios from "@/mk/hooks/useAxios";
import { formatToDayFdMYH } from "@/mk/utils/date";
import { Image } from "@/mk/components/ui/Image/Image";
import styles from "./ModalAccessExpand.module.css";
import {
  IconArrowLeft,
  IconArrowRight,
  IconPhone,
} from "@/components/layout/icons/IconsBiblioteca";
import {
  collectUniqueImages,
  flattenAccessDevices,
  getAccessHeadline,
  getAccessStatusInfo,
  getAccessTypeLabel,
  getEntityAvatar,
  getEntityGallery,
  getEntityName,
  getMovementMode,
  getUnitLabel,
} from "../shared/accessDetailUtils";

interface PropsType {
  id: string | number | null;
  open: boolean;
  onClose: () => void;
  type: "A" | "T" | "I" | "V" | "P";
}

const typeText: any = {
  A: "acompañante",
  T: "taxista",
  I: "invitación",
  V: "visitante",
  P: "pedido",
};

type Tone = "success" | "danger" | "warning" | "info" | "accent";

const toneClassMap: Record<Tone, string> = {
  success: styles.toneSuccess,
  danger: styles.toneDanger,
  warning: styles.toneWarning,
  info: styles.toneInfo,
  accent: styles.toneAccent,
};

const formatDetailDate = (dateStr: string | null = "") => {
  const formatted = formatToDayFdMYH(dateStr, true, true, false) || "";
  if (!formatted) return "-/-";
  return formatted.replace(/ del (\d{4}) - /, ", $1 - ");
};

const Badge = ({
  label,
  tone,
}: {
  label: React.ReactNode;
  tone: Tone;
}) => {
  return (
    <span className={`${styles.badge} ${toneClassMap[tone]}`}>{label}</span>
  );
};

const FactCard = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className={styles.factCard}>
    <span className={styles.factLabel}>{label}</span>
    <div className={styles.factValue}>{value || "-/-"}</div>
  </div>
);

const GalleryGroup = ({
  title,
  images,
}: {
  title: string;
  images: string[];
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
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

  return (
    <div className={styles.galleryGroup}>
      <div className={styles.galleryHeader}>
        <p className={styles.galleryTitle}>{title}</p>
        <span className={styles.galleryCount}>{images.length} foto(s)</span>
      </div>
      <div className={styles.imagesCarousel}>
        {showControls ? (
          <button
            className={styles.carouselBtn}
            onClick={() =>
              rowRef.current?.scrollBy({ left: -220, behavior: "smooth" })
            }
          >
            <IconArrowLeft color="var(--cWhite)" />
          </button>
        ) : null}
        <div className={styles.imagesRow} ref={rowRef}>
          {images.map((src, index) => (
            <Image
              key={`${title}-${src}-${index}`}
              src={src}
              alt={title}
              h={108}
              w={144}
              expandable
              square
            />
          ))}
        </div>
        {showControls ? (
          <button
            className={styles.carouselBtn}
            onClick={() =>
              rowRef.current?.scrollBy({ left: 220, behavior: "smooth" })
            }
          >
            <IconArrowRight color="var(--cWhite)" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ModalAccessExpand = ({ id, open, onClose, type }: PropsType) => {
  const [accessDetail, setAccessDetail]: any = useState({});
  const [accessDevices, setAccessDevices]: any[] = useState([]);
  const { execute } = useAxios();
  const [loading, setLoading] = useState(false);

  const getAccess = async () => {
    if (!id) {
      setAccessDetail({});
      setAccessDevices([]);
      return;
    }
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
      true,
    );
    setLoading(false);
    if (data?.success) {
      const detail = data?.data?.access || data?.data?.[0] || {};
      setAccessDetail(detail);
      setAccessDevices(
        data?.data?.accessDevices || data?.data?.access_devices || [],
      );
    }
  };

  useEffect(() => {
    if (!open) return;
    getAccess();
  }, [type, id, open]);

  const accessType = accessDetail?.type || "";
  const owner = accessDetail?.owner || {};
  const visit = accessDetail?.visit || {};
  const statusInfo = getAccessStatusInfo(accessDetail);
  const movementMode = getMovementMode(accessDetail);
  const deviceData = useMemo(
    () => flattenAccessDevices(accessDevices),
    [accessDevices],
  );
  const deviceItems = deviceData.devices;
  const actionItems = deviceData.actions;
  const subject = accessType === "O" ? owner : visit;
  const subjectName = getEntityName(subject) || "Sin nombre";
  const unitLabel = getUnitLabel(owner);
  const startedAt = accessDetail?.in_at || accessDetail?.begin_at;

  const imageGroups = useMemo(() => {
    const groups = [
      {
        key: "subject",
        title: type === "T" ? "Fotos del taxista" : "Fotos del visitante",
        images: getEntityGallery(subject),
      },
      {
        key: "host",
        title: "Fotos del residente destino",
        images: accessType === "O" ? [] : getEntityGallery(owner),
      },
      {
        key: "access",
        title: "Fotos del registro",
        images: collectUniqueImages(
          accessDetail?.url_image_p,
          accessDetail?.url_image,
        ),
      },
    ];

    const used = new Set<string>();
    return groups
      .map((group) => ({
        ...group,
        images: group.images.filter((image) => {
          if (used.has(image)) return false;
          used.add(image);
          return true;
        }),
      }))
      .filter((group) => group.images.length > 0);
  }, [accessDetail, accessType, owner, subject, type]);

  const timelineItems = [
    accessDetail?.begin_at
      ? {
          label: "Solicitud",
          date: formatDetailDate(accessDetail.begin_at),
          meta: "Acceso registrado",
        }
      : null,
    accessDetail?.confirm_at
      ? {
          label:
            accessDetail?.confirm === "N" || accessDetail?.rejected_guard_id != null
              ? "Rechazo"
              : "Validacion",
          date: formatDetailDate(accessDetail.confirm_at),
          meta: accessDetail?.obs_confirm || "",
        }
      : null,
    accessDetail?.in_at
      ? {
          label: "Ingreso",
          date: formatDetailDate(accessDetail.in_at),
          meta: accessDetail?.obs_in || "",
        }
      : null,
    accessDetail?.out_at
      ? {
          label: "Salida",
          date: formatDetailDate(accessDetail.out_at),
          meta: accessDetail?.obs_out || "",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; date: string; meta?: string }>;

  return (
    <DetailModal
      title={"Detalle del " + typeText[type]}
      open={open}
      onClose={onClose}
      buttonText=""
      buttonCancel=""
      zIndex={320}
      maxWidth={760}
      style={{
        width: "min(760px, calc(100vw - 32px))",
        maxHeight: "calc(100vh - 48px)",
        padding: "18px",
      }}
    >
      <LoadingScreen onlyLoading={loading || (!!id && !accessDetail?.id)}>
        <div className={styles.container}>
          <section className={styles.summaryCard}>
            <Avatar
              name={subjectName}
              src={getEntityAvatar(subject)}
              w={52}
              h={52}
            />
            <div className={styles.summaryBody}>
              <div className={styles.badgeRow}>
                <Badge label={statusInfo.label} tone={statusInfo.tone} />
                <Badge
                  label={getAccessTypeLabel(accessType, accessDetail)}
                  tone="accent"
                />
                <Badge label={movementMode} tone="info" />
              </div>
              <p className={styles.summaryTitle}>
                {getAccessHeadline(accessDetail)}
              </p>
              <p className={styles.summaryDate}>
                {unitLabel} · {formatDetailDate(startedAt)}
              </p>
            </div>
          </section>

          <section className={styles.sectionCard}>
            <p className={styles.sectionTitle}>Resumen</p>
            <div className={styles.factsGrid}>
              <FactCard
                label={type === "T" ? "Taxista" : "Visitante"}
                value={subjectName}
              />
              <FactCard
                label="Documento"
                value={subject?.ci ? `C.I. ${subject.ci}` : "-/-"}
              />
              <FactCard
                label="Residente destino"
                value={getEntityName(owner) || "-/-"}
              />
              <FactCard label="Unidad" value={unitLabel} />
              <FactCard
                label="Estado"
                value={<Badge label={statusInfo.label} tone={statusInfo.tone} />}
              />
              <FactCard label="Movimiento" value={movementMode} />
              {accessDetail?.plate ? (
                <FactCard label="Placa" value={accessDetail.plate} />
              ) : null}
              {accessType === "P" ? (
                <FactCard
                  label="Tipo de pedido"
                  value={accessDetail?.other?.other_type?.name || "-/-"}
                />
              ) : null}
            </div>
          </section>

          <section className={styles.sectionCard}>
            <p className={styles.sectionTitle}>Movimiento</p>
            {timelineItems.length > 0 ? (
              <div className={styles.timeline}>
                {timelineItems.map((entry) => (
                  <div
                    className={styles.timelineItem}
                    key={`${entry.label}-${entry.date}`}
                  >
                    <div className={styles.timelineHead}>
                      <span className={styles.timelineLabel}>{entry.label}</span>
                      <span className={styles.timelineDate}>{entry.date}</span>
                    </div>
                    {entry.meta ? (
                      <p className={styles.timelineMeta}>{entry.meta}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyCard}>
                Todavia no hay movimientos registrados para este acceso.
              </div>
            )}
          </section>

          <section className={styles.sectionCard}>
            <p className={styles.sectionTitle}>Fotos</p>
            {imageGroups.length > 0 ? (
              <div className={styles.galleryStack}>
                {imageGroups.map((group) => (
                  <GalleryGroup
                    key={group.key}
                    title={group.title}
                    images={group.images}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.emptyCard}>
                No se registraron imagenes para este detalle.
              </div>
            )}
          </section>

          <section className={styles.sectionCard}>
            <p className={styles.sectionTitle}>Registro tecnico</p>
            {deviceItems.length > 0 ? (
              <div className={styles.deviceGrid}>
                {deviceItems.map((device, index) => (
                  <div
                    className={styles.deviceCard}
                    key={`${device?.device_name || "device"}-${index}`}
                  >
                    <div className={styles.deviceTitleRow}>
                      <div className={styles.deviceTitleWrap}>
                        <span className={styles.deviceIcon}>
                          <IconPhone size={14} color="var(--cAccent)" />
                        </span>
                        <div>
                          <p className={styles.deviceName}>
                            {device?.device_name || "Dispositivo"}
                          </p>
                          <p className={styles.deviceMeta}>
                            {(device?.brand || "-/-") +
                              " / " +
                              (device?.model || "-/-")}
                          </p>
                        </div>
                      </div>
                      {device?.guardNames?.length > 0 ? (
                        <span className={styles.guardText}>
                          {device.guardNames.join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.factsGrid}>
                      <FactCard
                        label="Sistema"
                        value={`${device?.os || "-/-"} ${
                          device?.os_version || ""
                        }`.trim()}
                      />
                      <FactCard
                        label="Red"
                        value={`IP ${device?.ip_address || "-/-"}${
                          device?.carrier && device?.carrier !== "unknown"
                            ? ` · ${device.carrier}`
                            : ""
                        }`}
                      />
                      <FactCard
                        label="App"
                        value={`v${device?.app_version || "-/-"} (${
                          device?.build_number || "-/-"
                        })`}
                      />
                      <FactCard
                        label="Emulador"
                        value={device?.is_emulator ? "Si" : "No"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyCard}>
                No se registraron dispositivos para este detalle.
              </div>
            )}

            {actionItems.length > 0 ? (
              <div className={styles.actionList}>
                {actionItems.map((action) => (
                  <div className={styles.actionItem} key={action._key}>
                    <Badge
                      label={action?.action_name === "Out" ? "Salida" : "Entrada"}
                      tone={action?.action_name === "Out" ? "info" : "success"}
                    />
                    <div>
                      <p className={styles.actionText}>
                        {action?.description || "Sin descripcion"}
                      </p>
                      <p className={styles.actionMeta}>
                        {[
                          action?.guardName || "",
                          action?.deviceName || "",
                          formatDetailDate(action?.date_at),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </LoadingScreen>
    </DetailModal>
  );
};

export default ModalAccessExpand;
