/**
 * CDT-99 — Balance decía «sin datos» cuando lo que pasó fue un fallo de red.
 *
 * `useAxios` pone `loaded = true` en su `finally` pase lo que pase y deja
 * `data` en `null`. Sin mirar `error` —que en esta pantalla ni se
 * desestructuraba— un pedido fallido y un condominio recién creado producían
 * EL MISMO render: «Gráfica y tablas financieras sin datos. verás la evolución
 * del flujo de efectivo a medida que tengas ingresos y egresos».
 *
 * Una afirmación falsa sobre las finanzas del condominio, con el mismo tono
 * tranquilizador que el vacío legítimo.
 *
 * ⚠️ SON TRES RENDERS, NO DOS. El mismo `EmptyData` está escrito tres veces
 * —«Ingresos», «Egresos» y el combinado «Ingresos y egresos», que es el que
 * viene seleccionado por defecto— y los tres cuelgan del ÚNICO pedido a
 * `/v3/balances`. Por eso cada caso se corre sobre los tres filtros: arreglar
 * dos y dejar el tercero es el patrón CDT-26 → CDT-30.
 *
 * El doble de `useAxios` imita el flanco REAL del hook: al arrancar la
 * petición baja `loaded` y limpia `error` (`execute` hace `setError("")` y
 * `setLoaded(false)` de forma síncrona), y al responder los vuelve a poner.
 * Sin ese flanco la ventana «en vuelo» no existiría y el caso del parpadeo no
 * mediría nada.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/** Lo que va a devolver el PRÓXIMO pedido. Lo arma cada caso antes de montar. */
let respuesta: { data: any; error: any } = { data: null, error: "" };

/** El payload de cada pedido, para afirmar que el reintento pide de verdad. */
const pedidos: any[] = [];

/**
 * Cuántas respuestas ya aterrizaron. El doble responde en un tick aparte —no
 * en el mismo commit que el click— justamente para que la ventana «en vuelo»
 * EXISTA: si la respuesta llegara sincrónicamente, el render de en medio no
 * ocurriría nunca y el caso del parpadeo no mediría nada.
 */
let respuestasAterrizadas = 0;

/**
 * 🔴 Un registro POR RENDER de los mensajes que pinta `EmptyData`.
 *
 * En CDT-98 dos casos salían VERDES con el bug puesto porque el estado
 * equivocado era TRANSITORIO: aparecía y el render siguiente lo limpiaba, así
 * que mirar el DOM final no medía nada. Acá el texto mentiroso puede aparecer
 * justo mientras el reintento está en vuelo, así que se afirma sobre CADA
 * render y no sobre el último.
 */
const mensajesPintados: string[] = [];

vi.mock("@/components/NoData/EmptyData", async () => {
  const actual = await vi.importActual<any>("@/components/NoData/EmptyData");
  return {
    default: (props: any) => {
      mensajesPintados.push(String(props?.message ?? ""));
      return actual.default(props);
    },
  };
});

vi.mock("@/mk/hooks/useAxios", async () => {
  const React = await import("react");

  const useAxiosFalso = () => {
    const [enVuelo, setEnVuelo] = React.useState(0);
    const [loaded, setLoaded] = React.useState(true);
    const [estado, setEstado] = React.useState<any>({ data: null, error: "" });

    const reLoad = React.useCallback((p: any) => {
      pedidos.push(p);
      // El hook REAL, al ARRANCAR: limpia el error y baja `loaded`. Esa es la
      // ventana en la que el render de en medio ya no sabe que hubo un fallo.
      setEstado({ data: null, error: "" });
      setLoaded(false);
      setEnVuelo((n) => n + 1);
    }, []);

    React.useEffect(() => {
      if (enVuelo === 0) return;
      let vigente = true;
      const t = setTimeout(() => {
        if (!vigente) return;
        setEstado({ ...respuesta });
        setLoaded(true);
        respuestasAterrizadas += 1;
      }, 0);
      return () => {
        vigente = false;
        clearTimeout(t);
      };
    }, [enVuelo]);

    return {
      data: estado.data,
      error: estado.error,
      loaded,
      reLoad,
      execute: vi.fn(),
    };
  };

  return { default: useAxiosFalso };
});

vi.mock("@/mk/hooks/useAsyncExport/useAsyncExport", () => ({
  useAsyncExport: () => ({
    state: { isExporting: false },
    start: vi.fn(),
    download: vi.fn(),
    reset: vi.fn(),
  }),
}));

