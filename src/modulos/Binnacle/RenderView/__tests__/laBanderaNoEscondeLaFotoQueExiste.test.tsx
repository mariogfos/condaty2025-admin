/**
 * `has_image` es una COMPUERTA, y esconde fotos que existen.
 *
 * ────────────────────────────────────────────────────────────────────────
 * EL HECHO, MEDIDO
 * ────────────────────────────────────────────────────────────────────────
 *
 * `has_image` es la bandera del camino viejo: la foto que el servidor guardaba
 * en su propio disco (`GNEW-{id}.webp`, `GUARD-{id}.webp`). Hoy los fronts
 * suben a Cloudinary y el API devuelve `url_avatar` / `url_file`, y sobre esas
 * filas la bandera vale 0 — nadie la actualiza.
 *
 * Medido en la base local el 2026-09-24:
 *
 * ```
 * guards:  136 filas · 11 con `url_avatar` · 7 con la bandera en 1
 *          → 4 guardias tienen foto en Cloudinary con la bandera en 0
 * owners:  106 con `url_avatar` · 63 con la bandera en 1 → 46 escondidas
 * ```
 *
 * El detalle de la bitácora pedía `guardia.has_image` para decidir si pintaba
 * el avatar. La condición era falsa sobre una foto que existe, y el avatar no
 * se dibujaba nunca para esos cuatro.
 *
 * 🔴 Lo que decide es **si hay URL**. La bandera no se consulta más para eso.
 *
 * ⚠️ El único uso legítimo que le queda es saber si existe el archivo VIEJO en
 * el disco del servidor, y ese camino se retira cuando el API deje de
 * escribirlo. Por eso el pin de abajo prohíbe la bandera sobre `guardia`, no
 * en todo el archivo.
 */
import { describe, expect, it, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import fs from "fs";
import path from "path";

/**
 * 🔴 Sin los comentarios. Un pin que lee el archivo entero se satisface con la
 * explicación de arriba del código: este mismo test quedó VERDE en falso
 * porque el comentario que describe el defecto contiene el patrón prohibido.
 */
const sinComentarios = (ruta: string): string =>
  fs
    .readFileSync(ruta, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const RENDER_VIEW_SRC = sinComentarios(
  path.resolve(__dirname, "../RenderView.tsx"),
);
const GUARD_EDIT_FORM_SRC = sinComentarios(
  path.resolve(
    __dirname,
    "../../../../components/ProfileModal/GuardEditForm/GuardEditForm.tsx",
  ),
);

vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

import { ImageModalProvider } from "@/contexts/ImageModalContext";
import RenderView from "../RenderView";

const pintar = (item: any) =>
  render(
    <ImageModalProvider>
      <RenderView open={true} item={item} onClose={() => {}} />
    </ImageModalProvider>,
  );

const NOVEDAD = {
  id: 7,
  descrip: "Portón forzado en el sector B",
  created_at: "2026-09-20 10:00:00",
  updated_at: "2026-09-20 10:00:00",
  url_file: [],
  has_image: 0,
  guardia: {
    id: "g-1",
    name: "Pedro",
    last_name: "Rojas",
    // La foto está en Cloudinary y la bandera quedó en 0: es el caso de los
    // cuatro guardias medidos.
    has_image: 0,
    url_avatar: "https://res.cloudinary.com/demo/image/upload/v1/guard.webp",
  },
};

describe("la bandera `has_image` no esconde la foto que existe", () => {
  afterEach(() => cleanup());

  it("pinta el avatar del guardia con `has_image = 0` si hay `url_avatar`", () => {
    const { container } = pintar(NOVEDAD);

    const avatar = Array.from(container.querySelectorAll("img")).find((img) =>
      img.getAttribute("src")?.includes("guard.webp"),
    );

    expect(
      avatar,
      "🔴 La compuerta `guardia.has_image` escondió una foto que existe en Cloudinary.",
    ).toBeTruthy();
  });

  it("no pinta avatar cuando el guardia no tiene foto", () => {
    const { container } = pintar({
      ...NOVEDAD,
      guardia: { ...NOVEDAD.guardia, url_avatar: "" },
    });

    const avatares = Array.from(container.querySelectorAll("img")).filter(
      (img) => img.getAttribute("src")?.includes("cloudinary"),
    );

    expect(
      avatares,
      "Sin URL no hay avatar: si esto trae algo, la aserción de arriba no mide la compuerta.",
    ).toEqual([]);
  });

  it("el detalle de la bitácora no vuelve a consultar `guardia.has_image`", () => {
    expect(RENDER_VIEW_SRC).not.toMatch(/guardia\??\.?\s*\??\.has_image/);
    expect(RENDER_VIEW_SRC).toMatch(/guardia\?\.url_avatar/);
  });

  it("el formulario del guardia muestra `url_avatar` y no pide la bandera", () => {
    // 🔴 Pedía `formState.has_image === 1` y devolvía `formState.avatar`, que
    // en la edición NUNCA se llena: `ProfileModal` pone `url_avatar`. La foto
    // del guardia no aparecía ni con la bandera en 1.
    expect(GUARD_EDIT_FORM_SRC).not.toMatch(/has_image\s*===?\s*1/);
    expect(GUARD_EDIT_FORM_SRC).toMatch(/formState\.url_avatar/);
  });
});
