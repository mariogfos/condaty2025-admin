"use client";
import React, { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { getDateStrMes } from "@/mk/utils/date";
import { formatNumber } from "@/mk/utils/numbers";
import styles from "../../Surveys.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { SURVEY_STATUSES } from "../../config/surveys.constants";
import SurveyStatusActions from "./SurveyStatusActions";
import { SurveyDashboard } from "../SurveyDashboard/SurveyDashboard";

const STATUS_COLOR: Record<string, string> = {
  A: "var(--cSuccess)",
  P: "var(--cWarning)",
  S: "var(--cPrimary)",
  D: "var(--cWhiteV2)",
  C: "var(--cError)",
  X: "var(--cError)",
};

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        padding: "14px 16px",
        background: "linear-gradient(150deg, #d7fff008, #d7fff002)",
        borderRadius: 10,
        textAlign: "left",
        border: "1px solid #d7fff014",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <p
        style={{
          margin: 0,
          color: "var(--cWhiteV3)",
          fontSize: "var(--sS)",
          fontWeight: 500,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: 0,
          color: "var(--cPrimary)",
          fontSize: "var(--sXl)",
          fontWeight: 700,
        }}
      >
        {value}
      </p>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administradores",
  directive: "Directivos",

  // Roles de propietarios/residentes
  owner_homeowner: "Propietarios",
  owner_homeowner_resident: "Propietarios residentes",
  owner_homeowner_non_resident: "Propietarios no residentes",
  owner_tenant: "Inquilinos",
  resident: "Residentes",

  // Dependientes
  owner_dependiente: "Dependientes",
  dependent_of_homeowner: "Dependientes de propietarios",
  dependent_of_tenant: "Dependientes de inquilininos",

  // Staff
  guard: "Guardias",
  guard_supervisor: "Supervisor de guardias",
};

function Chip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "8px 12px",
        background: "#d7fff005",
        border: "1px solid #d7fff014",
        borderRadius: 12,
        fontSize: "0.85rem",
        color: "var(--cWhiteV1)",
        fontWeight: 400,
      }}
    >
      {label}
    </span>
  );
}

