/**
 * Encolar un reporte se acepta con 200 igual que con 202.
 *
 * ## 🔴 Qué se rompía (medido el 2026-08-14 en el servidor de dev)
 *
 * Ningún reporte de lista se podía bajar: el admin decía "Failed to fetch" y el
 * log de Laravel decía lo contrario —job iniciado, job completado, PDF de
 * 103 KB escrito—. El síntoma no apuntaba a nada.
 *
 * La causa estaba en el servidor, no en el código. nginx esconde el
 * `Access-Control-Allow-Origin` que pone Laravel y lo vuelve a agregar con
 * `add_header` SIN el flag `always`. Sin `always`, `add_header` sólo se aplica
 * a una lista fija de estados:
 *
 *     200, 201, 204, 206, 301, 302, 303, 304, 307, 308
 *
 * El 202 no está en esa lista. La respuesta llegaba sin esa cabecera y el
 * navegador la descartaba entera: en DevTools se veía el 202 en rojo y acá
 * llegaba un "Failed to fetch" pelado.
 *
 * Medido contra el servidor real, con `Origin` puesto:
 *
 *     POST /api/v3/adm-login   200   trae allow-origin
 *     OPTIONS (preflight)      204   trae allow-origin
 *     export de reportes       202   NO la trae
 *     sin token                401   NO la trae
 *
 * Y como TODO export de lista salía por un 202, fallaban TODOS los reportes y
 * nada más. El recibo de pagos seguía andando porque va por un 200 y después
 * abre el PDF con `window.open()`, una navegación donde CORS ni se aplica.
 *
 * Por eso el back pasó a responder 200 al encolar.
 *
 * ## Qué cuida este test
 *
 * Que se acepten LOS DOS códigos. No es un detalle:
 *
 *   - Sin el 200, el front vuelve a romperse contra el back de hoy.
 *   - Sin el 202, se rompe el día que alguien le ponga `always` al nginx y el
 *     back vuelva al código correcto.
 *
 * Aceptar los dos es lo que permite que los dos lados se desplieguen en
 * cualquier orden, y que volver a 202 no necesite coordinar nada.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsyncExport } from "../useAsyncExport";

vi.mock("@/mk/hooks/useToast", () => ({
  default: () => ({ showToast: vi.fn() }),
}));

/**
 * Responde el encolado con el status pedido y después deja el polling en
 * "pending", que alcanza: acá sólo interesa si el encolado se aceptó.
 */
const stubFetch = (statusDelEncolado: number) => {
  let primera = true;
  const fetchMock = vi.fn(async () => {
    if (primera) {
      primera = false;
      return {
        ok: true,
        status: statusDelEncolado,
        json: async () => ({ job_id: "job-1", status: "pending" }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: "pending" }),
    };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const encolarCon = async (status: number) => {
  stubFetch(status);
  const { result } = renderHook(() =>
    useAsyncExport({ type: "defaulters", endpoint: "/v3/defaulters" }),
  );

  await act(async () => {
    await result.current.start({ format: "pdf" });
  });

  // ⚠️ El hook devuelve `{ state, start, reset, download }`, así que hay que
  // entrar por `state`. La primera version de este test miraba
  // `result.current.status` —que es `undefined`— y el `waitFor` de "que no sea
  // idle" pasaba trivialmente: no medía nada.
  await waitFor(() => expect(result.current.state.jobId).toBeTruthy());
  return result;
};

describe("useAsyncExport: el status con el que el back acepta el encolado", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("acepta el 200 que devuelve el back de hoy", async () => {
    const result = await encolarCon(200);

    expect(
      result.current.state.status,
      'El back responde 200 al encolar (nginx se come el CORS de los 202) y el front lo trató como error. ' +
        "Casi seguro alguien dejó el chequeo en `res.status === 202` a secas: tiene que aceptar los dos.",
    ).not.toBe("failed");
    expect(result.current.state.jobId).toBe("job-1");
  });

  it("sigue aceptando el 202, que es lo correcto y vuelve cuando se arregle nginx", async () => {
    const result = await encolarCon(202);

    expect(
      result.current.state.status,
      "Se dejó de aceptar el 202. El día que nginx lleve `always` el back vuelve a 202 " +
        "y esto rompe todos los reportes de nuevo.",
    ).not.toBe("failed");
    expect(result.current.state.jobId).toBe("job-1");
  });
});
