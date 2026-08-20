/**
 * CDT-99 — el panel decía «no hay» cuando lo que pasó fue un fallo de red.
 *
 * `useAxios` pone `loaded = true` en su `finally` pase lo que pase y deja
 * `data` en `null`. Sin mirar `error` —que en esta pantalla ni se
 * desestructuraba— un `/dashboard` caído y un condominio recién creado
 * producían EL MISMO render.
 *
 * ⚠️ LO QUE APARECIÓ AL MEDIR, Y QUE EL TICKET NO NOMBRABA: el panel entero
 * cuelga de UN SOLO pedido. Ese `/dashboard` alimenta el gráfico financiero,
 * las cuatro `WidgetList`, las cuatro tarjetas del resumen y las tres de
 * usuarios. Un fallo no dejaba «un pedazo vacío»: dejaba NUEVE afirmaciones
 * falsas a la vez —«Bs. 0» de ingresos, «Bs. 0» de cartera vencida, «No hay
 * pagos por revisar», «No existe ningún tipo de alerta»…—. Por eso el arreglo
 * es UN aviso, no nueve carteles, y por eso este test mide los cinco textos
 * mentirosos y no sólo el del gráfico que nombraba el ticket.
 *
 * Y por eso mismo el caso de control mira lo contrario: el widget «Comunidad»
 * tiene su PROPIO pedido (y su propio estado de error desde CDT-47), así que
 * un `/dashboard` caído no lo puede borrar de la pantalla.
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/** Lo que va a devolver el PRÓXIMO pedido. Lo arma cada caso antes de montar. */
let respuesta: { data: any; error: any } = { data: null, error: "" };

/** Cuántas veces se pidió, para afirmar que el reintento pide de verdad. */
const pedidos: any[] = [];

/**
 * El `reLoad` vivo del componente. Sirve para simular un refresco disparado
 * DESDE AFUERA —el que hace `store.reLoadDashboard` cuando se cierra un modal
 * (`Index.tsx:461`)—, que es el camino donde ya hay un panel bueno en pantalla.
 */
let dispararRefrescoExterno: (p?: any) => void = () => {};

/**
 * Cuántas respuestas ya aterrizaron. El doble responde en un tick aparte —no
 * en el mismo commit que el click— justamente para que la ventana «en vuelo»
 * EXISTA: si la respuesta llegara sincrónicamente, el estado de carga no
 * tendría un solo render donde verse y el caso del parpadeo no mediría nada.
 */
let respuestasAterrizadas = 0;

