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
  AssemblyStatus,
} from "../../types/assemblies.types";
import { SurveyStatus } from "@/modulos/Surveys/types/surveys.types";
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
import AssemblyAttendanceForm from "../AssemblyAttendanceForm/AssemblyAttendanceForm";
import AssemblyAttendanceList from "../AssemblyAttendanceList/AssemblyAttendanceList";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useScreenSize } from "@/mk/hooks/useScreenSize";
import useInstantMsg from "@/mk/hooks/useInstantMsg";
import { useEvent } from "@/mk/hooks/useEvents";
import Button from "@/mk/components/forms/Button/Button";

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
  const [isRegisteringParticipant, setIsRegisteringParticipant] =
    useState(false);
  const [surveyToEdit, setSurveyToEdit] = useState<any>(null);
  const [surveyAction, setSurveyAction] = useState<"add" | "edit">("add");
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);
  const { isMobile } = useScreenSize();
  const { showToast } = useAuth();
  const { notifySegmented, notifyAll } = useInstantMsg();

  // Accordion states
  const [showDetails, setShowDetails] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [showParticipants, setShowParticipants] = useState(isMobile);

  useEffect(() => {
    if (isMobile) {
      setShowParticipants(true);
      setShowDetails(true);
    }
  }, [isMobile]);

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
  }, [id]);

  useEvent("assembly:status", loadAssembly);
  useEvent("attendance-registered", () => {
    setAttendanceRefreshKey((prev) => prev + 1);
    loadAssembly();
  });
  useEvent("survey-stats", loadAssembly);

  const canEditBasicInfo = assembly?.status === AssemblyStatus.Scheduled;
  const isFinished = assembly?.status === AssemblyStatus.Completed;

  const handleEditDescription = () => {
    if (!canEditBasicInfo) return;
    setTempDescription(assembly?.description || "");
    setIsEditingDescription(true);
  };

  const handleSaveDescription = async () => {
    if (!assembly || !canEditBasicInfo) return;
    setIsSaving(true);
    const success = await updateAssembly(assembly.id, {
      description: tempDescription,
    });
    if (success) {
      setAssembly({ ...assembly, description: tempDescription });
      setIsEditingDescription(false);
      showToast("Descripción actualizada con éxito", "success");
    } else {
      showToast("No se pudo actualizar la descripción", "error");
    }
    setIsSaving(false);
  };

  const handleEditDocs = () => {
    if (isFinished) return;
    setTempDocs({ files: normalizeUrls(assembly?.files) });
    setIsEditingDocs(true);
  };

  const handleSaveDocs = async () => {
    if (!assembly || isFinished) return;
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
    if (isFinished) return;
    try {
      const { data } = await execute(`/surveys/${surveyId}/status`, "PUT", {
        status,
      });
      if (data?.success || (data && !data.error)) {
        showToast("Estado actualizado correctamente", "success");
        loadAssembly();

        const survey = assembly?.surveys?.find((s: any) => s.id == surveyId);
        const oldStatus = survey?.status;
        const isResuming =
          oldStatus === SurveyStatus.Paused && status === SurveyStatus.Active;

        if (status === SurveyStatus.Active && !isResuming) {
          notifyAll("new-survey", {
            id: surveyId,
            title: survey?.title || "Nueva votación activa",
            act: "new-survey",
            source: "assembly",
            is_mandatory:
              survey?.is_mandatory === "Y" || survey?.is_mandatory === true,
          });
        } else {
          notifyAll("survey-status-change", {
            id: surveyId,
            status: status,
            title: survey?.title || "Actualización de votación",
            act: "survey-status-change",
            source: "assembly",
            is_mandatory: false,
          });
        }
      }
    } catch (e) {
      showToast("Error al actualizar el estado", "error");
    }
  };

  const handleEditSurvey = (survey: any) => {
    if (isFinished) return;
    setSurveyToEdit(survey);
    setSurveyAction("edit");
    setIsCreatingVoting(true);
  };

  const handleDeleteSurvey = async (surveyId: number | string) => {
    if (isFinished) return;
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

  const [isFinishing, setIsFinishing] = React.useState(false);

  const handleFinishAssembly = async (status: AssemblyStatus) => {
    if (!assembly) return;
    if (isFinished || assembly?.status == status) return;
    let statusLabel = "iniciar ahora";
    if (status === AssemblyStatus.Completed) statusLabel = "finalizar";

    if (
      !confirm(
        `¿Estás seguro de que deseas ${statusLabel} esta asamblea? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setIsFinishing(true);
    try {
      const { data } = await execute(
        `/assemblies/${assembly.id}/status`,
        "PATCH",
        { status: status },
      );
      if (data?.success || (data && !data.error)) {
        statusLabel = "inicio";
        if (status === AssemblyStatus.Completed) statusLabel = "finalizó";
        showToast(`Asamblea ${statusLabel} correctamente`, "success");
        loadAssembly();
        // Notificar a todos (owners + admins) que la asamblea finalizó
        notifyAll("assembly-status-change", {
          id: assembly.id,
          status: status,
          subject: assembly.subject,
          act: "assembly-status-change",
          source: "assembly",
        });
      }
    } catch (e: any) {
      showToast(
        e?.response?.data?.message || "Error al finalizar la asamblea",
        "error",
      );
    } finally {
      setIsFinishing(false);
    }
  };

  if (loading && !assembly) {
    return <div className={styles.container}>Cargando...</div>;
  }

  if (!assembly) {
    if (error) return <div className={styles.container}>Error: {error}</div>;
    return <div className={styles.container}>No se encontró la asamblea</div>;
  }

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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {assembly.status === AssemblyStatus.InProgress && (
                  <Button
                    variant="danger"
                    small
                    onClick={() =>
                      handleFinishAssembly(AssemblyStatus.Completed)
                    }
                    disabled={isFinishing}
                    // style={{
                    //   padding: "4px 12px",
                    //   fontSize: 11,
                    //   fontWeight: 600,
                    //   borderRadius: 6,
                    //   border: "none",
                    //   cursor: isFinishing ? "not-allowed" : "pointer",
                    //   backgroundColor: "#dc2626",
                    //   color: "#fff",
                    //   opacity: isFinishing ? 0.6 : 1,
                    //   whiteSpace: "nowrap",
                    // }}
                  >
                    {isFinishing ? "Finalizando..." : "Finalizar"}
                  </Button>
                )}
                {assembly.status === AssemblyStatus.Scheduled && (
                  <Button
                    variant="primary"
                    small
                    onClick={() =>
                      handleFinishAssembly(AssemblyStatus.InProgress)
                    }
                    disabled={isFinishing}
                  >
                    {isFinishing ? "Iniciando..." : "Iniciar Ahora"}
                  </Button>
                )}
                <StatusBadge
                  color={statusStyle.color}
                  backgroundColor={statusStyle.backgroundColor}
                  style={{ fontSize: 10 }}
                  containerStyle={{ width: "auto" }}
                >
                  {API_STATUS_LABELS[assembly.status] || assembly.status}
                </StatusBadge>
              </div>
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
              !isMobile && (
                <button
                  className={styles.editButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDescription();
                  }}
                  disabled={!canEditBasicInfo}
                  style={{ opacity: canEditBasicInfo ? 1 : 0.5 }}
                >
                  <IconEdit size={14} /> Editar
                </button>
              )
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
              !isMobile && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSurveyToEdit(null);
                    setSurveyAction("add");
                    setIsCreatingVoting(true);
                  }}
                  disabled={isFinished}
                  style={{ opacity: isFinished ? 0.5 : 1 }}
                >
                  <IconAdd size={14} /> Nueva pregunta
                </button>
              )
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
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      {/* Lifecycle Actions */}
                      {!isFinished && !isMobile && (
                        <>
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
                                  width: 14,
                                  height: 16,
                                  borderLeft: "4px solid var(--cWarning)",
                                  borderRight: "4px solid var(--cWarning)",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleStatusChange(survey.id, "P")
                                }
                                title="Pausar"
                              />
                              <IconCircleCheck
                                size={22}
                                color="var(--cError)"
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  handleStatusChange(survey.id, "C")
                                }
                                title="Finalizar"
                              />
                            </>
                          )}
                        </>
                      )}

                      {/* Edit/Delete (Only if no votes) */}
                      {!isFinished &&
                        !isMobile &&
                        !survey.squestions?.[0]?.soptions?.some(
                          (o: any) => (o.votes || 0) > 0,
                        ) &&
                        survey.status !== "C" && (
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
              !isMobile && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingFull(true);
                  }}
                  disabled={!canEditBasicInfo}
                  style={{ opacity: canEditBasicInfo ? 1 : 0.5 }}
                >
                  <IconEdit size={12} /> Editar
                </button>
              )
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
                {MODALITY_LABELS[assembly.modality as any] ||
                  "" ||
                  "No definida"}
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
                          owner_homeowner: "Propietarios",
                          owner_tenant: "Inquilinos",
                          dependent_of_homeowner: "Dependientes de prop.",
                          dependent_of_tenant: "Dependientes de inq.",
                        };
                        return labels[id.trim()] || "";
                      })
                      .filter(Boolean)
                      .join(", ")
                  : "Todos"}
              </span>
            </div>
          </Card>

          {/* DOCUMENTOS */}
          <Card
            title="DOCUMENTOS"
            titleRight={
              !isMobile && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDocs();
                  }}
                  disabled={isFinished}
                  style={{ opacity: isFinished ? 0.5 : 1 }}
                >
                  <IconAdd size={12} /> Subir
                </button>
              )
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
              <button
                className={styles.actionBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRegisteringParticipant(true);
                }}
                disabled={isFinished}
                style={{ opacity: isFinished ? 0.5 : 1 }}
              >
                <IconAdd size={12} /> Registrar
              </button>
            }
          >
            <AssemblyAttendanceList
              assemblyId={String(assembly.id)}
              refreshKey={attendanceRefreshKey}
              readOnly={isFinished}
              onAttendanceChange={() => {
                // P.23: Actualizar stats al eliminar asistente sin recargar toda la página
                setAttendanceRefreshKey((prev) => prev + 1);
                fetchAssemblyStats(id).then((s) => {
                  if (s) setStats(s);
                });
              }}
            />
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

      <AssemblyAttendanceForm
        open={isRegisteringParticipant}
        onClose={() => setIsRegisteringParticipant(false)}
        assemblyId={String(id)}
        assemblyModality={assembly?.modality as "P" | "V" | "H"}
        onSuccess={() => {
          setAttendanceRefreshKey((prev) => prev + 1);
          // Opcionalmente recargar stats si es necesario
          loadAssembly();
        }}
      />
    </div>
  );
};

export default AssemblyDetail;
