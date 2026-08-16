import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useState } from "react";

import useToast, { ToastItem } from "../useToast";

/**
 * Un pedido de toast SIN mensaje no borra los que ya están en pantalla.
 *
 * ## 🔴 Qué se rompía (CDT-60)
 *
 * `showToast` con mensaje vacío hacía `setToastQueue([]); return;`. Eso lo
 * convertía en el arma perfecta para tapar un error: cuando un request muere no
 * llega sobre de respuesta, `showToast(response?.message, "error")` viaja sin
 * texto, y en vez de avisar algo el hook BARRÍA la cola. Dos daños en la misma
 * línea: el error del guardado no se ve, y el aviso que el usuario ya tenía en
 * pantalla —de otra pantalla, de otro flujo— desaparece sin que nadie lo pida.
 *
 * Pedir un toast sin texto no es una orden de limpiar: es una llamada que se
 * quedó sin mensaje. Se ignora. Para SACAR un toast está el `onDismiss` del
 * `ToastViewport`, que lo quita por `id` y no toca los demás.
 *
 * ## Reinyección, medida el 2026-08-16
 *
 * Con `setToastQueue([])` de vuelta: **2/4 rojos**.
 */

const montarCola = () =>
  renderHook(() => {
    const [cola, setCola] = useState<ToastItem[]>([]);
    const { showToast } = useToast(setCola);
    return { cola, showToast };
  });

describe("useToast: el mensaje vacío", () => {
  it("no se lleva puesto un toast que ya estaba en pantalla", () => {
    const { result } = montarCola();

    act(() => result.current.showToast("Reserva creada", "success"));
    expect(result.current.cola).toHaveLength(1);

    // El caso real: un `showToast(response?.message, "error")` con el request
    // caído. Llega sin texto.
    act(() => result.current.showToast(undefined as any, "error"));

    // 🔴 Acá la cola quedaba en [] y el "Reserva creada" desaparecía.
    expect(
      result.current.cola,
      "un pedido sin mensaje no borra los avisos que ya están",
    ).toHaveLength(1);
    expect(result.current.cola[0].msg).toBe("Reserva creada");
  });

  it("el string vacío tampoco borra la cola", () => {
    const { result } = montarCola();

    act(() => result.current.showToast("Egreso guardado", "success"));
    act(() => result.current.showToast(""));

    expect(result.current.cola).toHaveLength(1);
    expect(result.current.cola[0].msg).toBe("Egreso guardado");
  });

  it("tampoco encola un toast en blanco", () => {
    const { result } = montarCola();

    act(() => result.current.showToast("", "error"));

    // Ni borra ni inventa: un toast sin texto es una caja vacía en pantalla.
    expect(result.current.cola).toHaveLength(0);
  });

  it("un mensaje con texto sigue encolando normal", () => {
    const { result } = montarCola();

    act(() => result.current.showToast("No se pudo guardar", "error"));

    expect(result.current.cola).toHaveLength(1);
    expect(result.current.cola[0].msg).toBe("No se pudo guardar");
    expect(result.current.cola[0].type).toBe("error");
  });

  it("sin `setToastQueue` no revienta", () => {
    const { result } = renderHook(() => useToast());
    expect(() => result.current.showToast("")).not.toThrow();
    expect(vi.isMockFunction(result.current.showToast)).toBe(false);
  });
});
