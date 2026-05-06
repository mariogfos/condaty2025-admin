"use client";
import axios from "axios";
import { createContext, useEffect, useRef, useState } from "react";

export type AxiosContextType = {
  contextInstance: any;
  waiting: number | null;
  setWaiting: Function;
};
export const AxiosContext = createContext({} as AxiosContextType);

const LOCAL_API_FALLBACK_PORT = "8000";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const buildLocalApiFallback = () => {
  if (typeof window === "undefined") return undefined;
  if (!LOCAL_HOSTS.has(window.location.hostname)) return undefined;

  const fallbackUrl = new URL(window.location.origin);
  fallbackUrl.port = LOCAL_API_FALLBACK_PORT;
  fallbackUrl.pathname = "/api";
  fallbackUrl.search = "";
  fallbackUrl.hash = "";

  return fallbackUrl.toString().replace(/\/$/, "");
};

const resolveApiBaseUrl = (apiUrl?: string) => {
  const normalizedApiUrl = apiUrl?.trim();
  if (!normalizedApiUrl) {
    return buildLocalApiFallback();
  }

  return normalizedApiUrl;
};

const AxiosInstanceProvider = ({
  config = {},
  interceptors = null,
  children,
}: any) => {
  const [waiting, setWaiting] = useState(0);
  const setWaiting2 = (newWaiting: number, origen: string) => {
    setWaiting((state) => {
      // logInfo("Waiting:", newWaiting, state + newWaiting, origen);
      return state + newWaiting;
    });
  };
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!config.baseURL) {
    config = { ...config, baseURL: resolveApiBaseUrl(API_URL) };
  }
  const instanceRef = useRef(axios.create(config));
  instanceRef.current.defaults.baseURL = config.baseURL;
  instanceRef.current.defaults.withCredentials = true;
  useEffect(() => {
    setWaiting2(0, "useEffect AxiosProvider");
    if (interceptors) {
      interceptors(instanceRef.current);
    }
  }, []);

  return (
    <AxiosContext.Provider
      value={{
        contextInstance: instanceRef.current,
        waiting,
        setWaiting: setWaiting2,
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
};

export default AxiosInstanceProvider;
