import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  cleanup,
  act,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import React from "react";

/**
 * «Falló la red» y «el condominio no publicó nada» NO pueden verse iguales.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 QUÉ SE ROMPÍA (CDT-47)
 * ────────────────────────────────────────────────────────────────────────
 *
 * Cuando el request del muro fallaba, el efecto de `Reel.tsx` hacía
 * `setContents([])` + `setHasMore(false)` y el render caía en la rama `else`
 * del ternario: el `EmptyData` con «Aún no hay publicaciones para mostrar».
 *
 * El usuario leía una AFIRMACIÓN sobre el estado de su condominio, y era
 * falsa. Sin aviso de error y sin forma de reintentar. El error estaba en la
 * mano (`initialError`): se usaba para vaciar la lista y se descartaba.
 *
 * Es la familia de CDT-42 al revés: aquel mostraba dato viejo, éste muestra un
 * vacío que afirma algo falso. Y CDT-42 no lo cubre: su aviso vive en
 * `useCrud`, y el muro no usa `useCrud`.
 *
 * ────────────────────────────────────────────────────────────────────────
 * LA SEGUNDA PUERTA: la paginación
 * ────────────────────────────────────────────────────────────────────────
 *
 * Si falla la página 2 en adelante, el muro no queda vacío, pero el
 * `setHasMore(false)` del catch es el mismo que pinta «Has llegado al final».
 * O sea: el scroll se cortaba en silencio y encima con un cartel afirmando que
 * ya se había visto todo el muro. Otra forma de la misma mentira.
 *
 * ────────────────────────────────────────────────────────────────────────
 * Reinyección, medida el 2026-08-19 — ver el reporte del ticket
 * ────────────────────────────────────────────────────────────────────────
 */

type EstadoDelHook = {
  data: any;
  loaded: boolean;
  error: any;
};

let estadoInicial: EstadoDelHook;
const reLoadInicial = vi.fn();
const executePaginacion = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: (url?: string | null) => {
    const base = {
      countAxios: 0,
      cancel: vi.fn(),
      isStale: false,
      waiting: 0,
      setWaiting: vi.fn(),
    };
    // El hook con URL es el de la carga inicial; los `useAxios()` sueltos del
    // módulo son los `execute` (paginación, likes, comentarios, edición).
    if (url === "/contents") {
      return {
        ...base,
        ...estadoInicial,
        reLoad: reLoadInicial,
        execute: vi.fn(),
      };
    }
    return {
      ...base,
      data: null,
      loaded: true,
      error: "",
      reLoad: vi.fn(),
      execute: executePaginacion,
    };
  },
}));

// Hijos pesados que no participan de lo que se mide.
vi.mock("@/modulos/Reel/MediaRenderer/MediaRenderer", () => ({
  default: () => null,
}));
vi.mock("@/modulos/Reel/CommentModal/CommentModal", () => ({
  default: () => null,
}));
vi.mock("@/modulos/Contents/RenderView/RenderView", () => ({
  default: () => null,
}));
vi.mock("@/modulos/Contents/AddContent/AddContent", () => ({
  default: () => null,
}));
// `Avatar` monta `Image`, que exige el `ImageModalProvider`. No participa de
// lo que se mide y arrastra medio árbol de contextos.
vi.mock("@/mk/components/ui/Avatar/Avatar", () => ({
  Avatar: () => null,
}));

import Reel from "@/modulos/Reel/Reel";

const EL_VACIO_MENTIROSO = "Aún no hay publicaciones para mostrar.";

const unaPublicacion = (id: number) => ({
  id,
  title: "",
  description: `publicación ${id}`,
  images: [],
  files: [],
  user: { id: 1, name: "Ana", last_name: "Pérez" },
  likes: 0,
  comments_count: 0,
  currentImageIndex: 0,
  isDescriptionExpanded: false,
});

