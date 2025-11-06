import { useState, useMemo, useCallback } from "react";
import { busquedaAvanzada, buscarCoincidencias, debounce } from "./searchUtils";
import { UseSearchOptions, ResultadoBusqueda } from "./types";

export function useSearch<T>(data: T[], options: UseSearchOptions<T> = {}) {
  const { initialData = [], debounceMs = 300, ...searchOptions } = options;

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ResultadoBusqueda<T>[]>([]);

  // Función de búsqueda con debounce
  const performSearch = useCallback(
    debounce((term: string) => {
      if (!term.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      try {
        const searchResults = busquedaAvanzada(data, term, searchOptions);
        setResults(searchResults);
      } catch (error) {
        console.error("Error en búsqueda:", error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs),
    [data, searchOptions, debounceMs]
  );

  // Función para manejar cambios en el término de búsqueda
  const handleSearch = useCallback(
    (term: string) => {
      setSearchTerm(term);
      if (term.trim()) {
        setIsSearching(true);
      }
      performSearch(term);
    },
    [performSearch]
  );

  // Función para limpiar la búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setResults([]);
    setIsSearching(false);
  }, []);

  // Resultados como objetos simples
  const objects = useMemo(() => results.map((r) => r.objeto), [results]);

  return {
    // Estado
    searchTerm,
    results,
    objects,
    isSearching,

    // Acciones
    handleSearch,
    clearSearch,
    setSearchTerm,

    // Métodos de conveniencia
    hasResults: results.length > 0,
    resultCount: results.length,

    // Búsqueda directa (sin estado)
    search: (term: string) => busquedaAvanzada(data, term, searchOptions),
    searchObjects: (term: string) =>
      buscarCoincidencias(data, term, searchOptions.campos, searchOptions),
  };
}

// Hook simplificado para uso rápido
export function useSimpleSearch<T>(data: T[], campos?: string | string[]) {
  return useSearch(data, { campos, debounceMs: 200 });
}
