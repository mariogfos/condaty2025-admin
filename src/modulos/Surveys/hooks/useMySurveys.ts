// condaty-admin/src/modulos/Surveys/hooks/useMySurveys.ts
import { useState, useCallback } from "react";
import useAxios from "@/mk/hooks/useAxios";
import {
  MySurveyCount,
  SurveyListItem,
  SurveyDetail,
  SurveyAnswer,
  SurveyFilterType,
} from "../types/mySurveys.types";

interface UseMySurveysReturn {
  counts: MySurveyCount | null;
  surveys: SurveyListItem[];
  error: string | null;
  loading: boolean;
  fetchSurveys: (filter: SurveyFilterType, dptoId?: string) => Promise<void>;
  fetchSurveyDetail: (surveyId: string) => Promise<SurveyDetail | null>;
  submitAnswers: (
    surveyId: string,
    dptoId: string,
    answers: SurveyAnswer[],
  ) => Promise<boolean>;
  fetchResults: (surveyId: string, dptoId?: string) => Promise<any | null>;
  fetchCounts: () => Promise<void>;
  execute: Function;
  reLoad: Function;
}

const modulePath = "/surveys";

export const useMySurveys = (): UseMySurveysReturn => {
  const [counts, setCounts] = useState<MySurveyCount | null>(null);
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [detailsCache, setDetailsCache] = useState<Record<string, SurveyDetail>>({});
  const { execute, reLoad } = useAxios();

  const fetchCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: response } = await execute(
        "/surveys/my-counts",
        "GET",
        {},
        false,
        true,
      );
      if (response?.success) {
        setCounts(response.data);
      }
    } catch (err: any) {
      console.error("Error fetching counts:", err);
      setError(err.message || "Error al cargar encuestas");
    } finally {
      setLoading(false);
    }
  }, [surveys]);

  const fetchSurveys = useCallback(
    async (filter: SurveyFilterType, dptoId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const payload: Record<string, string> = {
          filterBy: filter,
          fullType: "L",
        };
        if (dptoId) {
          payload.dpto_id = dptoId;
        }

        const { data: response } = await execute(
          modulePath,
          "GET",
          payload,
          true,
        );

        if (response?.success) {
          setSurveys(response.data || []);
        } else {
          setError(response?.message || "Error al cargar encuestas");
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar encuestas");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchSurveyDetail = useCallback(
    async (surveyId: string): Promise<SurveyDetail | null> => {
      // Return from cache if available
      if (detailsCache[surveyId]) {
        return detailsCache[surveyId];
      }

      try {
        setLoading(true);
        setError(null);
        const payload: Record<string, string> = {
          fullType: "DET",
          searchBy: surveyId,
        };

        const { data: response } = await execute(
          modulePath,
          "GET",
          payload,
          false,
          true,
        );

        if (response?.success) {
          const detail = response.data?.survey || null;
          if (detail) {
            setDetailsCache((prev) => ({ ...prev, [surveyId]: detail }));
          }
          return detail;
        }
        return null;
      } catch (err: any) {
        console.error("Error fetching survey detail:", err);
        setError(err.message || "Error al cargar encuesta");
      } finally {
        setLoading(false);
      }
      return null;
    },
    [detailsCache],
  );

  const submitAnswers = useCallback(
    async (
      surveyId: string,
      dptoId: string,
      answers: SurveyAnswer[],
    ): Promise<boolean> => {
      try {
        const { data: response } = await execute(
          modulePath + "/answers",
          "POST",
          {
            survey_id: surveyId,
            dpto_id: dptoId,
            squestions: answers,
          },
        );

        return response?.success || false;
      } catch (err) {
        console.error("Error submitting answers:", err);
        return false;
      }
    },
    [],
  );

  const fetchResults = useCallback(
    async (surveyId: string, dptoId?: string): Promise<any | null> => {
      try {
        setLoading(true);
        setError(null);
        const payload: Record<string, string> = {
          survey_id: surveyId,
        };
        if (dptoId) {
          payload.dpto_id = dptoId;
        }

        const { data: response } = await execute(
          modulePath + "/results",
          "GET",
          payload,
          false,
          true
        );

        if (response?.success) {
          return response.data || null;
        }
        return null;
      } catch (err: any) {
        console.error("Error fetching survey results:", err);
        setError(err.message || "Error al cargar resultados");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    counts,
    surveys,
    error,
    fetchSurveys,
    fetchSurveyDetail,
    submitAnswers,
    fetchResults,
    fetchCounts,
    execute,
    reLoad,
    loading,
  };
};
