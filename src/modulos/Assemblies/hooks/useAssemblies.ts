// src/modulos/Assemblies/hooks/useAssemblies.ts
import { useState, useCallback } from "react";
import useAxios from "@/mk/hooks/useAxios";
import {
  Assembly,
  AssemblyAttendance,
  AssemblyStats,
} from "../types/assemblies.types";
import { useAuth } from "@/mk/contexts/AuthProvider";

interface UseAssembliesReturn {
  assemblies: Assembly[];
  stats: any | null;
  error: string | null;
  loading: boolean;
  fetchAssemblies: (params?: any) => Promise<void>;
  fetchAssemblyDetail: (id: string | number) => Promise<Assembly | null>;
  fetchAssemblyStats: (id: string | number) => Promise<AssemblyStats | null>;
  updateAssemblyStatus: (
    id: string | number,
    status: string,
  ) => Promise<boolean>;
  execute: any;
  reLoad: any;
}

const modulePath = "/assemblies";

export const useAssemblies = (): UseAssembliesReturn => {
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { execute, reLoad } = useAxios();
  const { showToast } = useAuth();

  const fetchAssemblies = useCallback(
    async (params: any = { fullType: "L" }) => {
      setLoading(true);
      setError(null);
      try {
        const { data: response } = await execute(
          modulePath,
          "GET",
          params,
          true,
        );
        if (response?.success) {
          setAssemblies(response.data || []);
          if (response.message) {
            setStats(response.message);
          }
        } else {
          setError(response?.message || "Error al cargar asambleas");
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar asambleas");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchAssemblyDetail = useCallback(
    async (id: string | number): Promise<Assembly | null> => {
      setLoading(true);
      setError(null);
      try {
        const { data: response } = await execute(
          modulePath,
          "GET",
          { fullType: "DET", searchBy: id },
          false,
          true,
        );
        if (response?.success) {
          // En Condaty, el detalle suele venir en response.data.assembly o directo en response.data
          const data = response.data?.data || response.data?.assembly || null;
          return data;
        }
        return null;
      } catch (err: any) {
        console.error("Error fetching assembly detail:", err);
        setError(err.message || "Error al cargar asamblea");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const fetchAssemblyStats = useCallback(
    async (id: string | number): Promise<AssemblyStats | null> => {
      try {
        const { data: response } = await execute(
          `${modulePath}/${id}/stats`,
          "GET",
          {},
          false,
          true,
        );
        if (response?.success) {
          return (
            response.data?.data || response.data?.stats || response.data || null
          );
        }
        return null;
      } catch (err: any) {
        console.error("Error fetching assembly stats:", err);
        return null;
      }
    },
    [],
  );

  const updateAssemblyStatus = useCallback(
    async (id: string | number, status: string): Promise<boolean> => {
      try {
        const { data: response } = await execute(
          `${modulePath}/${id}/status`,
          "PUT",
          { status },
          false,
          true,
        );
        if (response?.success) {
          showToast("Estado actualizado correctamente", "success");
          return true;
        }
        showToast(response?.message || "Error al actualizar estado", "error");
        return false;
      } catch (err: any) {
        console.error("Error updating assembly status:", err);
        showToast(err.message || "Error al actualizar estado", "error");
        return false;
      }
    },
    [],
  );

  return {
    assemblies,
    stats,
    error,
    loading,
    fetchAssemblies,
    fetchAssemblyDetail,
    fetchAssemblyStats,
    updateAssemblyStatus,
    execute,
    reLoad,
  };
};
