"use client";
import { logError } from "../utils/logs";

const axiosInterceptors = (instance: any) => {
  instance.interceptors.request.use(
    (config: any) => {
      let apiToken = null;
      try {
        apiToken = JSON.parse(
          localStorage.getItem(
            (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
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
      logError("Network error1:", error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response: any) => {
      if (response?.status === 401) {
        localStorage.removeItem(
          (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
        );
        window.location.href = "/" + process.env.NEXT_PUBLIC_AUTH_LOGIN;
      }
      return response;
    },
    (error: any) => {
      if (error.response?.status === 401) {
        localStorage.removeItem(
          (process.env.NEXT_PUBLIC_AUTH_IAM as string) + "token"
        );
        window.location.href = "/login";
      }
      logError("Network error:", error);
      return Promise.reject(error);
    }
  );
};

export default axiosInterceptors;
