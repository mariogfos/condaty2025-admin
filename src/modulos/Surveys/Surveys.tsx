/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import styles from "./Surveys.module.css";
import NotAccess from "@/components/auth/NotAccess/NotAccess";
import useCrud from "@/mk/hooks/useCrud/useCrud";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useRouter } from "next/navigation";
import useCrudUtils from "../shared/useCrudUtils";
import RenderItem from "../shared/RenderItem";
import ItemList from "@/mk/components/ui/ItemList/ItemList";
import { getSurveyConfig } from "./config/surveys.config";
import { getStatusLabel } from "./config/surveys.constants";
import { SurveyItemData } from "./types/surveys.types";

const paramsInitial = {
  fullType: "CRUD",
  perPage: 20,
  page: 1,
  searchBy: "",
};

const Surveys = () => {
  const router = useRouter();
  const { user } = useAuth();

  // Define reLoad for use inside the config if needed
  let triggerReload: (params?: Record<string, any>) => void = () => {};

  const { mod, fields } = getSurveyConfig(triggerReload);

  const {
    userCan,
    List,
    setStore,
    onSearch,
    searchs,
    onEdit,
    onDel,
    onView,
    reLoad,
    execute,
    extraData,
  } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

  // Attach reLoad to the reference or pass directly
  triggerReload = (...args: any[]) => reLoad(...args);

  const { onLongPress, selItem, searchState } = useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

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
