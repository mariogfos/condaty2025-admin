"use client";
import styles from "./Surveys.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { getSurveyConfig } from "./config/surveys.config";
import { SurveyItemData } from "./types/surveys.types";

const paramsInitial = {
  fullType: "CRUD",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Surveys = () => {
  // Define reLoad for use inside the config if needed
  let triggerReload: (params?: Record<string, any>) => void = () => {};

  const { mod, fields } = getSurveyConfig(triggerReload);

  const { userCan, List, onView, reLoad } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  triggerReload = (...args: any[]) => reLoad(...args);

  const handleRowClick = (item: SurveyItemData) => {
    onView(item);
  };

  if (!userCan(mod.permiso, "R")) return <NotAccess />;

  return (
    <div className={styles.surveysContainer}>
      <h1 className={styles.title}>Encuestas</h1>
      <List onRowClick={handleRowClick} />
    </div>
  );
};

export default Surveys;