function SegmentationSummary({
  criteria,
  lTypeUnit = [],
}: {
  criteria: any;
  lTypeUnit: any;
}) {
  const roles = criteria?.roles ?? {};
  const activeRoles = Object.entries(roles)
    .filter(([, v]) => v === "1" || v === 1 || v === true)
    .map(([k]) => ROLE_LABELS[k] ?? k);

  const unitTypes: string[] = Array.isArray(criteria?.unit_types)
    ? criteria.unit_types.map(
        (t: string) => "Tipo: " + lTypeUnit.find((x: any) => x.id == t)?.name,
      )
    : [];

  const flags: string[] = [];
  if (criteria?.only_arrears) flags.push("Solo en mora");
  if (criteria?.only_current) flags.push("Solo al día");
  if (criteria?.vote_per_unit) flags.push("Un voto por unidad");
  if (criteria?.only_inhabited_units) flags.push("Solo unidades habitadas");

  const all = [...activeRoles, ...unitTypes, ...flags];
  if (!all.length) return null;

  return (
    <div
      style={{
        padding: "2px 4px",
      }}
    >
      <p
        style={{
          margin: "0 0 8px",
          fontSize: "var(--sS)",
          color: "var(--cWhiteV3)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Segmentación de audiencia
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {all.map((label, i) => (
          <Chip key={i} label={label} />
        ))}
      </div>
    </div>
  );
}

const RenderView = (props: {
  open: boolean;
  onClose: any;
  item: Record<string, any>;
  onEdit?: (item: any) => void;
  reLoad?: () => void;
  onCloseView?: () => void;
  extraData?: Record<string, any>;
}) => {
  const { showToast } = useAuth();
  const { execute } = useAxios();
  // Optimistic initial state from the list row — filled in after DET loads
  const [surveyData, setSurveyData] = useState<any>(props.item);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resolved numbers — only trusted after detailsLoaded = true
  const [audience, setAudience] = useState<number>(
    props.item?.estimated_audience ?? 0,
  );
  const [realResponses, setRealResponses] = useState<number>(
    props.item?.real_responses_count ?? 0,
  );
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState<any>({});
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!props.open || !props.item?.id) return;

    // Only reset detailed status if current survey changes
    if (surveyData?.id !== props.item.id) {
      setSurveyData(props.item);
      setDetailsLoaded(false);
      setStats(null);
    }

    setAudience(props.item?.estimated_audience ?? 0);
    setRealResponses(props.item?.real_responses_count ?? 0);
    loadData(props.item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, props.item?.id, filters]);

  const loadData = async (id: number) => {
    setDetailLoading(true);
    setStatsLoading(true);
    try {
      // Fetch Basic Details
      const detailRes = await execute(
        "/surveys",
        "GET",
        { fullType: "DET", searchBy: id },
        false,
        true,
      );
      if (detailRes.data?.success) {
        const det = detailRes.data.data;
        if (det.survey) setSurveyData(det.survey);
        setAudience(det.estimated_audience ?? 0);
        setRealResponses(det.real_responses_count ?? 0);
        setDetailsLoaded(true);
      }

      // Fetch Advanced Stats
      const statsRes = await execute(
        "/surveys/results",
        "GET",
        { survey_id: id, ...filters },
        false,
        true,
      );
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error("Error loading survey data:", err);
      showToast("Error al obtener detalle de la encuesta", "error");
    } finally {
      setDetailLoading(false);
      setStatsLoading(false);
    }
  };

  const participation =
    audience > 0 ? Math.round((realResponses / audience) * 100) : 0;
  // Only show stats AFTER details loaded to avoid flash of "no answers"
  const hasAnswers = detailsLoaded && realResponses > 0;
  const statusColor = STATUS_COLOR[surveyData?.status] ?? "var(--cWhiteV1)";

  const handleStatusChanged = (updated: any) => {
    setSurveyData((prev: any) => ({ ...prev, ...updated }));
    props.reLoad?.();
  };

  const handleOnDuplicate = (newSurvey: any) => {
    props.reLoad?.();
    props.onCloseView?.();
    if (newSurvey) {
      setTimeout(() => {
        props.onEdit?.(newSurvey);
      }, 100);
    }
  };

  return (
    <DataModal
      open={props.open}
      onClose={props.onClose}
      title="Detalle de la encuesta"
      buttonText=""
      buttonCancel=""
      maxWidth="95vw"
      style={{ width: "95vw", maxWidth: "1200px" }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "2px 0 4px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #d7fff014",
              background: "linear-gradient(150deg, #d7fff009, #d7fff002)",
            }}
          >
            <div style={{ flex: 1 }}>
              <p
                style={{
                  margin: 0,
                  color: "var(--cWhite)",
                  fontSize: "var(--sL)",
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                {surveyData?.title || surveyData?.name || "—"}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {surveyData?.status && (
                  <span
                    style={{
                      fontSize: "var(--sS)",
                      fontWeight: 600,
                      color: statusColor,
                      border: `1px solid ${statusColor}`,
                      borderRadius: 999,
                      padding: "2px 10px",
                    }}
                  >
                    {surveyData.status_label ||
                      SURVEY_STATUSES[surveyData.status]}
                  </span>
                )}
                {surveyData?.is_mandatory === true ||
                surveyData?.is_mandatory === "Y" ? (
                  <span
                    style={{ fontSize: "0.75rem", color: "var(--cWhiteV1)" }}
                  >
                    • Obligatoria
                  </span>
                ) : null}
              </div>
            </div>

            {surveyData?.id && (
              <SurveyStatusActions
                surveyId={surveyData.id}
                currentStatus={surveyData.status}
                hasAnswers={hasAnswers}
                surveyData={surveyData}
                onStatusChanged={handleStatusChanged}
                onDuplicate={handleOnDuplicate}
              />
            )}
          </div>

          {surveyData?.description && (
            <p
              style={{
                color: "var(--cWhiteV1)",
                fontSize: "var(--sS)",
                lineHeight: 1.4,
                margin: "0 4px",
              }}
            >
              {surveyData.description}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {(surveyData?.created_at ||
            surveyData?.expires_at ||
            surveyData?.scheduled_at) && (
            <div
              style={{
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                background: "linear-gradient(150deg, #d7fff008, #d7fff002)",
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d7fff014",
              }}
            >
              {surveyData?.created_at && (
                <div>
                  <p className={styles.subtitle}>Creada</p>
                  <p
                    style={{
                      color: "var(--cWhiteV1)",
                      fontSize: "var(--sM)",
                      margin: 0,
                    }}
                  >
                    {getDateStrMes(surveyData.created_at)} por{" "}
                    {surveyData.created_by_name}
                  </p>
                </div>
              )}
              {surveyData?.scheduled_at && (
                <div>
                  <p className={styles.subtitle}>Programada</p>
                  <p
                    style={{
                      color: "var(--cWhiteV1)",
                      fontSize: "var(--sM)",
                      margin: 0,
                    }}
                  >
                    {getDateStrMes(surveyData.scheduled_at)}
                  </p>
                </div>
              )}
              {surveyData?.expires_at && (
                <div>
                  <p className={styles.subtitle}>Vence</p>
                  <p
                    style={{
                      color: "var(--cWhiteV1)",
                      fontSize: "var(--sM)",
                      margin: 0,
                    }}
                  >
                    {getDateStrMes(surveyData.expires_at)}
                  </p>
                </div>
              )}
            </div>
          )}

          {detailsLoaded && surveyData?.target_criteria && (
            <div
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #d7fff014",
                background: "linear-gradient(150deg, #d7fff008, #d7fff002)",
              }}
            >
              <SegmentationSummary
                criteria={surveyData.target_criteria}
                lTypeUnit={props.extraData?.unit_types}
              />
            </div>
          )}
        </div>

        {/* {detailsLoaded && (
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            }}
          >
            <MetricCard
              label="Participantes2"
              value={`${formatNumber(realResponses || 0, 0)} / ${formatNumber(audience || 0, 0)}`}
            />
            <MetricCard
              label="Tasa de participación"
              value={`${participation}%`}
            />
            <MetricCard label="Representatividad" value={`${participation}%`} />
            <MetricCard label="Tiempo promedio" value="N/A" />
          </div>
        )} */}

        {detailsLoaded && stats && (
          <SurveyDashboard
            stats={stats}
            filters={filters}
            onFilterChange={setFilters}
          />
        )}

        {detailsLoaded && !hasAnswers && (
          <div
            style={{
              borderTop: "1px solid #d7fff014",
              paddingTop: 16,
              textAlign: "center",
            }}
          >
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
