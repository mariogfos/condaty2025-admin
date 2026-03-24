import React, { useEffect, useState } from "react";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import DetailModal from "@/mk/components/ui/DetailModal/DetailModal";
import LoadingScreen from "@/mk/components/ui/LoadingScreen/LoadingScreen";
import useAxios from "@/mk/hooks/useAxios";
import { formatToDayFdMYH } from "@/mk/utils/date";
import { getFullName } from "@/mk/utils/string";
import { Image } from "@/mk/components/ui/Image/Image";
import styles from "./ModalAccessExpand.module.css";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconPhone,
} from "@/components/layout/icons/IconsBiblioteca";

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

const typeMap: Record<string, string> = {
  C: "Sin QR",
  I: "QR Individual",
  G: "QR Grupal",
  F: "QR Frecuente",
  P: "Pedido",
  O: "Llave QR",
};

const ModalAccessExpand = ({ id, open, onClose, type }: PropsType) => {
  const [accessDetail, setAccessDetail]: any = useState({});
  const [accessDevices, setAccessDevices]: any[] = useState([]);
  const { execute } = useAxios();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);

  const formatDetailDate = (dateStr: string | null = "") => {
    const formatted = formatToDayFdMYH(dateStr, true, true, false) || "";
    if (!formatted) return "-/-";
    return formatted.replace(/ del (\d{4}) - /, ", $1 - ");
  };

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

  const getStatus = () => {
    if (accessDetail?.out_at) return "Completado";
    if (accessDetail?.in_at) return "Por salir";
    if (!accessDetail?.confirm_at) return "Por confirmar";
    if (accessDetail?.confirm === "Y") return "Por entrar";
    return "Rechazado";
  };

  const getTypeAccess = () => {
    if (accessDetail?.type === "P") {
      return "Pedido/" + (accessDetail?.other?.other_type?.name || "-/-");
    }
    return typeMap[accessDetail?.type] || "-/-";
  };

  const getActionNameEs = (actionName: string) => {
    if (actionName === "In") return "Entrada";
    if (actionName === "Out") return "Salida";
    return actionName || "-/-";
  };

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
    if (type != "I" && type != "P") {
      getAccess();
    }
  }, [type, id, open]);

  useEffect(() => {
    const imgs = [
      ...normalizeImageUrls((accessDetail as any)?.url_image_p),
      ...normalizeImageUrls((accessDetail as any)?.url_image),
      ...normalizeImageUrls((accessDetail as any)?.visit?.url_image_a),
      ...normalizeImageUrls((accessDetail as any)?.visit?.url_image_r),
    ];
    setImages(Array.from(new Set(imgs)));
  }, [accessDetail]);

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
    <DetailModal
      title={"Detalle del " + typeText[type]}
      open={open}
      onClose={onClose}
      buttonText=""
      buttonCancel=""
      zIndex={320}
      maxWidth={640}
      style={{
        width: "min(640px, calc(100vw - 140px))",
        maxHeight: "calc(100vh - 180px)",
        padding: "16px",
      }}
    >
      <LoadingScreen onlyLoading={loading || !accessDetail?.id}>
        <div className={styles.container}>
          <section className={styles.summaryCard}>
            <div className={styles.summaryIcon}>
              <IconCheck size={22} color="var(--cAccent)" />
            </div>
            <div className={styles.summaryTextWrap}>
              <p className={styles.summaryTitle}>
                <span className={styles.summaryStrong}>
                  {getFullName(accessDetail?.visit) || "Sin nombre"}
                </span>{" "}
                <span className={styles.summarySoft}>visitó a </span>
                <span className={styles.summaryStrong}>
                  {getFullName(accessDetail?.owner) || "-/-"}
                </span>
              </p>
              <p className={styles.summaryDate}>
                {formatDetailDate(
                  accessDetail?.in_at || accessDetail?.begin_at,
                )}
              </p>
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <p className={styles.sectionTitle}>Detalles del acceso</p>
            <div className={styles.detailsGrid}>
              <div className={styles.rowLabel}>Visitante</div>
              <div className={styles.rowValue}>
                <div className={styles.personValue}>
                  <Avatar
                    name={getFullName(accessDetail?.visit)}
                    src={getEntityAvatar(accessDetail?.visit)}
                    w={24}
                    h={24}
                  />
                  <span>{getFullName(accessDetail?.visit) || "-/-"}</span>
                </div>
              </div>
              <div className={styles.rowLabel}>C.I.</div>
              <div className={styles.rowValue}>
                {accessDetail?.visit?.ci || "-/-"}
              </div>
              <div className={styles.rowLabel}>Estado</div>
              <div className={styles.rowValue}>{getStatus()}</div>
              <div className={styles.rowLabel}>Tipo de acceso</div>
              <div className={styles.rowValue}>{getTypeAccess()}</div>
              <div className={styles.rowLabel}>Ingreso</div>
              <div className={styles.rowValue}>
                {formatDetailDate(accessDetail?.in_at)}
              </div>
              <div className={styles.rowLabel}>Salida</div>
              <div className={styles.rowValue}>
                {formatDetailDate(accessDetail?.out_at)}
              </div>
              <div className={styles.rowLabel}>Guardia de ingreso</div>
              <div className={styles.rowValue}>
                <div className={styles.personValue}>
                  <Avatar
                    name={getFullName(accessDetail?.guardia)}
                    src={getEntityAvatar(accessDetail?.guardia)}
                    w={24}
                    h={24}
                  />
                  <span>{getFullName(accessDetail?.guardia) || "-/-"}</span>
                </div>
              </div>
              <div className={styles.rowLabel}>Guardia de salida</div>
              <div className={styles.rowValue}>
                {accessDetail?.out_guard ? (
                  <div className={styles.personValue}>
                    <Avatar
                      name={getFullName(accessDetail?.out_guard)}
                      src={getEntityAvatar(accessDetail?.out_guard)}
                      w={24}
                      h={24}
                    />
                    <span>{getFullName(accessDetail?.out_guard) || "-/-"}</span>
                  </div>
                ) : (
                  "-/-"
                )}
              </div>
              <div className={styles.rowLabel}>Observación de ingreso</div>
              <div className={styles.rowValue}>
                {accessDetail?.obs_in || "-/-"}
              </div>
              <div className={styles.rowLabel}>Observación de salida</div>
              <div className={styles.rowValue}>
                {accessDetail?.obs_out || "-/-"}
              </div>
            </div>
          </section>

          {accessDevices.length > 0 && (
            <>
              <div className={styles.separator} />
              <section className={styles.sectionBlock}>
                <p className={styles.sectionTitle}>Dispositivos de registro</p>
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
                                  <IconPhone size={14} color="var(--cAccent)" />
                                </span>
                                <span>{dev?.device_name || "Dispositivo"}</span>
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
                                (dev?.carrier || "-/-")}
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
                          left: -200,
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
                          left: 200,
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
        </div>
      </LoadingScreen>
    </DetailModal>
  );
};

export default ModalAccessExpand;
