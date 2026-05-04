import React, { useEffect, useMemo, useRef, useState } from "react";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import styles from "./RenderView.module.css";
import { formatToDayFdMYH } from "@/mk/utils/date";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { Image } from "@/mk/components/ui/Image/Image";
import useAxios from "@/mk/hooks/useAxios";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconDelivery,
  IconExpand,
  IconHome,
  IconPhone,
  IconTaxi,
  IconUser,
  IconVehicle,
} from "@/components/layout/icons/IconsBiblioteca";
import ModalAccessExpand from "../ModalAccessExpand/ModalAccessExpand";
import {
  collectUniqueImages,
  flattenAccessDevices,
  getAccessStatusInfo,
  getAccessTypeLabel,
  getEntityAvatar,
  getEntityGallery,
  getEntityName,
  getMovementMode,
  getRequestActorInfo,
  getUnitLabel,
  splitRelatedAccesses,
} from "../shared/accessDetailUtils";

interface AccessRenderViewProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  extraData?: any;
}

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

const DetailBadge = ({
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

const InfoCard = ({
  label,
  value,
  icon = null,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) => (
  <div className={styles.infoCard}>
    <div className={styles.infoLabelRow}>
      {icon ? <span className={styles.infoIcon}>{icon}</span> : null}
      <span className={styles.infoLabel}>{label}</span>
    </div>
    <div className={styles.infoValue}>{value || "-/-"}</div>
  </div>
);

const AccessRow = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className={styles.infoRow}>
    <div className={styles.infoKey}>{label}</div>
    <div className={styles.infoContent}>{value || "-/-"}</div>
  </div>
);

const PersonValue = ({
  person,
  subtitle,
}: {
  person: any;
  subtitle?: React.ReactNode;
}) => {
  const personName = getEntityName(person) || "-/-";
  return (
    <div className={styles.personInline}>
      <Avatar name={personName} src={getEntityAvatar(person)} w={28} h={28} />
      <div className={styles.personInlineMeta}>
        <p className={styles.personInlineTitle}>{personName}</p>
        {subtitle ? (
          <p className={styles.personInlineSubtitle}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
};

const appendObservation = (
  sentence: React.ReactNode,
  note?: string,
) => {
  if (!note) return sentence;
  return (
    <>
      {sentence}{" "}
      <span className={styles.historyMuted}>
        Tambien registró una observación{" "}
      </span>
      <strong>"{note}"</strong>.
    </>
  );
};

const RelatedAccessCard = ({
  label,
  access,
  onOpen,
}: {
  label: string;
  access: any;
  onOpen: () => void;
}) => {
  const visitor = access?.visit || access?.owner || {};
  const statusInfo = getAccessStatusInfo(access);
  return (
    <button type="button" className={styles.relatedCard} onClick={onOpen}>
      <div className={styles.relatedCardHead}>
        <div className={styles.relatedAvatarWrap}>
          <Avatar
            name={getEntityName(visitor) || "Sin nombre"}
            src={getEntityAvatar(visitor)}
            w={40}
            h={40}
          />
          <div className={styles.relatedMeta}>
            <p className={styles.relatedTitle}>
              {getEntityName(visitor) || "Sin nombre"}
            </p>
            <p className={styles.relatedSubtitle}>
              {visitor?.ci ? `C.I. ${visitor.ci}` : "Sin documento"}
            </p>
          </div>
        </div>
        <IconExpand color="var(--cWhiteV1)" />
      </div>
      <div className={styles.relatedTags}>
        <DetailBadge label={label} tone="accent" />
        <DetailBadge label={statusInfo.label} tone={statusInfo.tone} />
      </div>
      <div className={styles.relatedTimes}>
        <span>Ingreso: {formatDetailDate(access?.in_at || access?.begin_at)}</span>
        <span>Salida: {formatDetailDate(access?.out_at)}</span>
      </div>
    </button>
  );
};

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
              rowRef.current?.scrollBy({ left: -240, behavior: "smooth" })
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
              h={120}
              w={156}
              expandable
              square
            />
          ))}
        </div>
        {showControls ? (
          <button
            className={styles.carouselBtn}
            onClick={() =>
              rowRef.current?.scrollBy({ left: 240, behavior: "smooth" })
            }
          >
            <IconArrowRight color="var(--cWhite)" />
          </button>
        ) : null}
      </div>
    </div>
  );
};

