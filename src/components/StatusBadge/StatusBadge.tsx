import styles from "./StatusBadge.module.css";
import { CSSProperties, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleX,
  Clock3,
} from "lucide-react";
import { LucideWrap } from "@/mk/components/ui/Icon/Icon";

interface StatusBadgeProps {
  children: React.ReactNode;
  backgroundColor?: string;
  color?: string;
  style?: CSSProperties;
  containerStyle?: CSSProperties;
  icon?: ReactNode | false;
}

type StatusToneKey =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "progress"
  | "neutral";

const getTextFromNode = (value: ReactNode): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(getTextFromNode).join(" ");
  }

  return "";
};

const getAutoStatusIcon = (label: string) => {
  const normalized = label.trim().toLowerCase();

  if (!normalized) return null;

  if (
    /(pagado|cobrado|aprobad|activo|confirmad|success|exito|vigente|respondid|enviado|completad)/.test(
      normalized,
    )
  ) {
    return CheckCircle2;
  }

  if (
    /(pendiente|por confirmar|por pagar|progreso|proceso|review|revision|revisión|espera|borrador|draft)/.test(
      normalized,
    )
  ) {
    return Clock3;
  }

  if (
    /(alerta|alto|media|medio|panic|pánico|moroso|warning|riesgo)/.test(
      normalized,
    )
  ) {
    return AlertTriangle;
  }

  if (
    /(anulad|rechazad|fallid|failed|cancelad|expired|vencid|bloquead|error)/.test(
      normalized,
    )
  ) {
    return CircleX;
  }

  if (/(curso|progress|submitted|en revision|en revisión)/.test(normalized)) {
    return CircleDashed;
  }

  return null;
};

const STATUS_TONES: Record<
  StatusToneKey,
  { text: string; background: string }
> = {
  success: {
    text: "var(--cStatusSuccess)",
    background: "var(--cStatusSuccessSoft)",
  },
  info: {
    text: "var(--cStatusInfo)",
    background: "var(--cStatusInfoSoft)",
  },
  warning: {
    text: "var(--cStatusWarning)",
    background: "var(--cStatusWarningSoft)",
  },
  danger: {
    text: "var(--cStatusDanger)",
    background: "var(--cStatusDangerSoft)",
  },
  progress: {
    text: "var(--cStatusProgress)",
    background: "var(--cStatusProgressSoft)",
  },
  neutral: {
    text: "var(--cStatusNeutral)",
    background: "var(--cStatusNeutralSoft)",
  },
};

const getToneKey = (label: string, color?: string): StatusToneKey => {
  const normalized = label.trim().toLowerCase();
  const normalizedColor = String(color || "").toLowerCase();

  if (
    normalizedColor.includes("csuccess") ||
    /(pagado|cobrado|aprobad|activo|confirmad|success|exito|vigente|respondid|enviado|completad)/.test(
      normalized,
    )
  ) {
    return "success";
  }

  if (
    normalizedColor.includes("cinfo") ||
    /(curso|progress|submitted|subido|en curso|transfer|info|cargad)/.test(
      normalized,
    )
  ) {
    return "info";
  }

  if (
    normalizedColor.includes("cwarning") ||
    /(pendiente|por confirmar|por pagar|review|revision|revisión|espera|borrador|draft|moroso|alerta|medio|media|warning|riesgo)/.test(
      normalized,
    )
  ) {
    return "warning";
  }

  if (
    normalizedColor.includes("cmediumalert") ||
    /(rechazad|fallid|failed|cancelad|expired|vencid|bloquead|error|anulad)/.test(
      normalized,
    )
  ) {
    return "danger";
  }

  if (
    /(revision interna|in progress|progreso|validando|en validacion|en validación)/.test(
      normalized,
    )
  ) {
    return "progress";
  }

  return "neutral";
};

const resolveBadgeTone = ({
  label,
  color,
  backgroundColor,
}: {
  label: string;
  color?: string;
  backgroundColor?: string;
}) => {
  const tone = STATUS_TONES[getToneKey(label, color)];

  if (color && !/^var\(--c(Success|Info|Warning|Error|MediumAlert)/.test(color)) {
    return {
      text: color,
      background:
        (backgroundColor
          ? `color-mix(in srgb, ${backgroundColor} 19%, transparent)`
          : null) ||
        `color-mix(in srgb, ${color} 8%, transparent)`,
    };
  }

  return {
    text: tone.text,
    background: tone.background,
  };
};

export const StatusBadge = ({
  children,
  backgroundColor,
  color,
  style,
  containerStyle,
  icon,
}: StatusBadgeProps) => {
  const labelText = getTextFromNode(children);
  const AutoIcon = icon === undefined ? getAutoStatusIcon(labelText) : null;
  const showIndicator = icon !== false;
  const tone = resolveBadgeTone({ label: labelText, color, backgroundColor });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        ...containerStyle,
      }}
    >
      <div
        className={styles.statusBadge}
        style={
          {
            "--status-badge-bg": tone.background,
            "--status-badge-text": tone.text,
            ...style,
          } as CSSProperties
        }
      >
        {showIndicator && (
          <span className={styles.indicator} aria-hidden="true">
            {icon ? (
              icon
            ) : AutoIcon ? (
              <LucideWrap
                icon={AutoIcon}
                size={14}
                strokeWidth={1.05}
                absoluteStrokeWidth
                color="currentColor"
                className={styles.icon}
              />
            ) : (
              <span className={styles.dot} />
            )}
          </span>
        )}
        <span className={styles.label}>{children}</span>
      </div>
    </div>
  );
};
