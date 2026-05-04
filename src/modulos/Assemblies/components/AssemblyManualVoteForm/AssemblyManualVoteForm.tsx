"use client";

import { useState, useEffect } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import Input from "@/mk/components/forms/Input/Input";
import styles from "./AssemblyManualVoteForm.module.css";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { Avatar } from "@/mk/components/ui/Avatar/Avatar";
import { ROLE_LABELS } from "../../types/assemblies.types";
import {
  IconSearch,
  IconCheck,
  IconCircleCheck,
} from "@/components/layout/icons/IconsBiblioteca";

interface AssemblyManualVoteFormProps {
  open: boolean;
  onClose: () => void;
  assemblyId: string | number;
  survey: any;
  onSuccess?: () => void;
}

const AssemblyManualVoteForm: React.FC<AssemblyManualVoteFormProps> = ({
  open,
  onClose,
  assemblyId,
  survey,
  onSuccess,
}) => {
  const [search, setSearch] = useState("");
  const [attendees, setAttendees] = useState<any[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<any[]>([]);
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { execute: fetchAttendees } = useAxios();
  const { execute: saveVote } = useAxios();
  const { showToast } = useAuth();

  const loadAttendees = async () => {
    setIsLoading(true);
    try {
      const { data: response } = await fetchAttendees(
        `/assemblies/${assemblyId}/attendances`,
        "GET",
        {},
        false,
        true,
      );
      if (response?.data) {
        setAttendees(response.data || []);
        setFilteredAttendees(response.data || []);
      }
    } catch (error) {
      console.error("Error loading attendees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadAttendees();
      setSearch("");
      setSelectedAttendee(null);
      setSelectedOptionId(null);
    }
  }, [open, assemblyId]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredAttendees(attendees);
      return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = attendees.filter((a) => {
      const name = `${a.owner?.name} ${a.owner?.last_name || ""}`.toLowerCase();
      const unit = a.dpto?.nro || "";
      return name.includes(lowerSearch) || unit.includes(lowerSearch);
    });
    setFilteredAttendees(filtered);
  }, [search, attendees]);

  const handleVote = async () => {
    if (!selectedAttendee || !selectedOptionId) return;

    setIsSaving(true);
    try {
      const { data: response, error } = await saveVote(
        `/assemblies/${assemblyId}/surveys/${survey.id}/manual-vote`,
        "POST",
        {
          owner_id: selectedAttendee.owner_id,
          soption_id: selectedOptionId,
        },
      );

      if (response?.success) {
        showToast("Voto registrado correctamente", "success");
        onSuccess?.();
        onClose();
      } else {
        showToast(
          error?.data?.message ||
            response?.message ||
            "Error al registrar voto",
          "error",
        );
      }
    } catch (error) {
      console.error("Error saving vote:", error);
      showToast("Error crítico al registrar voto", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const question = survey?.squestions?.[0];

  return (
    <DataModal
      open={open}
      onClose={onClose}
      title="Registrar Voto Manual"
      buttonText=""
      buttonCancel=""
      maxWidth={550}
    >
      <div className={styles.container}>
        <div className={styles.surveyContext}>
          <p className={styles.surveyLabel}>Pregunta activa:</p>
          <h4 className={styles.surveyTitle}>{survey?.title}</h4>
        </div>

        <div className={styles.stepSection}>
          <label className={styles.sectionLabel}>
            1. Selecciona al participante
          </label>
          <div className={styles.searchBar}>
            <Input
              name="search"
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o unidad en asistentes..."
            />
          </div>

          <div className={styles.attendeesList}>
            {isLoading ? (
              <div className={styles.message}>Cargando asistentes...</div>
            ) : filteredAttendees.length > 0 ? (
              filteredAttendees.map((att: any) => (
                <div
                  key={att.id}
                  className={`${styles.attendeeItem} ${
                    selectedAttendee?.id === att.id ? styles.selected : ""
                  }`}
                  onClick={() => setSelectedAttendee(att)}
                >
                  <Avatar
                    src={att.owner?.url_avatar}
                    name={att.owner?.name}
                    w={36}
                    h={36}
                  />
                  <div className={styles.attendeeInfo}>
                    <p className={styles.attName}>
                      {att.owner?.name} {att.owner?.last_name || ""}
                    </p>
                    <p className={styles.attDetail}>
                      Unidad {att.dpto?.nro || "-"} |{" "}
                      {ROLE_LABELS[att.role] || att.role}
                    </p>
                  </div>
                  {selectedAttendee?.id === att.id && (
                    <IconCheck size={18} color="var(--cSuccess)" />
                  )}
                </div>
              ))
            ) : (
              <div className={styles.message}>
                {search
                  ? "No se encontraron coincidencias."
                  : "No hay asistentes registrados."}
              </div>
            )}
          </div>
        </div>

        {selectedAttendee && (
          <div className={styles.stepSection}>
            <label className={styles.sectionLabel}>
              2. Selecciona la opción de voto
            </label>
            <div className={styles.optionsGrid}>
              {question?.soptions?.map((opt: any) => (
                <div
                  key={opt.id}
                  className={`${styles.optionCard} ${
                    selectedOptionId === opt.id ? styles.optionActive : ""
                  }`}
                  onClick={() => setSelectedOptionId(opt.id)}
                >
                  <span className={styles.optionText}>{opt.option_text}</span>
                  {selectedOptionId === opt.id && (
                    <IconCircleCheck size={20} color="var(--cSuccess)" />
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 24,
              }}
            >
              <Button
                variant="primary"
                onClick={handleVote}
                disabled={isSaving || !selectedOptionId}
                style={{
                  width: "100%",
                  height: 48,
                  backgroundColor: "var(--cAccent)",
                  borderColor: "var(--cAccent)",
                  color: "var(--cBlack)",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                {isSaving
                  ? "Registrando voto..."
                  : `Confirmar voto de ${selectedAttendee.owner?.name}`}
              </Button>

              <Button
                variant="cancel"
                onClick={onClose}
                disabled={isSaving}
                style={{ width: "100%", height: 48, fontSize: "16px" }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default AssemblyManualVoteForm;
