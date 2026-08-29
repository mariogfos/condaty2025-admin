import { describe, expect, it } from "vitest";

import {
  ContentDestiny,
  ContentType,
  OPCIONES_DE_DESTINO,
  esDocumento,
  esImagen,
  esVideo,
} from "../contentEnums";

/**
 * 🔴🔴 Éste es el flip que más comparaciones VIVAS toca.
 *
 * En los flips anteriores las del front estaban **inertes**. Acá **funcionan**:
 * **17 comparaciones** en tres archivos deciden qué botón queda activo, qué
 * campo se muestra y qué columna se pinta.
 *
 * Con la columna numérica todas darían `false`: el formulario abriría sin ningún
 * tipo seleccionado y la lista dejaría de distinguir imagen de video, **sin un
 * solo error**.
 */
describe("contentEnums — qué clase de publicación es", () => {
  it("reconoce el número, venga como número o como string", () => {
    expect(esImagen(ContentType.IMAGEN)).toBe(true);
    expect(esDocumento("2")).toBe(true);
    expect(esVideo(3)).toBe(true);
  });

  /**
   * 🔴 La letra vieja ya no la manda el API. Leerla como un tipo válido
   * escondería que algo quedó sin migrar.
   */
  it("la letra vieja ya no es un tipo", () => {
    expect(esImagen("I")).toBe(false);
    expect(esDocumento("D")).toBe(false);
    expect(esVideo("V")).toBe(false);
  });

  /**
   * ⚠️ Los tres son excluyentes. Sin este caso, un helper que devolviera `true`
   * siempre pasaría los dos de arriba — y en esta pantalla eso dejaría los tres
   * botones activos a la vez.
   */
  it("los tres tipos son excluyentes", () => {
    expect([esImagen(1), esDocumento(1), esVideo(1)]).toEqual([true, false, false]);
    expect([esImagen(2), esDocumento(2), esVideo(2)]).toEqual([false, true, false]);
    expect([esImagen(3), esDocumento(3), esVideo(3)]).toEqual([false, false, true]);
  });

  it("lo vacío no es ningún tipo", () => {
    for (const vacio of [undefined, null, "", 0]) {
      expect([esImagen(vacio), esDocumento(vacio), esVideo(vacio)]).toEqual([
        false,
        false,
        false,
      ]);
    }
  });

  /**
   * 🔴 Los ids del destino son lo que se guarda. `lComDestinies` de
   * `@/mk/utils/utils` sigue en letras porque lo comparte **Encuestas**, sin
   * migrar: por eso Contenidos se lleva su propia lista.
   */
  it("las opciones de destino mandan el número que el API guarda", () => {
    expect(OPCIONES_DE_DESTINO.map((o) => o.id)).toEqual([1, 2, 3, 4]);
    expect(ContentDestiny.TODOS).toBe(1);
  });
});
