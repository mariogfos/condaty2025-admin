"use client";

import { useEffect, useState } from "react";
import styles from "./AssemblyAttendanceList.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { AssemblyAttendance, ROLE_LABELS } from "../../types/assemblies.types";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";

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
}

const AssemblyAttendanceList: React.FC<AssemblyAttendanceListProps> = ({
  assemblyId,
  refreshKey,
  onAttendanceChange,
}) => {
  const [attendances, setAttendances] = useState<AssemblyAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { execute: fetchAttendances, loaded } = useAxios();

  useEffect(() => {
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
          console.log("response", response.data);
          setAttendances(response.data || []);
        }
      } catch (error) {
        console.error("Error loading attendances:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendances();
  }, [assemblyId, refreshKey]);

  const getModalityLabel = (modality: string) => {
    return modality === "P" ? "Presencial" : "Virtual";
  };

  console.log("attendances", attendances);
  const inPersonCount = attendances?.filter(
    (a) => a.modality_type === "P",
  ).length;
  const virtualCount = attendances?.filter(
    (a) => a.modality_type === "V",
  ).length;

  if (isLoading || !loaded) {
    return <div className={styles.loading}>Cargando asistentes...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <span className={styles.total}>
          Total: <strong>{attendances.length}</strong> asistentes
        </span>
        <span className={styles.breakdown}>
          Presencial: <strong>{inPersonCount}</strong> | Virtual:{" "}
          <strong>{virtualCount}</strong>
        </span>
      </div>

      {attendances.length === 0 ? (
        <div className={styles.empty}>No hay asistentes registrados aún.</div>
      ) : (
        <div className={styles.list}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Departamento</th>
                <th>Rol</th>
                <th>Modalidad</th>
                <th>Hora de ingreso</th>
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
                  <td>{attendance.dpto?.nro || "-"}</td>
                  <td>{ROLE_LABELS[attendance.role as string] || attendance.role || "-"}</td>
                  <td>
                    <span
                      className={`${styles.modalityBadge} ${attendance.modality_type === "P" ? styles.inPerson : styles.virtual}`}
                    >
                      {getModalityLabel(attendance.modality_type)}
                    </span>
                  </td>
                  <td>{formatOnlyTime(attendance.joined_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssemblyAttendanceList;
