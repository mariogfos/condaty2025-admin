import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./RenderView.module.css";
import { getFullName, getUrlImages } from "@/mk/utils/string";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { getDateTimeStrMesShort } from "@/mk/utils/date";
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
  const details = {
    boxBgColor: "var(--cGrayMd, #55595c)",
    borderColor: "var(--cGrayDark, #404244)",
    textColor: "var(--cWhite, #fafafa)",
    icon: <IconAlert size={36} color={"var(--cWhite, #fafafa)"} />,
    title: item.descrip || `Alerta de ${ALERT_LEVEL_LABELS[ALERT_LEVELS.HIGH]}`,
  };

  switch (item.type) {
    case "E":
      return {
        ...details,
        boxBgColor: "rgba(218, 94, 85, 0.55)",
        borderColor: "rgb(228, 96, 85)",
        icon: <IconAmbulance size={36} color={details.textColor} />,
        title: getEmergencyTitle(item.descrip)
      };
    case "F":
      return {
        ...details,
        boxBgColor: "rgba(218, 93, 93, 0.2)",
        borderColor: "rgb(228, 96, 85)",
        icon: <IconFlame size={36} color={details.textColor} />,
        title: getFireTitle(item.descrip)
      };
    case "T":
      return {
        ...details,
        boxBgColor: "rgba(112, 66, 112, 0.2)",
        borderColor: "rgb(167, 22, 167)",
        icon: <IconTheft size={36} color={details.textColor} />,
        title: getTheftTitle(item.descrip)
      };
    default:
      if (item.level >= ALERT_LEVELS.HIGH && item.descrip) {
        details.title = item.descrip;
      }
      return details;
  }
};

const getEmergencyTitle = (descrip: string) => {
  const isEmergency = descrip?.toLowerCase().includes("emergencia medica") ||
                     descrip?.toLowerCase().includes("emergencia médica");
  return isEmergency ? descrip : "Emergencia Médica";
};

const getFireTitle = (descrip: string) => {
  return descrip?.toLowerCase().includes("incendio") ? descrip : "Incendio";
};

const getTheftTitle = (descrip: string) => {
  const isTheft = descrip?.toLowerCase().includes("robo") ||
                  descrip?.toLowerCase().includes("intrusi");
  return isTheft ? descrip : "Robo o Intrusión";
};