const RenderView: React.FC<AccessRenderViewProps> = ({
  open,
  onClose,
  item,
}) => {
  const [openExpand, setOpenExpand] = useState<{
    open: boolean;
    id: string | number | null;
    type: "A" | "T" | "";
  }>({
    open: false,
    id: null,
    type: "",
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

  const accessDetail = data?.data?.access || data?.data?.[0] || item || {};
  const accessDevicesRaw =
    data?.data?.accessDevices || data?.data?.access_devices || [];

  const accessType = accessDetail?.type || item?.type || "";
  const owner = accessDetail?.owner || item?.owner || {};
  const visit = accessDetail?.visit || item?.visit || {};
  const statusInfo = getAccessStatusInfo(accessDetail);
  const approvalInfo = getRequestActorInfo(accessDetail);
  const { companions, taxis } = splitRelatedAccesses(accessDetail);
  const technicalData = useMemo(
    () => flattenAccessDevices(accessDevicesRaw),
    [accessDevicesRaw],
  );

  const subject = accessType === "O" ? owner : visit;
  const subjectName = getEntityName(subject) || "Sin nombre";
  const subjectDocument = accessType === "O" ? owner?.ci : visit?.ci;
  const unitLabel = getUnitLabel(owner);
  const movementMode = getMovementMode(accessDetail);
  const approvalSummary = approvalInfo.actorName
    ? `${approvalInfo.actorName}${
        approvalInfo.roleText ? ` (${approvalInfo.roleText})` : ""
      }`
    : "-/-";
  const approvalLabel =
    statusInfo.tone === "danger" ? "Rechazado por" : "Validado por";
  const guardInName = getEntityName(accessDetail?.guardia);
  const guardOutName = getEntityName(accessDetail?.out_guard);
  const actorRolePrefix =
    approvalInfo.roleText === "Guardia" ? "El guardia" : "El residente";
  const infoRows = [
    {
      label: accessType === "O" ? "Residente" : "Visitante",
      value: (
        <PersonValue
          person={subject}
          subtitle={
            subjectDocument
              ? `C.I. ${subjectDocument}`
              : "Sin documento registrado"
          }
        />
      ),
    },
    accessType !== "O"
      ? {
          label: "Residente destino",
          value: <PersonValue person={owner} subtitle={unitLabel} />,
        }
      : null,
    { label: "Unidad", value: unitLabel },
    {
      label: "Tipo de acceso",
      value: getAccessTypeLabel(accessType, accessDetail),
    },
    {
      label: "Estado",
      value: <DetailBadge label={statusInfo.label} tone={statusInfo.tone} />,
    },
    { label: "Movimiento", value: movementMode },
    { label: approvalLabel, value: approvalSummary },
    { label: "Fecha de solicitud", value: formatDetailDate(accessDetail?.begin_at) },
    { label: "Ingreso", value: formatDetailDate(accessDetail?.in_at) },
    { label: "Salida", value: formatDetailDate(accessDetail?.out_at) },
    {
      label: "Guardia de ingreso",
      value: guardInName ? <PersonValue person={accessDetail?.guardia} /> : "-/-",
    },
    {
      label: "Guardia de salida",
      value: guardOutName ? <PersonValue person={accessDetail?.out_guard} /> : "-/-",
    },
    accessDetail?.plate
      ? {
          label: "Placa",
          value: accessDetail.plate,
        }
      : null,
    accessType === "G"
      ? {
          label: "Evento",
          value: accessDetail?.invitation?.title || "-/-",
        }
      : null,
    accessType === "G"
      ? {
          label: "Invitados del QR",
          value: accessDetail?.invitation?.guests?.length || 0,
        }
      : null,
    accessType === "P"
      ? {
          label: "Tipo de pedido",
          value: accessDetail?.other?.other_type?.name || "-/-",
        }
      : null,
    accessDetail?.obs_confirm
      ? {
          label:
            statusInfo.tone === "danger"
              ? "Motivo de rechazo"
              : "Observacion",
          value: accessDetail.obs_confirm,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  const historyItems = [
    accessDetail?.begin_at
      ? {
          date: formatDetailDate(accessDetail.begin_at),
          sentence:
            accessType === "P"
              ? (
                  <>
                    Se registró un pedido para{" "}
                    <strong>{getEntityName(owner) || "el residente"}</strong> en{" "}
                    <strong>{unitLabel}</strong>.
                  </>
                )
              : accessType === "O"
                ? (
                    <>
                      El residente{" "}
                      <strong>{getEntityName(owner) || subjectName}</strong> inició
                      un acceso con llave QR para <strong>{unitLabel}</strong>.
                    </>
                  )
                : (
                    <>
                      Se registró la solicitud de acceso de{" "}
                    <strong>{subjectName}</strong> para{" "}
                    <strong>{unitLabel}</strong>.
                  </>
                ),
          note: accessDetail?.obs_confirm || "",
          tone: "warning" as Tone,
        }
      : null,
    accessDetail?.confirm_at
      ? {
          date: formatDetailDate(accessDetail.confirm_at),
          sentence: approvalInfo.actorName ? (
            accessDetail?.confirm === "N" || accessDetail?.rejected_guard_id ? (
              <>
                {actorRolePrefix} <strong>{approvalInfo.actorName}</strong>{" "}
                rechazó el acceso de <strong>{subjectName}</strong> para{" "}
                <strong>{unitLabel}</strong>.
              </>
            ) : (
              <>
                {actorRolePrefix} <strong>{approvalInfo.actorName}</strong>{" "}
                validó el acceso de <strong>{subjectName}</strong> para{" "}
                <strong>{unitLabel}</strong>.
              </>
            )
          ) : accessDetail?.confirm === "N" || accessDetail?.rejected_guard_id ? (
            <>
              Se rechazó el acceso de <strong>{subjectName}</strong> para{" "}
              <strong>{unitLabel}</strong>.
            </>
          ) : (
            <>
              Se validó el acceso de <strong>{subjectName}</strong> para{" "}
              <strong>{unitLabel}</strong>.
            </>
          ),
          note: accessDetail?.obs_confirm || "",
          tone:
            accessDetail?.confirm === "N" || accessDetail?.rejected_guard_id
              ? ("danger" as Tone)
              : ("accent" as Tone),
        }
      : null,
    accessDetail?.in_at
      ? {
          date: formatDetailDate(accessDetail.in_at),
          sentence: guardInName ? (
            <>
              El guardia <strong>{guardInName}</strong> registró el ingreso de{" "}
              <strong>{subjectName}</strong> en <strong>{unitLabel}</strong>.
            </>
          ) : (
            <>
              Se registró el ingreso de <strong>{subjectName}</strong> en{" "}
              <strong>{unitLabel}</strong>.
            </>
          ),
          note: accessDetail?.obs_in || "",
          tone: "success" as Tone,
        }
      : null,
    accessDetail?.out_at
      ? {
          date: formatDetailDate(accessDetail.out_at),
          sentence: guardOutName ? (
            <>
              El guardia <strong>{guardOutName}</strong> registró la salida de{" "}
              <strong>{subjectName}</strong>.
            </>
          ) : (
            <>
              Se registró la salida de <strong>{subjectName}</strong>.
            </>
          ),
          note: accessDetail?.obs_out || "",
          tone: "info" as Tone,
        }
      : null,
  ].filter(Boolean) as Array<{
    date: string;
    sentence: React.ReactNode;
    note?: string;
    tone?: Tone;
  }>;

  const imageGroups = useMemo(() => {
    const groups = [
      {
        key: "subject",
        title: accessType === "O" ? "Fotos del residente" : "Fotos del visitante",
        images:
          accessType === "O" ? getEntityGallery(owner) : getEntityGallery(visit),
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
  }, [accessDetail, accessType, owner, visit]);

  const actionItems = technicalData.actions;
  const deviceItems = technicalData.devices;

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
        maxWidth={980}
      >
        <LoadingScreen
          onlyLoading={Object.keys(accessDetail).length === 0}
          type="CardSkeleton"
        >
          <div className={styles.container}>
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTitle}>Informacion del acceso</p>
              </div>
              <div className={styles.infoTable}>
                {infoRows.map((row) => (
                  <AccessRow key={row.label} label={row.label} value={row.value} />
                ))}
              </div>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTitle}>Historial de actividad</p>
              </div>

              {historyItems.length > 0 ? (
                <div className={styles.historyList}>
                  {historyItems.map((historyItem) => (
                    <div
                      className={styles.historyItem}
                      key={`${historyItem.date}-${String(historyItem.tone)}`}
                    >
                      <div
                        className={`${styles.historyDot} ${
                          toneClassMap[historyItem.tone || "info"]
                        }`}
                      ></div>
                      <div className={styles.historyBody}>
                        <p className={styles.historySentence}>
                          {appendObservation(
                            historyItem.sentence,
                            historyItem.note,
                          )}
                        </p>
                        <p className={styles.historyDate}>{historyItem.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyCard}>
                  Todavia no hay eventos registrados para este acceso.
                </div>
              )}
            </section>

            {companions.length > 0 || taxis.length > 0 ? (
              <section className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <p className={styles.sectionTitle}>Relacionados</p>
                </div>
                <div className={styles.relatedColumns}>
                  {companions.length > 0 ? (
                    <div className={styles.relatedColumn}>
                      <div className={styles.relatedColumnHeader}>
                        <p className={styles.relatedColumnTitle}>Acompanantes</p>
                        <span className={styles.relatedColumnCount}>
                          {companions.length}
                        </span>
                      </div>
                      <div className={styles.relatedGrid}>
                        {companions.map((entry: any) => (
                          <RelatedAccessCard
                            key={entry?.id}
                            label="Acompanante"
                            access={entry}
                            onOpen={() =>
                              setOpenExpand({
                                open: true,
                                id: entry?.id,
                                type: "A",
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {taxis.length > 0 ? (
                    <div className={styles.relatedColumn}>
                      <div className={styles.relatedColumnHeader}>
                        <p className={styles.relatedColumnTitle}>Taxi</p>
                        <span className={styles.relatedColumnCount}>
                          {taxis.length}
                        </span>
                      </div>
                      <div className={styles.relatedGrid}>
                        {taxis.map((entry: any) => (
                          <RelatedAccessCard
                            key={entry?.id}
                            label="Taxi"
                            access={entry}
                            onOpen={() =>
                              setOpenExpand({
                                open: true,
                                id: entry?.id,
                                type: "T",
                              })
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTitle}>Fotos</p>
              </div>
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
                  No se registraron imagenes para este acceso.
                </div>
              )}
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTitle}>Registro tecnico</p>
              </div>

              {deviceItems.length > 0 ? (
                <div className={styles.deviceGrid}>
                  {deviceItems.map((device, index) => (
                    <div
                      className={styles.deviceCard}
                      key={`${device?.device_name || "device"}-${index}`}
                    >
                      <div className={styles.deviceHead}>
                        <div className={styles.deviceTitleWrap}>
                          <span className={styles.deviceIcon}>
                            <IconPhone size={14} color="var(--cAccent)" />
                          </span>
                          <div>
                            <p className={styles.deviceTitle}>
                              {device?.device_name || "Dispositivo"}
                            </p>
                            <p className={styles.deviceSubtitle}>
                              {(device?.brand || "-/-") +
                                " / " +
                                (device?.model || "-/-")}
                            </p>
                          </div>
                        </div>
                        {device?.guardNames?.length > 0 ? (
                          <span className={styles.deviceGuardList}>
                            {device.guardNames.join(", ")}
                          </span>
                        ) : null}
                      </div>

                      <div className={styles.deviceFacts}>
                        <InfoCard
                          label="Sistema"
                          value={`${device?.os || "-/-"} ${
                            device?.os_version || ""
                          }`.trim()}
                        />
                        <InfoCard
                          label="Red"
                          value={`IP ${device?.ip_address || "-/-"}${
                            device?.carrier && device?.carrier !== "unknown"
                              ? ` · ${device.carrier}`
                              : ""
                          }`}
                        />
                        <InfoCard
                          label="App"
                          value={`v${device?.app_version || "-/-"} (${
                            device?.build_number || "-/-"
                          })`}
                        />
                        <InfoCard
                          label="Emulador"
                          value={device?.is_emulator ? "Si" : "No"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyCard}>
                  No se registraron datos de dispositivo para este acceso.
                </div>
              )}

              {actionItems.length > 0 ? (
                <div className={styles.actionList}>
                  {actionItems.map((action) => (
                    <div className={styles.actionItem} key={action._key}>
                      <DetailBadge
                        label={action?.action_name === "Out" ? "Salida" : "Entrada"}
                        tone={action?.action_name === "Out" ? "info" : "success"}
                      />
                      <div className={styles.actionBody}>
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

      {openExpand.open ? (
        <ModalAccessExpand
          open={openExpand.open}
          onClose={() => setOpenExpand({ open: false, id: null, type: "" })}
          id={openExpand.id}
          type={openExpand.type as "A" | "T"}
        />
      ) : null}
    </>
  );
};

export default RenderView;
