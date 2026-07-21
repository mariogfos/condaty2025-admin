"use client";

import { useEffect, useState } from "react";
import styles from "./AssemblyAttendanceList.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  AssemblyAttendance,
  AssemblyAttendanceUnit,
  ROLE_LABELS,
} from "../../types/assemblies.types";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
import { IconTrash } from "@/components/layout/icons/IconsBiblioteca";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { useMemo } from "react";
import AsyncExportButton from "@/mk/components/ui/AsyncExportButton/AsyncExportButton";

// Helper para extraer solo la hora HH:MM
const formatOnlyTime = (dateStr: string) => {
  if (!dateStr) return "-";
  const parts = dateStr.split(/[T ]/);
  return parts[1] ? parts[1].slice(0, 5) : "-";
};

interface AssemblyAttendanceListProps {
  assemblyId: string | number;
  refreshKey?: number;
  onAttendanceChange?: () => void;
  readOnly?: boolean;
  assemblyModality?: "P" | "V" | "H";
}

const AssemblyAttendanceList: React.FC<AssemblyAttendanceListProps> = ({
  assemblyId,
  refreshKey,
  onAttendanceChange,
  readOnly = false,
  assemblyModality,
}) => {
  const [attendances, setAttendances] = useState<AssemblyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { execute: fetchAttendances, loaded } = useAxios();
  const { execute: deleteAttendance } = useAxios();
  // S38.5: el export de attendees ahora usa el flow async canónico
  // (POST /api/v3/reports/assemblies-attendances/export + polling)
  // vía `<AsyncExportButton>` (S33). Se MATA el legacy useAxios al
  // endpoint `GET /assemblies/{id}/export-attendances` (D-38-5 cleanup).
  const { showToast } = useAuth();

  const loadAttendances = async () => {
    setIsLoading(true);
    try {
      const { data: response } = await fetchAttendances(
        `/assemblies/${assemblyId}/attendances`,
        "GET",
        {},
        false,
        true,
      );
      if (response?.data) {
        // Group attendees by owner_id to avoid duplicates when owner has multiple units
        const groupedAttendances = (response.data || []).reduce(
          (acc: AssemblyAttendance[], att: AssemblyAttendance) => {
            const existing = acc.find((a) => a.owner_id === att.owner_id);
            if (existing) {
              if (!existing.units) {
                existing.units = [
                  { dpto: existing.dpto!, role: existing.role! },
                ];
              }
              existing.units.push({ dpto: att.dpto!, role: att.role! });
            } else {
              acc.push({
                ...att,
                units: [{ dpto: att.dpto!, role: att.role! }],
              });
            }
            return acc;
          },
          [],
        );
        setAttendances(groupedAttendances);
      }
    } catch (error) {
      console.error("Error loading attendances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendances();
  }, [assemblyId, refreshKey]);

  const handleDelete = async (
    ownerId: string | number,
    _attendanceId?: number,
  ) => {
    if (readOnly) return;
    if (
      !confirm(
        "¿Estás seguro de que deseas eliminar todas las assistencias de este participante?",
      )
    ) {
      return;
    }

    try {
      const { data: response, error } = await deleteAttendance(
        `/assemblies/${assemblyId}/attendances`,
        "DELETE",
        { owner_id: ownerId },
        false,
        true,
      );

      if (response?.success) {
        showToast("Asistencias eliminadas", "success");
        loadAttendances();
        onAttendanceChange?.();
      } else {
        showToast(
          error?.data?.message || "Error al eliminar assistencias",
          "error",
        );
      }
    } catch (err) {
      console.error("Error deleting attendance:", err);
      showToast("Error crítico al eliminar", "error");
    }
  };

  const getModalityLabel = (modality: string) => {
    return modality === "P" ? "Presencial" : "Virtual";
  };

  const isInPersonOnly = assemblyModality === "P";

  // console.log("attendances", attendances);
  const inPersonCount = attendances?.filter(
    (a) => a.modality_type === "P",
  ).length;
  const virtualCount = attendances?.filter(
    (a) => a.modality_type === "V",
  ).length;

  const { isMobile } = useScreenSize();

  if (isLoading || !loaded) {
    return <div className={styles.loading}>Cargando asistentes...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <span className={styles.total}>
          Asistentes: <br />
          <strong>{attendances.length}</strong>
        </span>
        <span className={styles.breakdown}>
          Presencial: <br />
          <strong>{inPersonCount}</strong>
        </span>
        {!isInPersonOnly && (
          <span className={styles.breakdown}>
            Virtual: <br /> <strong>{virtualCount}</strong>
          </span>
        )}
        {/* S38.5: AsyncExportButton reemplaza el Button+IconDownload legacy
            (que llamaba al endpoint síncrono /export-attendances). El flow
            async se encarga de: POST /api/v3/reports/assemblies-attendances/
            export + polling + download modal. Si no hay attendees, el botón
            no se renderea (mejor UX que disabled). */}
        {attendances.length > 0 && (
          <AsyncExportButton
            type="assemblies-attendances"
            params={{ assembly_id: assemblyId }}
            label="Exportar PDF"
            variant="secondary"
          />
        )}
      </div>

      {attendances.length === 0 ? (
        <div className={styles.empty}>No hay asistentes registrados aún.</div>
      ) : (
        <div className={styles.list}>
          {/* {isMobile ? ( */}
          <div className={styles.cardsContainer}>
            {attendances.map((attendance) => (
              <div key={attendance.owner_id} className={styles.attendanceCard}>
                <div className={styles.cardHeader}>
                  <Avatar
                    src={attendance.owner?.url_avatar}
                    name={`${attendance.owner?.name} ${attendance.owner?.last_name || ""}`}
                    w={40}
                    h={40}
                  />
                  <div className={styles.cardMainInfo}>
                    <span className={styles.cardName}>
                      {attendance.owner
                        ? `${attendance.owner.name} ${attendance.owner.last_name || ""}`
                        : "Desconocido"}
                    </span>
                    <span className={styles.cardSub}>
                      {attendance.units && attendance.units.length > 1 ? (
                        attendance.units.map(
                          (u: AssemblyAttendanceUnit, idx: number) => (
                            <span key={idx}>
                              {idx > 0 && ", "}
                              Und. {u.dpto.nro} (
                              {ROLE_LABELS[u.role as string] || u.role})
                              {u.dpto.is_arrears && " [Mora]"}
                            </span>
                          ),
                        )
                      ) : (
                        <>
                          Unidad {attendance.dpto?.nro || "-"}{" "}
                          {attendance.dpto?.is_arrears && (
                            <span
                              style={{
                                color: "#ff4d4f",
                                fontWeight: "bold",
                                fontSize: "0.8em",
                              }}
                            >
                              (Mora)
                            </span>
                          )}{" "}
                          | CI: {attendance.owner?.ci || "-"}
                        </>
                      )}
                    </span>
                  </div>
                  {!readOnly && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() =>
                        handleDelete(attendance.owner_id, attendance.id)
                      }
                      title="Eliminar asistencia"
                    >
                      <IconTrash size={18} />
                    </button>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.cardBadgeContainer}>
                    <span className={styles.cardRole}>
                      {ROLE_LABELS[attendance.role as string] ||
                        attendance.role ||
                        "-"}
                    </span>
                    <span
                      className={`${styles.modalityBadge} ${attendance.modality_type === "P" ? styles.inPerson : styles.virtual}`}
                    >
                      {getModalityLabel(attendance.modality_type)}
                    </span>
                  </div>
                  <span className={styles.cardTime}>
                    {formatOnlyTime(attendance.joined_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Departamento</th>
                  <th>Rol</th>
                  <th>Modalidad</th>
                  <th>Hora</th>
                  {!readOnly && <th style={{ width: 50 }}></th>}
                </tr>
              </thead>
              <tbody>
                {attendances.map((attendance) => (
                  <tr key={attendance.id}>
                    <td>
                      {attendance.owner
                        ? `${attendance.owner.name} ${attendance.owner.last_name || ""}`
                        : "Desconocido"}
                    </td>
                    <td>
                      {attendance.dpto?.nro || "-"}{" "}
                      {attendance.dpto?.is_arrears && (
                        <span
                          style={{
                            color: "#ff4d4f",
                            fontWeight: "bold",
                            fontSize: "0.8em",
                          }}
                        >
                          (Mora)
                        </span>
                      )}
                    </td>
                    <td>
                      {ROLE_LABELS[attendance.role as string] ||
                        attendance.role ||
                        "-"}
                    </td>
                    <td>
                      <span
                        className={`${styles.modalityBadge} ${attendance.modality_type === "P" ? styles.inPerson : styles.virtual}`}
                      >
                        {getModalityLabel(attendance.modality_type)}
                      </span>
                    </td>
                    <td>{formatOnlyTime(attendance.joined_at)}</td>
                    {!readOnly && (
                      <td>
                        <button
                          className={styles.deleteBtn}
onClick={() => handleDelete(attendance.owner_id, attendance.id)}
                          title="Eliminar asistencia"
                        >
                          <IconTrash size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )} */}
        </div>
      )}
    </div>
  );
};

export default AssemblyAttendanceList;
