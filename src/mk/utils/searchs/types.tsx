export interface OpcionesBusqueda {
  campos?: string | string[];
  usarFonetica?: boolean;
  umbralSimilitud?: number;
  maxResultados?: number;
  buscarEnTodosLosCampos?: boolean;
  caseSensitive?: boolean;
}

export interface ResultadoBusqueda<T> {
  objeto: T;
  campoEncontrado: string;
  valorOriginal: string;
  tipo: "exacta" | "fonetica" | "similar" | "contains";
  similitud: number;
  score: number;
}

export interface UseSearchOptions<T> extends OpcionesBusqueda {
  initialData?: T[];
  debounceMs?: number;
}
