import { useEffect, useState } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import styles from "./SurveyDetailModal.module.css";
import { useMySurveys } from "../../hooks/useMySurveys";
import SurveyStatsView from "../RenderView/SurveyStatsView";
import SurveyQuestion from "../Questions/SurveyQuestion";
import SingleChoice from "../Questions/SingleChoice";
import MultipleChoice from "../Questions/MultipleChoice";
import ScaleChoice from "../Questions/ScaleChoice";
import TextChoice from "../Questions/TextChoice";
import { SURVEY_STATUSES } from "../../config/surveys.constants";

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
  const [filters, setFilters] = useState<any>({});
  const { fetchSurveyDetail, fetchResults } = useMySurveys();
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!initialSurvey.id) return;

      setIsLoadingDetail(true);

      const hasResponded = initialSurvey.has_responded;
      const isClosed =
        initialSurvey.status === "C" || initialSurvey.status === "X";

      if (hasResponded || isClosed) {
        // Only fetch results if we are viewing stats
        const res = await fetchResults(initialSurvey.id);
        if (res) {
          setResults(res);
          // If results have survey_info, we can update surveyDetail with it
          if (res.survey_info) {
            setSurveyDetail((prev: any) => ({
              ...prev,
              ...res.survey_info,
              title: res.survey_info.title || prev.title,
            }));
          }
        }
      } else {
        // Only fetch detail if we are showing questions preview
        const detail = await fetchSurveyDetail(initialSurvey.id);
        if (detail) {
          setSurveyDetail(detail);
        }
      }

      setIsLoadingDetail(false);
    };

    loadData();
  }, [
    initialSurvey.id,
    initialSurvey.has_responded,
    initialSurvey.status,
    fetchSurveyDetail,
    fetchResults,
    filters,
  ]);

  const canAnswer =
    surveyDetail?.can_respond &&
    !initialSurvey.has_responded &&
    initialSurvey.status === "A";

  const formatDate = (value?: string | null) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("es-ES");
  };

  const totalParticipants = Number(
    surveyDetail.total_participants ??
      surveyDetail.total_voters ??
      results?.survey_info?.total_participants ??
      0,
  );
  const estimatedAudience = Number(
    surveyDetail.estimated_audience ??
      results?.survey_info?.estimated_audience ??
      0,
  );
  const participationRate =
    estimatedAudience > 0
      ? Math.round((totalParticipants / estimatedAudience) * 100)
      : 0;
  const statusLabel =
    SURVEY_STATUSES[surveyDetail.status] ||
    SURVEY_STATUSES[initialSurvey.status] ||
    "N/A";

  return (
    <DataModal
      open={true}
      onClose={onClose}
      onSave={onAnswer}
      title="Detalle de la encuesta"
      buttonText={canAnswer ? "Responder encuesta" : ""}
      buttonCancel="Cerrar"
      style={{ width: "88%" }}
    >
      <div className={styles.content}>
        {isLoadingDetail && <div className={styles.loadingBar} />}

        <section className={styles.hero}>
          <h3 className={styles.title}>{surveyDetail.title}</h3>
          {surveyDetail.description && (
            <p className={styles.description}>{surveyDetail.description}</p>
          )}
          <div className={styles.metaStrip}>
            <div className={styles.metaItem}>
              <span>Creación:</span>
              <strong>
                {formatDate(surveyDetail.created_at || surveyDetail.created_on)}
              </strong>
            </div>
            <div className={styles.metaItem}>
              <span>Publicación:</span>
              <strong>{formatDate(surveyDetail.published_at)}</strong>
            </div>
            <div className={styles.metaItem}>
              <span>Vencimiento:</span>
              <strong>
                {formatDate(surveyDetail.expires_at || surveyDetail.end_at)}
              </strong>
            </div>
            <div className={styles.statusPill}>{statusLabel}</div>
          </div>
        </section>

        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Participantes</span>
            <span className={styles.statValue}>
              {totalParticipants} / {estimatedAudience}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Tasa de participación</span>
            <span className={styles.statValue}>{participationRate}%</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Representatividad</span>
            <span className={styles.statValue}>{participationRate}%</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Tiempo promedio</span>
            <span className={styles.statValue}>N/A</span>
          </div>
        </div>

        {results ? (
          <div className={styles.resultsContainer}>
            <h4 className={styles.questionsTitle}>
              Resultados y tus respuestas
            </h4>
            <SurveyStatsView
              squestions={results.questions}
              totalParticipants={results.survey_info?.total_participants || 0}
              showSummary={false}
            />
          </div>
        ) : (
          <div className={styles.questions}>
            <h4 className={styles.questionsTitle}>Preguntas de la encuesta</h4>
            {surveyDetail.squestions?.length > 0
              ? surveyDetail.squestions.map((question: any, index: number) => (
                  <SurveyQuestion
                    key={question.id}
                    index={index}
                    label={question.question_text}
                    description={question.description}
                    required={question.is_required}
                  >
                    {(() => {
                      switch (question.type) {
                        case "S":
                          return (
                            <SingleChoice
                              options={question.soptions}
                              onChange={() => {}}
                              readOnly={true}
                            />
                          );
                        case "M":
                          return (
                            <MultipleChoice
                              options={question.soptions}
                              onChange={() => {}}
                              readOnly={true}
                            />
                          );
                        case "E":
                          return (
                            <ScaleChoice
                              minOptions={question.min_options}
                              maxOptions={question.max_options}
                              minLabel={question.soptions?.[0]?.option_text}
                              maxLabel={
                                question.soptions?.[
                                  question.soptions.length - 1
                                ]?.option_text
                              }
                              onChange={() => {}}
                              readOnly={true}
                            />
                          );
                        case "T":
                          return (
                            <TextChoice
                              name={`preview_${question.id}`}
                              onChange={() => {}}
                              readOnly={true}
                            />
                          );
                        default:
                          return null;
                      }
                    })()}
                  </SurveyQuestion>
                ))
              : !isLoadingDetail && (
                  <p className={styles.emptyQuestions}>
                    No hay preguntas disponibles.
                  </p>
                )}
          </div>
        )}
      </div>
    </DataModal>
  );
};

export default SurveyDetailModal;
