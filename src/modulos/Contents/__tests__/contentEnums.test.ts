import { describe, expect, it } from "vitest";

import {
  ContentDestiny,
  ContentType,
  OPCIONES_DE_DESTINO,
  esDocumento,
  esImagen,
  esVideo,
  OPCIONES_DE_TIPO,
  FILTRO_DE_TIPO,
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

/**
 * ────────────────────────────────────────────────────────────────────────
 * 🔴🔴 ESTE ARCHIVO PASABA MIENTRAS TRES PANTALLAS ESTABAN ROTAS
 * ────────────────────────────────────────────────────────────────────────
 *
 * Los casos de arriba miden el HELPER. Y el helper estaba bien: lo que faltaba
 * era que las pantallas lo usaran.
 *
 * Medido el 2026-09-02, `contents.type` seguia comparado contra chars en:
 *
 * | pantalla | que pasaba |
 * |---|---|
 * | `Contents/RenderView` | las tres ramas falsas → el ultimo `else`: **«Sin contenido disponible»** |
 * | `Reel/MediaRenderer`  | las tres falsas → `return null`: el reel no pintaba NADA |
 * | `Contents.tsx:43`     | `type == "D"`, en la linea siguiente a dos que SI estaban migradas |
 *
 * En produccion hay 143 publicaciones —140 imagenes, 2 documentos, 1 video—:
 * el detalle no mostraba ninguna.
 *
 * Los catalogos de abajo son lo que faltaba pinear: mientras los ids del
 * selector y del filtro fueran chars, la pantalla podia seguir mandando letras
 * aunque el helper supiera leer numeros.
 */
describe("los catalogos que arman el selector y el filtro", () => {
  it("el selector del formulario ofrece los numeros del enum", () => {
    expect(OPCIONES_DE_TIPO.map((o) => o.id)).toEqual([
      ContentType.IMAGEN,
      ContentType.VIDEO,
      ContentType.DOCUMENTO,
    ]);
    // Ni uno solo puede ser un char: el API valida con `Rule::enum(ContentType)`.
    for (const opcion of OPCIONES_DE_TIPO) {
      expect(typeof opcion.id).toBe("number");
    }
  });

  it("el filtro de la lista tambien, y conserva su ALL", () => {
    expect(FILTRO_DE_TIPO[0]).toMatchObject({ id: "ALL" });
    for (const opcion of FILTRO_DE_TIPO.slice(1)) {
      expect(typeof opcion.id).toBe("number");
    }
  });

  it("el selector conserva las extensiones que acepta cada tipo", () => {
    const porTipo = Object.fromEntries(OPCIONES_DE_TIPO.map((o) => [o.id, o.ext]));
    expect(porTipo[ContentType.IMAGEN]).toContain("png");
    expect(porTipo[ContentType.VIDEO]).toBe("mp4");
    expect(porTipo[ContentType.DOCUMENTO]).toContain("pdf");
  });
});
