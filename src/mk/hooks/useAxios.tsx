"use client";
import axios from "axios";
import {
  useState,
  useContext,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { AxiosContext } from "../contexts/AxiosInstanceProvider";
import { logError } from "../utils/logs";

/**
 * ⚠️ `PATCH` faltaba, y no era un olvido inocuo: el API tiene rutas `patch`
 * —`assemblies/{assembly}/status`, `tasks/{task}/status`, `tasks/{task}/assign`—
 * y el front ya las llamaba. Como `execute` estaba tipada `Function`, nadie se
 * enteraba de que el tipo no contemplaba el verbo que el código usa.
 */
export type MethodType = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * El sobre que devuelve el API en TODA respuesta.
 *
 * ⚠️ La firma es abierta a propósito (`[key: string]: any`). El sobre real trae
 * cuatro claves fijas —`success`, `data`, `message`, `errors`— y cada módulo le
 * agrega las suyas: `extraData` aparece en 34 lugares, y hay listados que suman
 * `total` o campos propios. Cerrarlo hoy rompería esos accesos sin haber ganado
 * nada: lo que importa es que las cuatro fijas **dejen de ser `any`**.
 *
 * 🔴 `success` es lo que más se lee mal. El API responde los rechazos de negocio
 * con **HTTP 200 y `success: false`**, así que un `try/catch` no los ve: hay que
 * mirar esta clave. De 168 llamadas del repo, sólo 44 lo hacían.
 */
export type ApiEnvelope<T = any> = {
  success?: boolean;
  data?: T;
  message?: any;
  errors?: any;
  [key: string]: any;
};

/** Lo que devuelve `execute` cuando la petición NO llegó a completarse. */
export type ApiError = {
  message: string;
  status: number;
  data: any;
};

/**
 * El par que devuelve `execute`: uno de los dos viene en null.
 *
 * ⚠️ `error` acá es sólo el fallo de transporte (red caída, 500, timeout). Un
 * rechazo de negocio llega con `error === null` y `data.success === false`.
 */
export type ExecuteResult<T = any> = {
  data: ApiEnvelope<T> | null;
  error: ApiError | null;
};

/**
 * 🔴 Antes era `Function`, que en TypeScript no verifica NADA: ni cuántos
 * argumentos recibe, ni de qué tipo, ni qué devuelve. Con cinco parámetros
 * posicionales —tres de ellos opcionales y dos booleanos seguidos— era la firma
 * más fácil de invocar mal de todo el repo, y el compilador miraba para otro
 * lado.
 */
export type ExecuteFn<T = any> = (
  url?: string | null,
  method?: MethodType,
  payload?: Record<string, any>,
  /** Si además de devolver la respuesta la guarda en el estado del hook. */
  saveInState?: boolean,
  notWaiting?: boolean,
) => Promise<ExecuteResult<T>>;

export type ReLoadFn = (
  payload?: Record<string, any> | null,
  noWaiting?: boolean,
  /** Si es `true`, no hace nada hasta que haya corrido la primera petición. */
  prevent?: boolean,
) => Promise<void>;

/** Suma o resta al contador global de peticiones en vuelo. */
export type SetWaitingFn = (delta: number, origen?: string) => void;

export type UseAxiosType<T = any> = {
  countAxios: number;
  cancel: () => void;
  /**
   * El sobre de la última respuesta, o `null` mientras no haya ninguna.
   *
   * ⚠️ Arranca en `[]` —no en `null`— cuando el hook se crea con `url: null`.
   * Es de la implementación vieja y NO se cambió acá: hay 83 llamadas y varias
   * podrían estar leyendo `.length` sobre eso. Cambiarlo es su propio PR, con
   * la medición hecha.
   */
  data: ApiEnvelope<T> | null;
  error: ApiError | "";
  loaded: boolean;
  execute: ExecuteFn<T>;
  reLoad: ReLoadFn;
  waiting: number;
  setWaiting: SetWaitingFn;
  notWaiting?: boolean;
};

/**
 * @typeParam T - Qué hay adentro de `data.data`. Por omisión es `any`, así que
 * las 83 llamadas que ya existen siguen compilando igual. Un módulo que quiera
 * chequeo real lo pide: `useAxios<Reserva[]>("/reservations")`.
 */
const useAxios = <T = any,>(
  url: string | null = null,
  method: MethodType = "GET",
  payload: Record<string, any> = {},
  noWaiting = false,
): UseAxiosType<T> => {
  const [data, setData] = useState<ApiEnvelope<T> | null>(null);
  const [error, setError] = useState<ApiError | "">("");
  const [loaded, setLoaded] = useState(false);
  const [countAxios, setCountAxios] = useState(0);
  const { contextInstance, waiting, setWaiting }: any =
    useContext(AxiosContext);
  const instance: any = useMemo(() => {
    return contextInstance || axios;
  }, [contextInstance]);
  const controllerRef = useRef(new AbortController());

  // 🔴 Refs con lo ultimo, para que `execute` no cambie de identidad.
  //
  // `setWaiting` del provider NO es estable: es una funcion comun que se
  // recrea en cada render de `AxiosInstanceProvider`, y ese provider
  // re-renderiza en CADA request porque cambia `waiting`. Ponerla en las
  // dependencias de un useCallback no memoizaria nada.
  //
  // `payload` es un objeto literal que casi todos los modulos arman inline,
  // asi que tambien es distinto en cada render.
  //
  // Leerlos por ref da lo mejor de los dos lados: `execute` conserva su
  // identidad entre renders, y cuando corre usa el valor actual, no el que
  // habia cuando se creo.
  const setWaitingRef = useRef(setWaiting);
  const payloadRef = useRef(payload);
  const countAxiosRef = useRef(countAxios);
  setWaitingRef.current = setWaiting;
  payloadRef.current = payload;
  countAxiosRef.current = countAxios;

  const cancel = useCallback(() => {
    controllerRef.current.abort();
  }, []);
  /**
   * 🔴 MEMOIZADA. Antes era un `const` comun: identidad nueva en cada render.
   *
   * Eso hacia que meterla en las dependencias de un `useEffect` disparara el
   * efecto en CADA render. Medido migrando Reservas: el efecto del pago
   * resuelto lanzaba peticiones de mas, y el modulo lo tapaba con un ref
   * propio. El parche servia para un modulo; el problema era de los 40.
   *
   * Depende solo de cosas que casi nunca cambian. Todo lo inestable
   * —`setWaiting`, `payload`— entra por ref.
   */
  const execute: ExecuteFn<T> = useCallback(async (
    _url: string | null = url,
    _method: MethodType = method,
    payload: Record<string, any> = {},
    Act: boolean = false,
    notWaiting = false,
  ): Promise<ExecuteResult<T>> => {
    setError("");
    if (!notWaiting) {
      setLoaded(false);
      setWaitingRef.current(1, "execute:" + _url);
    }
    if (
      process.env.NEXT_PUBLIC_DEBUG &&
      Number(process.env.NEXT_PUBLIC_DEBUG) > 0
    ) {
      payload = { _debug: process.env.NEXT_PUBLIC_DEBUG, ...payload };
    }
    if (_method == "GET" && payload) {
      _url = _url + "?" + new URLSearchParams(payload).toString();
    }

    let data: ApiEnvelope<T> | null = null;
    let error: ApiError | null = null;

    try {
      const response = await instance?.request({
        signal: controllerRef.current.signal,
        data: payload,
        method: _method,
        url: _url,
      });
      if (Act) {
        setData(response.data);
      }

      // setData(response.data);
      data = response.data;
    } catch (err) {
      logError("error useAxios", err);
      error = {
        message: (err as any).message,
        data: (err as any).response?.data || {},
        status: (err as any).response?.status || 0,
      };
      setError(error);
    } finally {
      if (!notWaiting) {
        setLoaded(true);
        setWaitingRef.current(-1, "-execute:" + _url);
      }
    }

    // ⚠️ Antes esto devolvia tambien `loaded`, y era ENGANOSO: no era el
    // estado despues de la llamada sino el capturado en el closure, o sea el
    // valor del render en que se creo `execute`. Siempre viejo, por
    // construccion. Verificado sobre las 168 llamadas del repo: ninguna lo
    // destructura —todas toman `data` y/o `error`—, asi que sacarlo no le
    // cambia nada a nadie. El `loaded` bueno lo devuelve el hook.
    return { data, error };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, url, method]);

  // Memoizada por el mismo motivo que `execute`: se pasa como prop a los
  // componentes hijos, y una identidad nueva por render los re-renderiza a
  // todos aunque no haya cambiado ningun dato.
  //
  // ⚠️ Va DESPUES de `execute`, no antes como estaba: al entrar en el array
  // de dependencias, `execute` se lee durante el render, y leerlo antes de su
  // declaracion es un ReferenceError por la zona muerta temporal. Como
  // funcion suelta no se notaba, porque recien se resolvia al llamarla.
  const reLoad: ReLoadFn = useCallback(
    async (
      _payload: Record<string, any> | null = null,
      noWaiting = false,
      prevent = false,
    ) => {
      if (prevent && countAxiosRef.current == 0) return;
      const pay = {
        ...payloadRef.current,
        ...(_payload || { extraData: false }),
      };
      await execute(url, method, pay, true, noWaiting);
    },
    [execute, url, method],
  );

  useEffect(() => {
    if (url) {
      setCountAxios(countAxios + 1);
      execute(url, method, payload, true, noWaiting);
    } else {
      setError("");
      setData([]);
      setLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    countAxios,
    cancel,
    data,
    error,
    loaded,
    execute,
    reLoad,
    waiting,
    setWaiting,
  };
};

export default useAxios;
