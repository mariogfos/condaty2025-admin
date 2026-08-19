import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  cleanup,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import React from "react";

/**
 * La TERCERA puerta al vacío mentiroso de CDT-47.
 *
 * El widget «Comunidad» del dashboard es hermano del muro: pega al mismo
 * endpoint (`/contents`), tenía el mismo `if (error) setContents([])` y caía al
 * mismo `EmptyData` («Sin publicaciones.») cuando lo que falló fue la red.
 *
 * 🔴 Arreglar sólo `Reel.tsx` dejaba el dashboard afirmando lo mismo que el
 * ticket vino a corregir — es el patrón CDT-26 → CDT-30: el arreglo tapa una
 * puerta y el mismo defecto reaparece por la de al lado.
 */

let estado: { data: any; loaded: boolean; error: any };
const reLoad = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    ...estado,
    reLoad,
    execute: vi.fn(),
    cancel: vi.fn(),
    isStale: false,
    countAxios: 0,
    waiting: 0,
    setWaiting: vi.fn(),
  }),
}));

vi.mock("@/modulos/Reel/Reel", () => ({
  ReelCompactList: () => <div data-testid="lista-compacta" />,
  default: () => null,
}));

// El widget vive dentro del `LanguageProvider` del layout. Acá se resuelve
// contra el diccionario REAL en español: así el test también pinea que las
// claves existan en `messages.ts` — si faltan, `translate` devuelve la clave
// cruda y la aserción cae.
vi.mock("@/i18n/useScopedI18n", async () => {
  const { messages } = await vi.importActual<any>("@/i18n/messages");
  return {
    useScopedI18n: (section: string) => ({
      locale: "es",
      translate: (key: string) => messages.es[section]?.[key] ?? key,
    }),
  };
});

import WidgetContentsResume from "@/components/Widgets/WidgetsDashboard/WidgetContentsResume/WidgetContentsResume";

const EL_VACIO_MENTIROSO = "Sin publicaciones.";

beforeEach(() => {
  reLoad.mockClear();
  estado = { data: null, loaded: true, error: "" };
});

afterEach(() => cleanup());

describe("CDT-47 — el widget Comunidad tampoco confunde fallo con vacío", () => {
  it("con el request fallado NO dice «Sin publicaciones»: avisa el fallo y ofrece reintentar", async () => {
    estado = {
      data: null,
      loaded: true,
      error: { message: "Network Error", status: 0, data: {} },
    };

    render(<WidgetContentsResume />);

    // Va PRIMERA: si no, la reinyección se pone roja por el cartel que falta y
    // el texto mentiroso —lo que el ticket vino a sacar— nunca se mide.
    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    expect(
      screen.getByText("No se pudo cargar la comunidad."),
    ).toBeInTheDocument();

    reLoad.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reLoad).toHaveBeenCalledTimes(1);
  });

  /*
   * La bifurcación de CDT-94: de dónde sale el texto lo decide el CÓDIGO HTTP.
   * Es la misma regla y el mismo `leerElErrorDelApi` que en el muro, pero el
   * widget la ejercita por su cuenta: comparten el helper, no el render.
   */
  it("un 4xx muestra el mensaje del API: reintentar no arregla un permiso", async () => {
    estado = {
      data: null,
      loaded: true,
      error: {
        message: "Request failed with status code 403",
        status: 403,
        data: { success: false, message: "No tiene permisos para visualizar" },
      },
    };

    render(<WidgetContentsResume />);

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    expect(
      await screen.findByText("No tiene permisos para visualizar"),
    ).toBeInTheDocument();
  });

  /*
   * ⚠️ Cuerpo INOCUO a propósito: si el fixture trajera un volcado del motor,
   * el caso pasaría por la lista de patrones técnicos y no se sabría cuál de
   * las dos reglas actuó. Así queda demostrado que basta el código HTTP. Y
   * evita pegar literales con pinta de credencial en el repo: eso se dice en
   * el nombre del caso, no en un string.
   */
  it("un 5xx cae al genérico SIN MIRAR el cuerpo, aunque el texto sea inofensivo", async () => {
    estado = {
      data: null,
      loaded: true,
      error: {
        message: "Request failed with status code 500",
        status: 500,
        data: { message: "detalle interno del servidor" },
      },
    };

    render(<WidgetContentsResume />);

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    expect(
      await screen.findByText("Revisa tu conexión e intenta de nuevo."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("detalle interno del servidor"),
    ).not.toBeInTheDocument();
  });

  it("sin error y sin publicaciones el EmptyData SIGUE apareciendo", async () => {
    estado = { data: { data: [] }, loaded: true, error: "" };

    render(<WidgetContentsResume />);

    expect(await screen.findByText(EL_VACIO_MENTIROSO)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
