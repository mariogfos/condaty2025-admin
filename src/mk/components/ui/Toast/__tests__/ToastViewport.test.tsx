import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ToastItem } from "@/mk/hooks/useToast";
import ToastViewport from "../ToastViewport";

describe("ToastViewport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      window.setTimeout(() => callback(performance.now()), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      window.clearTimeout(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("cierra el toast aunque el provider rerenderice durante la animacion de salida", () => {
    const toast: ToastItem = {
      id: "toast-1",
      msg: "Asamblea finalizada",
      type: "info",
      time: 1000,
      createdAt: 1,
    };
    const firstDismiss = vi.fn();
    const secondDismiss = vi.fn();

    const { rerender } = render(
      <ToastViewport toasts={[toast]} onDismiss={firstDismiss} />,
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    rerender(<ToastViewport toasts={[toast]} onDismiss={secondDismiss} />);

    act(() => {
      vi.advanceTimersByTime(79);
    });

    expect(firstDismiss).not.toHaveBeenCalled();
    expect(secondDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(firstDismiss).not.toHaveBeenCalled();
    expect(secondDismiss).toHaveBeenCalledWith("toast-1");
  });
});