const UserInfoDisplay = ({ user, prefix, detailText, isHighLevel = true }: {
  user: any;
  prefix: string;
  detailText: string;
  isHighLevel?: boolean;
}) => {
  if (!user) {
    return (
      <div className={isHighLevel ? styles.hlUserInfoContainer : styles.gUserInfoContainer}>
        <div className={isHighLevel ? styles.hlUserRow : styles.gUserRow}>
          <div className={styles.hlUserTextDetails}>
            <span className={isHighLevel ? styles.hlUserName : styles.gUserName}>
              Informador no disponible
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isHighLevel ? styles.hlUserInfoContainer : styles.gUserInfoContainer}>
      <div className={isHighLevel ? styles.hlUserRow : styles.gUserRow}>
        <div className={isHighLevel ? styles.hlAvatarContainer : styles.gAvatarContainer}>
          <Avatar
            hasImage={user.has_image}
            src={getUrlImages(prefix + user.id + ".webp?d=" + user.updated_at)}
            name={getFullName(user)}
            w={40}
            h={40}
          />
        </div>
        <div className={isHighLevel ? styles.hlUserTextDetails : styles.gUserTextDetails}>
          <span className={isHighLevel ? styles.hlUserName : styles.gUserName}>
            {getFullName(user)}
          </span>
          {detailText && (
            <span className={isHighLevel ? styles.hlUserUnitOrCi : styles.gUserCi}>
              {detailText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoBlock = ({ label, value, valueStyle, isHighLevel = true }: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  isHighLevel?: boolean;
}) => (
  <div className={isHighLevel ? styles.hlInfoBlockContent : styles.gInfoBlockContent}>
    <span className={isHighLevel ? styles.hlInfoLabel : styles.gInfoLabel}>{label}</span>
    <span
      className={isHighLevel ? styles.hlInfoValue : styles.gInfoValue}
      style={valueStyle}
    >
      {value}
    </span>
  </div>
);

const AttendedSection = ({ attendant, attendantPrefix, item, isHighLevel }: {
  attendant: any;
  attendantPrefix: string;
  item: any;
  isHighLevel: boolean;
}) => {
  const attendantDetailText = attendant?.ci ? `C.I: ${attendant.ci}` : "";
  const dateValue = item.date_at ? getDateTimeStrMesShort(item.date_at) : "N/A";

  if (isHighLevel) {
    return (
      <div className={styles.hlAttendedBySection}>
        <span className={styles.hlInfoLabelLarge}>Atendida por:</span>
        <UserInfoDisplay
          user={attendant}
          prefix={attendantPrefix}
          detailText={attendantDetailText}
          isHighLevel={true}
        />
        <div
          className={styles.hlInfoBlockContent}
          style={{ alignItems: "flex-start", marginTop: "var(--spS)" }}
        >
          <span className={styles.hlInfoLabel}>Fecha de atención:</span>
          <span className={styles.hlInfoValue}>{dateValue}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gAttendedSection}>
      <div className={styles.gInfoSeparator}></div>
      <span className={styles.gInfoLabelLarge}>Atendida por:</span>
      <UserInfoDisplay
        user={attendant}
        prefix={attendantPrefix}
        detailText={attendantDetailText}
        isHighLevel={false}
      />
      <InfoBlock
        label="Fecha de atención:"
        value={dateValue}
        isHighLevel={false}
      />
    </div>
  );
};

const ActionButton = ({ onSaveAttend }: { onSaveAttend: () => void }) => (
  <div className={styles.actionButtonWrapper}>
    <Button onClick={onSaveAttend} className={styles.actionButtonCustom}>
      Marcar como atendida
    </Button>
  </div>
);

interface RenderViewProps {
  open: boolean;
  onClose: () => void;
  item: Record<string, any>;
  reLoad?: () => void;
}

const RenderView = (props: RenderViewProps) => {
  const { execute } = useAxios();

  const onSaveAttend = async () => {
    const { data } = await execute(
      "/attend",
      "POST",
      { id: props.item.id },
      false,
      true
    );
    if (data?.success === true) {
      props.onClose();
      props.reLoad?.();
    }
  };

  // Computed values
  const isHighLevelAlert = props.item.level === ALERT_LEVELS.PANIC || props.item.level === ALERT_LEVELS.HIGH;
  const isAttended = Boolean(props.item.date_at);
  const isPanicLevel = props.item.level === 4;
  const showActionButton = !isAttended && isPanicLevel;

  // User data
  const informer = (props.item.level === 4 && props.item.owner)
    ? props.item.owner
    : props.item.guardia || props.item.owner;

  const informerPrefix = (props.item.level === 4 && props.item.owner)
    ? "/OWNER-"
: getInformerPrefix(props.item.guardia);

// Helper function to determine informer prefix
function getInformerPrefix(hasGuardia: boolean) {
  if (hasGuardia) {
    return "/GUARD-";
  }
  return "/OWNER-";
}

  const informerDetailText = informer?.dpto
    ? `Unidad: ${informer.dpto[0]?.nro}`
: getInformerCiText(informer);

// Helper function to get CI text
function getInformerCiText(informer: any) {
  if (informer?.ci) {
    return `C.I: ${informer.ci}`;
  }
  return "";
}

  const attendant = props.item.gua_attend || props.item.adm_attend;
  const attendantPrefix = props.item.gua_attend
    ? "/GUARD-"
: getAttendantPrefix(props.item.adm_attend);


function getAttendantPrefix(hasAdminAttend: boolean) {
  if (hasAdminAttend) {
    return "/ADM-";
  }
  return "/USER-";
}

  const alertTypeBoxDetails = isHighLevelAlert ? getAlertTypeBoxDetails(props.item) : null;
  const alertLevelColor = getAlertLevelFigmaColor(props.item.level);
  const createdAtValue = props.item.created_at ? getDateTimeStrMesShort(props.item.created_at) : "N/A";
  const alertLevelValue = getAlertLevelText(props.item.level) || "N/A";

  const renderHighLevelAlert = () => (
    <>
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
        <UserInfoDisplay
          user={informer}
          prefix={informerPrefix}
          detailText={informerDetailText}
          isHighLevel={true}
        />
      </div>
      <div className={styles.divider}></div>

      <div className={styles.hlMiddleSection}>
        <div className={styles.hlInfoRow}>
          <div className={styles.hlInfoBlockGrow}>
            <InfoBlock
              label="Fecha y hora de creación"
              value={createdAtValue}
              isHighLevel={true}
            />
          </div>
          <div className={styles.hlInfoBlockFixed}>
            <div className={styles.hlInfoBlockContent}>
              <span className={styles.hlInfoLabel}>Categoría de alerta</span>
              <span
                className={styles.hlAlertLevelValue}
                style={{ color: alertLevelColor }}
              >
                {alertLevelValue}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.divider}></div>

      <div className={styles.hlBottomSection}>
        {isAttended ? (
          <AttendedSection
            attendant={attendant}
            attendantPrefix={attendantPrefix}
            item={props.item}
            isHighLevel={true}
          />
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
    </>
  );

  const renderGeneralAlert = () => (
    <>
      <div className={styles.gTopSection}>
        <span className={styles.gAlertDescriptionText}>
          {props.item.descrip || "Descripción no disponible."}
        </span>
        {informer && (
          <UserInfoDisplay
            user={informer}
            prefix={informerPrefix}
            detailText={informerDetailText}
            isHighLevel={false}
          />
        )}
      </div>
      <div className={styles.divider}></div>

      <div className={styles.gBottomSection}>
        <div className={styles.gInfoRow}>
          <div className={styles.gInfoBlockGrow}>
            <InfoBlock
              label="Fecha y hora de creación"
              value={createdAtValue}
              isHighLevel={false}
            />
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
        <AttendedSection
          attendant={attendant}
          attendantPrefix={attendantPrefix}
          item={props.item}
          isHighLevel={false}
        />
      )}
    </>
  );

  return (
    <DataModal
      open={props.open}
      onClose={props.onClose}
      title="Detalle de alerta"
      buttonText=""
      buttonCancel=""
      style={{ width: "600px" }}
    >
      <div className={styles.figmaContainer}>
        {isHighLevelAlert ? renderHighLevelAlert() : renderGeneralAlert()}
        {showActionButton && <ActionButton onSaveAttend={onSaveAttend} />}
      </div>
    </DataModal>
  );
};

export default RenderView;
