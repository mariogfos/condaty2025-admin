"use client";
import React, { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import ScheduleSurveyModal from "./ScheduleSurveyModal";

import useInstantMsg from "@/mk/hooks/useInstantMsg";
import { CSSProperties } from "react";

import { SurveyStatus } from "@/modulos/Surveys/types/surveys.types";

type StatusAction = {
  label: string;
  targetStatus: SurveyStatus;
  variant?: "primary" | "secondary" | "terciary" | "danger";
  /** If true, intercept click and show the ScheduleSurveyModal before calling API */
  needsDates?: boolean;
};

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  [SurveyStatus.Draft]: [
    {
      label: "Hacer visible",
      targetStatus: SurveyStatus.Voting,
      variant: "secondary",
    },
    {
      label: "Programar",
      targetStatus: SurveyStatus.Scheduled,
      variant: "secondary",
      needsDates: true,
    },
  ],
  [SurveyStatus.Voting]: [
    {
      label: "Volver a borrador",
      targetStatus: SurveyStatus.Draft,
      variant: "terciary",
    },
    {
      label: "Activar ahora",
      targetStatus: SurveyStatus.Active,
      variant: "primary",
    },
    {
      label: "Cancelar",
      targetStatus: SurveyStatus.Disabled,
      variant: "danger",
    },
  ],
  [SurveyStatus.Active]: [
    {
      label: "Pausar",
      targetStatus: SurveyStatus.Paused,
      variant: "secondary",
    },
    {
      label: "Cerrar encuesta",
      targetStatus: SurveyStatus.Closed,
      variant: "danger",
    },
    {
      label: "Cancelar",
      targetStatus: SurveyStatus.Disabled,
      variant: "danger",
    },
  ],
  [SurveyStatus.Paused]: [
    {
      label: "Reanudar",
      targetStatus: SurveyStatus.Active,
      variant: "primary",
    },
    {
      label: "Cerrar encuesta",
      targetStatus: SurveyStatus.Closed,
      variant: "danger",
    },
    {
      label: "Cancelar",
      targetStatus: SurveyStatus.Disabled,
      variant: "danger",
    },
  ],
  [SurveyStatus.Scheduled]: [
    {
      label: "Publicar ya",
      targetStatus: SurveyStatus.Active,
      variant: "primary",
    },
    {
      label: "Editar programación",
      targetStatus: SurveyStatus.Scheduled,
      variant: "secondary",
      needsDates: true,
    },
    {
      label: "Volver a borrador",
      targetStatus: SurveyStatus.Draft,
      variant: "terciary",
    },
  ],
  [SurveyStatus.Closed]: [],
  [SurveyStatus.Disabled]: [],
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
  const { notifySegmented, notifyAll } = useInstantMsg();
  const [loading, setLoading] = useState<string | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const actions = STATUS_ACTIONS[currentStatus] ?? [];

  const getActionButtonStyle = (
    variant: StatusAction["variant"],
  ): CSSProperties => {
    if (variant === "primary") {
      return {
        height: 34,
        padding: "6px 14px",
        fontSize: "12px",
        fontWeight: 600,
        borderRadius: 8,
        width: "auto",
        minWidth: 110,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      };
    }

    if (variant === "danger") {
      return {
        height: 34,
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: 500,
        borderRadius: 8,
        width: "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      };
    }

    return {
      height: 34,
      padding: "6px 12px",
      fontSize: "12px",
      fontWeight: 500,
      borderRadius: 8,
      width: "auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
    };
  };

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
    expiresAt?: string | null,
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
        true,
      );
      if (data?.success) {
        showToast(data.message || "Estado actualizado", "success");
        onStatusChanged(data.data);

        // Smart notify: resolveChannel picks the right channel automatically.
        const isResuming =
          currentStatus === SurveyStatus.Paused &&
          targetStatus === SurveyStatus.Active;

        if (targetStatus === SurveyStatus.Active && !isResuming) {
          notifyAll("new-survey", {
            id: surveyId,
            title: surveyData?.title || "Nueva encuesta disponible",
            act: "new-survey",
            is_mandatory:
              surveyData?.is_mandatory === "Y" ||
              surveyData?.is_mandatory === true,
          });
        } else {
          notifyAll("survey-status-change", {
            id: surveyId,
            status: targetStatus,
            title: surveyData?.title || "Actualización de encuesta",
            act: "survey-status-change",
            is_mandatory: false,
          });
        }
      }
    } catch (e: any) {
      showToast(e?.message || "Error al cambiar estado", "error");
    } finally {
      setLoading(null);
    }
  };

  const handleScheduleConfirm = (
    scheduledAt: string,
    expiresAt: string | null,
  ) => {
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
        true,
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
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {actions.map((action) => (
          <Button
            key={`${action.targetStatus}-${action.label}`}
            variant={action.variant ?? "secondary"}
            disabled={loading !== null}
            onClick={() => handleActionClick(action)}
            style={getActionButtonStyle(action.variant ?? "secondary")}
          >
            {loading === action.targetStatus && !action.needsDates
              ? "..."
              : action.label}
          </Button>
        ))}
        <Button
          variant="secondary"
          disabled={loading !== null}
          onClick={handleDuplicate}
          style={getActionButtonStyle("secondary")}
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
