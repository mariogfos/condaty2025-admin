/**
 * CDT-74 — `showToast` devuelve el id del toast que encoló.
 *
 * Sin eso no había forma de que una pantalla retirara SU toast cuando dejaba de
 * ser cierto. El caso del ticket: «Generando recibo…» se emitía con los 5 s por
 * defecto y el de éxito llegaba después, así que quedaban los dos en pantalla
 * unos segundos — uno diciendo que está generando y el otro que ya se generó.
 *
 * 🔴 El item se crea FUERA del updater de `setState`, y eso no es estilo: un
 * updater puede correr dos veces en modo estricto, y con `createToastItem`
 * adentro el id devuelto sería distinto del que quedó en la cola.
 */
import { describe, it, expect, vi } from "vitest";
import useToast, { appendToastItem, type ToastItem } from "../useToast";

/** Ejercita el hook sin montarlo: `useToast` no usa estado propio de React. */
const conCola = () => {
  let cola: ToastItem[] = [];
  const setToastQueue = vi.fn((updater: any) => {
    cola = typeof updater === "function" ? updater(cola) : updater;
  });
  const { showToast } = useToast(setToastQueue);
  return { showToast, verCola: () => cola };
};

describe("CDT-74 — showToast devuelve el id de lo que encoló", () => {
  it("el id devuelto es EL MISMO que quedó en la cola", () => {
    const { showToast, verCola } = conCola();

    const id = showToast("Generando recibo...", "info");

    expect(id).toBeTruthy();
    expect(verCola()).toHaveLength(1);
    // 🔴 Acá vivía el riesgo: si el item se creara dentro del updater, este
    // id y el de la cola serían distintos y el descarte no encontraría nada.
    expect(verCola()[0].id).toBe(id);
  });

  it("con ese id se puede sacar ese toast y sólo ese", () => {
    const { showToast, verCola } = conCola();

    const idProgreso = showToast("Generando recibo...", "info");
    showToast("Otra cosa que pasó", "success");
    expect(verCola()).toHaveLength(2);

    const quedan = verCola().filter((t) => t.id !== idProgreso);
    expect(quedan).toHaveLength(1);
    expect(quedan[0].msg).toBe("Otra cosa que pasó");
  });

  /**
   * ⚠️ El caso incómodo, escrito para que nadie lo "arregle": un duplicado
   * reciente NO se encola (`appendToastItem` lo descarta), pero `showToast`
   * devuelve el id igual. Descartar por un id que no está es inofensivo —el
   * filtro no encuentra nada—, así que quien lo use no necesita chequearlo.
   */
  it("un duplicado reciente devuelve id aunque no se encole, y eso no rompe nada", () => {
    const { showToast, verCola } = conCola();

    const primero = showToast("Generando recibo...", "info");
    const segundo = showToast("Generando recibo...", "info");

    expect(verCola()).toHaveLength(1);
    expect(segundo).toBeTruthy();
    expect(segundo).not.toBe(primero);

    // Sacar por el id del que nunca entró deja la cola intacta.
    expect(verCola().filter((t) => t.id !== segundo)).toHaveLength(1);
  });

  it("un mensaje vacío sigue sin encolar y no devuelve id (CDT-60)", () => {
    const { showToast, verCola } = conCola();

    expect(showToast("", "error")).toBeUndefined();
    expect(verCola()).toHaveLength(0);
  });
});
