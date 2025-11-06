// Exportaciones principales
export { useSearch, useSimpleSearch } from "./useSearch";
export { busquedaAvanzada, buscarCoincidencias } from "./searchUtils";
export { normalizarTexto, soundexEspanol, levenshtein } from "./searchUtils";
export type {
  OpcionesBusqueda,
  ResultadoBusqueda,
  UseSearchOptions,
} from "./types";
