"use client";
import React, { useEffect, useState } from 'react';
import { Card } from '@/mk/components/ui/Card/Card';
import TagLabel from '@/mk/components/ui/TagLabel/TagLabel';
import { SurveyCard } from './SurveyCard';
import { SurveyAnswerForm } from './SurveyAnswerForm';
import { SurveyDetail } from '../types/mySurveys.types';
import { useMySurveys } from '../hooks/useMySurveys';
import styles from './MySurveyList.module.css';

interface MySurveyListProps {
  dptoId?: string;
}

export const MySurveyList: React.FC<MySurveyListProps> = ({ dptoId }) => {
  const {
    counts,
    surveys,
    loading,
    error,
    activeTab,
    setActiveTab,
    fetchSurveys,
    fetchSurveyDetail,
    submitAnswers,
    fetchCounts,
  } = useMySurveys();

  const [selectedSurvey, setSelectedSurvey] = useState<SurveyDetail | null>(null);
  const [answerMode, setAnswerMode] = useState(false);

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchSurveys(activeTab, dptoId);
  }, [activeTab, dptoId]);

  const handleRespond = async (surveyId: string) => {
    const detail = await fetchSurveyDetail(surveyId);
    if (detail) {
      setSelectedSurvey(detail);
      setAnswerMode(true);
    }
  };

  const handleView = async (surveyId: string) => {
    const detail = await fetchSurveyDetail(surveyId);
    if (detail) {
      setSelectedSurvey(detail);
      setAnswerMode(false);
    }
  };

  const handleSubmitAnswers = async (answers: any[]) => {
    if (!selectedSurvey || !dptoId) return;
    
    const success = await submitAnswers(selectedSurvey.id, dptoId, answers);
    if (success) {
      setSelectedSurvey(null);
      setAnswerMode(false);
      fetchSurveys(activeTab, dptoId);
      fetchCounts();
    }
  };

  // Render survey detail or form
  if (selectedSurvey) {
    return (
      <SurveyAnswerForm
        survey={selectedSurvey}
        onSubmit={handleSubmitAnswers}
        onCancel={() => {
          setSelectedSurvey(null);
          setAnswerMode(false);
        }}
      />
    );
  }

  const tabConfig = {
    P: { label: 'Pendientes', count: counts?.pending || 0 },
    R: { label: 'Respondidas', count: counts?.responded || 0 },
    E: { label: 'Historial', count: counts?.expired || 0 },
  };

  const renderEmpty = (tab: string) => (
    <Card className={styles.emptyState}>
      <div className={styles.emptyContent}>
        {tab === 'P' && <span className={styles.emptyIcon}>📋</span>}
        {tab === 'R' && <span className={styles.emptyIcon}>✅</span>}
        {tab === 'E' && <span className={styles.emptyIcon}>📜</span>}
        
        <p className={styles.emptyTitle}>
          {tab === 'P' ? 'No hay encuestas pendientes' : 
           tab === 'R' ? 'Aún no has respondido ninguna encuesta' : 
           'No hay encuestas en tu historial'}
        </p>
        <p className={styles.emptyDescription}>
          {tab === 'P' ? 'No tienes encuestas pendientes por responder.' :
           tab === 'R' ? 'Las encuestas que respondas aparecerán aquí.' :
           'Las encuestas cerradas aparecerán aquí.'}
        </p>
      </div>
    </Card>
  );

  const renderLoading = () => (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner} />
      <p>Cargando encuestas...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mis Encuestas</h2>
      </div>

      {error && (
        <Card className={styles.errorCard}>
          <TagLabel type="error">{error}</TagLabel>
        </Card>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {(Object.entries(tabConfig) as [string, typeof tabConfig.P][]).map(([key, { label, count }]) => (
          <button
            key={key}
            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(key as any)}
          >
            <span>{label}</span>
            {count > 0 && <span className={styles.tabBadge}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          renderLoading()
        ) : surveys.length === 0 ? (
          renderEmpty(activeTab)
        ) : (
          <div className={styles.surveyGrid}>
            {surveys.map(survey => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onRespond={() => handleRespond(survey.id)}
                onView={() => handleView(survey.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
