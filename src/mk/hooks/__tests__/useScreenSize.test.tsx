import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useScreenSize } from "../useScreenSize";

const resizeViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
};

describe("useScreenSize", () => {
  it("updates only from the viewport snapshot and preserves a stable value between renders", () => {
    resizeViewport(1280);
    const { result, rerender } = renderHook(() => useScreenSize());
    const firstSnapshot = result.current;

    rerender();
    expect(result.current).toBe(firstSnapshot);
    expect(result.current).toEqual({
      width: 1280,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    act(() => resizeViewport(480));
    expect(result.current).toEqual({
      width: 480,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });
  });
});
