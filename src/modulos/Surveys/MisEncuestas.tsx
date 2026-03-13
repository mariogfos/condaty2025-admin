"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/mk/contexts/AuthProvider";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import styles from "./MisEncuestas.module.css";
import TabsButtons from "@/mk/components/ui/TabsButton/TabsButtons";
import SurveySummaryCard from "./components/SurveySummaryCard/SurveySummaryCard";
import SurveyList from "./components/SurveyListView/SurveyList";
import SurveyDetailModal from "./components/SurveyDetailModal/SurveyDetailModal";
import SurveyAnswerForm from "./components/SurveyAnswerForm";

const MisEncuestas = () => {
  const { setStore, store, userCan } = useAuth();
  const [activeTab, setActiveTab] = useState("P");
  const [counts, setCounts] = useState({
    P: 0,
    R: 0,
    E: 0,
  });
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [modalMode, setModalMode] = useState<"view" | "answer">("view");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setStore({ ...store, title: "" });
  }, []);

  const tabs = [
    { value: "P", text: "Pendientes", numero: counts.P },
    { value: "R", text: "Respondidas", numero: counts.R },
    { value: "E", text: "Historial", numero: counts.E },
  ];

  const handleCountsChange = (newCounts: { P: number; R: number; E: number }) => {
    setCounts(newCounts);
  };

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
    setModalMode("view");
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
            count={counts.P}
            isActive={activeTab === "P"}
            onClick={() => setActiveTab("P")}
          />
          <SurveySummaryCard
            title="RESPONDIDAS"
            count={counts.R}
            isActive={activeTab === "R"}
            onClick={() => setActiveTab("R")}
          />
          <SurveySummaryCard
            title="HISTORIAL"
            count={counts.E}
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
          onCountsChange={handleCountsChange}
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
