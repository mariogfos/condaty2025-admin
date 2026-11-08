import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import {
  QR_ACCOUNT_STATE_COLOR,
  QR_ACCOUNT_STATE_LABEL,
  qrAccountState,
} from "@/modulos/QrDinamico/shared";

export function BankAccountStatusBadge({ status }: { status?: string }) {
  if (status !== "A" && status !== "X") return <StatusBadge>Sin estado</StatusBadge>;

  const enabled = status === "A";
  return (
    <StatusBadge
      color={enabled ? "var(--cSuccess)" : "var(--cError)"}
      backgroundColor={enabled ? "var(--cHoverSuccess)" : "var(--cHoverError)"}
    >
      {enabled ? "Habilitada" : "Deshabilitada"}
    </StatusBadge>
  );
}

export function BankAccountQrBadge({ account }: {
  account: {
    qr_dynamic_enabled?: boolean;
    qr_dynamic_bank_id?: string | null;
    qr_dynamic_has_credentials?: boolean;
  };
}) {
  const state = qrAccountState(account);
  const tone = QR_ACCOUNT_STATE_COLOR[state];
  return (
    <StatusBadge color={tone.color} backgroundColor={tone.bg}>
      {QR_ACCOUNT_STATE_LABEL[state]}
    </StatusBadge>
  );
}
