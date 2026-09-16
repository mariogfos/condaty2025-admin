let currentSessionId: string | null = null;

export const getPresenceSessionId = () => currentSessionId;

export const setPresenceSessionId = (sessionId: string | null) => {
  currentSessionId = sessionId;
};
