"use client";

import { useState } from "react";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./AssemblySurveyManager.module.css";
import { Assembly, AssemblySurvey } from "../../types/assemblies.types";
import useAxios from "@/mk/hooks/useAxios";

interface AssemblySurveyManagerProps {
  assembly: Assembly;
  onSurveyChange?: () => void;
}

const AssemblySurveyManager: React.FC<AssemblySurveyManagerProps> = ({
  assembly,
  onSurveyChange,
}) => {
  const [surveys, setSurveys] = useState<AssemblySurvey[]>(assembly.surveys || []);
  const [isLoading, setIsLoading] = useState(false);
  const { execute: fetchSurveys, loading: fetching } = useAxios();
  const { execute: attachSurvey, loading: attaching } = useAxios();
  const { execute: detachSurvey, loading: detaching } = useAxios();

  // Cargar encuestas de la asamblea
  const loadSurveys = async () => {
    setIsLoading(true);
    try {
      const response = await fetchSurveys(`/assemblies/${assembly.id}/surveys`, "GET", {}, false, true);
      if (response?.data) {
        setSurveys(response.data);
      }
    } catch (error) {
      console.error("Error loading surveys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Por ahora mostrar las encuestas asociadas
  // En una versión completa, se podría agregar un modal para buscar y agregar encuestas

  const handleDetachSurvey = async (surveyId: number) => {
    if (detaching) return;
    
    try {
      await detachSurvey(`/assemblies/${assembly.id}/surveys/${surveyId}`, "DELETE", {}, false, true);
      setSurveys(surveys.filter(s => s.id !== surveyId));
      onSurveyChange?.();
    } catch (error) {
      console.error("Error detaching survey:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      D: { label: "Borrador", className: styles.draft },
      S: { label: "Programada", className: styles.scheduled },
      A: { label: "Activa", className: styles.active },
      P: { label: "Pausada", className: styles.paused },
      C: { label: "Cerrada", className: styles.closed },
      X: { label: "Deshabilitada", className: styles.disabled },
    };
    
    const config = statusConfig[status] || { label: status, className: "" };
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Encuestas de la asamblea</h3>
        <span className={styles.count}>{surveys.length} encuestas</span>
      </div>

      {isLoading || fetching ? (
        <div className={styles.loading}>Cargando encuestas...</div>
      ) : surveys.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay encuestas asociadas a esta asamblea.</p>
          <p className={styles.hint}>
            Las encuestas se pueden crear y asociar desde el detalle de la asamblea.
          </p>
        </div>
      ) : (
        <div className={styles.surveyList}>
          {surveys.map((survey) => (
            <div key={survey.id} className={styles.surveyItem}>
              <div className={styles.surveyInfo}>
                <span className={styles.surveyTitle}>{survey.title}</span>
                {getStatusBadge(survey.status)}
              </div>
              <div className={styles.surveyActions}>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => handleDetachSurvey(survey.id)}
                  disabled={detaching}
                >
                  Desasociar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.info}>
        <p>
          <strong>Nota:</strong> Las encuestas de asamblea son votaciones con una sola pregunta.
          Para crear una nueva encuesta, ve a la sección de Encuestas y selecciona "Votación de asamblea".
        </p>
      </div>
    </div>
  );
};

export default AssemblySurveyManager;