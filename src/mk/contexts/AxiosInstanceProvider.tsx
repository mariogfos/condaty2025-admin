"use client";
import axios from "axios";
import { createContext, useEffect, useRef, useState } from "react";

export type AxiosContextType = {
  contextInstance: any;
  waiting: number | null;
  setWaiting: Function;
};
export const AxiosContext = createContext({} as AxiosContextType);
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
    config = { ...config, baseURL: API_URL };
  }
  const instanceRef = useRef(axios.create(config));
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
