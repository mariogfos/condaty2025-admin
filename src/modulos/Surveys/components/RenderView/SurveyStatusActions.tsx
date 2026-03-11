"use client";
import React, { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";

type StatusAction = {
  label: string;
  targetStatus: string;
  variant?: "primary" | "secondary" | "terciary" | "danger";
};

const STATUS_ACTIONS: Record<string, StatusAction[]> = {
  D: [
    { label: "Publicar ahora", targetStatus: "A", variant: "primary" },
    { label: "Programar", targetStatus: "S", variant: "secondary" },
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
    { label: "Volver a borrador", targetStatus: "D", variant: "secondary" },
  ],
  C: [],
  X: [],
};

type Props = {
  surveyId: number;
  currentStatus: string;
  hasAnswers?: boolean;
  onStatusChanged: (updatedSurvey: any) => void;
  onDuplicate?: () => void;
};

export default function SurveyStatusActions({
  surveyId,
  currentStatus,
  onStatusChanged,
  onDuplicate,
}: Props) {
  const { execute } = useAxios();
  const { showToast } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const actions = STATUS_ACTIONS[currentStatus] ?? [];

  const handleChangeStatus = async (targetStatus: string) => {
    setLoading(targetStatus);
    try {
      const { data } = await execute(
        `/surveys/${surveyId}/status`,
        "PUT",
        { status: targetStatus },
        false,
        true
      );
      if (data?.success) {
        showToast(data.message || "Estado actualizado", "success");
        onStatusChanged(data.data);
      }
    } catch (e: any) {
      showToast(e?.message || "Error al cambiar estado", "error");
    } finally {
      setLoading(null);
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
        onDuplicate?.();
      }
    } catch (e: any) {
      showToast("Error al duplicar la encuesta", "error");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {actions.map((action) => (
        <Button
          key={action.targetStatus}
          variant={action.variant ?? "secondary"}
          small
          disabled={loading !== null}
          onClick={() => handleChangeStatus(action.targetStatus)}
        >
          {loading === action.targetStatus ? "..." : action.label}
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
  );
}