/** Deja capturado el callback del observer para dispararlo a mano. */
const instalarIntersectionObserver = () => {
  const callbacks: any[] = [];
  (globalThis as any).IntersectionObserver = class {
    constructor(cb: any) {
      callbacks.push(cb);
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  return callbacks;
};

beforeEach(() => {
  reLoadInicial.mockClear();
  executePaginacion.mockClear();
  estadoInicial = { data: null, loaded: true, error: "" };
});

afterEach(() => {
  cleanup();
});

describe("CDT-47 — el muro no confunde un fallo de red con un muro vacío", () => {
  it("con el request fallado NO dice «Aún no hay publicaciones»: dice qué pasó y ofrece reintentar", async () => {
    estadoInicial = {
      data: null,
      loaded: true,
      // Red caída: axios no llega a tener respuesta, así que `status` es 0.
      error: { message: "Network Error", status: 0, data: {} },
    };

    render(<Reel />);

    // 🔴 LA AFIRMACIÓN DEL TICKET, y va PRIMERA a propósito: si va después del
    // `getByRole("alert")`, la reinyección se pone roja por no encontrar el
    // cartel de error y el texto mentiroso nunca se llega a mirar.
    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    expect(screen.getByText("No se pudo cargar el muro.")).toBeInTheDocument();
    expect(
      screen.getByText("Revisa tu conexión e intenta de nuevo."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });

  it("un 4xx muestra el mensaje del API, no «revisa tu conexión» (regla de CDT-94: manda el código HTTP)", async () => {
    estadoInicial = {
      data: null,
      loaded: true,
      error: {
        message: "Request failed with status code 403",
        status: 403,
        data: { success: false, message: "No tiene permisos para visualizar" },
      },
    };

    render(<Reel />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument(),
    );

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    expect(
      screen.getByText("No tiene permisos para visualizar"),
    ).toBeInTheDocument();
  });

  it("un 5xx NO filtra el mensaje del motor: cae al genérico", async () => {
    estadoInicial = {
      data: null,
      loaded: true,
      error: {
        message: "Request failed with status code 500",
        status: 500,
        data: {
          message:
            "SQLSTATE[HY000] [1045] Access denied for user 'condaty'@'10.0.0.5'",
        },
      },
    };

    render(<Reel />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument(),
    );

    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
    expect(
      screen.getByText("Revisa tu conexión e intenta de nuevo."),
    ).toBeInTheDocument();
  });

  /**
   * El caso de CONTROL. Sin esto, «arreglar» el error es tan fácil como borrar
   * el `EmptyData`, y un condominio recién creado dejaría de saber que su muro
   * está vacío porque nadie publicó todavía — que es verdad y hay que decirla.
   */
  it("sin error y sin publicaciones el EmptyData SIGUE apareciendo", async () => {
    estadoInicial = {
      data: { data: [], message: { total: 0 } },
      loaded: true,
      error: "",
    };

    render(<Reel />);

    expect(await screen.findByText(EL_VACIO_MENTIROSO)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument();
  });

  it("el botón de reintentar VUELVE A PEDIR, y mientras tanto no repinta el vacío", async () => {
    estadoInicial = {
      data: null,
      loaded: true,
      error: { message: "Network Error", status: 0, data: {} },
    };

    render(<Reel />);

    const boton = await screen.findByRole("button", { name: "Reintentar" });
    // El `reLoad` del montaje ya corrió; se mide el disparo del click.
    reLoadInicial.mockClear();

    fireEvent.click(boton);

    expect(reLoadInicial).toHaveBeenCalledTimes(1);
    // Y el vacío mentiroso no vuelve mientras el request está en vuelo:
    // `useAxios` limpia su `error` al arrancar la petición.
    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    expect(screen.getByText("Cargando publicaciones...")).toBeInTheDocument();
  });
});

describe("CDT-47 — la segunda puerta: la página siguiente que falla", () => {
  it("no dice «Has llegado al final»: avisa el fallo y reintenta esa misma página", async () => {
    const callbacks = instalarIntersectionObserver();

    estadoInicial = {
      data: {
        data: [unaPublicacion(1), unaPublicacion(2)],
        message: { total: 40 },
      },
      loaded: true,
      error: "",
    };
    executePaginacion.mockResolvedValue({
      data: null,
      error: { message: "Network Error", status: 0, data: {} },
    });

    render(<Reel />);

    await screen.findByText("publicación 1");

    // El centinela del scroll infinito entra en viewport → pide la página 2.
    await act(async () => {
      callbacks.forEach((cb) => cb([{ isIntersecting: true }]));
    });

    await waitFor(() => expect(executePaginacion).toHaveBeenCalledTimes(1));

    // 🔴 LA MENTIRA DEL OTRO LADO DEL SCROLL.
    expect(screen.queryByText("Has llegado al final.")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "No se pudieron cargar más publicaciones. Revisa tu conexión.",
      ),
    ).toBeInTheDocument();

    // Y el reintento pide de verdad, otra vez.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    });

    await waitFor(() => expect(executePaginacion).toHaveBeenCalledTimes(2));
  });

  it("cuando de verdad no hay más páginas SIGUE diciendo «Has llegado al final»", async () => {
    estadoInicial = {
      data: {
        data: [unaPublicacion(1), unaPublicacion(2)],
        message: { total: 2 },
      },
      loaded: true,
      error: "",
    };

    render(<Reel />);

    expect(await screen.findByText("Has llegado al final.")).toBeInTheDocument();
    expect(
      screen.queryByText(
        "No se pudieron cargar más publicaciones. Revisa tu conexión.",
      ),
    ).not.toBeInTheDocument();
  });
});
