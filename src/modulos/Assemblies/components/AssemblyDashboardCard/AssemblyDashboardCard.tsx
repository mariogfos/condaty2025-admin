"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import WidgetBase from "@/components/Widgets/WidgetBase/WidgetBase";
import { formatToDayFdMYH } from "@/mk/utils/date";
import styles from "./AssemblyDashboardCard.module.css";
import { IconCalendar, IconArrowRight, IconGroup } from "@/components/layout/icons/IconsBiblioteca";
import { STATUS_LABELS } from "../../types/assemblies.types";
import { useLanguage } from "@/i18n/LanguageProvider";

export const AssemblyDashboardCard = ({ assembly: initialAssembly = null }: { assembly?: any }) => {
  const router = useRouter();
  const { userCan } = useAuth();
  const { execute } = useAxios();
  const [assembly, setAssembly] = useState<any>(initialAssembly);
  const [loading, setLoading] = useState(!initialAssembly);

  useEffect(() => {
    if (initialAssembly) {
      setAssembly(initialAssembly);
      setLoading(false);
      return;
    }

    const fetchNextAssembly = async () => {
      try {
        const { data } = await execute("/v3/assemblies", "GET", {
          fullType: "L",
          perPage: 1,
          page: 1,
          filterBy: "status:S,P", // Scheduled or InProgress
          sortBy: "start_time",
          sortOrder: "asc", 
        });

        if (data?.data && data.data.length > 0) {
          setAssembly(data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching next assembly:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userCan("assemblies", "R")) {
      fetchNextAssembly();
    } else {
      setLoading(false);
    }
  }, [initialAssembly]);

  if (loading || !assembly) return null;

  const handleGoToDetail = () => {
    router.push(`/assemblies/${assembly.id}`);
  };

  const statusClass = assembly.status === "P" ? styles.statusActive : styles.statusScheduled;

  return (
    <WidgetBase
      title="Próxima Asamblea"
      subtitle="Información y registro de asistencia"
      variant="V1"
      className={styles.cardContainer}
    >
      <div className={styles.content} onClick={handleGoToDetail}>
        <div className={styles.header}>
          <div className={`${styles.statusBadge} ${statusClass}`}>
            <span className={styles.dot}></span>
            {STATUS_LABELS[assembly.status as keyof typeof STATUS_LABELS] || assembly.status}
          </div>
          <div className={styles.iconContainer}>
            <IconGroup size={32} color="var(--cAccent)" />
          </div>
        </div>
        
        <h3 className={styles.subject}>{assembly.subject}</h3>
        
        <div className={styles.infoRow}>
          <IconCalendar size={16} color="var(--cWhiteV1)" />
          <span>{formatToDayFdMYH(assembly.start_time, false)}</span>
        </div>

        <div className={styles.footer}>
          <button className={styles.actionButton}>
            Ver Detalle
            <IconArrowRight size={16} />
          </button>
        </div>
      </div>
    </WidgetBase>
  );
};
