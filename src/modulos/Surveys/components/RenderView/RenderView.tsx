"use client";
import React, { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateStrMes } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import styles from "../../Surveys.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { getStatusLabel } from "../../config/surveys.constants";
import SurveyStatusActions from "./SurveyStatusActions";
import SurveyStatsView from "./SurveyStatsView";

const STATUS_COLOR: Record<string, string> = {
  A: "var(--cSuccess, #10b981)",
  P: "var(--cWarning, #f59e0b)",
  S: "var(--cInfo, #3b82f6)",
  D: "var(--cWhiteV1, #a7a7a7)",
  C: "var(--cError, #ef4444)",
  X: "var(--cError, #ef4444)",
};

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 100,
        padding: "12px 16px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: "var(--bRadius)",
        textAlign: "center",
      }}
    >
      <p className={styles.subtitle} style={{ marginBottom: 4 }}>{label}</p>
      <p className={styles.title} style={{ fontSize: "1.25rem", marginBottom: 0 }}>{value}</p>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administradores",
  directive: "Directivos",
  owner_titular: "Residentes titulares",
  owner_homeowner: "Propietarios",
  owner_dependiente: "Dependientes",
  guard: "Guardias",
  guard_supervisor: "Supervisor de guardia",
};

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        background: "rgba(99,102,241,0.15)",
        border: "1px solid rgba(99,102,241,0.4)",
        borderRadius: 20,
        fontSize: "0.78rem",
        color: "var(--cWhiteV1)",
      }}
    >
      {label}
    </span>
  );
}

