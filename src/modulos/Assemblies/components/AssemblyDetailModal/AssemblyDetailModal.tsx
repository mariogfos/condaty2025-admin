"use client";

import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./AssemblyDetailModal.module.css";
import {
  Assembly,
  AssemblyStats,
  STATUS_LABELS,
  TYPE_LABELS,
  MODALITY_LABELS,
  AUDIENCE_LABELS,
} from "../../types/assemblies.types";
import AssemblyStatusActions from "../AssemblyStatusActions/AssemblyStatusActions";
import AssemblyAttendanceList from "../AssemblyAttendanceList/AssemblyAttendanceList";
import AssemblySurveyManager from "../AssemblySurveyManager/AssemblySurveyManager";
import AssemblyConfigForm from "../AssemblyConfigForm/AssemblyConfigForm";
import AssemblyActaManager from "../AssemblyActaManager/AssemblyActaManager";
import useAxios from "@/mk/hooks/useAxios";

interface AssemblyDetailModalProps {
  item: Assembly;
  onClose: () => void;
  onUpdate?: (updatedAssembly: Assembly) => void;
}

type TabType = "info" | "attendances" | "surveys" | "config" | "acta";

const AssemblyDetailModal: React.FC<AssemblyDetailModalProps> = ({
  item: initialAssembly,
  onClose,
  onUpdate,
}) => {
  const [assembly, setAssembly] = useState<Assembly>(initialAssembly);
  const [stats, setStats] = useState<AssemblyStats | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const { execute: fetchStats, loaded } = useAxios();

  // Cargar stats cuando se abra el modal
  useEffect(() => {
    const loadStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await fetchStats(
          `/assemblies/${assembly.id}/stats`,
          "GET",
          {},
          false,
          true,
        );
        if (response?.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error("Error loading assembly stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, [assembly.id]);

  // Función para actualizar la asamblea localmente
  const handleAssemblyUpdate = (updatedAssembly: Assembly) => {
    setAssembly(updatedAssembly);
    onUpdate?.(updatedAssembly);
  };

  // Función para actualizar stats después de cambios
  const refreshStats = async () => {
    try {
      const response = await fetchStats(
        `/assemblies/${assembly.id}/stats`,
        "GET",
        {},
        false,
        true,
      );
      if (response?.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error refreshing stats:", error);
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "No definida";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "No definida";
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "info", label: "Información" },
    { id: "attendances", label: "Asistencias" },
    { id: "surveys", label: "Encuestas" },
    { id: "config", label: "Configuración" },
    { id: "acta", label: "Acta" },
  ];

  return (
    <DataModal
      title={assembly.subject}
      open={true}
      onClose={onClose}
      maxWidth={900}
      className={styles.detailModal}
    >
      {/* Header con información básica */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.headerRow}>
            <span className={styles.label}>Tipo:</span>
            <span className={styles.value}>
              {TYPE_LABELS[assembly.type as keyof typeof TYPE_LABELS] ||
                assembly.type}
            </span>
          </div>
          <div className={styles.headerRow}>
            <span className={styles.label}>Modalidad:</span>
            <span className={styles.value}>
              {MODALITY_LABELS[
                assembly.modality as keyof typeof MODALITY_LABELS
              ] || assembly.modality}
            </span>
          </div>
          <div className={styles.headerRow}>
            <span className={styles.label}>Fecha:</span>
            <span className={styles.value}>
              {assembly.start_date}{" "}
              {assembly.start_time ? `a las ${assembly.start_time}` : ""}
            </span>
          </div>
        </div>

        {/* Acciones de estado */}
        <AssemblyStatusActions
          assembly={assembly}
          onStatusChange={handleAssemblyUpdate}
        />
      </div>

      {/* Stats rápidos */}
      {stats && (
        <div className={styles.quickStats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {stats.total_attendances || 0}
            </span>
            <span className={styles.statLabel}>Asistentes</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {stats.quorum?.quorum_percentage || 0}%
            </span>
            <span className={styles.statLabel}>Quórum</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.total_surveys || 0}</span>
            <span className={styles.statLabel}>Encuestas</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {stats.active_surveys || 0}
            </span>
            <span className={styles.statLabel}>Activas</span>
          </div>
        </div>
      )}

      {/* Tabs de navegación */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido según tab */}
      <div className={styles.tabContent}>
        {activeTab === "info" && (
          <div className={styles.infoContent}>
            <div className={styles.infoSection}>
              <h4>Descripción</h4>
              <p>{assembly.description || "Sin descripción"}</p>
            </div>

            {assembly.modality !== "I" && assembly.meeting_url && (
              <div className={styles.infoSection}>
                <h4>Enlace de reunión</h4>
                <a
                  href={assembly.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {assembly.meeting_url}
                </a>
              </div>
            )}

            {assembly.modality !== "V" && assembly.address && (
              <div className={styles.infoSection}>
                <h4>Dirección</h4>
                <p>{assembly.address}</p>
                {assembly.address_url && (
                  <a
                    href={assembly.address_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver en mapa
                  </a>
                )}
              </div>
            )}

            {assembly.files && assembly.files.length > 0 && (
              <div className={styles.infoSection}>
                <h4>Documentos adjuntos</h4>
                <ul className={styles.fileList}>
                  {assembly.files.map((file, index) => (
                    <li key={index}>
                      <a href={file} target="_blank" rel="noopener noreferrer">
                        Documento {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === "attendances" && (
          <AssemblyAttendanceList
            assemblyId={assembly.id}
            onAttendanceChange={refreshStats}
          />
        )}

        {activeTab === "surveys" && (
          <AssemblySurveyManager
            assembly={assembly}
            onSurveyChange={refreshStats}
          />
        )}

        {activeTab === "config" && (
          <AssemblyConfigForm
            assembly={assembly}
            onConfigChange={handleAssemblyUpdate}
          />
        )}

        {activeTab === "acta" && (
          <AssemblyActaManager
            assembly={assembly}
            onActaChange={handleAssemblyUpdate}
          />
        )}
      </div>
    </DataModal>
  );
};

export default AssemblyDetailModal;
