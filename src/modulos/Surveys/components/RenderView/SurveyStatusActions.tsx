"use client";
import React, { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import ScheduleSurveyModal from "./ScheduleSurveyModal";

import useInstantMsg from "@/mk/hooks/useInstantMsg";

type StatusAction = {
  label: string;
  targetStatus: string;
  variant?: "primary" | "secondary" | "terciary" | "danger";
  /** If true, intercept click and show the ScheduleSurveyModal before calling API */
  needsDates?: boolean;
};

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  D: [
    { label: "Publicar ahora", targetStatus: "A", variant: "primary" },
    { label: "Programar", targetStatus: "S", variant: "secondary", needsDates: true },
  ],
  A: [
    { label: "Pausar", targetStatus: "P", variant: "secondary" },
    { label: "Cerrar encuesta", targetStatus: "C", variant: "danger" },
  ],
  P: [
    { label: "Reanudar", targetStatus: "A", variant: "primary" },
    { label: "Cerrar encuesta", targetStatus: "C", variant: "danger" },
  ],
  S: [
    { label: "Publicar ya", targetStatus: "A", variant: "primary" },
    { label: "Editar programación", targetStatus: "S", variant: "secondary", needsDates: true },
    { label: "Volver a borrador", targetStatus: "D", variant: "terciary" },
  ],
  C: [],
  X: [],
};

type Props = {
  surveyId: number;
  currentStatus: string;
  hasAnswers?: boolean;
  /** Current survey data to pre-fill dates in the modal */
  surveyData?: Record<string, any>;
  onStatusChanged: (updatedSurvey: any) => void;
  onDuplicate?: (newSurvey: any) => void;
};

export default function SurveyStatusActions({
  surveyId,
  currentStatus,
  surveyData,
  onStatusChanged,
  onDuplicate,
}: Props) {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const { notifySegmented } = useInstantMsg();
  const [loading, setLoading] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const actions = STATUS_ACTIONS[currentStatus] ?? [];

  const handleActionClick = (action: StatusAction) => {
    if (action.needsDates) {
      // Open the schedule modal and remember which status we want
      setPendingStatus(action.targetStatus);
      setScheduleModalOpen(true);
    } else {
      callChangeStatus(action.targetStatus);
    }
  };

  const callChangeStatus = async (
    targetStatus: string,
    scheduledAt?: string,
    expiresAt?: string | null
  ) => {
    setLoading(targetStatus);
    try {
      const payload: Record<string, any> = { status: targetStatus };
      if (scheduledAt) payload.scheduled_at = scheduledAt;
      if (expiresAt) payload.expires_at = expiresAt;

      const { data } = await execute(
        `/surveys/${surveyId}/status`,
        "PUT",
        payload,
        false,
        true
      );
      if (data?.success) {
        showToast(data.message || "Estado actualizado", "success");
        onStatusChanged(data.data);

        // Smart notify: resolveChannel picks the right channel automatically.
        // Single group → specific channel (e.g. "owners"). Multi-group → "all".
        // Result: exactly 1 DB write regardless of how many groups are targeted.
        if (targetStatus === "A") {
          notifySegmented("new-survey", {
            id: surveyId,
            title: surveyData?.title || "Nueva encuesta disponible",
            act: "new-survey",
            is_mandatory: surveyData?.is_mandatory === "Y" || surveyData?.is_mandatory === true,
          }, surveyData?.target_criteria);
        }
      }
    } catch (e: any) {
      showToast(e?.message || "Error al cambiar estado", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleScheduleConfirm = (scheduledAt: string, expiresAt: string | null) => {
    setScheduleModalOpen(false);
    if (pendingStatus) {
      callChangeStatus(pendingStatus, scheduledAt, expiresAt ?? undefined);
      setPendingStatus(null);
    }
  };

  const handleDuplicate = async () => {
    setLoading("duplicate");
    try {
      const { data } = await execute(
        `/surveys/${surveyId}/duplicate`,
        "POST",
        {},
        false,
        true
      );
      if (data?.success) {
        showToast("Encuesta duplicada como borrador", "success");
        onDuplicate?.(data.data);
      }
    } catch (e: any) {
      showToast("Error al duplicar la encuesta", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {actions.map((action) => (
          <Button
            key={`${action.targetStatus}-${action.label}`}
            variant={action.variant ?? "secondary"}
            small
            disabled={loading !== null}
            onClick={() => handleActionClick(action)}
          >
            {loading === action.targetStatus && !action.needsDates ? "..." : action.label}
          </Button>
        ))}
        <Button
          variant="terciary"
          small
          disabled={loading !== null}
          onClick={handleDuplicate}
        >
          {loading === "duplicate" ? "..." : "Duplicar"}
        </Button>
      </div>

      {/* Schedule modal — shown when Programar or Editar programación is clicked */}
      <ScheduleSurveyModal
        open={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setPendingStatus(null);
        }}
        initialScheduledAt={surveyData?.scheduled_at}
        initialExpiresAt={surveyData?.expires_at}
        onConfirm={handleScheduleConfirm}
        loading={loading !== null}
      />
    </>
  );
}
