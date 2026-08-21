"use client";
import React, { useState, useEffect } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Input from "@/mk/components/forms/Input/Input";
import styles from "../../Surveys.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  initialScheduledAt?: string | null;
  initialExpiresAt?: string | null;
  onConfirm: (scheduledAt: string, expiresAt: string | null) => void;
  loading?: boolean;
};

export default function ScheduleSurveyModal({
  open,
  onClose,
  initialScheduledAt,
  initialExpiresAt,
  onConfirm,
  loading,
}: Props) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [errors, setErrors] = useState<{
    scheduledAt?: string;
    expiresAt?: string;
  }>({});

  // Pre-fill dates converting API datetime to input[type=datetime-local] format
  useEffect(() => {
    if (open) {
      setScheduledAt(toInputFormat(initialScheduledAt));
      setExpiresAt(toInputFormat(initialExpiresAt));
      setErrors({});
    }
  }, [open, initialScheduledAt, initialExpiresAt]);

  const toInputFormat = (val?: string | null): string => {
    if (!val) return "";
    // datetime-local expects YYYY-MM-DDTHH:MM
    return val.replace(" ", "T").slice(0, 16);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!scheduledAt) errs.scheduledAt = "La fecha de inicio es obligatoria";
    if (scheduledAt && expiresAt && scheduledAt >= expiresAt) {
      errs.expiresAt = "La fecha fin debe ser posterior a la de inicio";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    onConfirm(scheduledAt, expiresAt || null);
  };

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Programar encuesta"
      buttonText={loading ? "Guardando..." : "Confirmar"}
      buttonCancel="Cancelar"
      onSave={handleConfirm}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "8px 0",
        }}
      >
        <p className={styles.subtitle} style={{ margin: 0 }}>
          Define cuándo se publicará y, opcionalmente, cuándo cerrará la
          encuesta.
        </p>

        <div>
          <label
            className={styles.subtitle}
            style={{ display: "block", marginBottom: 6, fontSize: "0.85rem" }}
          >
            Fecha y hora de inicio *
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#d7fff005",
              border: errors.scheduledAt
                ? "1px solid var(--cError)"
                : "1px solid #d7fff014",
              borderRadius: "var(--bRadius)",
              color: "var(--cWhite)",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />
          {errors.scheduledAt && (
            <p
              style={{
                color: "var(--cError)",
                fontSize: "0.78rem",
                marginTop: 4,
              }}
            >
              {errors.scheduledAt}
            </p>
          )}
        </div>

        <div>
          <label
            className={styles.subtitle}
            style={{ display: "block", marginBottom: 6, fontSize: "0.85rem" }}
          >
            Fecha y hora de cierre{" "}
            <span style={{ opacity: 0.6 }}>(opcional)</span>
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#d7fff005",
              border: errors.expiresAt
                ? "1px solid var(--cError)"
                : "1px solid #d7fff014",
              borderRadius: "var(--bRadius)",
              color: "var(--cWhite)",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />
          {errors.expiresAt && (
            <p
              style={{
                color: "var(--cError)",
                fontSize: "0.78rem",
                marginTop: 4,
              }}
            >
              {errors.expiresAt}
            </p>
          )}
        </div>
      </div>
    </DataModal>
  );
}
