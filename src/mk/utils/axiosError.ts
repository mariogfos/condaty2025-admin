export const toSafeAxiosError = (error: any) => ({
  message: error?.message,
  status: error?.response?.status,
  method: error?.config?.method,
  url: error?.config?.url,
  responseMessage: error?.response?.data?.message,
});

export const getRequestErrorMessage = (
  error: any,
  fallback = "No se pudo completar la solicitud. Intenta nuevamente.",
) => {
  if (!error) return fallback;

  const serverMessage = error?.data?.message ?? error?.response?.data?.message;
  const status = error?.status ?? error?.response?.status;
  if (typeof serverMessage === "string" && serverMessage.trim()) {
    return serverMessage;
  }

  if (status === 401) {
    return "Tu sesión venció. Inicia sesión nuevamente.";
  }

  if (!status || error?.message === "Network Error") {
    return "No se pudo contactar al servidor. Verifica tu conexión e intenta nuevamente.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};
