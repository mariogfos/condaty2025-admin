import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import {
  getDateTimeStrMesShort,
} from "@/mk/utils/date";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { getAlertLevelText, getAlertLevelFigmaColor, ALERT_LEVELS, ALERT_LEVEL_LABELS } from "../alertConstants";
import {
  IconAlert,
  IconAmbulance,
  IconFlame,
  IconTheft,
  IconClock,
} from "@/components/layout/icons/IconsBiblioteca";

const getAlertTypeBoxDetails = (item: any) => {
  let details = {
    boxBgColor: "var(--cGrayMd, #55595c)",
    borderColor: "var(--cGrayDark, #404244)",
    textColor: "var(--cWhite, #fafafa)",
    icon: <IconAlert size={36} color={"var(--cWhite, #fafafa)"} />,
    title: item.descrip || `Alerta de ${ALERT_LEVEL_LABELS[ALERT_LEVELS.HIGH]}`,
  };

  if (item.type === "E") {
    details.boxBgColor = "rgba(218, 94, 85, 0.55)";
    details.borderColor = "rgb(228, 96, 85)";
    details.icon = <IconAmbulance size={36} color={details.textColor} />;
    details.title =
      item.descrip?.toLowerCase().includes("emergencia medica") ||
      item.descrip?.toLowerCase().includes("emergencia médica")
        ? item.descrip
        : "Emergencia Médica";
  } else if (item.type === "F") {
    details.boxBgColor = "rgba(218, 93, 93, 0.2)";
    details.borderColor = "rgb(228, 96, 85)";
    details.icon = <IconFlame size={36} color={details.textColor} />;
    details.title = item.descrip?.toLowerCase().includes("incendio")
      ? item.descrip
      : "Incendio";
  } else if (item.type === "T") {
    details.boxBgColor = "rgba(112, 66, 112, 0.2)";
    details.borderColor = "rgb(167, 22, 167)";
    details.icon = <IconTheft size={36} color={details.textColor} />;
    details.title =
      item.descrip?.toLowerCase().includes("robo") ||
      item.descrip?.toLowerCase().includes("intrusi")
        ? item.descrip
        : "Robo o Intrusión";
  } else if (item.level >= ALERT_LEVELS.HIGH && item.descrip) {
    details.title = item.descrip;
  }
  return details;
};

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onConfirm?: Function;
  extraData?: any;
  reLoad?: Function;
}) => {
  const { execute } = useAxios();
  const onSaveAttend = async () => {
    const { data } = await execute(
      "/attend",
      "POST",
      {
        id: props?.item?.id,
      },
      false,
      true
    );
    if (data?.success == true) {
      props?.onClose();
      props?.reLoad && props?.reLoad();
    }
  };

  const isHighLevelAlert = props.item.level === ALERT_LEVELS.PANIC || props.item.level === ALERT_LEVELS.HIGH;
  const isAttended = !!props.item.date_at;

  const informer =
    props.item.level === 4 && props.item.owner
      ? props.item.owner
      : props.item.guardia || props.item.owner;
  const informerPrefix =
    props.item.level === 4 && props.item.owner
      ? "/OWNER-"
      : props.item.guardia
      ? "/GUARD-"
      : "/OWNER-";
  const informerDetailText = informer?.dpto
    ? `Unidad: ${informer.dpto[0]?.nro}`
    : informer?.ci
    ? `C.I: ${informer.ci}`
    : "";

  const attendant = props.item.gua_attend || props.item.adm_attend;
  const attendantPrefix = props.item.gua_attend
    ? "/GUARD-"
    : props.item.adm_attend
    ? "/ADM-"
    : "/USER-";

  const alertTypeBoxDetails = isHighLevelAlert
    ? getAlertTypeBoxDetails(props.item)
    : null;
  const alertLevelColor = getAlertLevelFigmaColor(props.item.level);

  return (
    <DataModal
      open={props.open}
      onClose={props?.onClose}
      title="Detalle de alerta"
      buttonText=""
      buttonCancel=""
      style={{ width: "600px" }}
    >
      {isHighLevelAlert ? (
        <div className={styles.figmaContainer}>
          <div className={styles.hlTopSection}>
            <div
              className={styles.hlAlertTypeBox}
              style={{
                backgroundColor: alertTypeBoxDetails?.boxBgColor,
                borderColor: alertTypeBoxDetails?.borderColor,
              }}
            >
              <div className={styles.hlAlertTypeIconContainer}>
                {alertTypeBoxDetails?.icon}
              </div>
              <span
                className={styles.hlAlertTypeText}
                style={{ color: alertTypeBoxDetails?.textColor }}
              >
                {alertTypeBoxDetails?.title}
              </span>
            </div>
            <div className={styles.hlUserInfoContainer}>
              <div className={styles.hlUserRow}>
                {informer && (
                  <div className={styles.hlAvatarContainer}>
                    <Avatar
                      hasImage={informer.has_image}
                      src={getUrlImages(
                        informerPrefix +
                          informer.id +
                          ".webp?d=" +
                          informer.updated_at
                      )}
                      name={getFullName(informer)}
                      w={40}
                      h={40}
                    />
                  </div>
                )}
                <div className={styles.hlUserTextDetails}>
                  <span className={styles.hlUserName}>
                    {informer
                      ? getFullName(informer)
                      : "Informador no disponible"}
                  </span>
                  {informerDetailText && (
                    <span className={styles.hlUserUnitOrCi}>
                      {informerDetailText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.divider}></div>

          <div className={styles.hlMiddleSection}>
            <div className={styles.hlInfoRow}>
              <div className={styles.hlInfoBlockGrow}>
                <div className={styles.hlInfoBlockContent}>
                  <span className={styles.hlInfoLabel}>
                    Fecha y hora de creación
                  </span>
                  <span className={styles.hlInfoValue}>
                    {props.item.created_at
                      ? getDateTimeStrMesShort(props.item.created_at)
                      : "N/A"}
                  </span>
                </div>
              </div>
              <div className={styles.hlInfoBlockFixed}>
                <div className={styles.hlInfoBlockContent}>
                  <span className={styles.hlInfoLabel}>
                    Categoría de alerta
                  </span>
                  <span
                    className={styles.hlAlertLevelValue}
                    style={{ color: alertLevelColor }}
                  >
                    {getAlertLevelText(props.item.level) || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.divider}></div>
          <div className={styles.hlBottomSection}>
            {isAttended ? (
              <div className={styles.hlAttendedBySection}>
                <span className={styles.hlInfoLabelLarge}>Atendida por:</span>
                <div className={styles.hlUserInfoContainer}>
                  <div className={styles.hlUserRow}>
                    {attendant && (
                      <div className={styles.hlAvatarContainer}>
                        <Avatar
                          hasImage={attendant.has_image}
                          src={getUrlImages(
                            attendantPrefix +
                              attendant.id +
                              ".webp?d=" +
                              attendant.updated_at
                          )}
                          name={getFullName(attendant)}
                          w={40}
                          h={40}
                        />
                      </div>
                    )}
                    <div className={styles.hlUserTextDetails}>
                      <span className={styles.hlUserName}>
                        {attendant ? getFullName(attendant) : "N/A"}
                      </span>
                      {attendant?.ci && (
                        <span className={styles.hlUserUnitOrCi}>
                          C.I: {attendant.ci}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div
                  className={styles.hlInfoBlockContent}
                  style={{ alignItems: "flex-start", marginTop: "var(--spS)" }}
                >
                  <span className={styles.hlInfoLabel}>Fecha de atención:</span>
                  <span className={styles.hlInfoValue}>
                    {props.item.date_at
                      ? getDateTimeStrMesShort(props.item.date_at)
                      : "N/A"}
                  </span>
                </div>
              </div>
            ) : (
              <div className={styles.hlPendingSection}>
                <div className={styles.hlPendingIconContainer}>
                  <IconClock size={32} color={alertLevelColor} />
                </div>
                <span
                  className={styles.hlPendingText}
                  style={{ color: alertLevelColor }}
                >
                  Pendiente de atención
                </span>
              </div>
            )}
          </div>

          {!isAttended && props.item.level === 4 && (
            <div className={styles.actionButtonWrapper}>
              <Button
                onClick={onSaveAttend}
                className={styles.actionButtonCustom}
              >
                Marcar como atendida
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.figmaContainer}>
          <div className={styles.gTopSection}>
            <span className={styles.gAlertDescriptionText}>
              {props.item.descrip || "Descripción no disponible."}
            </span>
            {informer && (
              <div className={styles.gUserInfoContainer}>
                <div className={styles.gUserRow}>
                  <div className={styles.gAvatarContainer}>
                    <Avatar
                      hasImage={informer.has_image}
                      src={getUrlImages(
                        informerPrefix +
                          informer.id +
                          ".webp?d=" +
                          informer.updated_at
                      )}
                      name={getFullName(informer)}
                      w={40}
                      h={40}
                    />
                  </div>
                  <div className={styles.gUserTextDetails}>
                    <span className={styles.gUserName}>
                      {getFullName(informer)}
                    </span>
                    {informerDetailText && (
                      <span className={styles.gUserCi}>
                        {informerDetailText}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className={styles.divider}></div>
          <div className={styles.gBottomSection}>
            <div className={styles.gInfoRow}>
              <div className={styles.gInfoBlockGrow}>
                <div className={styles.gInfoBlockContent}>
                  <span className={styles.gInfoLabel}>
                    Fecha y hora de creación
                  </span>
                  <span className={styles.gInfoValue}>
                    {props.item.created_at
                      ? getDateTimeStrMesShort(props.item.created_at)
                      : "N/A"}
                  </span>
                </div>
              </div>
              <div className={styles.gInfoBlockFixed}>
                <div className={styles.gInfoBlockContent}>
                  <span className={styles.gInfoLabel}>Grupo de alerta</span>
                  <span
                    className={styles.gAlertLevelValue}
                    style={{ color: alertLevelColor }}
                  >
                    {getAlertLevelText(props.item.level) || "-/-"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {isAttended && attendant && (
            <div className={styles.gAttendedSection}>
              <div className={styles.gInfoSeparator}></div>
              <span className={styles.gInfoLabelLarge}>Atendida por:</span>
              <div className={styles.gUserInfoContainer}>
                <div className={styles.gUserRow}>
                  <div className={styles.gAvatarContainer}>
                    <Avatar
                      hasImage={attendant.has_image}
                      src={getUrlImages(
                        attendantPrefix +
                          attendant.id +
                          ".webp?d=" +
                          attendant.updated_at
                      )}
                      name={getFullName(attendant)}
                      w={40}
                      h={40}
                    />
                  </div>
                  <div className={styles.gUserTextDetails}>
                    <span className={styles.gUserName}>
                      {getFullName(attendant)}
                    </span>
                    {attendant.ci && (
                      <span className={styles.gUserCi}>
                        C.I: {attendant.ci}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={styles.gInfoBlockContent}
                style={{ alignItems: "flex-start", marginTop: "var(--spS)" }}
              >
                <span className={styles.gInfoLabel}>Fecha de atención:</span>
                <span className={styles.gInfoValue}>
                  {props.item.date_at
                    ? getDateTimeStrMesShort(props.item.date_at)
                    : "N/A"}
                </span>
              </div>
            </div>
          )}

          {!isAttended && props.item.level === 4 && (
            <div className={styles.actionButtonWrapper}>
              <Button
                onClick={onSaveAttend}
                className={styles.actionButtonCustom}
              >
                Marcar como atendida
              </Button>
            </div>
          )}
        </div>
      )}
    </DataModal>
  );
};

export default RenderView;