function SegmentationSummary({ criteria, lTypeUnit=[] }: { criteria: any, lTypeUnit: any }) {
  const roles = criteria?.roles ?? {};
  const activeRoles = Object.entries(roles)
    .filter(([, v]) => v === "1" || v === 1 || v === true)
    .map(([k]) => ROLE_LABELS[k] ?? k);

  const unitTypes: string[] = Array.isArray(criteria?.unit_types)
    ? criteria.unit_types.map((t: string) => 'Tipo: '+lTypeUnit.find((x: any) => x.id == t)?.name)
    : [];

  const flags: string[] = [];
  if (criteria?.only_arrears) flags.push("Solo en mora");
  if (criteria?.vote_per_unit) flags.push("Un voto por unidad");
  if (criteria?.only_inhabited_units) flags.push("Solo unidades habitadas");

  const all = [...activeRoles, ...unitTypes, ...flags];
  if (!all.length) return null;

  return (
    <div
      style={{
        padding: "12px 16px",
        background: "rgba(255,255,255,0.04)",
        borderRadius: "var(--bRadius)",
        borderLeft: "3px solid rgba(99,102,241,0.5)",
      }}
    >
      <p className={styles.subtitle} style={{ marginBottom: 8, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Segmentación de audiencia
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {all.map((label, i) => <Chip key={i} label={label} />)}
      </div>
    </div>
  );
}


const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onEdit?: Function;
  reLoad?: Function;
  extraData?: Record<string, any>;
}) => {
  const { showToast } = useAuth();
  const { execute } = useAxios();
    // Optimistic initial state from the list row — filled in after DET loads
  const [surveyData, setSurveyData] = useState<any>(props.item.survey);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resolved numbers — only trusted after detailsLoaded = true
  const [audience, setAudience] = useState<number>(props.item?.estimated_audience ?? 0);
  const [realResponses, setRealResponses] = useState<number>(props.item?.real_responses_count ?? 0);

  useEffect(() => {
    if (!props.open || !props.item?.survey?.id) return;
    // Reset on new survey
    setSurveyData(props.item.survey);
    setDetailsLoaded(false);
    setAudience(props.item?.estimated_audience ?? 0);
    setRealResponses(props.item?.real_responses_count ?? 0);
    fetchDetails(props.item.survey.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.item?.survey?.id]);

  const fetchDetails = async (id: number) => {
    setDetailLoading(true);
    try {
      const { data } = await execute("/surveys", "GET", {
        fullType: "DET",
        searchBy: id,
      },false,true);
      if (data?.data) {
        const det = data.data;
        if (det.survey) setSurveyData(det.survey);
        setAudience(det.estimated_audience ?? 0);
        setRealResponses(det.real_responses_count ?? 0);
        setDetailsLoaded(true);
      }
    } catch {
      showToast("Error al obtener detalle de la encuesta", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const participation = audience > 0 ? Math.round((realResponses / audience) * 100) : 0;
  // Only show stats AFTER details loaded to avoid flash of "no answers"
  const hasAnswers = detailsLoaded && realResponses > 0;
  const statusColor = STATUS_COLOR[surveyData?.status] ?? "var(--cWhiteV1)";

  const handleStatusChanged = (updated: any) => {
    setSurveyData((prev: any) => ({ ...prev, ...updated }));
    props.reLoad?.();
  };

  return (
    <DataModal
      open={props.open}
      onClose={props.onClose}
      title="Detalle de la encuesta"
      buttonText=""
      buttonCancel=""
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "4px 0" }}>
        {/* Header: Title + Status + Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p className={styles.title} style={{ fontSize: "1.15rem", marginBottom: 4, marginTop: 0 }}>
                {surveyData?.title || surveyData?.name || "—"}
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {surveyData?.status && (
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: statusColor,
                      border: `1px solid ${statusColor}`,
                      borderRadius: 4,
                      padding: "2px 8px",
                    }}
                  >
                    {surveyData.status_label || getStatusLabel(surveyData.status)}
                  </span>
                )}
                {surveyData?.is_mandatory === true || surveyData?.is_mandatory === "Y" ? (
                  <span style={{ fontSize: "0.75rem", color: "var(--cWhiteV1)" }}>• Obligatoria</span>
                ) : null}
              </div>
            </div>

            {/* Action buttons */}
            {surveyData?.id && (
              <SurveyStatusActions
                surveyId={surveyData.id}
                currentStatus={surveyData.status}
                hasAnswers={hasAnswers}
                surveyData={surveyData}
                onStatusChanged={handleStatusChanged}
                onDuplicate={() => props.reLoad?.()}
              />
            )}
          </div>

          {surveyData?.description && (
            <p style={{ color: "var(--cWhiteV1)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
              {surveyData.description}
            </p>
          )}
        </div>

        {/* Metrics Row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MetricCard label="Audiencia estimada" value={formatNumber(audience, 0)} />
          <MetricCard label="Participantes" value={formatNumber(realResponses, 0)} />
          <MetricCard label="Participación" value={`${participation}%`} />
        </div>

        {/* Dates */}
        {(surveyData?.created_at || surveyData?.expires_at || surveyData?.scheduled_at) && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {surveyData?.created_at && (
              <div>
                <p className={styles.subtitle}>Creada</p>
                <p style={{ color: "var(--cWhiteV1)", fontSize: "0.875rem", margin: 0 }}>
                  {getDateStrMes(surveyData.created_at)} por {surveyData.created_by_name}
                </p>
              </div>
            )}
            
            {surveyData?.scheduled_at && (
              <div>
                <p className={styles.subtitle}>Programada para</p>
                <p style={{ color: "var(--cWhiteV1)", fontSize: "0.875rem", margin: 0 }}>
                  {getDateStrMes(surveyData.scheduled_at)}
                </p>
              </div>
            )}
            {surveyData?.published_at && (
              <div>
                <p className={styles.subtitle}>Publicada</p>
                <p style={{ color: "var(--cWhiteV1)", fontSize: "0.875rem", margin: 0 }}>
                  {getDateStrMes(surveyData.published_at)}
                </p>
              </div>
            )}
            {surveyData?.expires_at && (
              <div>
                <p className={styles.subtitle}>Vence</p>
                <p style={{ color: "var(--cWhiteV1)", fontSize: "0.875rem", margin: 0 }}>
                  {getDateStrMes(surveyData.expires_at)}
                </p>
              </div>
            )}
            {surveyData?.status === "C" && (
              <div>
                <p className={styles.subtitle}>Cerrada</p>
                <p style={{ color: "var(--cWhiteV1)", fontSize: "0.875rem", margin: 0 }}>
                  {getDateStrMes(surveyData.closed_at || surveyData.expires_at)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Segmentation Criteria */}
        {detailsLoaded && surveyData?.target_criteria && (
          <SegmentationSummary criteria={surveyData.target_criteria} lTypeUnit={props.extraData?.unit_types}/>
        )}

        {/* Loading indicator while DET loads */}
        {detailLoading && (
          <p className={styles.subtitle} style={{ textAlign: "center", fontSize: "0.8rem", margin: 0 }}>
            Cargando detalles completos...
          </p>
        )}


        {/* Statistics — only shown after details loaded and has answers */}
        {detailsLoaded && hasAnswers && surveyData?.squestions?.length > 0 && (
          <div>
            <div style={{ borderTop: "1px solid var(--borderV1)", paddingTop: 20, marginBottom: 16 }}>
              <p className={styles.title} style={{ fontSize: "1rem", marginBottom: 4 }}>
                Estadísticas de respuestas
              </p>
              <p className={styles.subtitle} style={{ fontSize: "0.8rem" }}>
                Resultados globales de todos los participantes
              </p>
            </div>
            <SurveyStatsView
              squestions={surveyData.squestions}
              totalParticipants={realResponses}
            />
          </div>
        )}

        {detailsLoaded && !hasAnswers && (
          <div style={{ borderTop: "1px solid var(--borderV1)", paddingTop: 16, textAlign: "center" }}>
            <p className={styles.subtitle}>
              Aún no hay respuestas registradas para esta encuesta.
            </p>
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default RenderView;
