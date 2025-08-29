export const ALERT_LEVELS = {
  PANIC: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
} as const;

export const ALERT_LEVEL_LABELS = {
  [ALERT_LEVELS.PANIC]: 'Nivel pánico',
  [ALERT_LEVELS.HIGH]: 'Nivel alto',
  [ALERT_LEVELS.MEDIUM]: 'Nivel medio',
  [ALERT_LEVELS.LOW]: 'Nivel bajo',
} as const;

export const ALERT_LEVEL_OPTIONS = [
  { id: 'T', name: 'Todos' },
  { id: ALERT_LEVELS.PANIC, name: ALERT_LEVEL_LABELS[ALERT_LEVELS.PANIC] },
  { id: ALERT_LEVELS.HIGH, name: ALERT_LEVEL_LABELS[ALERT_LEVELS.HIGH] },
  { id: ALERT_LEVELS.MEDIUM, name: ALERT_LEVEL_LABELS[ALERT_LEVELS.MEDIUM] },
  { id: ALERT_LEVELS.LOW, name: ALERT_LEVEL_LABELS[ALERT_LEVELS.LOW] },
];

export const getAlertLevelText = (level: number): string => {
  return ALERT_LEVEL_LABELS[level as keyof typeof ALERT_LEVEL_LABELS] || ALERT_LEVEL_LABELS[ALERT_LEVELS.MEDIUM];
};

export const getAlertLevelInfo = (level: number) => {
  switch (level) {
    case ALERT_LEVELS.PANIC:
    case ALERT_LEVELS.HIGH:
      return {
        label: ALERT_LEVEL_LABELS[level as keyof typeof ALERT_LEVEL_LABELS],
        backgroundColor: 'var(--cHoverError)',
        color: 'var(--cError)'
      };
    case ALERT_LEVELS.MEDIUM:
      return {
        label: ALERT_LEVEL_LABELS[ALERT_LEVELS.MEDIUM],
        backgroundColor: 'var(--cHoverWarning)',
        color: 'var(--cWarning)'
      };
    case ALERT_LEVELS.LOW:
      return {
        label: ALERT_LEVEL_LABELS[ALERT_LEVELS.LOW],
        backgroundColor: 'var(--cHoverSuccess)',
        color: 'var(--cSuccess)'
      };
    default:
      return {
        label: 'Nivel desconocido',
        backgroundColor: 'var(--cHoverLight)',
        color: 'var(--cLightDark)'
      };
  }
};

export const getAlertLevelFigmaColor = (level: number): string => {
  switch (level) {
    case ALERT_LEVELS.PANIC:
    case ALERT_LEVELS.HIGH:
      return "#e46055";
    case ALERT_LEVELS.MEDIUM:
      return "#e9b01e";
    case ALERT_LEVELS.LOW:
      return "#34a853";
    default:
      return "#a7a7a7";
  }
};
