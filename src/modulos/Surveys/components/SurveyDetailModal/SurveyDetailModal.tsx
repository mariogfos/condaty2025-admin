import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./SurveyDetailModal.module.css";
import { useMySurveys } from "../../hooks/useMySurveys";
import SurveyStatsView from "../RenderView/SurveyStatsView";

interface SurveyDetailModalProps {
  survey: any;
  onClose: () => void;
  onAnswer: () => void;
}

const SurveyDetailModal: React.FC<SurveyDetailModalProps> = ({
  survey,
  onClose,
  onAnswer,
}) => {
  const [surveyDetail, setSurveyDetail] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const { fetchSurveyDetail, fetchResults, loading: hookLoading } = useMySurveys();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const detail = await fetchSurveyDetail(survey.id);
      if (detail) {
        setSurveyDetail(detail);
        // If already responded or closed/expired, fetch results
        if (survey.has_responded || survey.status === 'C' || survey.status === 'X') {
          const res = await fetchResults(survey.id);
          setResults(res);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [survey.id, survey.has_responded, survey.status, fetchSurveyDetail, fetchResults]);

  const canAnswer = surveyDetail?.can_respond && !survey.has_responded && survey.status === 'A';

  return (
    <DataModal
      open={true}
      onClose={onClose}
      title={survey.title}
      style={{ width: '80%' }}
    >
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando detalle...</p>
        </div>
      ) : (
        <div className={styles.content}>
          {surveyDetail?.description && (
            <p className={styles.description}>{surveyDetail.description}</p>
          )}
          
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{surveyDetail?.questions_count || 0}</span>
              <span className={styles.statLabel}>Preguntas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{results?.survey_info?.total_participants ?? surveyDetail?.estimated_audience ?? 0}</span>
              <span className={styles.statLabel}>Participantes</span>
            </div>
            {results?.survey_info?.global_score > 0 && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{results.survey_info.global_score}</span>
                <span className={styles.statLabel}>Puntaje Global</span>
              </div>
            )}
          </div>

          {results ? (
            <div className={styles.resultsContainer}>
              <h4 className={styles.questionsTitle}>Resultados y tus respuestas</h4>
              <SurveyStatsView 
                squestions={results.questions} 
                totalParticipants={results.survey_info?.total_participants || 0} 
              />
            </div>
          ) : (
            <div className={styles.questions}>
              <h4 className={styles.questionsTitle}>Preguntas de la encuesta</h4>
              {surveyDetail?.squestions?.map((question: any, index: number) => (
                <div key={question.id} className={styles.question}>
                  <p className={styles.questionText}>
                    {index + 1}. {question.question_text}
                    {question.is_required && <span className={styles.required}>*</span>}
                  </p>
                  {question.description && (
                    <p className={styles.questionDescription}>{question.description}</p>
                  )}
                  <p className={styles.questionType}>
                    Tipo: {
                      question.type === 'S' ? 'Opción única' :
                      question.type === 'M' ? 'Opción múltiple' :
                      question.type === 'E' ? 'Escala' :
                      'Texto'
                    }
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className={styles.actions}>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            
            {canAnswer && (
              <Button onClick={onAnswer}>
                Responder encuesta
              </Button>
            )}
          </div>
        </div>
      )}
    </DataModal>
  );
};

export default SurveyDetailModal;
