import {
  isNewReportsViewerEnabled,
  shouldUseNewReportsViewer,
} from "../reportFeatureFlags";

describe("reportFeatureFlags", () => {
  const originalFlag = process.env.NEXT_PUBLIC_REPORTS_VIEWER_ENABLED;

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_REPORTS_VIEWER_ENABLED;
      return;
    }

    process.env.NEXT_PUBLIC_REPORTS_VIEWER_ENABLED = originalFlag;
  });

  it("uses legacy reports by default", () => {
    delete process.env.NEXT_PUBLIC_REPORTS_VIEWER_ENABLED;

    expect(isNewReportsViewerEnabled()).toBe(false);
    expect(shouldUseNewReportsViewer("payments-income")).toBe(false);
  });

  it("enables the new reports viewer only with an explicit truthy flag", () => {
    process.env.NEXT_PUBLIC_REPORTS_VIEWER_ENABLED = "true";

    expect(isNewReportsViewerEnabled()).toBe(true);
    expect(shouldUseNewReportsViewer("payments-income")).toBe(true);
    expect(shouldUseNewReportsViewer("")).toBe(false);
  });
});
