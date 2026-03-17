"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./MisEncuestas.module.css";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import SurveySummaryCard from "./components/SurveySummaryCard/SurveySummaryCard";
import SurveyList from "./components/SurveyListView/SurveyList";
import SurveyDetailModal from "./components/SurveyDetailModal/SurveyDetailModal";
import SurveyAnswerForm from "./components/SurveyAnswerForm";
import { useMySurveys } from "./hooks/useMySurveys";
import { SurveyFilterType } from "./types/mySurveys.types";
import { useEvent } from "@/mk/hooks/useEvents";

const MisEncuestas = () => {
  const { setStore, store, userCan } = useAuth();
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"view" | "answer">("view");
  const [activeTab, setActiveTab] = useState<SurveyFilterType>("P");
  const {
    counts: myCounts,
    surveys,
    fetchSurveys,
    fetchSurveyDetail,
    submitAnswers,
    fetchCounts,
    execute,
    reLoad,
    loading,
  } = useMySurveys();

  useEffect(() => {
    fetchCounts();
  }, []);

  useEffect(() => {
    fetchSurveys(activeTab);
  }, [activeTab]);

  // Refresh list and counter when a new survey notification arrives
  const handleNewSurveyNotif = useCallback(
    () => {
      fetchCounts();
      fetchSurveys("P"); // Refresh pending tab — where new surveys appear
    },
    [fetchCounts, fetchSurveys]
  );

  useEvent("survey:new", handleNewSurveyNotif);

  const tabs = [
    { value: "P", text: "Pendientes", numero: myCounts?.P || 0 },
    { value: "R", text: "Respondidas", numero: myCounts?.R || 0 },
    { value: "E", text: "Historial", numero: myCounts?.E || 0 },
  ];

  const handleViewSurvey = (survey: any) => {
    setSelectedSurvey(survey);
    setModalMode("view");
  };

  const handleAnswerSurvey = (survey: any) => {
    setSelectedSurvey(survey);
    setModalMode("answer");
  };

  const handleCloseModal = () => {
    setSelectedSurvey(null);
  };

  const handleSurveyAnswered = () => {
    setSelectedSurvey((prev: any) => ({ ...prev, has_responded: true }));
    setModalMode("view");
    fetchCounts();
    fetchSurveys(activeTab);
  };

  if (!userCan("surveys", "R")) {
    return <NotAccess />;
  }

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <div className={styles.summarySection}>
        <div className={styles.summaryHeader}>
          <h2 className={styles.summaryTitle}>Mis Encuestas</h2>
        </div>
        <div className={styles.summaryCards}>
          <SurveySummaryCard
            title="PENDIENTES"
            count={myCounts?.P || 0}
            isActive={activeTab === "P"}
            onClick={() => setActiveTab("P")}
          />
          <SurveySummaryCard
            title="RESPONDIDAS"
            count={myCounts?.R || 0}
            isActive={activeTab === "R"}
            onClick={() => setActiveTab("R")}
          />
          <SurveySummaryCard
            title="HISTORIAL"
            count={myCounts?.E || 0}
            isActive={activeTab === "E"}
            onClick={() => setActiveTab("E")}
          />
        </div>
      </div>

      {/* Tabs and List */}
      <div className={styles.listSection}>
        <div className={styles.tabsSection}>
          <TabsButtons
            sel={activeTab}
            tabs={tabs}
            setSel={setActiveTab}
            variant="rounded"
          />
        </div>

        <SurveyList
          activeTab={activeTab}
          onView={handleViewSurvey}
          onAnswer={handleAnswerSurvey}
          surveys={surveys}
          execute={execute}
          reLoad={reLoad}
          loading={loading}
        />
      </div>

      {/* Modal */}
      {selectedSurvey && modalMode === "view" && (
        <SurveyDetailModal
          survey={selectedSurvey}
          onClose={handleCloseModal}
          onAnswer={() => setModalMode("answer")}
        />
      )}

      {selectedSurvey && modalMode === "answer" && (
        <SurveyAnswerForm
          survey={selectedSurvey}
          onClose={handleCloseModal}
          onSuccess={handleSurveyAnswered}
        />
      )}
    </div>
  );
};

export default MisEncuestas;
