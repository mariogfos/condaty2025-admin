"use client";
import Pusher from "pusher-js";
import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import { logError, logInfo } from "../utils/logs";
import { useAuth } from "./AuthProvider";
import { throttle } from "../utils/utils";
import { getDataNotif } from "@/components/req/NotifMsg";
import { log } from "console";

export interface PusherContextType {
  pusher: any;
  socketConnected: string;
  socketNew: number;
  socketEvent: any;
  notif: number;
  setNotif: Function;
}
export const PusherContext = createContext({} as PusherContextType);

const PusherContextProvider = ({ children }: any) => {
  const [pusher, setPusher]: any = useState(null);
  const { user, showToast, logout } = useAuth();
  const [socketConnected, setSocketConnected] = useState("");
  const [socketNew, setSocketNew] = useState(0);
  const [socketEvent, setSocketEvent]: any = useState(null);
  const [notif, setNotif] = useState(0);

  const _init = async () => {
    if (pusher) return;
    try {
      // log("init Pusher");
      // Pusher.logToConsole = true;
      let newPusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_K as string, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
      });
      setPusher(newPusher);
    } catch (error) {
      logError("error Pusher", error);
    }
  };

  const init = throttle(_init, 1000);

  let conectando = false;
  const propagateEvent = async (event: any) => {
    await setSocketEvent(event?.data);
    await setNotif((old: any) => old + 1);
    await setSocketNew((old: any) => old + 1);
    logInfo("propagateEvent:", event);
  };

  const _connect = async () => {
    // logInfo("pusher connet....", pusher);
    if (!pusher) await init();
    if (conectando) {
      logInfo("pusher esta conectando....");
      return;
    }
    conectando = true;
    if (pusher?.connection?.state && pusher?.connection.state == "conneted") {
      logInfo("pusher Ya Conectado");
      return;
    }
    if (pusher?.connection?.state && pusher?.connection.state != "conneted") {
      try {
        pusher.connection.bind("state_change", function (states: any) {
          logInfo(
            "Socket onConnectionStateChange: " +
              states.current +
              " from " +
              states.previous
          );
          setSocketConnected(states.current);
        });

        pusher.bind_global((event: String, data: any) => {
          if (event == "pusher:pong") return;

          if (data && typeof data == "string") {
            try {
              data = JSON.parse(data);
            } catch (error) {
              logError("Error parse data", data);
            }
          }
          if (event == "sessionDel") {
            const tokenActual = user?.token.split("|")[0];
            if (data?.id == tokenActual || data?.id == 0) {
              logInfo("eliminado");
              logout();
            }
            return;
          }
          propagateEvent({ eventName: event, data });
          const e = getDataNotif(data, true);
          logInfo("Socket", e);

          showToast(e.msg, e.type);
        });
      } catch (e) {
        logError("Socket Connect ERROR: " + e);
      }
    }
    conectando = false;
  };

  const connect = throttle(_connect, 1000);
  let iniciando = false;
  const _initPush = async () => {
    if (iniciando) {
      logInfo("initPush ya iniciando....");
      return;
    }
    iniciando = true;
    try {
      // logInfo("initPush suscribiendo....", user);
      let channel = await pusher.subscribe(
        (
          process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX +
          "-" +
          process.env.NEXT_PUBLIC_AUTH_IAM
        ).replace("/", "") + user?.id
      );

      channel.bind("pusher:subscription_succeeded", function (...states: any) {
        // states = {previous: 'oldState', current: 'newState'}
        logInfo(
          "Socket connection success : ",
          (
            process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX +
            "-" +
            process.env.NEXT_PUBLIC_AUTH_IAM
          ).replace("/", "") + user?.id,
          states
        );
      });

      (process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTERESTS as string)
        .split(",")
        .map(async (e: any) => {
          const r = await pusher.subscribe(
            (
              process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX as string
            ).replace("/", "") +
              user.client_id +
              "-" +
              e
          );
          r.bind("pusher:subscription_succeeded", function (...states: any) {
            // states = {previous: 'oldState', current: 'newState'}
            logInfo(
              "Socket connection success: ",
              (
                process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX as string
              ).replace("/", "") +
                user.client_id +
                "-" +
                e,
              states
            );
          });
        });
    } catch (error) {
      logError("Socket initPush error", error);
    }

    iniciando = false;
  };

  const initPush = throttle(_initPush, 1000);

  useEffect(() => {
    // logInfo("useEffect pusher user", pusher?.connection?.state, user);
    init();
    return () => {
      if (!pusher) return;
      if (!user?.client_id) return;
      try {
        logInfo("useEffect pusher unsuscribe", pusher?.connection?.state, user);
        pusher.unsubscribe({
          channelName:
            (
              process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX +
              "-" +
              process.env.NEXT_PUBLIC_AUTH_IAM
            ).replace("/", "") + user.id,
        });
        (process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTERESTS as string)
          .split(",")
          .map(async (e: any) => {
            await pusher.unsubscribe({
              channelName:
                process.env.NEXT_PUBLIC_PUSHER_BEAMS_INTEREST_PREFIX +
                user.client_id +
                "-" +
                e,
            });
          });
      } catch (error) {
        logError("error unsubscribe", error);
      }
    };
  }, [user]);

  useEffect(() => {
    // logInfo("useEffect pusher", pusher?.connection?.state);
    if (!pusher) {
      init();
      return;
    }
    // logInfo("useEffect pusher exist", pusher?.connection?.state);
    if (!socketConnected) {
      connect();
      return;
    }
    if (socketConnected == "connected") {
      initPush();
      return;
    }
  }, [pusher, socketConnected]);

  // useEffect(() => {
  //   try {
  //     LogRocket.identify(user?.id, user);
  //   } catch (error) {
  //     console.log("error LogRocket", error);
  //   }
  // }, [user]);

  return (
    <PusherContext.Provider
      value={{
        pusher,
        socketConnected,
        socketNew,
        socketEvent,
        notif,
        setNotif,
      }}
    >
      {/* {!user?.client_id ? <SelClient sidebar={false} /> : children} */}
      {children}
    </PusherContext.Provider>
  );
};

export default PusherContextProvider;

export const usePusher = () => {
  const data: PusherContextType = useContext(PusherContext);
  return { ...data };
};
