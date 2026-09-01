"use client";
import { logError } from "../utils/logs";
import { toSafeAxiosError } from "../utils/axiosError";
import { rememberExpiredSession } from "../utils/authSession";

const LOGIN_SCREEN_ROUTE = "/";
const authTokenKey = `${process.env.NEXT_PUBLIC_AUTH_IAM || "/adm-iam"}token`;

const redirectExpiredSession = () => {
  try {
    localStorage.removeItem(authTokenKey);
    localStorage.removeItem("condaty_client_id");
    rememberExpiredSession();
  } finally {
    window.location.href = LOGIN_SCREEN_ROUTE;
  }
};

const axiosInterceptors = (instance: any) => {
  instance.interceptors.request.use(
    (config: any) => {
      let apiToken = null;
      try {
        apiToken = JSON.parse(
          localStorage.getItem(
            authTokenKey
          ) + ""
        ).token;
      } catch (e) {
        apiToken = null;
      }

      if (apiToken) {
        config.headers = {
          ...(config.headers || {}),
          Authorization: "Bearer " + apiToken,
          accept: "application/json",
        };
      }
      return config;
    },
    (error: any) => {
      logError("Network error1:", toSafeAxiosError(error));
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: any) => {
      if (response?.status === 401) {
        redirectExpiredSession();
      }
      return response;
    },
    (error: any) => {
      if (error.response?.status === 401) {
        redirectExpiredSession();
      }
      logError("Network error:", toSafeAxiosError(error));
      return Promise.reject(error);
    }
  );
};

export default axiosInterceptors;
