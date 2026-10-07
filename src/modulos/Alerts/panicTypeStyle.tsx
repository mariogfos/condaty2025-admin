import {
  IconAlert,
  IconAmbulance,
  IconFlame,
  IconTheft,
} from "@/components/layout/icons/IconsBiblioteca";
import { ALERT_TYPE } from "./alertConstants";

type TranslationKey = "medicalEmergency" | "fire" | "theft" | "other";

/**
 * Name, icon and colours of the PANIC modal that `Layout` opens when a
 * resident presses the button.
 *
 * 🔴 The map was keyed by the OLD letters (`E`, `F`, `T`, `O`) while the push
 * carries `alerts.type` as a number since 2026-08-28 (api#463): the modal of
 * every panic alert opened with no icon, no colour and no name. No error.
 *
 * ⚠️ `Number()` because the payload may carry the number as a string.
 */
export function panicTypeStyle(
  type: unknown,
  translate: (key: TranslationKey) => string
) {
  switch (Number(type)) {
    case ALERT_TYPE.MEDICAL:
      return {
        name: translate("medicalEmergency"),
        icon: <IconAmbulance size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverError)", border: "var(--cError)" },
      };
    case ALERT_TYPE.FIRE:
      return {
        name: translate("fire"),
        icon: <IconFlame size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverWarning)", border: "var(--cWarning)" },
      };
    case ALERT_TYPE.THEFT:
      return {
        name: translate("theft"),
        icon: <IconTheft size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverInfo)", border: "var(--cInfo)" },
      };
    case ALERT_TYPE.OTHER:
      return {
        name: translate("other"),
        icon: <IconAlert size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverInfo)", border: "var(--cInfo)" },
      };
    default:
      return undefined;
  }
}
