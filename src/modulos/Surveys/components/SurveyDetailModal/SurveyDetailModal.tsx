import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Button from "@/mk/components/forms/Button/Button";
import styles from "./SurveyDetailModal.module.css";
import { useMySurveys } from "../../hooks/useMySurveys";
import SurveyStatsView from "../RenderView/SurveyStatsView";
import SurveyQuestion from "../Questions/SurveyQuestion";
import SingleChoice from "../Questions/SingleChoice";
import MultipleChoice from "../Questions/MultipleChoice";
import ScaleChoice from "../Questions/ScaleChoice";
import TextChoice from "../Questions/TextChoice";

interface SurveyDetailModalProps {
  survey: any;
  onClose: () => void;
  onAnswer: () => void;
}

const SurveyDetailModal: React.FC<SurveyDetailModalProps> = ({
  survey: initialSurvey,
  onClose,
  onAnswer,
}) => {
  const [surveyDetail, setSurveyDetail] = useState<any>(initialSurvey);
  const [results, setResults] = useState<any>(null);
  const { fetchSurveyDetail, fetchResults } = useMySurveys();
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!initialSurvey.id) return;
      
      setIsLoadingDetail(true);
      // Fetch core detail (questions, etc)
      const detail = await fetchSurveyDetail(initialSurvey.id);
      if (detail) {
        setSurveyDetail(detail);
      }

      // If already responded or closed/expired, fetch results
      if (initialSurvey.has_responded || initialSurvey.status === 'C' || initialSurvey.status === 'X') {
        const res = await fetchResults(initialSurvey.id);
        if (res) {
          setResults(res);
        }
      }
      setIsLoadingDetail(false);
    };

    loadData();
  }, [initialSurvey.id, initialSurvey.has_responded, initialSurvey.status, fetchSurveyDetail, fetchResults]);

  const canAnswer = surveyDetail?.can_respond && !initialSurvey.has_responded && initialSurvey.status === 'A';

  return (
    <DataModal
      open={true}
      onClose={onClose}
      onSave={onAnswer}
      title={surveyDetail.title}
      buttonText={canAnswer ? "Responder encuesta" : ""}
      buttonCancel="Cerrar"
      style={{ width: '80%' }}
    >
      <div className={styles.content}>
        {isLoadingDetail && <div className={styles.loadingBar} />}

        {surveyDetail.description && (
          <p className={styles.description}>{surveyDetail.description}</p>
        )}
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{surveyDetail.questions_count || 0}</span>
            <span className={styles.statLabel}>Preguntas</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{results?.survey_info?.total_participants ?? surveyDetail.estimated_audience ?? 0}</span>
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
            {surveyDetail.squestions?.length > 0 ? (
              surveyDetail.squestions.map((question: any, index: number) => (
                <SurveyQuestion
                  key={question.id}
                  index={index}
                  label={question.question_text}
                  description={question.description}
                  required={question.is_required}
                >
                  {(() => {
                    switch (question.type) {
                      case 'S':
                        return <SingleChoice options={question.soptions} onChange={() => {}} readOnly={true} />;
                      case 'M':
                        return <MultipleChoice options={question.soptions} onChange={() => {}} readOnly={true} />;
                      case 'E':
                        return (
                          <ScaleChoice 
                            minOptions={question.min_options} 
                            maxOptions={question.max_options} 
                            minLabel={question.soptions?.[0]?.option_text}
                            maxLabel={question.soptions?.[question.soptions.length - 1]?.option_text}
                            onChange={() => {}} 
                            readOnly={true} 
                          />
                        );
                      case 'T':
                        return <TextChoice name={`preview_${question.id}`} onChange={() => {}} readOnly={true} />;
                      default:
                        return null;
                    }
                  })()}
                </SurveyQuestion>
              ))
            ) : !isLoadingDetail && (
              <p className={styles.emptyQuestions}>No hay preguntas disponibles.</p>
            )}
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default SurveyDetailModal;
