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
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/** Lo que va a devolver el PRÓXIMO pedido. Lo arma cada caso antes de montar. */
let respuesta: { data: any; error: any } = { data: null, error: "" };

/** El payload de cada pedido, para afirmar que el reintento pide de verdad. */
const pedidos: any[] = [];

/**
 * El `reLoad` vivo del componente, para simular el refresco que dispara el
 * efecto de los filtros cuando ya hay un balance bueno en pantalla.
 */
let dispararRefrescoExterno: (p?: any) => void = () => {};

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
    // 🔴 Arranca en `false`, como el hook real: el pedido del montaje ya salió
    // (review 4R de CDT-99). Antes arrancaba en `true` y salteaba ese tick, o
    // sea que el primer commit era `loaded && !data` — un estado que el hook
    // REAL no puede producir, y que dejaba sin ejercitar justamente el orden
    // «primero LoadingScreen, después el cartel de fallo».
    const [loaded, setLoaded] = React.useState(false);
    const [estado, setEstado] = React.useState<any>({ data: null, error: "" });
    const [viejo, setViejo] = React.useState(false);

    const reLoad = React.useCallback((p: any) => {
      pedidos.push(p);
      // 🔴 FIEL AL HOOK REAL (review de CDT-99): al ARRANCAR limpia el `error`
      // y baja `loaded`, pero NO toca `data`. El doble anterior lo borraba, y
      // por eso el estado «cargado + falló + dato viejo todavía en pantalla»
      // era IRREPRESENTABLE: la suite no podía ver que un refresco fallado
      // borraba un panel correcto.
      setEstado((e: any) => ({ data: e.data, error: "" }));
      setLoaded(false);
      setEnVuelo((n: number) => n + 1);
    }, []);

    dispararRefrescoExterno = reLoad;

    // El pedido del montaje (`enVuelo === 0`) y cada reintento aterrizan acá,
    // en un tick posterior: así hay al menos un render con el pedido en vuelo.
    React.useEffect(() => {
      let vigente = true;
      const t = setTimeout(() => {
        if (!vigente) return;
        // El hook real, al fallar, hace `setError` y NADA MÁS: `data` sigue
        // siendo la de antes. Y marca `isStale` sólo si había dato que quedara
        // viejo (`useAxios.tsx:292`).
        setEstado((e: any) =>
          respuesta.error
            ? { data: e.data, error: respuesta.error }
            : { ...respuesta },
        );
        setViejo(!!respuesta.error);
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
      // Igual que el real: sin dato en pantalla no hay nada "viejo" que avisar.
      isStale: estado.data !== null && viejo,
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

// El modal de rango personalizado, sólo para poder afirmar que se ABRE: sin un
// observable, el test del centinela era una negación sobre una lista vacía y
// quedaba verde con cualquier implementación que no mandara nada (review 4R).
vi.mock("@/components/DateRangeFilterModal/DateRangeFilterModal", () => ({
  // ⚠️ El botón de cerrar NO es decorativo: tiene que llamar al `onClose` real.
  // Con un doble que sólo se pinta, «descartar el modal» no lo cerraba nunca y
  // la aserción de que vuelve a abrirse pasaba sin medir nada.
  default: ({ open, onClose }: any) =>
    open ? (
      <div data-testid="modal-rango-personalizado">
        <button type="button" onClick={() => onClose?.()}>
          cerrar-rango
        </button>
      </div>
    ) : null,
}));

// 🔴 El `LoadingScreen` real lee `waiting` del `AxiosContext`, que en el test
// no existe, así que el doble deja pasar los hijos. Eso tiene una consecuencia
// que hay que tener presente al leer los casos de abajo (review 4R): el doble
// NO tapa nada, o sea que si una rama de la pantalla se olvidara de preguntar
// por la carga, acá se vería el contenido crudo — que es exactamente lo que
// pasaba con el render del filtro `T` y lo que estos casos ahora pinean.
// En producción el `LoadingScreen` compartido sí tapa, y por eso el defecto
// podía vivir ahí sin que nadie lo notara.
vi.mock("@/mk/components/ui/LoadingScreen/LoadingScreen", () => ({
  default: ({ children }: any) => (
    <div data-testid="pantalla-de-carga">{children}</div>
  ),
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
   * 🔴 EL MISMO DEFECTO DADO VUELTA (review de CDT-99).
   *
   * `useAxios` no limpia `data` al fallar. Si el cartel preguntara por
   * `error`, un refresco fallado le borraría al usuario un balance CORRECTO
   * para poner «no se pudo cargar». Se avisa, no se borra.
   */
  it("un refresco fallado NO borra el balance correcto: avisa que el dato quedó viejo", async () => {
    respuesta = {
      data: {
        success: true,
        data: {
          ...SOBRE_VACIO_LEGITIMO.data.data,
          saldoInicial: "7350.00",
        },
      },
      error: "",
    };
    await montarEn(null);
    expect(screen.queryByText(TITULO_DEL_FALLO)).not.toBeInTheDocument();

    respuesta = LA_RED_SE_CAYO;
    const objetivo = respuestasAterrizadas + 1;
    await act(async () => {
      dispararRefrescoExterno({ filter_date: "m", filter_mov: "T" });
    });
    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );

    // No aparece el cartel de carga fallida: había datos y siguen estando.
    expect(screen.queryByText(TITULO_DEL_FALLO)).not.toBeInTheDocument();
    // Y tampoco se calla: avisa que no se pudo actualizar.
    expect(screen.getByRole("status")).toHaveTextContent(
      "No se pudo actualizar",
    );
  });

  /**
   * 🔴 Hallazgo del review 4R: el render del filtro POR DEFECTO no preguntaba
   * por la carga.
   *
   * Los tres renders de esta pantalla cuelgan del mismo pedido, pero sólo dos
   * abrían con `if (estaCargando)`. El tercero —`filter_mov === "T"`, el que
   * viene seleccionado al entrar— era `cargaFallida ? … : loaded && vacío ? …
   * : gráficas`, así que con un reintento EN VUELO y sin dato caía derecho a
   * las gráficas con las series en `undefined`.
   *
   * ⚠️ Por qué nadie lo veía: en producción lo tapa el contador global del
   * `LoadingScreen` compartido, que no es de este código; y en la suite lo
   * tapaba el doble, que deja pasar los hijos. Dos tapas distintas sobre el
   * mismo agujero.
   */
  it("con el filtro por defecto, el reintento en vuelo muestra la carga y no las gráficas", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montarEn(null);
    await screen.findByText(TITULO_DEL_FALLO);

    // Se aprieta Reintentar y se mira el render de EN MEDIO.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    });

    // 🔴 LA ASERCIÓN QUE MIDE ESTA RAMA es la de la GRÁFICA, no la de la
    // pantalla de carga: los tres renders cuelgan del mismo pedido, así que
    // los otros dos ya mostraban su carga y `getAllByTestId(...).length > 0`
    // quedaba verde con el defecto puesto. Lo MEDÍ reinyectando: sin la rama
    // de carga en `T`, ese render cae en las GRÁFICAS con las series en
    // `undefined`, y eso es lo único que lo distingue.
    expect(screen.queryByTestId("graf-balance")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("pantalla-de-carga").length).toBeGreaterThan(0);
    // Tampoco el cartel de fallo viejo ni el vacío: mientras no se sepa, no se
    // afirma nada.
    expect(screen.queryByText(TITULO_DEL_FALLO)).not.toBeInTheDocument();
    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
  });

  /**
   * 🔴 El borde que el corte de `cargaFallida` ahora es dueño, y que no estaba
   * medido en ninguna de las dos pantallas (review 4R).
   *
   * Un 200 rechazado en el cuerpo llegando como REFRESCO, con un balance bueno
   * ya en pantalla. Ahí no hay `error` —axios no rechaza un 200— y `useAxios`
   * hace `setData(response.data)` igual, así que el sobre sin `data` PISA al
   * bueno: `isStale` no se puede prender, porque el dato viejo ya no existe.
   *
   * ⚠️ Que se vea el cartel de fallo en vez de la banda NO es un descuido: es
   * lo único honesto que se puede pintar cuando el dato anterior ya no está.
   * Lo que este test fija es que caiga en el CARTEL y no en el vacío mentiroso
   * — que es donde caía antes del ticket.
   *
   * Lo que sí queda pendiente y no es de esta pantalla: que el hook pise un
   * sobre bueno con uno rechazado le pega a TODOS los módulos. Va aparte.
   */
  it("un 200 rechazado llegando como REFRESCO cae en el cartel, no en el vacío", async () => {
    respuesta = {
      data: {
        success: true,
        data: {
          ...SOBRE_VACIO_LEGITIMO.data.data,
          saldoInicial: "7350.00",
        },
      },
      error: "",
    };
    await montarEn(null);
    expect(screen.queryByText(TITULO_DEL_FALLO)).not.toBeInTheDocument();

    // El refresco vuelve con un 200 rechazado en el CUERPO: sin `data`.
    respuesta = {
      data: { success: false, message: "No tenés acceso a las finanzas." },
      error: "",
    };
    const objetivo = respuestasAterrizadas + 1;
    await act(async () => {
      dispararRefrescoExterno({ filter_date: "m", filter_mov: "T" });
    });
    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );

    // No dice que el condominio no tiene finanzas.
    expect(screen.queryByText(EL_VACIO_MENTIROSO)).not.toBeInTheDocument();
    // Dice lo que pasó, con el texto que mandó el API.
    expect(screen.getByText(TITULO_DEL_FALLO)).toBeInTheDocument();
    expect(
      screen.getByText("No tenés acceso a las finanzas."),
    ).toBeInTheDocument();
    // ⚠️ Acá NO va una aserción sobre la banda de dato viejo, y es a propósito
    // (review 4R): en este camino `isStale` no se puede prender ni queriendo
    // —el hook lo apaga por la rama de éxito, porque un 200 NO es un rechazo
    // de axios—, así que afirmar que la banda no está sería una aserción que
    // no puede fallar. Lo que este caso mide es dónde CAE el render.
  });

  /**
   * 🔴 Hallazgo del review 4R: la banda de «dato viejo» NO puede convivir con
   * la pantalla de carga.
   *
   * `isStale` sigue prendido mientras el reintento está EN VUELO —el hook lo
   * apaga recién cuando un refresco entra bien—, así que sin la guarda de
   * `estaCargando` el usuario ve al mismo tiempo «cargando» y «no se pudo
   * actualizar», con un botón de Reintentar encima de algo que ya se está
   * reintentando.
   */
  it("mientras el reintento está en vuelo NO se ve la banda de dato viejo", async () => {
    respuesta = {
      data: {
        success: true,
        data: {
          ...SOBRE_VACIO_LEGITIMO.data.data,
          saldoInicial: "7350.00",
        },
      },
      error: "",
    };
    await montarEn(null);

    // Primero se rompe un refresco: ahí sí tiene que aparecer la banda.
    respuesta = LA_RED_SE_CAYO;
    const objetivo = respuestasAterrizadas + 1;
    await act(async () => {
      dispararRefrescoExterno({ filter_date: "m", filter_mov: "T" });
    });
    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No se pudo actualizar",
    );

    // Ahora se aprieta Reintentar y se mira el render de EN MEDIO, con el
    // pedido todavía en vuelo: `isStale` sigue en `true`, pero la banda no
    // tiene que estar.
    await act(async () => {
      fireEvent.click(screen.getByText("Reintentar"));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  /**
   * 🔴 `sc` NO es un período: es «abrí el modal de rango personalizado». El
   * efecto de los filtros lo trata así (`Balance.tsx:87`), y el reintento
   * tenía que hacer lo mismo — si no, reintentar después de abrir y descartar
   * ese modal le manda el centinela al API en vez de un rango de fechas.
   */
  it("reintentar con el período personalizado a medio elegir NO manda el centinela al API", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montarEn(null);
    await screen.findByText(TITULO_DEL_FALLO);

    // El usuario abre «Personalizado» y lo descarta sin elegir fechas: el
    // filtro queda en `sc`.
    const periodo = screen
      .getByText("Periodo")
      .closest("button") as HTMLButtonElement;
    fireEvent.click(periodo);
    const portal = within(document.getElementById("portal-root") as HTMLElement);
    fireEvent.click(portal.getByText("Personalizado"));

    // El modal se descarta de verdad: el filtro queda en `sc` y sin rango.
    fireEvent.click(screen.getByText("cerrar-rango"));
    expect(
      screen.queryByTestId("modal-rango-personalizado"),
    ).not.toBeInTheDocument();

    const pedidosAntes = pedidos.length;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    // 🔴 LA MITAD POSITIVA, que faltaba (review 4R). Sin esto la aserción de
    // abajo era una negación sobre una lista VACÍA: quedaba verde con
    // cualquier implementación cuyo Reintentar no hiciera nada, incluida una
    // regresión de la guarda a un `return` mudo. Lo que el botón promete es
    // resolver, y acá se afirma QUÉ hace: vuelve a abrir el modal para que el
    // usuario elija el rango que le falta.
    expect(
      screen.getByTestId("modal-rango-personalizado"),
    ).toBeInTheDocument();

    // Y recién entonces, la negativa: no sale ningún pedido con el centinela.
    expect(
      pedidos.slice(pedidosAntes).some((p) => p?.filter_date === "sc"),
    ).toBe(false);
  });

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
