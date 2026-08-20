/**
 * CDT-74 — no había forma de cerrar un toast a mano.
 *
 * 🔴 Lo que lo impedía NO era el `pointer-events: none`: era que la tarjeta no
 * tenía botón de cerrar. Y ese `none` tiene que quedarse donde está — el
 * `.viewport` es `position: fixed`, 720 px, arriba y al centro, así que con
 * eventos activos se come los clicks del header y del buscador que tiene
 * debajo, incluso estando invisible.
 *
 * La forma correcta es un botón con `pointer-events: auto` sobre una tarjeta
 * que sigue en `none`: la propiedad se resuelve por elemento, no se hereda
 * como un candado.
 *
 * ⚠️ Cerrar pasa por la etapa `leaving`, igual que el vencimiento del reloj. Es
 * lo que sostiene que este cambio NO toque la máquina de estados de CDT-68: el
 * `onDismiss` sigue llegando por el mismo camino y después de la misma
 * animación.
 */
import { act, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ToastItem } from "@/mk/hooks/useToast";
import ToastViewport, { EXIT_ANIMATION_MS } from "../ToastViewport";

const unToast = (over: Partial<ToastItem> = {}): ToastItem => ({
  id: "toast-1",
  msg: "Recibo generado con éxito.",
  type: "success",
  time: 5000,
  createdAt: 1,
  ...over,
});

describe("CDT-74 — el toast se puede cerrar a mano", () => {
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

  it("el botón de cerrar existe y descarta el toast sin esperar los 5 s", () => {
    const onDismiss = vi.fn();
    render(<ToastViewport toasts={[unToast()]} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(0); // entra
    });

    const cerrar = screen.getByRole("button", { name: "Cerrar aviso" });
    fireEvent.click(cerrar);

    // Todavía no: primero corre la animación de salida, igual que cuando vence
    // el reloj. Esta aserción es la que fija que NO se llame de una.
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });

    expect(onDismiss).toHaveBeenCalledWith("toast-1");
    // Y muchísimo antes de los 5 s de vida, que es todo el punto del ticket.
    expect(EXIT_ANIMATION_MS).toBeLessThan(5000);
  });

  it("cerrar uno no toca a los otros tres de la cola", () => {
    const onDismiss = vi.fn();
    const cola = [
      unToast({ id: "t-1", msg: "Primero" }),
      unToast({ id: "t-2", msg: "Segundo" }),
      unToast({ id: "t-3", msg: "Tercero" }),
    ];
    render(<ToastViewport toasts={cola} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const botones = screen.getAllByRole("button", { name: "Cerrar aviso" });
    expect(botones).toHaveLength(3);

    // El viewport invierte el orden: el más nuevo va arriba.
    fireEvent.click(botones[0]);
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith("t-3");
  });

  /**
   * 🔴 El pin que protege el arreglo de CDT-68: el reloj de vida sigue
   * colgando de la etapa VISIBLE. Si alguien "simplificara" el botón llamando
   * a `onDismiss` directo, este caso no lo notaría — por eso el primero afirma
   * que NO se llama antes de la animación. Éste fija la otra mitad: un toast
   * que nadie toca sigue yéndose solo a los 5 s.
   */
  it("el toast que nadie cierra sigue yéndose solo, como antes", () => {
    const onDismiss = vi.fn();
    render(<ToastViewport toasts={[unToast({ time: 5000 })]} onDismiss={onDismiss} />);

    act(() => {
      vi.advanceTimersByTime(0);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    // ⚠️ En DOS pasos, no en uno. Avanzar `5000 + EXIT_ANIMATION_MS` de una
    // sola vez NO alcanza: a los 5 s la etapa pasa a `leaving`, pero el efecto
    // que agenda el `onDismiss` se monta en el render siguiente, cuando el
    // reloj falso ya consumió todo el tramo. Un solo avance deja el test en
    // rojo con el código CORRECTO — lo medí.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(EXIT_ANIMATION_MS);
    });
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });
});
