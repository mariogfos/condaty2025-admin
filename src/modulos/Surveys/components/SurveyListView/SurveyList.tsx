"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import useAxios from "@/mk/hooks/useAxios";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./SurveyList.module.css";

interface SurveyListProps {
  activeTab: string;
  onView: (survey: any) => void;
  onAnswer: (survey: any) => void;
  onCountsChange: (counts: { P: number; R: number; E: number }) => void;
}

const SurveyList: React.FC<SurveyListProps> = ({
  activeTab,
  onView,
  onAnswer,
  onCountsChange,
}) => {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const countsRef = useRef({ P: 0, R: 0, E: 0 });

  const { execute: executeSurveys, loaded: loadedSurveys } = useAxios(
    "/surveys",
    "GET",
    {},
    true
  );

  const { execute: executeCounts, loaded: loadedCounts } = useAxios(
    "/surveys/my-counts",
    "GET",
    {},
    true
  );

  const loadingOverall = !loadedSurveys || !loadedCounts;

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch surveys
    const surveyPayload = {
      filterBy: activeTab,
      fullType: 'L',
    };
    
    const surveyResponse = await executeSurveys('/surveys', 'GET', surveyPayload);
    
    if (surveyResponse?.data?.success) {
      setSurveys(surveyResponse.data.data?.data || []);
    }

    // Fetch counts
    const countsResponse = await executeCounts('/surveys/my-counts', 'GET', {});
    
    if (countsResponse?.data?.success) {
      const counts = countsResponse.data.data || {};
      const newCounts = {
        P: counts.pending || 0,
        R: counts.responded || 0,
        E: counts.expired || 0,
      };
      countsRef.current = newCounts;
      onCountsChange(newCounts);
    }

    setLoading(false);
  }, [activeTab, executeSurveys, executeCounts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusBadge = (survey: any) => {
    if (survey.has_responded) {
      return <span className={styles.badgeSuccess}>✓ Respondida</span>;
    }
    if (survey.status === 'C') {
      return <span className={styles.badgeDefault}>Cerrada</span>;
    }
    return <span className={styles.badgeActive}>Activa</span>;
  };

  const canAnswer = (survey: any) => {
    return survey.can_respond && !survey.has_responded && survey.status === 'A';
  };

  if (loadingOverall) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando encuestas...</p>
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>No hay encuestas {
          activeTab === 'P' ? 'pendientes' : 
          activeTab === 'R' ? 'respondidas' : 
          'en el historial'
        }</p>
        <p className={styles.emptyDescription}>
          {activeTab === 'P' 
            ? 'No tienes encuestas pendientes por responder.'
            : activeTab === 'R'
            ? 'Las encuestas que respondas aparecerán aquí.'
            : 'Las encuestas cerradas aparecerán aquí.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {surveys.map((survey) => (
        <div key={survey.id} className={styles.item}>
          <div className={styles.itemHeader}>
            <h3 className={styles.itemTitle}>{survey.title}</h3>
            {getStatusBadge(survey)}
          </div>
          
          {survey.description && (
            <p className={styles.itemDescription}>{survey.description}</p>
          )}
          
          <div className={styles.itemMeta}>
            <span>{survey.questions_count} pregunta{survey.questions_count !== 1 ? 's' : ''}</span>
            {survey.expires_at && (
              <span>Vence: {new Date(survey.expires_at).toLocaleDateString('es-BO')}</span>
            )}
            {survey.is_mandatory && (
              <span className={styles.mandatory}>Obligatoria</span>
            )}
          </div>
          
          <div className={styles.itemActions}>
            <Button
              variant="secondary"
              onClick={() => onView(survey)}
            >
              Ver detalle
            </Button>
            
            {canAnswer(survey) && (
              <Button onClick={() => onAnswer(survey)}>
                Responder
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SurveyList;
