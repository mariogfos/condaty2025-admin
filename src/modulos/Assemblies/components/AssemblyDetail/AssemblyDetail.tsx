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
  IconCircleCheck,
  IconTrash,
  IconArrowDown,
  IconArrowUp,
  IconArrowLeft,
  IconDownload,
  IconDOC,
} from "@/components/layout/icons/IconsBiblioteca";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import { getDateStrMes, getDateTimeStrMes } from "@/mk/utils/date";
import Card from "@/mk/v2/Components/ui/Card/Card";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import RenderForm from "../../RenderForm/RenderForm";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import AssemblySurveyForm from "@/modulos/Surveys/components/AssemblySurveyForm/AssemblySurveyForm";
import { useAuth } from "@/mk/contexts/AuthProvider";

const normalizeUrls = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.url) return item.url;
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") return [value];
  return [];
};

const getFilenameFromUrl = (url: string, fallback: string) => {
  const base = url?.split("?")[0]?.split("/").pop() || "";
  return base || fallback;
};

const buildFileObjects = (urls: string[], prefix: string) => {
  return (urls || []).map((url, index) => ({
    name: getFilenameFromUrl(url, `${prefix}_${index + 1}`),
    url,
  }));
};

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
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [tempDocs, setTempDocs] = useState({ files: [] as string[] });
  const [isSavingDocs, setIsSavingDocs] = useState(false);
  const [isCreatingVoting, setIsCreatingVoting] = useState(false);
  const [surveyToEdit, setSurveyToEdit] = useState<any>(null);
  const [surveyAction, setSurveyAction] = useState<"add" | "edit">("add");

  const { showToast } = useAuth();

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

  const handleEditDocs = () => {
    setTempDocs({ files: normalizeUrls(assembly?.files) });
    setIsEditingDocs(true);
  };

  const handleSaveDocs = async () => {
    if (!assembly) return;
    setIsSavingDocs(true);
    const payload = {
      files: buildFileObjects(tempDocs.files, "documento_asamblea"),
    };
    const success = await updateAssembly(assembly.id, payload);
    if (success) {
      setAssembly({ ...assembly, files: payload.files as any });
      setIsEditingDocs(false);
      showToast("Documentos actualizados con éxito", "success");
    } else {
      showToast("No se pudieron actualizar los documentos", "error");
    }
    setIsSavingDocs(false);
  };

  const handleStatusChange = async (
    surveyId: number | string,
    status: string,
  ) => {
    try {
      const { data } = await execute(`/surveys/${surveyId}/status`, "PUT", {
        status,
      });
      if (data?.success || (data && !data.error)) {
        showToast("Estado actualizado correctamente", "success");
        loadAssembly();
      }
    } catch (e) {
      showToast("Error al actualizar el estado", "error");
    }
  };

  const handleEditSurvey = (survey: any) => {
    setSurveyToEdit(survey);
    setSurveyAction("edit");
    setIsCreatingVoting(true);
  };

  const handleDeleteSurvey = async (surveyId: number | string) => {
    if (!confirm("¿Estás seguro de eliminar esta votación?")) return;
    try {
      const { data } = await execute(`/surveys/${surveyId}`, "DELETE");
      if (data?.success || (data && !data.error)) {
        showToast("Votación eliminada correctamente", "success");
        loadAssembly();
      }
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || "Error al eliminar la votación",
        "error",
      );
    }
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditDescription();
                }}
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
              <button
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSurveyToEdit(null);
                  setSurveyAction("add");
                  setIsCreatingVoting(true);
                }}
              >
                <IconAdd size={14} /> Nueva pregunta
              </button>
            }
            openable={false}
            variant="v2"
          >
            {/* Dynamic Voting Questions */}
            {assembly.surveys && assembly.surveys.length > 0 ? (
              assembly.surveys.map((survey: any) => (
                <div key={survey.id} className={styles.votacionCard}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <h3 className={styles.votacionTitle}>{survey.title}</h3>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {/* Lifecycle Actions */}
                      {(survey.status === "D" || survey.status === "P") && (
                        <IconCirclePlay
                          size={22}
                          color="var(--cSuccess)"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleStatusChange(survey.id, "A")}
                          title="Activar"
                        />
                      )}
                      
                      {survey.status === "A" && (
                        <>
                          <div 
                             style={{ 
                               width: 14, height: 16, 
                               borderLeft: '4px solid var(--cWarning)', 
                               borderRight: '4px solid var(--cWarning)',
                               cursor: 'pointer'
                             }}
                             onClick={() => handleStatusChange(survey.id, "P")}
                             title="Pausar"
                          />
                          <IconCircleCheck
                            size={22}
                            color="var(--cError)"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleStatusChange(survey.id, "C")}
                            title="Finalizar"
                          />
                        </>
                      )}

                      {/* Edit/Delete (Only if no votes) */}
                      {(!survey.squestions?.[0]?.soptions?.some((o: any) => (o.votes || 0) > 0) && survey.status !== 'C') && (
                        <>
                          <IconEdit
                            size={18}
                            color="#888"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleEditSurvey(survey)}
                            title="Editar"
                          />
                          <IconTrash
                            size={18}
                            color="var(--cError)"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleDeleteSurvey(survey.id)}
                            title="Eliminar"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {survey.squestions?.map((q: any) => {
                    const totalVotes =
                      q.soptions?.reduce(
                        (acc: number, opt: any) => acc + (opt.votes || 0),
                        0,
                      ) || 0;

                    return (
                      <div key={q.id}>
                        <div className={styles.votacionMeta}>
                          <span className={styles.votacionCount}>
                            {totalVotes} {totalVotes === 1 ? "voto" : "votos"}{" "}
                            en total
                          </span>
                          <span className={styles.votacionStatus}>
                            {survey.status === "C"
                              ? "Finalizada"
                              : survey.status === "A"
                                ? "Activa"
                                : survey.status === "P" 
                                  ? "Pausada"
                                  : "Borrador"}
                          </span>
                        </div>

                        {q.soptions?.map((opt: any) => {
                          const votes = opt.votes || 0;
                          const percentage =
                            totalVotes > 0
                              ? Math.round((votes / totalVotes) * 100)
                              : 0;

                          return (
                            <div key={opt.id} className={styles.optionItem}>
                              <div className={styles.optionHeader}>
                                <span>{opt.option_text}</span>
                                <span>
                                  {percentage}% ({votes}{" "}
                                  {votes === 1 ? "voto" : "votos"})
                                </span>
                              </div>
                              <div className={styles.progressContainer}>
                                <div
                                  className={styles.progressBar}
                                  style={{
                                    width: `${percentage}%`,
                                    background: opt.option_text
                                      .toLowerCase()
                                      .includes("no")
                                      ? "#EF4444"
                                      : opt.option_text
                                            .toLowerCase()
                                            .includes("nulo")
                                        ? "#444"
                                        : "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                                  }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingFull(true);
                }}
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
              <button
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditDocs();
                }}
              >
                <IconAdd size={12} /> Subir
              </button>
            }
          >
            <div className={styles.docList}>
              {assembly.files && assembly.files.length > 0 ? (
                assembly.files.map((file: any, index: number) => (
                  <a
                    key={index}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.docItem}
                  >
                    <div className={styles.docInfo}>
                      <IconDOC size={18} color="var(--cAccent)" />
                      <span className={styles.docName}>
                        {file.name || `Documento ${index + 1}`}
                      </span>
                    </div>
                    <div className={styles.docDownload}>
                      <IconDownload size={16} />
                    </div>
                  </a>
                ))
              ) : (
                <div style={{ padding: "10px 0", color: "#666", fontSize: 13 }}>
                  No hay documentos subidos.
                </div>
              )}
            </div>
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

      <DataModal
        title="Actualizar Documentos"
        open={isEditingDocs}
        onClose={() => setIsEditingDocs(false)}
        onSave={handleSaveDocs}
        buttonText={isSavingDocs ? "Guardando..." : "Guardar cambios"}
        disabled={isSavingDocs}
        maxWidth={600}
      >
        {isEditingDocs && (
          <div style={{ padding: "10px 0" }}>
            <p
              style={{
                fontSize: 14,
                color: "#888",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Sube o elimina documentos adjuntos para esta asamblea. Los cambios
              se aplicarán inmediatamente al guardar.
            </p>
            <UploadFileV3
              formState={tempDocs}
              setFormState={setTempDocs}
              name="files"
              mode="all"
              maxMB={5}
            />
          </div>
        )}
      </DataModal>

      <AssemblySurveyForm
        open={isCreatingVoting}
        onClose={() => {
          setIsCreatingVoting(false);
          setSurveyToEdit(null);
        }}
        assemblyId={id}
        execute={execute}
        onSuccess={loadAssembly}
        editItem={surveyToEdit}
        action={surveyAction}
      />
    </div>
  );
};

export default AssemblyDetail;
