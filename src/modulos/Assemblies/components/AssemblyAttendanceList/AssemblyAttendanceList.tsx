"use client";

import { useEffect, useState } from "react";
import styles from "./AssemblyAttendanceList.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { AssemblyAttendance } from "../../types/assemblies.types";
import { formatToDayDDMMYYYYHHMM } from "@/mk/utils/date";

interface AssemblyAttendanceListProps {
  assemblyId: number;
  onAttendanceChange?: () => void;
}

const AssemblyAttendanceList: React.FC<AssemblyAttendanceListProps> = ({
  assemblyId,
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
  }, [assemblyId]);

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
                  <td>{attendance.owner?.name || "Desconocido"}</td>
                  <td>{attendance.dpto?.number || "-"}</td>
                  <td>{attendance.role || "-"}</td>
                  <td>
                    <span
                      className={`${styles.modalityBadge} ${attendance.modality_type === "P" ? styles.inPerson : styles.virtual}`}
                    >
                      {getModalityLabel(attendance.modality_type)}
                    </span>
                  </td>
                  <td>
                    {attendance.joined_at
                      ? formatToDayDDMMYYYYHHMM(
                          attendance.joined_at.replace(" ", "T"),
                          false,
                        )
                      : "-"}
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
