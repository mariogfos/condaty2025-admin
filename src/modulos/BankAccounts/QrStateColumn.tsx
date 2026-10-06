import React from "react";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import {
  QR_ACCOUNT_STATE_COLOR,
  QR_ACCOUNT_STATE_LABEL,
  qrAccountState,
} from "@/modulos/QrDinamico/shared";
import styles from "./BankAccounts.module.css";

/**
 * The "QR Dinámico" column of the bank accounts list — only for the Condaty
 * team.
 *
 * 🔴 Production (`origin/prod`, `BankAccounts.tsx`) has this column for FOS
 * users, and `dev` lost it: admin#822 wrote the state helper and its test, and
 * the column never made it into `fields`. The test drew its own column, so it
 * passed with the screen showing nothing. Without it the Condaty team cannot
 * tell which account charges by QR —or is switched on and cannot charge,
 * «Incompleto»— without opening every account.
 *
 * ⚠️ FOS only, the same rule as the API (`BankAccountPolicy::configureQrDinamico`:
 * `fosrole_id > 0`). A condominium ADM never sees QR configuration.
 */
export const isCondatyTeam = (user: { fosrole_id?: unknown } | null | undefined) =>
  Number(user?.fosrole_id ?? 0) > 0;

export const renderQrStateCell = ({ item }: Record<string, any>) => {
  const state = qrAccountState(item);
  const tone = QR_ACCOUNT_STATE_COLOR[state];
  return (
    <StatusBadge color={tone.color} backgroundColor={tone.bg}>
      {QR_ACCOUNT_STATE_LABEL[state]}
    </StatusBadge>
  );
};

export const qrStateColumn = (user: { fosrole_id?: unknown } | null | undefined) =>
  isCondatyTeam(user)
    ? {
        qr_dynamic_status: {
          rules: [],
          api: "",
          label: "QR Dinámico",
          form: false,
          list: {
            width: "180px",
            className: styles.statusColumn,
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
            onRender: renderQrStateCell,
          },
        },
      }
    : {};
