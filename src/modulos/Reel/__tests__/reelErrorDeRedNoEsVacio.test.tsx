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

  /*
   * El cuerpo del fixture es a propósito INOCUO y no se parece en nada a un
   * volcado del motor: así queda demostrado que lo que descarta el mensaje es
   * EL CÓDIGO HTTP y no la lista de patrones técnicos. Con un volcado de
   * verdad el caso pasaría igual y no se sabría cuál de las dos reglas actuó.
   *
   * ⚠️ Y de paso evita pegar en el repo literales con pinta de credencial: un
   * fixture no es un lugar seguro para eso —rompen capturas y barridos aunque
   * estén dentro de un string de test—. Lo que hay que decir se dice en el
   * nombre del caso.
   */
  it("un 5xx cae al genérico SIN MIRAR el cuerpo, aunque el texto sea inofensivo", async () => {
    estadoInicial = {
      data: null,
      loaded: true,
      error: {
        message: "Request failed with status code 500",
        status: 500,
        data: { message: "detalle interno del servidor" },
      },
    };

    render(<Reel />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument(),
    );

    expect(
      screen.queryByText("detalle interno del servidor"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Revisa tu conexión e intenta de nuevo."),
    ).toBeInTheDocument();
  });

  /*
   * LA TERCERA RAMA del efecto inicial: el `else`.
   *
   * 🔴 No hay `error` de transporte —axios no rechaza un 200— y sin embargo el
   * efecto vacía la lista igual. Con el render mirando sólo `initialError`,
   * estas dos formas caían en el `EmptyData` mentiroso.
   *
   * Y el motivo por el que esto NO es un caso teórico: este mismo cambio ya
   * cerró la forma del 200 rechazado del lado de la PAGINACIÓN. La página 2
   * distinguía «no se pudo traer» de «se acabó» y la página 1 no: una
   * asimetría entre dos ramas del mismo arreglo.
   */
  it("un HTTP 200 rechazado en el cuerpo (`success:false`) NO es un muro vacío", async () => {
    estadoInicial = {
      data: {
        success: false,
        message: "El módulo de contenidos no está habilitado para este condominio",
        errors: [],
      },
      loaded: true,
      error: "",
    };

    render(<Reel />);

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());

    // Y como es un rechazo de negocio, se muestra lo que el API dice.
    expect(
      screen.getByText(
        "El módulo de contenidos no está habilitado para este condominio",
      ),
    ).toBeInTheDocument();
  });

  it("un 200 sin `message.total` tampoco es un muro vacío", async () => {
    estadoInicial = {
      data: { data: [] },
      loaded: true,
      error: "",
    };

    render(<Reel />);

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByText("No se pudo cargar el muro.")).toBeInTheDocument();
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

    // 🔴 El reintento que FUNCIONA. Dejarlo fallando otra vez sólo afirma que
    // se volvió a llamar: nunca ejercita el camino bueno y no pinea el
    // invariante de más abajo, que es justo el que se rompería si el centinela
    // le ganara la carrera al efecto y `page` saltara de largo.
    executePaginacion.mockResolvedValue({
      data: { data: [unaPublicacion(3), unaPublicacion(4)] },
      error: null,
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    });

    await waitFor(() => expect(executePaginacion).toHaveBeenCalledTimes(2));

    // Llegan las publicaciones que faltaban...
    expect(await screen.findByText("publicación 3")).toBeInTheDocument();
    expect(screen.getByText("publicación 4")).toBeInTheDocument();

    // ...y el cartel de error se va.
    expect(
      screen.queryByText(
        "No se pudieron cargar más publicaciones. Revisa tu conexión.",
      ),
    ).not.toBeInTheDocument();

    /*
     * 🔴 QUÉ PINEA ESTO, EXACTAMENTE: el ARGUMENTO del reintento.
     *
     * Que `handleRetryLoadMore` vuelva a pedir la misma página que falló y no
     * mueva `page`. Nada más que eso. Si la mueve, la página que falló no se
     * pide nunca y el usuario pierde 20 publicaciones sin un solo síntoma: la
     * lista sigue, el scroll sigue, y ahí faltan.
     *
     * ⚠️ NO pinea ningún ORDEN DE EJECUCIÓN, y conviene decirlo porque es fácil
     * leerlo al revés. El `IntersectionObserver` de este archivo es un stub: su
     * `observe()` es un no-op y no entrega nada por su cuenta, sólo se le
     * disparan las callbacks a mano. Por eso este test **no puede detectar** un
     * centinela que se adelante al efecto: porque el stub nunca lo produce —
     * NO porque el adelanto sea inofensivo.
     *
     * 🔴 De hecho es dañino y se puede forzar: entregando el centinela dentro
     * del mismo `act` que el `fireEvent.click`, la aserción de abajo se pone
     * ROJA («expected 4 to be 2»), y la página que falló se pierde. En ese
     * montaje `act` difiere el vaciado de los efectos pasivos hasta cerrar su
     * ámbito, así que el centinela ya existe cuando se lo hace entregar y el
     * `setPage` llega antes que el pedido. Es un artefacto del planificador de
     * los tests, no un orden que el navegador produzca.
     *
     * ────────────────────────────────────────────────────────────────────
     * La carrera que esto NO cubre, y por qué no hace falta cubrirla
     * ────────────────────────────────────────────────────────────────────
     *
     * El reintento devuelve `hasMore` a `true`, y eso re-monta el centinela
     * justo donde el usuario está parado. Si su entrega le ganara al efecto de
     * paginación, `page` saltaría de largo y la página que falló no se pediría
     * nunca.
     *
     * Lo que sostiene que en el NAVEGADOR eso no pasa es un argumento de
     * ordenamiento, no este test: la entrega de un `IntersectionObserver`
     * ocurre en «update intersection observations», que corre DESPUÉS de las
     * callbacks de `requestAnimationFrame`, mientras que React vacía los
     * efectos pasivos en una tarea encolada durante el propio click. Medido el
     * 2026-08-19 como experimento aparte —con click nativo, sin `act`— el
     * pedido de la página salió antes del primer `rAF`, y `rAF` es un piso
     * CONSERVADOR: la entrega real llega todavía más tarde que ese piso, así
     * que la conclusión se sostiene a fortiori.
     *
     * ⚠️ Ese experimento mide el argumento de ordenamiento, NO el peor caso:
     * sin `act` el re-render no ocurre, así que el centinela nuevo todavía no
     * existía cuando se entregó. La precaución que lo hacía honesto es la misma
     * que lo dejó fuera del caso peligroso.
     *
     * Escribir un test de ordenamiento acá sería peor que no tenerlo: para que
     * fallara habría que reproducir el diferimiento de `act`, que es del
     * entorno de tests y no del navegador — verde o rojo por construcción, y
     * en cualquiera de los dos casos anunciando una red que no está.
     */
    const paginaDelFallo = executePaginacion.mock.calls[0][2].page;
    const paginaDelReintento = executePaginacion.mock.calls[1][2].page;
    expect(paginaDelFallo).toBe(2);
    expect(paginaDelReintento).toBe(2);
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
