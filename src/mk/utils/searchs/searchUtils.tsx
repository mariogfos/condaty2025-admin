import { OpcionesBusqueda, ResultadoBusqueda } from "./types";

// Función para normalizar texto (compatible con React Native)
export const normalizarTexto = (texto: string): string => {
  if (typeof texto !== "string") return "";

  let normalized = texto.toLowerCase();

  // Normalizar caracteres (compatible con React Native)
  normalized = normalized
    .replace(/á/g, "a")
    .replace(/é/g, "e")
    .replace(/í/g, "i")
    .replace(/ó/g, "o")
    .replace(/ú/g, "u")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();

  return normalized;
};

// Soundex en español para búsqueda fonética
export const soundexEspanol = (palabra: string): string => {
  const normalizada = normalizarTexto(palabra);

  if (normalizada.length === 0) return "";

  let primeraLetra = normalizada.charAt(0);
  let resto = normalizada.substring(1);

  // Reemplazar grupos de letras por códigos numéricos
  resto = resto
    .replace(/[aeiouhw]/g, "")
    .replace(/[bfpv]/g, "1")
    .replace(/[cgjkqsxz]/g, "2")
    .replace(/[dt]/g, "3")
    .replace(/[l]/g, "4")
    .replace(/[mn]/g, "5")
    .replace(/[r]/g, "6");

  // Eliminar dígitos consecutivos duplicados

  let codigo = primeraLetra;
  let ultimoDigito = "";

  for (let i = 0; i < resto.length; i++) {
    const digito = resto.charAt(i);
    if (digito !== ultimoDigito) {
      codigo += digito;
      ultimoDigito = digito;
    }
  }

  return (codigo + "000").substring(0, 4);
};

// Distancia de Levenshtein para errores de tipeo
export const levenshtein = (a: string, b: string): number => {
  const an = a.length;
  const bn = b.length;

  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array(bn + 1)
    .fill(null)
    .map(() => Array(an + 1).fill(null));

  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[bn][an];
};

// Función para obtener campos de búsqueda
export const obtenerCamposBusqueda = <T,>(
  objeto: T,
  campos: string | string[]
): string[] => {
  const camposArray = Array.isArray(campos) ? campos : [campos];
  const valores: string[] = [];

  for (const campo of camposArray) {
    const valor = campo
      .split(".")
      .reduce(
        (obj: any, key: string) =>
          obj && obj[key] !== undefined ? obj[key] : "",
        objeto
      );

    if (valor && typeof valor === "string") {
      valores.push(valor);
    }
  }

  return valores;
};

// Función debounce para optimizar búsquedas
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Función principal de búsqueda
export function busquedaAvanzada<T>(
  array: T[],
  palabra: string,
  opciones: OpcionesBusqueda = {}
): ResultadoBusqueda<T>[] {
  const {
    campos = [],
    usarFonetica = true,
    umbralSimilitud = 0.7,
    maxResultados = 10,
    buscarEnTodosLosCampos = false,
    caseSensitive = false,
  } = opciones;

  if (!palabra.trim()) {
    return [];
  }

  const palabraNormalizada = caseSensitive ? palabra : normalizarTexto(palabra);
  const codigoSoundex = usarFonetica ? soundexEspanol(palabra) : "";
  const resultados: ResultadoBusqueda<T>[] = [];

  // Si no se especifican campos, buscar en todas las propiedades string
  const camposABuscar =
    campos && (Array.isArray(campos) ? campos : [campos]).length > 0
      ? campos
      : array.length > 0
      ? Object.keys(array[0]).filter(
          (key) => typeof (array[0] as any)[key] === "string"
        )
      : [];

  for (const objeto of array) {
    let mejorResultado: Omit<ResultadoBusqueda<T>, "objeto"> | null = null;

    for (const campo of Array.isArray(camposABuscar)
      ? camposABuscar
      : [camposABuscar]) {
      const valor = campo
        .split(".")
        .reduce(
          (obj: any, key: string) =>
            obj && obj[key] !== undefined ? obj[key] : "",
          objeto
        );

      if (!valor || typeof valor !== "string") continue;

      const valorNormalizado = caseSensitive ? valor : normalizarTexto(valor);
      let tipo: ResultadoBusqueda<T>["tipo"] = "similar";
      let similitud = 0;
      let score = 0;

      // 1. Coincidencia exacta
      if (valorNormalizado === palabraNormalizada) {
        tipo = "exacta";
        similitud = 1;
        score = 100;
      }
      // 2. Coincidencia que contiene la palabra
      else if (valorNormalizado.includes(palabraNormalizada)) {
        tipo = "contains";
        similitud = 0.95;
        score = 90;
      }
      // 3. Coincidencia fonética
      else if (usarFonetica && soundexEspanol(valor) === codigoSoundex) {
        tipo = "fonetica";
        similitud = 0.9;
        score = 80;
      }
      // 4. Coincidencia por similitud
      else {
        const distancia = levenshtein(palabraNormalizada, valorNormalizado);
        const longitudMax = Math.max(
          palabraNormalizada.length,
          valorNormalizado.length
        );
        similitud = 1 - distancia / longitudMax;

        if (similitud >= umbralSimilitud) {
          tipo = "similar";
          score = Math.floor(similitud * 100);
        }
      }

      if (
        similitud >= umbralSimilitud &&
        (!mejorResultado || score > mejorResultado.score)
      ) {
        mejorResultado = {
          campoEncontrado: campo,
          valorOriginal: valor,
          tipo,
          similitud,
          score,
        };

        if (tipo === "exacta" && !buscarEnTodosLosCampos) {
          break;
        }
      }
    }

    if (mejorResultado) {
      resultados.push({
        objeto,
        ...mejorResultado,
      });
    }
  }

  return resultados
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ordenTipo = { exacta: 0, contains: 1, fonetica: 2, similar: 3 };
      return ordenTipo[a.tipo] - ordenTipo[b.tipo];
    })
    .slice(0, maxResultados);
}

// Función simplificada para obtener solo los objetos
export function buscarCoincidencias<T>(
  array: T[],
  palabra: string,
  campos?: string | string[],
  opciones: Omit<OpcionesBusqueda, "campos"> = {}
): T[] {
  return busquedaAvanzada(array, palabra, { ...opciones, campos }).map(
    (result) => result.objeto
  );
}