/**
 * 🔴 Un registro POR RENDER de los mensajes que pinta `EmptyData`.
 *
 * En CDT-98 dos casos salían VERDES con el bug puesto porque el estado
 * equivocado era TRANSITORIO. Acá los textos mentirosos pueden reaparecer
 * mientras el reintento está en vuelo —`useAxios` limpia su `error` al
 * arrancar—, así que se afirma sobre CADA render y no sobre el DOM final.
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
    // Arranca en `false`, como el hook real: el pedido del montaje ya salió.
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

    // El pedido del montaje (`enVuelo === 0`) y cada reintento resuelven acá,
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

// El diccionario REAL en español: así el test también pinea que las claves
// existan en `messages.ts` — si faltan, `translate` devuelve la clave cruda y
// las aserciones caen.
vi.mock("@/i18n/useScopedI18n", async () => {
  const { messages } = await vi.importActual<any>("@/i18n/messages");
  return {
    useScopedI18n: (section: string) => ({
      locale: "es",
      localeTag: "es-BO",
      translate: (key: string, vars?: Record<string, any>) => {
        const texto = messages.es[section]?.[key] ?? key;
        if (!vars) return texto;
        return Object.keys(vars).reduce(
          (acc, k) => acc.replaceAll(`{${k}}`, String(vars[k])),
          texto,
        );
      },
    }),
  };
});

// Desktop: las tarjetas de usuarios y el gráfico sólo se pintan fuera de móvil.
vi.mock("@/mk/hooks/useScreenSize", () => ({
  useScreenSize: () => ({ isMobile: false }),
}));

// Tiene su PROPIO pedido y su propio estado de error (CDT-47): se dobla para
// que no consuma el `useAxios` falso, y para poder afirmar que sobrevive.
vi.mock(
  "@/components/Widgets/WidgetsDashboard/WidgetContentsResume/WidgetContentsResume",
  () => ({ default: () => <div data-testid="widget-comunidad" /> }),
);
// Ídem: pide su propia salud de configuración, no sale de `/dashboard`.
vi.mock("@/components/ConfigHealth/ConfigHealth", () => ({
  default: () => <div data-testid="config-health" />,
}));

vi.mock("@/modulos/Owners/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/modulos/Payments/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/modulos/Reservas/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/modulos/Alerts/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/modulos/Contents/RenderView/RenderView", () => ({ default: () => null }));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({ default: () => null }));
vi.mock(
  "@/modulos/Assemblies/components/AssemblyDashboardCard/AssemblyDashboardCard",
  () => ({ AssemblyDashboardCard: () => <div data-testid="asamblea" /> }),
);
vi.mock(
  "@/components/Widgets/WidgetsDashboard/WidgetGraphResume/WidgetGraphResume",
  () => ({
    default: ({ showEmptyData, emptyDataProps }: any) => {
      // 🔴 El gráfico NO pasa por `EmptyData`: pinta su vacío por su cuenta
      // (review 4R). Sin empujar acá el mensaje, la primera de las cinco
      // vueltas del bucle de `LOS_VACIOS_MENTIROSOS` —justo la que nombraba el
      // ticket— comparaba contra una lista donde ese texto NUNCA podía estar:
      // una aserción que no puede fallar.
      if (showEmptyData) {
        mensajesPintados.push(String(emptyDataProps?.message ?? ""));
        return (
          <div data-testid="grafico-vacio">{emptyDataProps?.message}</div>
        );
      }
      return <div data-testid="grafico" />;
    },
  }),
);

import HomePage from "../Index";

const TITULO_DEL_FALLO = "No se pudo cargar la información del panel.";
const GENERICO = "Revisa tu conexión e intenta de nuevo.";
const CARGANDO = "Cargando la información del panel...";

/**
 * 🔴 LOS CINCO textos que afirmaban algo falso sobre el condominio. El del
 * gráfico es el que nombraba el ticket; los otros cuatro salen del MISMO
 * pedido y mentían igual.
 */
const LOS_VACIOS_MENTIROSOS = [
  "Gráfica financiera sin datos. Verás la evolución del control financiero a medida que tengas movimiento financiero.",
  "No hay pagos por revisar. Una vez los residentes comiencen a pagar sus deudas se mostrarán aquí.",
  "No existe ningún tipo de alerta. Cuando un guardia o residente registre una se mostrará aquí.",
  "Sin solicitudes de reserva. Una vez los residentes comiencen a reservar las áreas se mostrarán aquí.",
  "No se encontró ninguna cuenta de pre-registro. Cuando un usuario se auto-registre se mostrará aquí.",
];

/** Red caída: no hubo respuesta HTTP, así que `status` es 0 y no hay sobre. */
const LA_RED_SE_CAYO = {
  data: null,
  error: { message: "Network Error", status: 0, data: {} },
};

/** Un condominio nuevo DE VERDAD: el sobre llegó, con todo en cero y vacío. */
const SOBRE_VACIO_LEGITIMO = {
  data: {
    success: true,
    data: {
      TotalIngresos: 0,
      TotalEgresos: 0,
      morosos: 0,
      adminsCount: 0,
      ownersCount: 0,
      guardsCount: 0,
      ingresosHist: [],
      egresosHist: [],
      porConfirmar: [],
      alertas: [],
      porReservar: [],
      porActivar: [],
    },
  },
  error: "",
};

const montar = async () => {
  const objetivo = respuestasAterrizadas + 1;
  render(<HomePage />);
  await waitFor(() =>
    expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
  );
};

