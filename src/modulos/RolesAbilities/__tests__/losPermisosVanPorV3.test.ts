import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 🔴 El catálogo de permisos se mudó a `/api/v3/abilities`.
 *
 * Vivía en `routes/api.php` **sin prefijo** —`/api/abilities`— y su controller
 * en `app/Http/Controllers`. Los dos se mudaron al módulo el 2026-08-30
 * (`api#…`), y la ruta vieja **ya no existe**: sin este cambio la pantalla de
 * Permisos come 404 y el editor de roles se queda sin opciones.
 *
 * ⚠️ Su módulo hermano, `RolesCategories`, ya llamaba a `v3/ability-categories`
 * desde S70. Éste quedó atrás **cuatro meses** — la misma forma que mordió 119
 * veces en los `rn`, y en Tipos de unidad y en Comentarios.
 *
 * Se mide sobre el TEXTO del archivo: el defecto es una cadena de URL, no un
 * comportamiento.
 */
const ARCHIVO = "src/modulos/RolesAbilities/RolesAbilities.tsx";

describe("los permisos van por /v3", () => {
  const texto = () => readFileSync(join(process.cwd(), ARCHIVO), "utf8");

  it("no llama al módulo sin prefijo", () => {
    expect(texto()).not.toMatch(/modulo:\s*["']abilities["']/);
  });

  // La otra mitad: sin esto el caso pasaría también si alguien borrara la línea.
  it("llama a v3/abilities", () => {
    expect(texto()).toMatch(/modulo:\s*["']v3\/abilities["']/);
  });
});
