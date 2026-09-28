import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Las publicaciones van por `/v3/contents`, la ruta canónica del módulo.
 *
 * `/api/contents` es un alias legacy del MISMO controller (`routes/api.php`)
 * y hoy responde igual; el listado y el detalle ya iban por `v3` (vía
 * `useCrud`, `modulo: "v3/contents"`), pero publicar, editar y el muro seguían
 * por el alias. Mientras el alias exista, volver a él no rompe nada visible:
 * por eso se pinea el texto y no el comportamiento.
 *
 * ⚠️ `/content-like` NO tiene ruta `v3` y se queda como está: el patrón de
 * abajo no lo toca porque exige `contents` con `s`.
 */
const ARCHIVOS = [
  "src/modulos/Reel/Reel.tsx",
  "src/modulos/Contents/AddContent/AddContent.tsx",
  "src/modulos/Contents/RenderView/RenderView.tsx",
];

// Los que llaman de verdad. `RenderView` ya no pide nada (recibe la
// publicación cargada); sigue arriba para que una llamada nueva no vuelva por
// el alias.
const LOS_QUE_LLAMAN = [
  "src/modulos/Reel/Reel.tsx",
  "src/modulos/Contents/AddContent/AddContent.tsx",
];

// `"/contents` o `` `/contents `` — el alias legacy. `/v3/contents` no matchea
// porque el `/` de antes de `contents` tiene que ser el primero de la cadena.
const RUTA_LEGACY = /["'`]\/contents\b/g;

describe("las publicaciones del admin van por /v3", () => {
  it.each(ARCHIVOS)("%s no llama al alias legacy", (archivo) => {
    const texto = readFileSync(join(process.cwd(), archivo), "utf8");

    expect(texto.match(RUTA_LEGACY)).toBeNull();
  });

  // La otra mitad: sin esto el test pasaría también si alguien borrara las
  // llamadas en vez de arreglarlas.
  it.each(LOS_QUE_LLAMAN)("%s sigue llamando a /v3/contents", (archivo) => {
    const texto = readFileSync(join(process.cwd(), archivo), "utf8");

    expect(texto).toContain('"/v3/contents"');
  });
});
