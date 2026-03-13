// condaty-admin/src/modulos/Surveys/hooks/useMySurveys.ts
import { useState, useCallback } from 'react';
import useAxios from '@/mk/hooks/useAxios';
import { 
  MySurveyCount, 
  SurveyListItem, 
  SurveyDetail, 
  SurveyAnswer,
  SurveyFilterType 
} from '../types/mySurveys.types';

interface UseMySurveysReturn {
  counts: MySurveyCount | null;
  surveys: SurveyListItem[];
  loading: boolean;
  error: string | null;
  activeTab: SurveyFilterType;
  setActiveTab: (tab: SurveyFilterType) => void;
  fetchSurveys: (filter: SurveyFilterType, dptoId?: string) => Promise<void>;
  fetchSurveyDetail: (surveyId: string) => Promise<SurveyDetail | null>;
  submitAnswers: (surveyId: string, dptoId: string, answers: SurveyAnswer[]) => Promise<boolean>;
  fetchCounts: () => Promise<void>;
}

export const useMySurveys = (): UseMySurveysReturn => {
  const [counts, setCounts] = useState<MySurveyCount | null>(null);
  const [surveys, setSurveys] = useState<SurveyListItem[]>([]);
  const [activeTab, setActiveTab] = useState<SurveyFilterType>('P');
  const [error, setError] = useState<string | null>(null);

  // Fetch counts
  const { execute: executeCounts, loaded: loadingCounts } = useAxios(
    '/surveys/my-counts',
    'GET',
    {},
    true
  );

  // Fetch surveys list
  const { execute: executeSurveys, loaded: loadingSurveys } = useAxios(
    '/surveys',
    'GET',
    {},
    true
  );

  // Submit answers
  const { execute: executeAnswers, loaded: loadingSubmit } = useAxios(
    '/surveys/answers',
    'POST',
    {},
    true
  );

  const loading = loadingCounts || loadingSurveys || loadingSubmit;

  const fetchCounts = useCallback(async () => {
    try {
      const response = await executeCounts();
      if (response?.success) {
        setCounts(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching counts:', err);
    }
  }, [executeCounts]);

  const fetchSurveys = useCallback(async (filter: SurveyFilterType, dptoId?: string) => {
    setError(null);
    try {
      const params: Record<string, string> = {
        filterBy: filter,
        fullType: 'L',
      };
      if (dptoId) {
        params.dpto_id = dptoId;
      }
      
      // Build query string
      const queryString = new URLSearchParams(params).toString();
      const response = await executeSurveys(`?${queryString}`, 'GET');
      
      if (response?.success) {
        setSurveys(response.data?.data || []);
      } else {
        setError(response?.message || 'Error al cargar encuestas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar encuestas');
    }
  }, [executeSurveys]);

  const fetchSurveyDetail = useCallback(async (surveyId: string): Promise<SurveyDetail | null> => {
    try {
      const response = await executeSurveys(`?fullType=DET&searchBy=${surveyId}`, 'GET');
      
      if (response?.success) {
        return response.data?.survey || null;
      }
      return null;
    } catch (err) {
      console.error('Error fetching survey detail:', err);
      return null;
    }
  }, [executeSurveys]);

  const submitAnswers = useCallback(async (
    surveyId: string, 
    dptoId: string, 
    answers: SurveyAnswer[]
  ): Promise<boolean> => {
    try {
      const response = await executeAnswers('', 'POST', {
        survey_id: surveyId,
        dpto_id: dptoId,
        questions: answers,
      });
      
      return response?.success || false;
    } catch (err) {
      console.error('Error submitting answers:', err);
      return false;
    }
  }, [executeAnswers]);

  return {
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
  };
};
