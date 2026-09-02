"use client";
import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useAxios from "../hooks/useAxios";
import { useRouter } from "next/navigation";
import Login from "../components/auth/Login";
import useToast, { ToastItem } from "../hooks/useToast";
import Splash from "../../components/req/Splash";
import ToastViewport from "../components/ui/Toast/ToastViewport";
import { CLAVE_DEL_TOKEN } from "@/mk/utils/claveDelToken";
export interface AuthContextType {
  user: any;
  error: any;
  loaded: boolean;
  login: Function;
  logout: Function;
  userCan: Function;
  showToast: Function;
  /** Saca un toast por su `id`, el que devuelve `showToast` (CDT-74). */
  dismissToast: Function;
  waiting: number;
  setWaiting: Function;
  splash: boolean;
  store: any;
  storeRef: any;
  setStore: Function;
  getUser: Function;
}

export const AuthContext = createContext({} as AuthContextType);
const AuthProvider = ({ children, noAuth = false }: any): any => {
  const { error, loaded, execute, waiting, setWaiting } = useAxios();
  const [user, setUser] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const storeRef = useRef<any>(null);
  const [splash, setSplash] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const router: any = useRouter();
  const { showToast } = useToast(setToasts);

  /**
   * Descarta un toast por id. Es el mismo filtro que ya usaba el `onDismiss`
   * del viewport; acá se expone para que una pantalla pueda sacar el suyo
   * cuando deja de ser cierto —el caso del ticket: «Generando recibo…» cuando
   * el recibo ya está (CDT-74)—.
   *
   * ⚠️ Sale de la cola SIN animación de salida, a diferencia del botón de
   * cerrar. Es a propósito: acá el toast no se está despidiendo, está siendo
   * REEMPLAZADO por el de éxito que llega en el mismo instante. Animar la
   * salida haría que los dos convivan justo el rato que el ticket quiere
   * evitar.
   */
  const dismissToast = useCallback((id: string) => {
    if (!id) return;
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const _setStore = useCallback(async (newStore: object) => {
    setStore((old: object | Function) => {
      if (typeof newStore == "function") return { ...newStore(old) };
      return { ...old, ...newStore };
    });
  }, []);

  const getUser = async (client_id = null) => {
    setWaiting(1, "getUser");
    let currentUser: any = false;
    try {
      const token = await JSON.parse(
        localStorage.getItem(
          CLAVE_DEL_TOKEN,
        ) + "",
      );
      currentUser = user || token.user;
      // M3: dedupe — antes había 2 bloques if/else idénticos
      // para setear credentials.client_id. Consolidado a 1.
      const credentials: any = {};
      if (client_id) {
        credentials.client_id = client_id;
      } else if (currentUser?.client_id) {
        credentials.client_id = currentUser.client_id;
      }
      if (currentUser) {
        const { data, error }: any = await execute(
          process.env.NEXT_PUBLIC_AUTH_IAM,
          "POST",
          credentials,
          false,
          true,
        );

        if (data?.success && !error) {
          currentUser = data?.data?.user;
          if (client_id) {
            currentUser.client_id = client_id;
          } else if (credentials.client_id) {
            currentUser.client_id = credentials.client_id;
          }

          if (currentUser.client_id) {
            localStorage.setItem("condaty_client_id", currentUser.client_id);
          }

          localStorage.setItem(
            CLAVE_DEL_TOKEN,
            JSON.stringify({ token: token.token, user: currentUser }),
          );
        } else {
          // 🔴 Acá decía `error.status`, sin `?`. `useAxios.execute()` sólo
          // llena `error` cuando axios TIRA, o sea cuando la respuesta no es
          // 2xx — y `LoginBaseController::iam()` termina con
          // `sendError(INCORRECT_ACCESS, $error, 200)` cuando el usuario no
          // tiene acceso al condominio: **HTTP 200 con `success: false`**. En
          // esa rama `error` es `null` y leerle `.status` tira un TypeError,
          // que se lo traga el `try/catch` de afuera. Resultado: la limpieza de
          // abajo NO CORRÍA, y el usuario caía al login con el token viejo
          // guardado. Al recargar pasaba lo mismo: no se destrababa solo.
          if (error?.status == 500) {
            // Este `return` se saltea el `setWaiting(-1)` de más abajo, y
            // `waiting` es un acumulador global (`state + newWaiting`): sin
            // esto queda en +1 para siempre.
            setWaiting(-1, "-getUser500");
            setTimeout(async () => {
              localStorage.removeItem(
                CLAVE_DEL_TOKEN,
              );
              setUser(false);
              setSplash(false);
            }, 1000);
            return;
          }
          localStorage.removeItem(
            CLAVE_DEL_TOKEN,
          );
          localStorage.removeItem("condaty_client_id");
          setUser(false);
          setWaiting(-1, "-getUser");
          setSplash(false);
          return;
        }
      }
    } catch (e) {
      currentUser = false;
    }
    setUser(currentUser);
    setWaiting(-1, "-getUser2");
    setSplash(false);
  };

  const userCan = (
    ability: string,
    _action: string,
    minResponsive: "desktop" | "tablet" | "mobile" | null = "tablet",
  ) => {
    // console.log("userCan", ability, _action, minResponsive, window.innerWidth);
    // if (minResponsive != "mobile") {
    //   if (minResponsive == "tablet" && window.innerWidth < 498) {
    //     router.push("/");
    //     // return false;
    //   }
    //   if (minResponsive == "desktop" && window.innerWidth < 998) {
    //     router.push("/");
    //     // return false;
    //   }
    // }
    let action = "";
    if (_action == "add") action = "C";
    if (_action == "edit") action = "U";
    if (_action == "delete") action = "D";
    if (_action == "view") action = "R";
    if (action == "") action = _action;
    // console.log("userCan", ability, action, user);
    if (!ability) return true;
    if (!user) return false;
    if (user.role?.abilities == "**" + user.client_id + "**") return true;
    const abilities = "|" + user.role?.abilities || "";

    if (!abilities?.includes(ability)) return false;
    const a = abilities?.indexOf("|" + ability);
    const b = (abilities + "|").indexOf("|", a + 1);
    const permiso = (abilities.substring(a, b) + ":").split(":");
    if (!(permiso[1] + "").includes(action)) {
      return false;
    }
    return true;
  };

  const login = async (credentials: any) => {
    setWaiting(1, "login");
    setUser(false);

    const { data, error }: any = await execute(
      process.env.NEXT_PUBLIC_AUTH_LOGIN,
      "POST",
      credentials,
    );

    if (data?.success && !error) {
      setUser(data?.data?.user);
      localStorage.setItem(
        CLAVE_DEL_TOKEN,
        JSON.stringify({ token: data?.data?.token, user: data?.data?.user }),
      );
      setWaiting(-1, "-login");
      return { user: data?.data?.user };
    } else {
      setUser(false);

      setWaiting(-1, "-login2");
      return { user, errors: data?.errors || data?.message || error };
    }
  };
  const logout = async () => {
    setUser({ id: "0" });
    setWaiting(1, "logout");
    const { data, error }: any = await execute(
      process.env.NEXT_PUBLIC_AUTH_LOGOUT,
      "POST",
    );
    localStorage.removeItem(
      CLAVE_DEL_TOKEN,
    );
    setUser(false);
    if (data?.success) {
      setWaiting(-1, "-logout");
    } else {
      setWaiting(-1, "-logout2");
      return { user, errors: data?.errors || data?.message || error };
    }
  };

  const result = useMemo(
    () => ({
      user,
      error,
      loaded,
      login,
      logout,
      userCan,
      showToast,
      dismissToast,
      waiting,
      setWaiting,
      splash,
      store,
      storeRef,
      setStore: _setStore,
      getUser: getUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, error, loaded, waiting, splash, store, storeRef],
  );

  useEffect(() => {
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (splash)
    return (
      <>
        <ToastViewport
          toasts={toasts}
          onDismiss={(id) =>
            setToasts((prev) => prev.filter((toast) => toast.id !== id))
          }
        />
        <Splash />
      </>
    );

  return (
    <AuthContext.Provider value={result}>
      {loaded || <Splash />}
      <ToastViewport
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((prev) => prev.filter((toast) => toast.id !== id))
        }
      />
      {!noAuth && !user ? <Login /> : children}
      {/* {children} */}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  // M3: no spread — antes `{ ...data }` creaba un objeto nuevo en cada
  // render, lo que re-renderizaba a todos los consumidores. Retornamos
  // el value del context directamente (estable entre renders).
  return useContext(AuthContext);
};
