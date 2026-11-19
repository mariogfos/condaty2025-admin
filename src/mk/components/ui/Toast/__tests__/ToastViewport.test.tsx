import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TOAST_TIME, createToastItem, type ToastItem } from "@/mk/hooks/useToast";
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
      createdAt: Date.now(),
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

  it("retira el aviso aunque el navegador no ejecute el frame de entrada", () => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    const toast = createToastItem("Comprobante recibido", "info", 1000);
    const onDismiss = vi.fn();
    render(<ToastViewport toasts={[toast]} onDismiss={onDismiss} />);

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(180));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith(toast.id);
  });

  it("mantiene el vencimiento original al remontar la vista", () => {
    const toast = createToastItem("Reserva confirmada", "info", 1000);
    const onDismiss = vi.fn();
    const first = render(<ToastViewport toasts={[toast]} onDismiss={onDismiss} />);
    act(() => vi.advanceTimersByTime(900));
    first.unmount();
    render(<ToastViewport toasts={[toast]} onDismiss={onDismiss} />);

    act(() => vi.advanceTimersByTime(100));
    act(() => vi.advanceTimersByTime(180));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith(toast.id);
  });

  it.each([0, Infinity])("usa el plazo normal si la duración es %s", (duration) => {
    const toast = createToastItem("Aviso", "info", duration);
    const onDismiss = vi.fn();
    render(<ToastViewport toasts={[toast]} onDismiss={onDismiss} />);

    act(() => vi.advanceTimersByTime(DEFAULT_TOAST_TIME - 1));
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    act(() => vi.advanceTimersByTime(180));

    expect(onDismiss).toHaveBeenCalledWith(toast.id);
  });

  it("la X cierra solo el aviso seleccionado y los demás vencen solos", () => {
    const older = createToastItem("Primer aviso", "info", 1000);
    const newer = createToastItem("Segundo aviso", "warning", 2000);
    const onDismiss = vi.fn();
    const Queue = () => {
      const [toasts, setToasts] = useState([older, newer]);
      return (
        <ToastViewport
          toasts={toasts}
          onDismiss={(id) => {
            onDismiss(id);
            setToasts((current) => current.filter((toast) => toast.id !== id));
          }}
        />
      );
    };
    render(<Queue />);
    act(() => vi.advanceTimersByTime(0));

    fireEvent.click(screen.getAllByRole("button", { name: "Cerrar notificación" })[0]);
    expect(screen.queryByText("Segundo aviso")).toBeNull();
    expect(screen.getByText("Primer aviso")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(180));
    act(() => vi.advanceTimersByTime(2000));

    expect(screen.queryByText("Primer aviso")).toBeNull();
    expect(onDismiss.mock.calls).toEqual([[newer.id], [older.id]]);
  });
});
