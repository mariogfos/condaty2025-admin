import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 🔴🔴 `/api/comments` NO EXISTE, y las cuatro llamadas del admin le pegaban.
 *
 * El módulo se movió a `/api/v3/comments` en S71 y la línea legacy quedó
 * comentada en `routes/api.php:182`. Medido con `php artisan route:list
 * --path=comments`: no hay ninguna ruta `api/comments`.
 *
 * ⚠️ Y no se ve como un error: los `catch` de las dos pantallas dejan la lista
 * vacía, así que el administrador lee **"no hay comentarios"** en una
 * publicación que sí los tiene, y al comentar no pasa nada.
 *
 * Se mide sobre el TEXTO del archivo y no renderizando: el defecto es una
 * cadena de URL, no un comportamiento. Un test que monte el componente mediría
 * el mock de axios, no la ruta que sale.
 */
const ARCHIVOS = [
  "src/components/CommentsModal/CommentsModal.tsx",
  "src/modulos/Reel/Reel.tsx",
];

// `"/comments` o `` `/comments `` — la ruta legacy. `/v3/comments` no matchea
// porque el `/` de antes de `comments` tiene que ser el primero de la cadena.
const RUTA_LEGACY = /["'`]\/comments/g;

describe("los comentarios del admin van por /v3", () => {
  it.each(ARCHIVOS)("%s no llama a la ruta legacy", (archivo) => {
    const texto = readFileSync(join(process.cwd(), archivo), "utf8");

    expect(texto.match(RUTA_LEGACY)).toBeNull();
  });

  // La otra mitad: sin esto el test pasaría también si alguien borrara las
  // llamadas en vez de arreglarlas.
  it.each(ARCHIVOS)("%s sigue llamando a /v3/comments", (archivo) => {
    const texto = readFileSync(join(process.cwd(), archivo), "utf8");

    expect(texto).toContain("/v3/comments");
  });
});