// El `LoadingScreen` real lee `waiting` del `AxiosContext`, que en el test no
// existe. El doble deja pasar los hijos: así lo que se mide es la rama que
// eligió la pantalla, no el skeleton.
vi.mock("@/mk/components/ui/LoadingScreen/LoadingScreen", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/Widgets/WidgetGrafIngresos/WidgetGrafIngresos", () => ({
  default: () => <div data-testid="graf-ingresos" />,
}));
vi.mock("@/components/Widgets/WidgetGrafEgresos/WidgetGrafEgresos", () => ({
  default: () => <div data-testid="graf-egresos" />,
}));
vi.mock("@/components/Widgets/WidgetGrafBalance/WidgetGrafBalance", () => ({
  default: () => <div data-testid="graf-balance" />,
}));

import Balance from "../Balance";

/** El texto que el ticket vino a sacar de la pantalla ante un fallo. */
const EL_VACIO_MENTIROSO =
  "Gráfica y tablas financieras sin datos. verás la evolución del flujo de efectivo";

const TITULO_DEL_FALLO = "No se pudo cargar la información financiera.";
const GENERICO = "Revisa tu conexión e intenta de nuevo.";

/** Un condominio nuevo DE VERDAD: el sobre llegó, y llegó vacío. */
const SOBRE_VACIO_LEGITIMO = {
  data: {
    success: true,
    data: {
      saldoInicial: "0.00",
      categI: [],
      categE: [],
      ingresosHist: [],
      egresosHist: [],
    },
  },
  error: "",
};

/** Red caída: no hubo respuesta HTTP, así que `status` es 0 y no hay sobre. */
const LA_RED_SE_CAYO = {
  data: null,
  error: { message: "Network Error", status: 0, data: {} },
};

/** Los tres filtros de «Tipo de transacción», que son tres renders distintos. */
const LOS_TRES_FILTROS = [
  ["Ingresos y egresos", null],
  ["Ingresos", "Ingresos"],
  ["Egresos", "Egresos"],
] as const;

const elegirTipoDeTransaccion = (opcion: string) => {
  const trigger = screen
    .getByText("Tipo de transacción")
    .closest("button") as HTMLButtonElement;
  fireEvent.click(trigger);
  const portal = within(document.getElementById("portal-root") as HTMLElement);
  fireEvent.click(portal.getByText(opcion));
};

/** Monta la pantalla y la deja en el filtro pedido (`null` = el de entrada). */
const montarEn = async (opcion: string | null) => {
  render(<Balance />);
  if (opcion) elegirTipoDeTransaccion(opcion);
  // El pedido resuelve en un tick posterior: sin esperarlo, las aserciones
  // negativas pasarían de arriba porque la pantalla sigue en carga.
  const objetivo = respuestasAterrizadas + 1;
  await waitFor(() =>
    expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
  );
};

beforeEach(() => {
  const portal = document.createElement("div");
  portal.id = "portal-root";
  document.body.appendChild(portal);
  pedidos.length = 0;
  mensajesPintados.length = 0;
  respuestasAterrizadas = 0;
  respuesta = { data: null, error: "" };
});

afterEach(() => {
  cleanup();
  document.getElementById("portal-root")?.remove();
  vi.clearAllMocks();
});

