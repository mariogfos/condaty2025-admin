export const AUTH_SESSION_MESSAGE_KEY = "condaty_auth_session_message";
export const AUTH_SESSION_EXPIRED_MESSAGE =
  "Tu sesión venció. Inicia sesión nuevamente.";

export const rememberExpiredSession = () => {
  sessionStorage.setItem(
    AUTH_SESSION_MESSAGE_KEY,
    AUTH_SESSION_EXPIRED_MESSAGE,
  );
};

export const consumeAuthSessionMessage = () => {
  const message = sessionStorage.getItem(AUTH_SESSION_MESSAGE_KEY);
  if (message) sessionStorage.removeItem(AUTH_SESSION_MESSAGE_KEY);
  return message;
};
