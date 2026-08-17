import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ToastItem } from "@/mk/hooks/useToast";
import ToastViewport, { EXIT_ANIMATION_MS } from "../ToastViewport";

/**
 * CDT-68 — el toast que se emite con la pestaña oculta no se iba nunca.
 *
 * 🔴 Este test corre con `visibilityState = "hidden"` y con el
 * `requestAnimationFrame` PENDIENTE a propósito. Un test con la pestaña visible
 * pasa igual con el bug puesto: el `rAF` corre, `hasEntered` queda en `true` y
 * el descarte funciona. La condición real es la de Pagos, donde el toast del
 * recibo y el de WhatsApp se emiten después de un `window.open`
 * (`src/modulos/Payments/RenderView/RenderView.tsx:166` y `:203`), que manda la
 * pestaña al fondo y deja el frame sin correr.
 *
 * Se afirman las dos mitades: con la pestaña oculta el toast espera al usuario
 * y DESPUÉS se descarta; con la pestaña visible la animación de entrada y los
 * 5 s de siempre no cambian.
 */
/**
 * `TOAST_TIME` es la entrada que ELIGE el test (el `time` del toast), así que va
 * como literal. `EXIT_ANIMATION_MS` se importa del componente: repetir el 180
 * acá dejaba el test verde midiendo la duración vieja si alguien la cambiaba.
 */
const TOAST_TIME = 5000;

const buildToast = (): ToastItem => ({
  id: "toast-recibo",
  msg: "Recibo generado con éxito.",
  type: "success",
  time: TOAST_TIME,
  createdAt: 1,
});

describe("ToastViewport con la pestaña oculta (CDT-68)", () => {
  let pendingFrames: FrameRequestCallback[] = [];

  const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => state,
    });
  };

  /** El `rAF` que el navegador tenía suspendido corre al volver a la pestaña. */
  const flushFrames = () => {
    const frames = pendingFrames;
    pendingFrames = [];
    frames.forEach((frame) => frame(performance.now()));
  };

  beforeEach(() => {
    vi.useFakeTimers();
    pendingFrames = [];
    // El `rAF` NO se resuelve solo: acá lo decide el test, como en una pestaña
    // oculta lo decide el navegador.
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      pendingFrames.push(callback);
      return pendingFrames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    setVisibility("visible");
  });

  it("con la pestaña oculta espera al usuario y despues descarta el toast", () => {
    setVisibility("hidden");
    const onDismiss = vi.fn();
    const card = () =>
      document.querySelector<HTMLElement>('[role="status"]');

    render(<ToastViewport toasts={[buildToast()]} onDismiss={onDismiss} />);

    // El frame quedó pendiente: el toast todavía no se vio.
    expect(pendingFrames).toHaveLength(1);
    expect(card()?.style.opacity).toBe("0");

    // Pasa de largo el reloj de vida entero con la pestaña al fondo. El toast
    // NO se descarta: el usuario no llegó a leerlo.
    //
    // Va en dos tandas a propósito: un timer que se agende DURANTE la primera
    // (la animación de salida) tiene que poder vencer en la segunda. Con todo
    // en un solo `act` el descarte queda agendado y sin correr, y el test se
    // pondría verde por el batching de React, no por el arreglo.
    act(() => {
      vi.advanceTimersByTime(TOAST_TIME + 1000);
    });
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS + 1000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
    expect(card()).not.toBeNull();

    // El usuario vuelve a la pestaña: el navegador corre el frame suspendido.
    setVisibility("visible");
    act(() => {
      flushFrames();
    });

    expect(card()?.style.opacity).toBe("1");

    // Y a partir de ACÁ corren los 5 s: el toast se va.
    act(() => {
      vi.advanceTimersByTime(TOAST_TIME);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });

    expect(onDismiss).toHaveBeenCalledWith("toast-recibo");
  });

  it("con la pestaña visible entra animado y se descarta a los 5 s como siempre", () => {
    setVisibility("visible");
    const onDismiss = vi.fn();
    const card = () =>
      document.querySelector<HTMLElement>('[role="status"]');

    render(<ToastViewport toasts={[buildToast()]} onDismiss={onDismiss} />);

    // Arranca corrido y transparente: es el primer fotograma de la entrada.
    expect(card()?.style.transform).toContain("translate3d(0, -18px, 0)");
    expect(card()?.style.opacity).toBe("0");

    act(() => {
      flushFrames();
    });

    // Y el frame lo lleva a su lugar, opaco: la animación de entrada sigue.
    expect(card()?.style.transform).toContain("translate3d(0, 0px, 0)");
    expect(card()?.style.opacity).toBe("1");

    act(() => {
      vi.advanceTimersByTime(TOAST_TIME - 1);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    expect(card()?.style.opacity).toBe("1");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // Ya arrancó la salida, pero el descarte espera a que termine.
    expect(card()?.style.opacity).toBe("0");
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });

    expect(onDismiss).toHaveBeenCalledWith("toast-recibo");
  });
});
