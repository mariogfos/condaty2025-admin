"use client";
import {
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
import useToast, { ToastType } from "../hooks/useToast";
import { logError } from "../utils/logs";
import Splash from "../../components/req/Splash";
import Toast from "../components/ui/Toast/Toast";
import { IconLogoElekta } from "@/components/layout/icons/IconsBiblioteca";

export interface AuthContextType {
  user: any;
  error: any;
  loaded: boolean;
  login: Function;
  logout: Function;
  userCan: Function;
  showToast: Function;
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
  const [toast, setToast] = useState<ToastType>({
    msg: "",
    type: "success",
    time: 3000,
  });
  const router: any = useRouter();
  const { showToast } = useToast(toast, setToast);

  const _setStore = async (newStore: object) => {
    setStore((old: object | Function) => {
      if (typeof newStore == "function") return { ...newStore(old) };
      return { ...old, ...newStore };
    });
  };

  const getUser = async (client_id = null) => {
    setSplash(true);
    setWaiting(1, "getUser");
    let currentUser: any = false;
    try {
      const token = await JSON.parse(
        localStorage.getItem(
          (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
        ) + ""
      );
      currentUser = user || token.user;
      const credentials: any = {};
      if (client_id) credentials.client_id = client_id;
      if (currentUser) {
        const { data, error }: any = await execute(
          process.env.NEXT_PUBLIC_AUTH_IAM,
          "POST",
          credentials
        );

        if (data?.success && !error) {
          currentUser = data?.data?.user;
          localStorage.setItem(
            (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
            JSON.stringify({ token: token.token, user: data?.data?.user })
          );
        } else {
          

          if (error.status == 500) {
          
            setTimeout(async () => {
              localStorage.removeItem(
                (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
              );
              setUser(false);
              setSplash(false);
            }, 1000);
            return;
          }
          localStorage.removeItem(
            (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
          );
          setUser(false);
          setWaiting(-1, "-getUser");
          setSplash(false);
          router.reload();
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
    minResponsive: "desktop" | "tablet" | "mobile" | null = "tablet"
  ) => {
    // console.log("userCan", ability, _action, minResponsive, window.innerWidth);
    if (minResponsive != "mobile") {
      if (minResponsive == "tablet" && window.innerWidth < 498) {
        router.push("/");
        // return false;
      }
      if (minResponsive == "desktop" && window.innerWidth < 998) {
        router.push("/");
        // return false;
      }
    }
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
    if (!user.role?.abilities?.includes(ability)) return false;
    const a = user?.role?.abilities?.indexOf(ability);
    const b = (user?.role?.abilities + "|").indexOf("|", a);
    const permiso = (user.role.abilities.substring(a, b) + ":").split(":");
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
      credentials
    );

    if (data?.success && !error) {
      setUser(data?.data?.user);
      localStorage.setItem(
        (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token",
        JSON.stringify({ token: data?.data?.token, user: data?.data?.user })
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
      "POST"
    );
    localStorage.removeItem(
      (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
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
      waiting,
      setWaiting,
      splash,
      store,
      storeRef,
      setStore: _setStore,
      getUser: getUser,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, error, loaded, waiting, splash, store, storeRef]
  );

  useEffect(() => {
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (splash)
    return (
      <>
        <Toast toast={toast} showToast={setToast} />
        <Splash />
      </>
    );

  return (
    <AuthContext.Provider value={result}>
      {loaded || <Splash />}
      <Toast toast={toast} showToast={setToast} />
      {!noAuth && !user ? <Login /> : children}
      {/* {children} */}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useAuth = () => {
  const data: AuthContextType = useContext(AuthContext);
  return { ...data };
};
