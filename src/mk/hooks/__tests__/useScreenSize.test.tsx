import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useScreenSize } from "../useScreenSize";

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
};

describe("useScreenSize", () => {
  it("en un celular, el PRIMER render ya dice móvil, sin un segundo render", () => {
    setViewportWidth(480);
    const renders: ReturnType<typeof useScreenSize>[] = [];

    renderHook(() => {
      const size = useScreenSize();
      renders.push(size);
      return size;
    });

    expect(renders.map((size) => size.isMobile)).toEqual([true]);
  });

  it("sigue el resize y conserva la identidad mientras el ancho no cambia", () => {
    setViewportWidth(1280);
    const { result, rerender } = renderHook(() => useScreenSize());
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
    expect(first).toEqual({
      width: 1280,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    });

    act(() => {
      setViewportWidth(480);
      window.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toEqual({
      width: 480,
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });
  });
});
