"use client";

import { ArrowRight, CalendarDays, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import WidgetBase from "@/components/Widgets/WidgetBase/WidgetBase";
import { useScopedI18n } from "@/i18n/useScopedI18n";
import { formatToDayFdMYH } from "@/mk/utils/date";
import { STATUS_LABELS } from "../../types/assemblies.types";
import styles from "./AssemblyDashboardCard.module.css";

export const AssemblyDashboardCard = ({ assembly }: { assembly?: any }) => {
  const router = useRouter();
  const { translate } = useScopedI18n("home");

  if (!assembly) return null;

  const statusClass =
    assembly.status === "P" ? styles.statusActive : styles.statusScheduled;
  const statusLabel =
    STATUS_LABELS[assembly.status as keyof typeof STATUS_LABELS] ||
    assembly.status;

  return (
    <WidgetBase
      title={translate("nextAssembly")}
      subtitle={translate("nextAssemblySubtitle")}
      variant="V1"
      className={styles.cardContainer}
    >
      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.iconContainer} aria-hidden="true">
            <UsersRound size={22} strokeWidth={1.6} />
          </span>
          <span className={`${styles.statusBadge} ${statusClass}`}>
            <i aria-hidden="true" />
            {statusLabel}
          </span>
        </div>

        <h3 className={styles.subject}>{assembly.subject}</h3>

        <div className={styles.dateBlock}>
          <span className={styles.dateLabel}>
            <CalendarDays size={15} strokeWidth={1.65} aria-hidden="true" />
            {translate("assemblyDate")}
          </span>
          <strong>{formatToDayFdMYH(assembly.start_time, false)}</strong>
        </div>

        <button
          type="button"
          className={styles.actionButton}
          onClick={() => router.push(`/assemblies/${assembly.id}`)}
        >
          {translate("viewAssemblyDetail")}
          <ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </WidgetBase>
  );
};
