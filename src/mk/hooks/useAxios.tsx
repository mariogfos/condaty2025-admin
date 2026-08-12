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

export type MethodType = "GET" | "POST" | "PUT" | "DELETE";

export type UseAxiosType = {
  countAxios: number;
  cancel: Function;
  data: any;
  error: any;
  loaded: boolean;
  execute: Function;
  reLoad: Function;
  waiting: number;
  setWaiting: Function;
  notWaiting?: boolean;
};

const useAxios = (
  url: string | null = null,
  method: MethodType = "GET",
  payload: object = {},
  noWaiting = false,
): UseAxiosType => {
  const [data, setData] = useState<any>(null);
  const [error, setError]: any = useState("");
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
  const execute: any = useCallback(async (
    _url: string | null = url,
    _method: MethodType = method,
    payload: any = {},
    Act: boolean = false,
    notWaiting = false,
  ) => {
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

    let data = null;
    let error: null | { message: string; status: number; data: any } = null;

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
  const reLoad = useCallback(
    async (_payload: any = null, noWaiting = false, prevent = false) => {
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
