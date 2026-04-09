// src/modulos/Assemblies/components/AssemblyDetail/AssemblyDetail.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./AssemblyDetail.module.css";
import { useAssemblies } from "../../hooks/useAssemblies";
import {
  API_STATUS_LABELS,
  STATUS_STYLE,
  TYPE_LABELS,
  MODALITY_LABELS,
} from "../../config/assemblies.constants";
import {
  Assembly,
  AssemblySurvey,
  AssemblyStats,
} from "../../types/assemblies.types";
import {
  IconEdit,
  IconAdd,
  IconCirclePlay,
  IconTrash,
  IconArrowDown,
  IconArrowUp,
  IconArrowLeft,
} from "@/components/layout/icons/IconsBiblioteca";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import Card from "@/mk/v2/Components/ui/Card/Card";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import RenderForm from "../../RenderForm/RenderForm";

interface AssemblyDetailProps {
  id: string | number;
}

const AssemblyDetail: React.FC<AssemblyDetailProps> = ({ id }) => {
  const router = useRouter();
  const {
    fetchAssemblyDetail,
    fetchAssemblyStats,
    updateAssembly,
    execute,
    loading,
    error,
  } = useAssemblies();
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [stats, setStats] = useState<AssemblyStats | null>(null);

  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingFull, setIsEditingFull] = useState(false);

  // Accordion states
  const [showDetails, setShowDetails] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const loadAssembly = async () => {
    const data = await fetchAssemblyDetail(id);
    if (data) {
      setAssembly(data);
      const statsData = await fetchAssemblyStats(id);
      if (statsData) setStats(statsData);
    }
  };

  useEffect(() => {
    loadAssembly();
  }, [id, fetchAssemblyDetail, fetchAssemblyStats]);

  const handleEditDescription = () => {
    setTempDescription(assembly?.description || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!assembly) return;
    setIsSaving(true);
    const success = await updateAssembly(assembly.id, {
      description: tempDescription,
    });
    if (success) {
      setAssembly({ ...assembly, description: tempDescription });
      setIsEditingDescription(false);
    }
    setIsSaving(false);
  };

  if (loading && !assembly)
    return <div className={styles.container}>Cargando...</div>;
  if (error) return <div className={styles.container}>Error: {error}</div>;
  if (!assembly)
    return <div className={styles.container}>No se encontró la asamblea</div>;

  const statusStyle = STATUS_STYLE[assembly.status] || {
    color: "#fff",
    backgroundColor: "#333",
  };

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <span onClick={() => router.push("/assemblies")}>Asambleas</span>
        <span>{">"}</span>
        <span className={styles.active}>
          {TYPE_LABELS[assembly.type as any] || assembly.type}:{" "}
          {assembly?.subject || "Cargando..."}
        </span>
      </div>

      <div className={styles.layout}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* ASUNTO Card */}
          <Card
            title="ASUNTO"
            titleRight={
              <StatusBadge
                color={statusStyle.color}
                backgroundColor={statusStyle.backgroundColor}
                style={{ fontSize: 10 }}
                containerStyle={{ width: "auto" }}
              >
                {API_STATUS_LABELS[assembly.status] || assembly.status}
              </StatusBadge>
            }
            openable={false}
            variant="v2"
          >
            <h1 className={styles.mainSubject}>{assembly.subject}</h1>
            <span className={styles.typeLabel}>
              {TYPE_LABELS[assembly.type as any] || assembly.type}
            </span>
            <div className={styles.metricsGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Participación</span>
                <span className={styles.metricValue}>
                  {stats?.quorum?.attendees || assembly.attendances_count || 0}{" "}
                  residentes /{" "}
                  {stats?.quorum?.total_units || assembly.participation || "0"}{" "}
                  unidades
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Quórum</span>
                <span className={styles.metricValue}>
                  {stats?.quorum?.quorum_percentage || 0}% /{" "}
                  {assembly.quorum_required || 0}%
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Fecha de inicio</span>
                <span className={styles.metricValue}>
                  {getDateTimeStrMes(assembly.start_time)}
                </span>
              </div>
            </div>
          </Card>

          {/* DESCRIPCIÓN Card */}
          <Card
            title="DESCRIPCIÓN"
            titleRight={
              <button
                className={styles.editButton}
                onClick={handleEditDescription}
              >
                <IconEdit size={14} /> Editar
              </button>
            }
            openable={false}
            variant="v2"
          >
            <p className={styles.descriptionText}>
              {assembly.description || "Sin descripción proporcionada."}
            </p>
          </Card>

          {/* VOTACIONES Card */}
          <Card
            title="VOTACIONES"
            titleRight={
              <button className={styles.actionBtn}>
                <IconAdd size={14} /> Nueva pregunta
              </button>
            }
            openable={false}
            variant="v2"
          >
            {/* Simulated Voting Question based on image */}
            {1 == 1 ? (
              [1].map((survey: any) => (
                <div key={survey.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <h3 className={styles.votacionTitle}>Prueba prueba</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <IconCirclePlay
                        size={18}
                        color="#888"
                        style={{ cursor: "pointer" }}
                      />
                      <IconEdit
                        size={18}
                        color="#888"
                        style={{ cursor: "pointer" }}
                      />
                      <IconTrash
                        size={18}
                        color="#888"
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </div>
                  <div className={styles.votacionMeta}>
                    <span className={styles.votacionCount}>
                      0 votos en total
                    </span>
                    <span className={styles.votacionStatus}>Finalizada</span>
                  </div>

                  <div className={styles.optionItem}>
                    <div className={styles.optionHeader}>
                      <span>Sí estoy de acuerdo</span>
                      <span>68% (31 votos)</span>
                    </div>
                    <div className={styles.progressContainer}>
                      <div
                        className={styles.progressBar}
                        style={{ width: "68%" }}
                      ></div>
                    </div>
                  </div>

                  <div className={styles.optionItem}>
                    <div className={styles.optionHeader}>
                      <span>Voto nulo</span>
                      <span>24% (11 votos)</span>
                    </div>
                    <div className={styles.progressContainer}>
                      <div
                        className={styles.progressBar}
                        style={{ width: "24%", background: "#444" }}
                      ></div>
                    </div>
                  </div>

                  <div className={styles.optionItem}>
                    <div className={styles.optionHeader}>
                      <span>No estoy de acuerdo</span>
                      <span>8% (3 votos)</span>
                    </div>
                    <div className={styles.progressContainer}>
                      <div
                        className={styles.progressBar}
                        style={{ width: "8%", background: "#EF4444" }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{ padding: "20px", textAlign: "center", color: "#666" }}
              >
                No hay votaciones registradas.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          {/* DETALLES */}
          <Card
            title="DETALLES"
            titleRight={
              <button
                className={styles.actionBtn}
                onClick={() => setIsEditingFull(true)}
              >
                <IconEdit size={12} /> Editar
              </button>
            }
          >
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Inicio:</span>
              <span className={styles.detailValue}>
                {getDateTimeStrMes(assembly.start_time)}
              </span>
            </div>
            {assembly.end_time && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Finalización:</span>
                <span className={styles.detailValue}>
                  {getDateTimeStrMes(assembly.end_time)}
                </span>
              </div>
            )}
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Modalidad:</span>
              <span className={styles.detailValue}>
                {MODALITY_LABELS[assembly.modality as any] || assembly.modality}
              </span>
            </div>

            {["V", "H"].includes(assembly.modality as string) && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Reunión virtual:</span>
                <span className={styles.detailValue}>
                  {assembly.meeting_url ? (
                    <a
                      href={assembly.meeting_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Unirse a la reunión
                    </a>
                  ) : (
                    "No definido"
                  )}
                </span>
              </div>
            )}

            {["P", "H"].includes(assembly.modality as string) && (
              <>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dirección:</span>
                  <span className={styles.detailValue}>
                    {assembly.address || "No definida"}
                  </span>
                </div>
                {assembly.address_url && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Ubicación:</span>
                    <span className={styles.detailValue}>
                      <a
                        href={assembly.address_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        Ver en Google Maps
                      </a>
                    </span>
                  </div>
                )}
              </>
            )}

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Audiencia:</span>
              <span className={styles.detailValue}>
                {typeof assembly.target_audience === "string"
                  ? assembly.target_audience
                      .split(",")
                      .map((id) => {
                        const labels: any = {
                          owners: "Propietarios",
                          tenants: "Inquilinos",
                          owner_dependents: "Dependientes de prop.",
                          tenant_dependents: "Dependientes de inq.",
                        };
                        return labels[id] || id;
                      })
                      .join(", ")
                  : "Todos"}
              </span>
            </div>
          </Card>

          {/* DOCUMENTOS */}
          <Card
            title="DOCUMENTOS"
            titleRight={
              <button className={styles.actionBtn}>
                <IconAdd size={12} /> Subir
              </button>
            }
          >
            No hay documentos subidos.
          </Card>

          {/* PARTICIPANTES */}
          <Card
            title="PARTICIPANTES"
            titleRight={
              <button className={styles.actionBtn}>
                <IconAdd size={12} /> Registrar
              </button>
            }
          >
            No hay participantes registrados.
          </Card>
        </div>
      </div>

      <DataModal
        title="Editar Descripción"
        open={isEditingDescription}
        onClose={() => setIsEditingDescription(false)}
        onSave={handleSaveDescription}
        buttonText={isSaving ? "Guardando..." : "Guardar"}
        disabled={isSaving}
        maxWidth={800}
        style={{ height: "90vh", display: "flex", flexDirection: "column" }}
        className={styles.modalContent}
      >
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <TextArea
            name="description"
            label="Descripción de la Asamblea"
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            fullHeight={true}
            style={{ minHeight: "400px" }}
            placeholder="Escribe la descripción detallada aquí..."
            required={false}
          />
        </div>
      </DataModal>

      {isEditingFull && (
        <RenderForm
          open={isEditingFull}
          onClose={() => setIsEditingFull(false)}
          item={assembly}
          setItem={setAssembly}
          execute={execute}
          reLoad={loadAssembly}
        />
      )}
    </div>
  );
};

export default AssemblyDetail;
