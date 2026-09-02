import { describe, it, expect } from "vitest";
import {
  calcularPosicionDelDesplegable,
  type Rectangulo,
} from "../posicionDelDesplegable";

const ventana = { width: 1280, height: 700 };

const campoEn = (top: number, left = 100, width = 200): Rectangulo => ({
  top,
  bottom: top + 44,
  left,
  width,
});

describe("el desplegable no se sale de la pantalla", () => {
  it("con lugar abajo, se abre abajo y pegado al campo", () => {
    const { top } = calcularPosicionDelDesplegable(campoEn(100), ventana, 300);
    // 100 + 44 (alto del campo) + 8 (separacion)
    expect(top).toBe(152);
  });

  it("sin lugar abajo y con lugar arriba, se abre arriba", () => {
    const { top } = calcularPosicionDelDesplegable(campoEn(600), ventana, 300);
    // 600 - 300 - 8
    expect(top).toBe(292);
  });

  /**
   * El caso que se cortaba. Un campo a 300px con un desplegable de 376px:
   * abajo no entra (700 - 344 - 12 = 344 < 376) y arriba hay mas lugar
   * (288 > 344? no) ... arriba hay 288 y abajo 344, asi que abre ABAJO y se
   * acota. Antes hacia `top = 300 - 376 = -76` y el buscador quedaba fuera.
   */
  it("nunca devuelve un top negativo", () => {
    for (let top = 200; top <= 500; top += 10) {
      const posicion = calcularPosicionDelDesplegable(campoEn(top), ventana, 376);
      expect(posicion.top).toBeGreaterThanOrEqual(12);
    }
  });

  it("un campo alto y un desplegable alto siguen entrando en la pantalla", () => {
    // El caso exacto que se cortaba antes: abre hacia arriba y no llega.
    const { top } = calcularPosicionDelDesplegable(
      { top: 300, bottom: 344, left: 100, width: 200 },
      { width: 1280, height: 500 },
      376,
    );
    expect(top).toBe(12);
  });

  it("un campo pegado al borde derecho no se sale", () => {
    // El desplegable puede ser mas ancho que su campo: `width: max-content`,
    // hasta 420px.
    const { left } = calcularPosicionDelDesplegable(
      campoEn(100, 1000, 200),
      ventana,
      300,
      420,
    );
    // 1280 - 420 - 12
    expect(left).toBe(848);
  });

  it("sin el ancho real, se acota con el del campo", () => {
    const { left } = calcularPosicionDelDesplegable(campoEn(100, 1200, 200), ventana, 300);
    expect(left).toBe(1280 - 200 - 12);
  });

  it("un campo pegado al borde izquierdo respeta el margen", () => {
    const { left } = calcularPosicionDelDesplegable(campoEn(100, 0, 200), ventana, 300);
    expect(left).toBe(12);
  });

  it("en la primera apertura, sin alto todavia, abre abajo", () => {
    const { top } = calcularPosicionDelDesplegable(campoEn(600), ventana);
    // Sin alto no se puede decidir: abajo, pegado al campo.
    expect(top).toBe(652);
  });

  it("el ancho que devuelve sigue siendo el del campo", () => {
    // Es un `minWidth`: el CSS pone `width: max-content` y su propio max-width.
    const { width } = calcularPosicionDelDesplegable(campoEn(100, 100, 333), ventana, 300);
    expect(width).toBe(333);
  });
});
