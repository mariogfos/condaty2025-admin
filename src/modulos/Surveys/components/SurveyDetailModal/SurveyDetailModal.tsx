"use client";
import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import useAxios from "@/mk/hooks/useAxios";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./SurveyDetailModal.module.css";

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
  const [loading, setLoading] = useState(true);

  const { execute: executeDetail, loaded } = useAxios(
    "/surveys",
    "GET",
    {},
    true
  );

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const payload = {
        fullType: 'DET',
        searchBy: survey.id,
      };
      
      const response = await executeDetail('/surveys', 'GET', payload);
      
      if (response?.data?.success) {
        setSurveyDetail(response.data.data?.survey);
      }
      setLoading(false);
    };

    fetchDetail();
  }, [survey.id]);

  const canAnswer = surveyDetail?.can_respond && !surveyDetail?.has_responded && surveyDetail?.status === 'A';

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
              <span className={styles.statValue}>{surveyDetail?.estimated_audience || 0}</span>
              <span className={styles.statLabel}>Audiencia</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{surveyDetail?.real_responses_count || 0}</span>
              <span className={styles.statLabel}>Respondieron</span>
            </div>
          </div>

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
