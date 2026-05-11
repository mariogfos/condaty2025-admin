export type ReportViewerState = {
  params?: Record<string, any>;
};

export const encodeReportViewerState = (state: ReportViewerState) => {
  try {
    return encodeURIComponent(JSON.stringify(state || {}));
  } catch (_error) {
    return "";
  }
};

export const decodeReportViewerState = (
  value: string | null | undefined,
): ReportViewerState => {
  if (!value) return {};

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch (_error) {
    return {};
  }
};
