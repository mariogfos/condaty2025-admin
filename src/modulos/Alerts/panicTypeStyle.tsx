import {
  IconAlert,
  IconAmbulance,
  IconFlame,
  IconTheft,
} from "@/components/layout/icons/IconsBiblioteca";
import { ALERT_TYPE } from "./alertConstants";

/**
 * Icon and colours of the PANIC modal that `Layout` opens when a resident
 * presses the button. (The name it shows is the alert's own `descrip`, which
 * the API already builds from the type.)
 *
 * 🔴 The map was keyed by the OLD letters (`E`, `F`, `T`, `O`) while the push
 * carries `alerts.type` as a number since 2026-08-28 (api#463): the modal of
 * every panic alert opened with no icon and no colour. No error.
 *
 * ⚠️ `Number()` because the payload may carry the number as a string.
 */
export function panicTypeStyle(type: unknown) {
  switch (Number(type)) {
    case ALERT_TYPE.MEDICAL:
      return {
        icon: <IconAmbulance size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverError)", border: "var(--cError)" },
      };
    case ALERT_TYPE.FIRE:
      return {
        icon: <IconFlame size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverWarning)", border: "var(--cWarning)" },
      };
    case ALERT_TYPE.THEFT:
      return {
        icon: <IconTheft size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverInfo)", border: "var(--cInfo)" },
      };
    case ALERT_TYPE.OTHER:
      return {
        icon: <IconAlert size={36} color="var(--cWhite)" />,
        color: { background: "var(--cHoverInfo)", border: "var(--cInfo)" },
      };
    default:
      return undefined;
  }
}