beforeEach(() => {
  pedidos.length = 0;
  mensajesPintados.length = 0;
  respuesta = { data: null, error: "" };
  // 🔴 Se resetea entre casos (review 4R de CDT-99): un contador de módulo
  // que sólo crece hace que el objetivo de cada `waitFor` dependa de cuántos
  // casos corrieron antes, o sea del ORDEN. El archivo de Balance ya lo hacía.
  respuestasAterrizadas = 0;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CDT-99 — el panel no confunde «falló el pedido» con «no hay nada»", () => {
  it("con el pedido fallado NO afirma ninguno de los cinco vacíos: avisa el fallo y ofrece reintentar", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montar();

    // 🔴 Va PRIMERO. Si no, la reinyección se pondría roja por el cartel que
    // falta y los textos mentirosos —lo que el ticket vino a sacar— nunca se
    // llegarían a medir.
    for (const mentira of LOS_VACIOS_MENTIROSOS) {
      expect(screen.queryByText(mentira)).not.toBeInTheDocument();
    }
    expect(screen.queryByTestId("grafico-vacio")).not.toBeInTheDocument();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(TITULO_DEL_FALLO)).toBeInTheDocument();
    expect(screen.getByText(GENERICO)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });

  /**
   * Las tarjetas de números salen del mismo pedido y no tienen `EmptyData` que
   * suprimir: sin datos mostraban «Bs. 0» de ingresos y «Bs. 0» de cartera
   * vencida, que es la misma afirmación falsa escrita con dígitos.
   */
  it("con el pedido fallado tampoco muestra montos ni conteos en cero", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montar();
    await screen.findByRole("alert");

    // 🔴 «Bs. 0» NO matchea: `formatNumber` usa dos decimales y lo que se
    // pinta es «Bs. 0.00» (review de CDT-99). La aserción que este test
    // declara como su propósito quedaba verde incluso con el bug reinyectado.
    expect(screen.queryByText("Bs. 0.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Resumen actual")).not.toBeInTheDocument();
    expect(screen.queryByText("Resumen de usuarios")).not.toBeInTheDocument();
  });

  /**
   * 🔴 Punto 1 de la medición: no convertir la pantalla entera en un cartel de
   * error. Estos dos tienen su PROPIO pedido —`ConfigHealth` y el widget
   * «Comunidad», que además ya trae su estado de error de CDT-47—, así que un
   * `/dashboard` caído no los puede borrar.
   */
  it("lo que NO falló sigue en pantalla: configuración y el widget Comunidad", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montar();
    await screen.findByRole("alert");

    expect(screen.getByTestId("config-health")).toBeInTheDocument();
    expect(screen.getByTestId("widget-comunidad")).toBeInTheDocument();
  });

  /**
   * EL CONTROL. Un condominio nuevo de verdad no tiene movimientos y esos
   * mensajes TIENEN que seguir existiendo — y sin botón, porque no hay nada
   * que reintentar. Es el caso que cae si el arreglo se pasa de largo y
   * convierte todo vacío en un error.
   */
  it("el vacío REAL sigue apareciendo entero, sin cartel y sin botón", async () => {
    respuesta = SOBRE_VACIO_LEGITIMO;
    await montar();

    for (const vacioLegitimo of LOS_VACIOS_MENTIROSOS) {
      expect(await screen.findByText(vacioLegitimo)).toBeInTheDocument();
    }
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(TITULO_DEL_FALLO)).not.toBeInTheDocument();
    // Y las tarjetas del resumen vuelven, con sus ceros legítimos.
    expect(screen.getByText("Resumen actual")).toBeInTheDocument();
  });

  it("el botón de reintentar REINTENTA, y el panel vuelve con sus datos", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montar();
    await screen.findByRole("alert");

    const pedidosAntes = pedidos.length;

    // El reintento SÍ trae datos: así se ejercita un reintento que funciona y
    // no sólo que se llamó. Un mock que devuelve el mismo error no prueba nada.
    respuesta = {
      data: {
        success: true,
        data: {
          ...SOBRE_VACIO_LEGITIMO.data.data,
          TotalIngresos: 4500,
          // Distinto de los ingresos a propósito: si fueran iguales, el monto
          // del balance coincidiría y la aserción no sabría cuál tarjeta miró.
          TotalEgresos: 1200,
          ingresosHist: [{ amount: 4500, mes: 8 }],
          egresosHist: [{ amount: 1200, mes: 8 }],
        },
      },
      error: "",
    };

    const objetivo = respuestasAterrizadas + 1;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(pedidos.length).toBe(pedidosAntes + 1);
    expect(await screen.findByTestId("grafico")).toBeInTheDocument();
    expect(screen.getByText("Bs. 4,500.00")).toBeInTheDocument();
  });

  /**
   * 🔴 EL OTRO SIGNO DEL MISMO DEFECTO (review de CDT-99).
   *
   * `useAxios` NO limpia `data` cuando falla: sólo hace `setError`. Si la
   * condición del cartel preguntara por `error`, un refresco fallado le
   * BORRARÍA al usuario un panel CORRECTO que estaba leyendo para poner un
   * «no se pudo cargar». Cambiar «no se pudo actualizar» por «no hay nada» es
   * exactamente el defecto que este ticket vino a cerrar, dado vuelta.
   *
   * Lo que corresponde ahí es `isStale`: se avisa, no se borra.
   */
  it("un refresco fallado NO borra el panel correcto: avisa que el dato quedó viejo", async () => {
    respuesta = {
      data: {
        success: true,
        // Egresos distinto de ingresos a propósito: si fueran iguales, el
        // monto del balance coincidiría y la aserción no sabría cuál miró.
        data: {
          ...SOBRE_VACIO_LEGITIMO.data.data,
          TotalIngresos: 4500,
          TotalEgresos: 1200,
        },
      },
      error: "",
    };
    await montar();
    expect(await screen.findByText("Bs. 4,500.00")).toBeInTheDocument();

    // Ahora se cae la red en el REFRESCO, con el panel bueno en pantalla.
    respuesta = LA_RED_SE_CAYO;
    const objetivo = respuestasAterrizadas + 1;
    await act(async () => {
      dispararRefrescoExterno({});
    });
    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );

    // El panel sigue: no se le borró al usuario lo que estaba mirando.
    expect(screen.getByText("Bs. 4,500.00")).toBeInTheDocument();
    expect(screen.getByText("Resumen actual")).toBeInTheDocument();
    // Y NO se pinta el cartel de carga fallida, que sería mentira.
    expect(screen.queryByText(TITULO_DEL_FALLO)).not.toBeInTheDocument();
    // Pero tampoco se calla: avisa que el dato quedó viejo.
    expect(screen.getByRole("status")).toHaveTextContent(
      "No se pudo actualizar",
    );
  });

  /**
   * 🔴 EL PARPADEO. Se afirma sobre CADA render, no sobre el final.
   *
   * `useAxios` limpia su `error` al ARRANCAR la petición: el render de en
   * medio ya no sabe que hubo un fallo y `data` sigue en `null`, así que sin
   * un estado de carga propio el panel repinta los cinco «no hay» justo ahí.
   * Un test que mire el DOM final no lo vería nunca: el render siguiente lo
   * borra.
   */
  /**
   * 🔴 El borde que el corte de `cargaFallida` ahora es dueño, y que no estaba
   * medido (review 4R): un 200 rechazado en el cuerpo llegando como REFRESCO,
   * con el panel bueno ya en pantalla.
   *
   * Ahí no hay `error` —axios no rechaza un 200— y `useAxios` hace
   * `setData(response.data)` igual, así que el sobre sin `data` PISA al bueno.
   * `isStale` no se puede prender, porque el dato viejo ya no existe.
   *
   * ⚠️ Que se vea el cartel de fallo en vez de la banda NO es un descuido: es
   * lo único honesto cuando el dato anterior ya no está. Lo que se fija acá es
   * que caiga en el CARTEL y no en los nueve «no hay» de antes del ticket.
   */
  it("un 200 rechazado llegando como REFRESCO cae en el cartel, no en los vacíos", async () => {
    respuesta = {
      data: {
        success: true,
        data: {
          ...SOBRE_VACIO_LEGITIMO.data.data,
          TotalIngresos: 4500,
          TotalEgresos: 1200,
        },
      },
      error: "",
    };
    await montar();
    expect(await screen.findByText("Bs. 4,500.00")).toBeInTheDocument();

    respuesta = {
      data: { success: false, message: "No tenés acceso al panel." },
      error: "",
    };
    const objetivo = respuestasAterrizadas + 1;
    await act(async () => {
      dispararRefrescoExterno({});
    });
    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );

    // ⚠️ Acá se mide el DOM final, no el registro por render, y eso es a
    // propósito: mientras el refresco está en vuelo el panel sigue mostrando
    // el dato ANTERIOR —que es lo que queremos— y ese dato tiene sus listas
    // vacías de verdad. O sea que el registro por render trae vacíos
    // LEGÍTIMOS, no mentiras. La mentira sería que queden en pantalla DESPUÉS
    // de que el pedido volvió rechazado, y eso es lo que se afirma.
    for (const mentira of LOS_VACIOS_MENTIROSOS) {
      expect(screen.queryByText(mentira)).not.toBeInTheDocument();
    }
    // Ni los montos en cero, que son la misma mentira con dígitos.
    expect(screen.queryByText("Bs. 0.00")).not.toBeInTheDocument();
    // Dice lo que pasó, con el texto del API.
    expect(screen.getByText(TITULO_DEL_FALLO)).toBeInTheDocument();
    expect(screen.getByText("No tenés acceso al panel.")).toBeInTheDocument();
    // ⚠️ Acá NO va una aserción sobre la banda de dato viejo, y es a propósito
    // (review 4R): en este camino `isStale` no se puede prender ni queriendo
    // —el hook lo apaga por la rama de éxito, porque un 200 NO es un rechazo
    // de axios—, así que afirmar que la banda no está sería una aserción que
    // no puede fallar. Lo que este caso mide es dónde CAE el render.
  });

  /**
   * 🔴 Hallazgo del review 4R: la guarda de la banda estaba MUERTA.
   *
   * `datoDesactualizado` se apoyaba en `!cargandoDashboard`, que comparte el
   * predicado `!dashboard?.data` con `cargaFallida`. En el único caso donde
   * `isStale` está prendido —hay dato viejo EN PANTALLA— las dos son `false`,
   * así que no suprimían nada: la banda y su botón de Reintentar se pintaban
   * durante el reintento, prometiendo resolver algo que ya se estaba
   * resolviendo.
   */
  it("mientras el reintento está en vuelo NO se ve la banda de dato viejo", async () => {
    respuesta = {
      data: {
        success: true,
        data: {
          ...SOBRE_VACIO_LEGITIMO.data.data,
          TotalIngresos: 4500,
          TotalEgresos: 1200,
        },
      },
      error: "",
    };
    await montar();

    // Primero se rompe un refresco: ahí sí tiene que aparecer la banda.
    respuesta = LA_RED_SE_CAYO;
    const objetivo = respuestasAterrizadas + 1;
    await act(async () => {
      dispararRefrescoExterno({});
    });
    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "No se pudo actualizar",
    );

    // Ahora se aprieta Reintentar y se mira el render de EN MEDIO, con el
    // pedido todavía en vuelo: `isStale` sigue prendido —el hook lo apaga
    // recién cuando un refresco entra bien— pero la banda no tiene que estar.
    await act(async () => {
      fireEvent.click(screen.getByText("Reintentar"));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("durante el reintento NUNCA se pinta un vacío mentiroso, en ningún render", async () => {
    respuesta = LA_RED_SE_CAYO;
    await montar();
    await screen.findByRole("alert");

    mensajesPintados.length = 0;
    respuesta = LA_RED_SE_CAYO;
    const objetivo = respuestasAterrizadas + 1;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    // El estado de carga toma la posta en el MISMO render del click: el
    // pedido todavía está en vuelo y ya no hay ni cartel ni «no hay».
    expect(screen.getByText(CARGANDO)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await waitFor(() =>
      expect(respuestasAterrizadas).toBeGreaterThanOrEqual(objetivo),
    );
    await screen.findByRole("alert");

    for (const mentira of LOS_VACIOS_MENTIROSOS) {
      expect(mensajesPintados).not.toContain(mentira);
    }
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
    await montar();

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
    await montar();

    expect(await screen.findByText(GENERICO)).toBeInTheDocument();
    expect(
      screen.queryByText("Detalle interno del servidor"),
    ).not.toBeInTheDocument();
  });

  /**
   * La segunda forma del fallo: HTTP 200 rechazado en el CUERPO.
   * `sendError($msg, [], 200)` devuelve `{success:false, message}` y ningún
   * `data`. Axios no rechaza un 200, así que acá no hay `error` que mirar y
   * mirando sólo `error` esta forma seguía cayendo en los vacíos mentirosos.
   */
  it("un HTTP 200 rechazado en el cuerpo tampoco es un condominio sin actividad", async () => {
    respuesta = {
      data: {
        success: false,
        message: "No tienes permiso para realizar esta acción",
        errors: [],
      },
      error: "",
    };
    await montar();

    for (const mentira of LOS_VACIOS_MENTIROSOS) {
      expect(screen.queryByText(mentira)).not.toBeInTheDocument();
    }
    expect(
      await screen.findByText("No tienes permiso para realizar esta acción"),
    ).toBeInTheDocument();
  });
});
