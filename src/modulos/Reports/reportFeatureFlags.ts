const ENABLED_FLAG_VALUES = new Set([
  "1",
  "true",
  "yes",
  "on",
]);

const normalizeFlagValue = (value: string | undefined) =>
  (value || "").trim().toLowerCase();

export const isNewReportsViewerEnabled = () =>
  ENABLED_FLAG_VALUES.has(
    normalizeFlagValue(process.env.NEXT_PUBLIC_REPORTS_VIEWER_ENABLED),
  );

export const shouldUseNewReportsViewer = (
  reportPreset: string | null | undefined,
) => Boolean(reportPreset) && isNewReportsViewerEnabled();
