/**
 * La sesión de presencia en curso, para que el logout la cierre como `logout`
 * (`presence_session_id`) en vez de dejarla morir por inactividad.
 */
let currentSessionId: string | null = null;

export const getPresenceSessionId = () => currentSessionId;

export const setPresenceSessionId = (sessionId: string | null) => {
  currentSessionId = sessionId;
};
