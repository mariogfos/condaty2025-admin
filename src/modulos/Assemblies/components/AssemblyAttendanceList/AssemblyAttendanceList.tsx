"use client";

import { useEffect, useState } from "react";
import styles from "./AssemblyAttendanceList.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { AssemblyAttendance, ROLE_LABELS } from "../../types/assemblies.types";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";
import { IconTrash } from "@/components/layout/icons/IconsBiblioteca";

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
  const { execute: deleteAttendance } = useAxios();
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
        setAttendances(response.data || []);
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

  const handleDelete = async (attendanceId: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta asistencia?")) {
      return;
    }

    try {
      const { data: response, error } = await deleteAttendance(
        `/assemblies/${assemblyId}/attendances/${attendanceId}`,
        "DELETE",
      );

      if (response?.success || !response?.error) {
        showToast("Asistencia eliminada", "success");
        loadAttendances();
        onAttendanceChange?.();
      } else {
        showToast(
          error?.data?.message || "Error al eliminar asistencia",
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
          Asistentes: <br />
          <strong>{attendances.length}</strong>
        </span>
        <span className={styles.breakdown}>
          Presencial: <br />
          <strong>{inPersonCount}</strong>
        </span>
        <span className={styles.breakdown}>
          Virtual: <br /> <strong>{virtualCount}</strong>
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
                <th style={{ width: 50 }}></th>
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
                  <td>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(attendance.id)}
                      title="Eliminar asistencia"
                    >
                      <IconTrash size={16} />
                    </button>
                  </td>
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
