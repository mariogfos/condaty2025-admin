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
import AssemblyManualVoteForm from "../AssemblyManualVoteForm/AssemblyManualVoteForm";
import AssemblyActaManager from "../AssemblyActaManager/AssemblyActaManager";
import VotersListModal from "@/modulos/Surveys/components/VotersListModal/VotersListModal";
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
    uploadActa,
    execute,
    loading,
    error,
  } = useAssemblies();
  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [stats, setStats] = useState<AssemblyStats | null>(null);

  const [isAttendanceListOpen, setIsAttendanceListOpen] = useState(false);
  const [isManualVoteOpen, setIsManualVoteOpen] = useState(false);
  const [votingForSurvey, setVotingForSurvey] = useState<any>(null);
  const [attendanceUpdated, setAttendanceUpdated] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState("");
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
  const [isEditingActa, setIsEditingActa] = useState(false);
  const [tempActa, setTempActa] = useState({ acta_file: [] as string[] });
  const [isSavingActa, setIsSavingActa] = useState(false);
  const [votersModal, setVotersModal] = useState<{
    open: boolean;
    soptionId: number | string;
    soptionText: string;
    totalVoters: number;
  } | null>(null);
  const { isMobile } = useScreenSize();
  const { showToast } = useAuth();
  const { notifySegmented, notifyAll } = useInstantMsg();

  // Accordion states
  const [showDetails, setShowDetails] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [showParticipants, setShowParticipants] = useState(isMobile);

  // Ordenamiento de votaciones: activas primero por published_at, luego por created_at
  const getSortedSurveys = (surveys: any[]) => {
    if (!surveys?.length) return [];
    return [...surveys].sort((a, b) => {
      const isActiveA = a.status === 'A';
      const isActiveB = b.status === 'A';
      // Si una está activa y otra no, la activa va primero
      if (isActiveA && !isActiveB) return -1;
      if (!isActiveA && isActiveB) return 1;
      // Ordenar activas por published_at descendente (última publicada primero)
      if (isActiveA && isActiveB) {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        return dateB - dateA;
      }
      // Ordenar inactivas por created_at descendente (última creada primero)
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

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
  const isFinished = assembly?.status === AssemblyStatus.Completed || assembly?.status === AssemblyStatus.Cancelled;

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

  const handleEditActa = () => {
    setTempActa({ acta_file: assembly?.acta_file ? [assembly.acta_file] : [] });
    setIsEditingActa(true);
  };

  const handleSaveActa = async () => {
    if (!assembly || tempActa.acta_file.length === 0) return;
    setIsSavingActa(true);
    const success = await uploadActa(assembly.id, tempActa.acta_file[0]);
    if (success) {
      setAssembly({
        ...assembly,
        acta_file: tempActa.acta_file[0],
        acta_uploaded_at: new Date().toISOString(),
      });
      setIsEditingActa(false);
      showToast("Acta subida correctamente", "success");
    } else {
      showToast("Error al subir el acta", "error");
    }
    setIsSavingActa(false);
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
    if (status === AssemblyStatus.Cancelled) statusLabel = "cancelar";

    if (
      !confirm(
        `¿Estás seguro de que deseas ${statusLabel} esta asamblea? Esta acción no se puede deshacer.`,
      )
    )
      return;
    setIsFinishing(true);
    try {
      // Si se cancela la asamblea, finalizar todas las votaciones activas primero
      if (status === AssemblyStatus.Cancelled && assembly.surveys) {
        const activeSurveys = assembly.surveys.filter(
          (s: any) => s.status === SurveyStatus.Active || s.status === SurveyStatus.Paused,
        );
        for (const survey of activeSurveys) {
          await execute(`/surveys/${survey.id}/status`, "PUT", {
            status: SurveyStatus.Closed,
          });
        }
      }

      const { data } = await execute(
        `/assemblies/${assembly.id}/status`,
        "PATCH",
        { status: status },
      );
      if (data?.success || (data && !data.error)) {
        statusLabel = "inicio";
        if (status === AssemblyStatus.Completed) statusLabel = "finalizó";
        if (status === AssemblyStatus.Cancelled) statusLabel = "canceló";
        showToast(`Asamblea ${statusLabel} correctamente`, "success");
        loadAssembly();
        // Notificar a todos (owners + admins) que la asamblea cambió de estado
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
                  <>
                    <Button
                      variant="danger"
                      small
                      onClick={() =>
                        handleFinishAssembly(AssemblyStatus.Cancelled)
                      }
                      disabled={isFinishing}
                    >
                      {isFinishing ? "Cancelando..." : "Cancelar"}
                    </Button>
                    <Button
                      variant="primary"
                      small
                      onClick={() =>
                        handleFinishAssembly(AssemblyStatus.Completed)
                      }
                      disabled={isFinishing}
                    >
                      {isFinishing ? "Finalizando..." : "Finalizar"}
                    </Button>
                  </>
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
                  de{" "}
                  {stats?.quorum?.total_units || assembly.participation || "0"}{" "}
                  unidades totales
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

          {/* ORDEN DEL DÍA Card */}
          <Card
            title="ORDEN DEL DÍA"
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
              {assembly.description || "Sin orden del día proporcionado."}
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
              getSortedSurveys(assembly.surveys).map((survey: any) => (
                <div key={survey.id} className={styles.votacionCard}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 8,
                    }}
                  >
                    <h3 className={styles.votacionTitle}>
                      {survey.squestions?.[0]?.question_text || survey.title}
                    </h3>
                    <div
                      style={{ display: "flex", gap: 12, alignItems: "center" }}
                    >
                      {/* Lifecycle Actions */}
                      {!isFinished && (
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
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                              }}
                            >
                              <Button
                                variant="terciary"
                                onClick={() => {
                                  setVotingForSurvey(survey);
                                  setIsManualVoteOpen(true);
                                }}
                                style={{
                                  height: "32px",
                                  padding: "0 10px",
                                  fontSize: "12px",
                                }}
                              >
                                Votar manualmente
                              </Button>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  marginLeft: "8px",
                                  borderLeft: "1px solid #e2e8f0",
                                  paddingLeft: "16px",
                                }}
                              >
                                <div
                                  style={{
                                    width: 12,
                                    height: 14,
                                    borderLeft: "3px solid var(--cWarning)",
                                    borderRight: "3px solid var(--cWarning)",
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
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Edit/Delete (Only if no votes) */}
                      {!isFinished &&
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
                    const abstention = q.abstention ?? null;
                    const countAsOption = abstention?.count_as_option === true;

                    // Denominador para porcentajes:
                    // count_as_option=true → total_expected (abstención forma parte del 100%)
                    // count_as_option=false o sin abstención → votos emitidos
                    const totalVotesRaw =
                      q.soptions?.reduce(
                        (acc: number, opt: any) => acc + (opt.votes || 0),
                        0,
                      ) || 0;

                    const denominator = countAsOption
                      ? (abstention?.total_expected ?? totalVotesRaw)
                      : totalVotesRaw;

                    const totalLabel = countAsOption
                      ? `${abstention?.total_voted ?? totalVotesRaw} votos válidos de ${abstention?.total_expected ?? 0} esperados`
                      : `${totalVotesRaw} ${totalVotesRaw === 1 ? "voto" : "votos"} en total`;

                    return (
                      <div key={q.id}>
                        <div className={styles.votacionMeta}>
                          <span className={styles.votacionCount}>
                            {totalLabel}
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

                        {/* Opciones de respuesta válidas */}
                        {q.soptions?.map((opt: any) => {
                          const votes = opt.votes || 0;
                          const percentage =
                            denominator > 0
                              ? Math.round((votes / denominator) * 100)
                              : 0;
                          const isNo = opt.option_text?.toLowerCase().includes("no");
                          const isNulo = opt.option_text?.toLowerCase().includes("nulo");
                          const barColor = isNo
                            ? "#EF4444"
                            : isNulo
                              ? "#444"
                              : "linear-gradient(90deg, #8b5cf6, #3b82f6)";

                          return (
                            <div key={opt.id} className={styles.optionItem}>
                              <div className={styles.optionHeader}>
                                <span>{opt.option_text}</span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <span>
                                    {percentage}% ({votes}{" "}
                                    {votes === 1 ? "voto" : "votos"})
                                  </span>
                                  {votes > 0 && (
                                    <button
                                      className={styles.verVotantesBtn}
                                      onClick={() => {
                                        setVotersModal({
                                          open: true,
                                          soptionId: opt.id,
                                          soptionText: opt.option_text || "",
                                          totalVoters: votes,
                                        });
                                      }}
                                    >
                                      ver
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className={styles.progressContainer}>
                                <div
                                  className={styles.progressBar}
                                  style={{ width: `${percentage}%`, background: barColor }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Barra de abstención — solo cuando count_as_option=true */}
                        {abstention && countAsOption && (
                          <div className={styles.optionItem}>
                            <div className={styles.optionHeader}>
                              <span style={{ color: "#f97316", fontWeight: 600 }}>
                                Abstenciones
                              </span>
                              <span style={{ color: "#f97316" }}>
                                {abstention.abstention_rate}% ({abstention.abstentions}{" "}
                                {abstention.abstentions === 1 ? "unidad" : "unidades"})
                              </span>
                            </div>
                            <div className={styles.progressContainer}>
                              <div
                                className={styles.progressBar}
                                style={{
                                  width: `${abstention.abstention_rate}%`,
                                  background: "linear-gradient(90deg, #f97316, #ef4444)",
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer informativo — solo cuando count_as_option=false */}
                        {abstention && !countAsOption && abstention.total_expected > 0 && (
                          <div className={styles.abstentionFooter}>
                            <span className={styles.abstentionFooterItem}>
                              ✔ Votos válidos:{" "}
                              <strong>{abstention.total_voted}</strong>{" "}
                              ({abstention.participation_rate}%)
                            </span>
                            <span className={styles.abstentionSeparator}>|</span>
                            <span
                              className={styles.abstentionFooterItem}
                              style={{ color: "#f97316" }}
                            >
                              Abstenciones:{" "}
                              <strong>{abstention.abstentions}</strong>{" "}
                              ({abstention.abstention_rate}%)
                            </span>
                          </div>
                        )}
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

          {/* ACTA */}
          <Card
            title="ACTA DE LA ASAMBLEA"
            titleRight={
              !isMobile && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditActa();
                  }}
                  disabled={!isFinished}
                  style={{ opacity: !isFinished ? 0.5 : 1 }}
                >
                  <IconAdd size={12} /> Subir
                </button>
              )
            }
          >
            <AssemblyActaManager assembly={assembly} />
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
                // P.23: Actualizar todo al cambiar asistencia (agrega o elimina)
                setAttendanceRefreshKey((prev) => prev + 1);
                loadAssembly();
              }}
            />
          </Card>
        </div>
      </div>

      <DataModal
        title="Editar Orden del día"
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
            label="Orden del día de la Asamblea"
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            fullHeight={true}
            style={{ minHeight: "400px" }}
            placeholder="Escribe el orden del día detallado aquí..."
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

      <DataModal
        title="Subir Acta de la Asamblea"
        open={isEditingActa}
        onClose={() => setIsEditingActa(false)}
        onSave={handleSaveActa}
        buttonText={isSavingActa ? "Subiendo..." : "Guardar acta"}
        disabled={isSavingActa}
        maxWidth={600}
      >
        {isEditingActa && (
          <div style={{ padding: "10px 0" }}>
            <p
              style={{
                fontSize: 14,
                color: "#888",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Sube el archivo final del acta de la asamblea. Este archivo estará
              disponible para consulta por los residentes.
            </p>
            <UploadFileV3
              formState={tempActa}
              setFormState={setTempActa}
              name="acta_file"
              mode="documents"
              maxMB={10}
              cant={1}
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
      <AssemblyManualVoteForm
        open={isManualVoteOpen}
        onClose={() => {
          setIsManualVoteOpen(false);
          setVotingForSurvey(null);
        }}
        assemblyId={id}
        survey={votingForSurvey}
        onSuccess={() => {
          loadAssembly();
        }}
      />

      {/* Modal para ver lista de votantes por opción */}
      {votersModal && (
        <VotersListModal
          open={votersModal.open}
          onClose={() => setVotersModal(null)}
          soptionId={votersModal.soptionId}
          soptionText={votersModal.soptionText}
          totalVoters={votersModal.totalVoters}
        />
      )}
    </div>
  );
};

export default AssemblyDetail;