describe("CDT-99 — Balance no confunde «falló el pedido» con «no hay finanzas»", () => {
  it.each(LOS_TRES_FILTROS)(
    "en «%s», con el pedido fallado NO dice «sin datos»: avisa el fallo y ofrece reintentar",
    async (_nombre, opcion) => {
      respuesta = LA_RED_SE_CAYO;
      await montarEn(opcion);

      // 🔴 Va PRIMERA. Si no, la reinyección se pondría roja por el cartel que
      // falta y el texto mentiroso —lo que el ticket vino a sacar— nunca se
      // llegaría a medir.
      await waitFor(() =>
        expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument(),
      );

      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(TITULO_DEL_FALLO)).toBeInTheDocument();
      expect(screen.getByText(GENERICO)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reintentar" }),
      ).toBeInTheDocument();
    },
  );

  /**
   * EL CONTROL. Un condominio nuevo de verdad no tiene movimientos y ese
   * mensaje TIENE que seguir existiendo — y sin botón, porque no hay nada que
   * reintentar. Es el caso que cae si el arreglo se pasa de largo y convierte
   * todo vacío en un error.
   */
  it.each(LOS_TRES_FILTROS)(
    "en «%s», el vacío REAL sigue diciendo «sin datos», sin cartel y sin botón",
    async (_nombre, opcion) => {
      respuesta = SOBRE_VACIO_LEGITIMO;
      await montarEn(opcion);

      expect(await screen.findByText(EL_VACIO_MENTIROSO)).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Reintentar" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(TITULO_DEL_FALLO)).not.toBeInTheDocument();
    },
  );

  it("el botón de reintentar REINTENTA, y con los filtros vigentes", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montarEn("Egresos");
    await screen.findByRole("alert");

    const pedidosAntes = pedidos.length;

    // El reintento SÍ trae datos: así se ejercita un reintento que funciona y
    // no sólo que se llamó. Un mock que devuelve el mismo error no prueba nada.
    respuesta = {
      data: {
        success: true,
        data: {
          saldoInicial: "0.00",
          categI: [{ id: 11, name: "Servicios básicos" }],
          categE: [{ id: 11, name: "Servicios básicos" }],
          ingresosHist: [],
          egresosHist: [
            {
              categ_id: "110",
              name: "Agua",
              category_id: "11",
              amount: "1500.00",
              mes: 8,
            },
          ],
        },
      },
      error: "",
    };

    const objetivo = respuestasAterrizadas + 1;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(respuestasAterrizadas).toBe(objetivo));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(pedidos.length).toBe(pedidosAntes + 1);
    expect(await screen.findByTestId("graf-egresos")).toBeInTheDocument();

    // 🔴 El ARGUMENTO, no sólo la llamada: `reLoad` sin payload manda el del
    // montaje (`{}`), o sea el período por defecto, y el usuario perdería el
    // filtro que tenía elegido.
    expect(pedidos[pedidos.length - 1]).toMatchObject({
      filter_date: "m",
      filter_mov: "E",
    });
  });

  /**
   * 🔴 EL PARPADEO. Se afirma sobre CADA render, no sobre el final.
   *
   * Mientras el reintento está en vuelo, `useAxios` ya limpió su `error`: el
   * render de en medio no sabe que hubo un fallo. Si el `EmptyData` se
   * preguntara antes que el estado de carga, el usuario volvería a leer la
   * mentira justo ahí, y un test que mire el DOM final no lo vería nunca
   * porque el render siguiente la borra.
   *
   * Esto pinea el ORDEN de las ramas: carga → fallo → vacío.
   */
  it("durante el reintento NUNCA se pinta el texto mentiroso, en ningún render", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montarEn("Ingresos");
    await screen.findByRole("alert");

    mensajesPintados.length = 0;
    respuesta = LA_RED_SE_CAYO;
    const objetivo = respuestasAterrizadas + 1;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    // La ventana en vuelo: `useAxios` ya limpió su `error`, así que el cartel
    // se fue y todavía no volvió. Justo acá es donde reaparecía la mentira.
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();

    await waitFor(() => expect(respuestasAterrizadas).toBe(objetivo));
    await screen.findByRole("alert");

    expect(mensajesPintados).not.toContain(EL_VACIO_MENTIROSO);
  });

  /**
   * La bifurcación de CDT-94: de dónde sale el texto lo decide el CÓDIGO HTTP,
   * no el contenido. Es el mismo `leerElErrorDelApi` que el muro y el widget,
   * pero esta pantalla lo ejercita por su cuenta: comparten el helper, no el
   * render.
   */
  it("un 4xx muestra el mensaje del API: reintentar no arregla un permiso", async () => {
    respuesta = {
      data: null,
      error: {
        message: "Request failed with status code 403",
        status: 403,
        data: { success: false, message: "No tiene permisos para visualizar" },
      },
    };
    await montarEn(null);

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    expect(
      await screen.findByText("No tiene permisos para visualizar"),
    ).toBeInTheDocument();
    expect(screen.queryByText(GENERICO)).not.toBeInTheDocument();
  });

  /**
   * ⚠️ El cuerpo del 500 es INOCUO a propósito. Con un volcado del motor de
   * verdad el caso pasaría igual por la lista de patrones técnicos y no se
   * sabría cuál de las dos reglas actuó; así queda demostrado que decide el
   * CÓDIGO. De paso no entra al repo ningún texto con pinta de credencial.
   */
  it("un 5xx cae al genérico sin mirar el cuerpo", async () => {
    respuesta = {
      data: null,
      error: {
        message: "Request failed with status code 500",
        status: 500,
        data: { success: false, message: "Detalle interno del servidor" },
      },
    };
    await montarEn(null);

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    expect(await screen.findByText(GENERICO)).toBeInTheDocument();
    expect(
      screen.queryByText("Detalle interno del servidor"),
    ).not.toBeInTheDocument();
  });

  /**
   * La segunda forma del fallo: HTTP 200 rechazado en el CUERPO.
   * `sendError($msg, [], 200)` devuelve `{success:false, message}` y ningún
   * `data`. Axios no rechaza un 200, así que acá no hay `error` que mirar y
   * mirando sólo `error` esta forma seguía cayendo en el vacío mentiroso.
   */
  it("un HTTP 200 rechazado en el cuerpo tampoco es un condominio sin finanzas", async () => {
    respuesta = {
      data: {
        success: false,
        message: "No tienes permiso para realizar esta acción",
        errors: [],
      },
      error: "",
    };
    await montarEn(null);

    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    expect(
      await screen.findByText("No tienes permiso para realizar esta acción"),
    ).toBeInTheDocument();
  });
});
