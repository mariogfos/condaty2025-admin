import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, act, waitFor } from "@testing-library/react";
import React from "react";

/**
 * El mensaje que manda el API llega a la pantalla.
 *
 * ## 🔴 Qué se rompía (CDT-94)
 *
 * `useCrud.onSave` leía sólo `response?.message`, y ante CUALQUIER no-2xx axios
 * rechaza: `response` queda `null`, así que el toast caía SIEMPRE al genérico
 * «No se pudo guardar. Intenta nuevamente.». El campo `message` del sobre no se
 * leía nunca.
 *
 * El API **sí** dice cuál campo falta: `DebtDptoController::checkValidationRules()`
 * valida con siete mensajes escritos en castellano —«La unidad es obligatoria.»,
 * «Debe indicar el monto de la deuda.»…— y desde CDT-93 salen como un **422 con
 * los errores por campo**. Ninguno se veía. El usuario leía «No se pudo
 * guardar» y no sabía qué corregir.
 *
 * ⚠️ CDT-93 y esto se ven IGUAL en pantalla mientras esto esté roto, porque los
 * dos casos son no-2xx: aquel arreglo del API no se nota hasta que este entre.
 *
 * Es el kernel compartido: le pasa a las ~40 pantallas, las de Mk y las
 * migradas a Mk2. No es de Deudas.
 *
 * ## Las cuatro ramas, y por qué están las cuatro
 *
 * | sobre | qué tiene que verse |
 * |---|---|
 * | 422 con `message` | ese `message` |
 * | 422 con `errors` por campo | además, los campos MARCADOS |
 * | sin sobre (red caída) | el genérico de siempre |
 * | `message` técnico (SQLSTATE) | el genérico — el front no confía en la sanitización del API |
 *
 * El quinto es el CONTROL: un guardado exitoso sigue igual. Sin él, «arreglar»
 * esto mandando todo por la rama de error pasaría en verde.
 *
 * ## Reinyección, medida el 2026-08-18
 *
 * Las dos mitades se reinyectaron por separado; el detalle literal está en el
 * reporte del ticket. Mitad A (volver a `response?.message || generico`): 3
 * rojos. Mitad B (no llamar a `_setErrors` con los `errors` del sobre): 1 rojo.
 */

const execute = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: null,
    reLoad: vi.fn(),
    execute,
    loaded: true,
    error: null,
    cancel: vi.fn(),
    waiting: 0,
    setWaiting: vi.fn(),
  }),
}));

const showToast = vi.fn();
vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast,
  }),
}));

vi.mock("@/mk/components/ui/Table/Table", () => ({
  default: () => <div data-testid="table-mock" />,
}));
vi.mock("@/mk/components/ui/Pagination/Pagination", () => ({
  default: () => null,
}));
vi.mock("@/mk/hooks/useCrud/FormElement", () => ({ default: () => null }));
vi.mock("@/mk/components/forms/DataSearch/DataSearch", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/data/ImportDataModal/ImportDataModal", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/ui/DetailModal/DetailModal", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/ui/NewModal/NewModal", () => ({
  default: () => null,
}));
vi.mock("@/mk/components/forms/FloatButton/FloatButton", () => ({
  default: () => null,
}));
vi.mock("@/components/NoData/EmptyData", () => ({ default: () => null }));
vi.mock("@/mk/hooks/useMediaQuery", () => ({ default: () => false }));
vi.mock("@/components/layout/icons/IconsBiblioteca", async (importOriginal) => {
  const actual: any = await importOriginal();
  const mocked: Record<string, any> = { __esModule: true };
  for (const key of Object.keys(actual)) mocked[key] = () => null;
  return mocked;
});

import useCrud, { ModCrudType } from "../useCrud";
import { MENSAJE_GENERICO_DE_GUARDADO } from "../leerElErrorDelApi";

const mod: ModCrudType = {
  modulo: "v3/debt-dptos",
  singular: "Deuda",
  plural: "",
  permiso: "expense",
} as ModCrudType;

const fields = {
  id: { rules: [], api: "e" },
  dpto_id: { rules: [], api: "ae", label: "Unidad" },
  amount: { rules: [], api: "ae", label: "Monto", list: {} },
  subcategory_id: { rules: [], api: "ae", label: "Subcategoría" },
};

const listaOk = () => ({
  data: { data: [], message: { total: 0 } },
  error: null,
});

const montar = () => {
  const runtime: { current: any } = { current: null };

  const Comp = () => {
    runtime.current = useCrud({
      paramsInitial: { page: 1, perPage: 20, fullType: "L", searchBy: "" },
      mod,
      fields,
    });
    return null;
  };

  render(<Comp />);
  return runtime;
};

/**
 * Lo que devuelve `useAxios` cuando axios RECHAZA: `data` en null y el sobre
 * del API en `error.data` — es literalmente su catch (`useAxios.tsx:220`,
 * `err.response?.data || {}`).
 */
const rechazoDelApi = (sobre: any, status = 422) => ({
  data: null,
  error: { message: "Request failed", status, data: sobre },
});

const toastsVisibles = () =>
  showToast.mock.calls.filter(([msg]) => !!msg && String(msg).trim() !== "");

/** Guarda y espera a que el `onSave` entero termine. */
const guardar = async (runtime: any, setErrors?: Function) => {
  await act(async () => {
    void runtime.current.onSave(
      { dpto_id: 7, amount: 150, subcategory_id: 3 },
      setErrors,
    );
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
};

const conElPostFallando = (respuesta: any) => {
  execute.mockImplementation(async (_url: string, method: string) => {
    if (method === "POST") return respuesta;
    return listaOk();
  });
};

describe("useCrud: el mensaje del API llega a la pantalla (CDT-94)", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("con `message` en el sobre de un 422, se muestra ESE y no el genérico", async () => {
    // El sobre real del 422: lo arma el handler de Laravel, no `sendError`, así
    // que no trae `success`. Medido en
    // `UnaDeudaSinUnCampoObligatorioDiceCualFaltaTest`.
    conElPostFallando(
      rechazoDelApi({
        message: "La unidad es obligatoria.",
        errors: { dpto_id: ["La unidad es obligatoria."] },
      }),
    );

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    await guardar(runtime);

    expect(toastsVisibles()).toHaveLength(1);
    expect(
      toastsVisibles()[0][0],
      "🔴 el usuario no leyó qué campo falta: no sabe qué corregir",
    ).toBe("La unidad es obligatoria.");
    expect(toastsVisibles()[0][1]).toBe("error");
  });

  it("con `errors` por campo, los campos quedan MARCADOS en el formulario", async () => {
    conElPostFallando(
      rechazoDelApi({
        message: "Debe indicar el monto de la deuda. (and 1 more error)",
        errors: {
          amount: ["Debe indicar el monto de la deuda."],
          subcategory_id: ["La subcategoría es obligatoria."],
        },
      }),
    );

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    // 🔴 Va el `_setErrors` del formulario, no el estado del hook: es el que le
    // pasa `renderForm` (`useCrud.tsx:1723`) y el único que el form mira para
    // pintar debajo del input. Mandarlos al otro los deja donde nadie los lee.
    const setErrorsDelForm = vi.fn();
    await guardar(runtime, setErrorsDelForm);

    // La primera llamada es la de `checkRulesFields` (sin errores locales); la
    // que importa es la última, con lo que devolvió el API.
    expect(
      setErrorsDelForm.mock.calls.length,
      "🔴 el form nunca recibió los errores por campo del API",
    ).toBeGreaterThan(1);

    const marcados = setErrorsDelForm.mock.calls.at(-1)![0];
    expect(Object.keys(marcados).sort()).toEqual(["amount", "subcategory_id"]);
    expect(marcados.amount).toEqual(["Debe indicar el monto de la deuda."]);
    expect(marcados.subcategory_id).toEqual(["La subcategoría es obligatoria."]);
  });

  it("sin sobre —red caída, timeout, CORS— queda el genérico de siempre", async () => {
    // El catch de `useAxios` deja `data: {}` cuando no hubo respuesta HTTP.
    conElPostFallando({
      data: null,
      error: { message: "Network Error", status: 0, data: {} },
    });

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    const setErrorsDelForm = vi.fn();
    await guardar(runtime, setErrorsDelForm);

    expect(toastsVisibles()).toHaveLength(1);
    expect(
      toastsVisibles()[0][0],
      "🔴 un error de red no tiene mensaje del API: el genérico es lo correcto",
    ).toBe(MENSAJE_GENERICO_DE_GUARDADO);

    // Y no puede quedar un mensaje vacío ni `undefined` colgado en el form.
    const ultima = setErrorsDelForm.mock.calls.at(-1)![0];
    expect(Object.keys(ultima)).toHaveLength(0);
  });

  it("un 5xx NUNCA muestra su mensaje, aunque el texto parezca inofensivo", async () => {
    // 🔴 LA REGLA: manda el código, no el texto. Estos tres pasaban la lista
    // negra ENTEROS —los midió el review con `app.debug` prendido, que es como
    // están los servidores de testers— y llevan adentro usuario de base, IP,
    // host, puerto y rutas del servidor. Ninguno se nombra en el filtro: los
    // tapa el 500.
    const delMotor = [
      "Access denied for user 'condaty'@'10.0.0.5' (using password: YES)",
      "cURL error 7: Failed to connect to internal-api port 8000",
      "file_get_contents(/var/www/storage/x): failed to open stream",
    ];

    for (const mensaje of delMotor) {
      showToast.mockReset();
      conElPostFallando(
        rechazoDelApi({ success: false, message: mensaje, errors: [] }, 500),
      );

      const runtime = montar();
      await waitFor(() => expect(execute).toHaveBeenCalled());
      await guardar(runtime);

      expect(toastsVisibles()).toHaveLength(1);
      expect(
        toastsVisibles()[0][0],
        `🔴 un 500 le mostró el motor al usuario: «${mensaje}»`,
      ).toBe(MENSAJE_GENERICO_DE_GUARDADO);
      cleanup();
    }
  });

  it("con texto técnico en un 4xx —SQLSTATE, tabla, traza— se muestra el genérico", async () => {
    // La segunda línea, para donde el código HTTP dice «esto es de negocio»:
    // hay cinco sitios que concatenan un `getMessage()` dentro de un rechazo
    // —`ExpenseImportService:53` y `:293`, `AreaBlockingService:129`,
    // `SurveyController:725`, `DebtGroupController:145`—.
    //
    // ⚠️ Va como 4xx A PROPÓSITO: con 500 este test pasaría por la regla del
    // código y no mediría el filtro de texto que dice medir.
    conElPostFallando(
      rechazoDelApi(
        {
          success: false,
          message:
            "No se pudo importar: SQLSTATE[42S22]: Column not found: 1054 Unknown column 'monto' (SQL: insert into `expenses` ...)",
          errors: [],
        },
        409,
      ),
    );

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    await guardar(runtime);

    expect(toastsVisibles()).toHaveLength(1);
    expect(
      toastsVisibles()[0][0],
      "🔴 se le mostró el SQL al usuario",
    ).toBe(MENSAJE_GENERICO_DE_GUARDADO);
  });

  it("un 4xx de negocio muestra su mensaje, que está escrito para el usuario", async () => {
    conElPostFallando(
      rechazoDelApi(
        { success: false, message: "No puede crear este registro en otro condominio.", errors: [] },
        403,
      ),
    );

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    await guardar(runtime);

    expect(toastsVisibles()).toHaveLength(1);
    expect(toastsVisibles()[0][0]).toBe(
      "No puede crear este registro en otro condominio.",
    );
  });

  it("el `errors: []` de `sendError` NO pisa los errores locales del formulario", async () => {
    // 🔴 `sendError($msg, [], 4xx)` manda `errors` como ARRAY vacío, no objeto,
    // y pasárselo a `setErrors` le borra al formulario los errores que ya tenía
    // pintados.
    //
    // ⚠️ MEDIDO: el caso está defendido DOS VECES y cada defensa alcanza sola,
    // así que reinyectar una sola deja este test VERDE —y verde por el motivo
    // equivocado—. Son:
    //   1. el `!Array.isArray(valor)` de `comoSobre`, que devuelve `null`;
    //   2. el `if (Object.keys(limpios).length > 0)`, que deja `errores` en
    //      `null` en vez de `{}` — y `{}` es TRUTHY, así que `onSave` llamaría
    //      al `setErrors` del formulario con un objeto vacío.
    // Sacando las dos, este caso se pone rojo con
    // «expected [ [ {} ], [ {} ] ] to have a length of 1 but got 2».
    //
    // (Un array NO vacío en `errors` no existe: `$validator->errors()` es un
    // `MessageBag` y serializa a objeto en cuanto tiene una clave.)
    conElPostFallando(
      rechazoDelApi(
        { success: false, message: "La deuda ya fue cobrada.", errors: [] },
        409,
      ),
    );

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    const setErrorsDelForm = vi.fn();
    await guardar(runtime, setErrorsDelForm);

    expect(toastsVisibles()[0][0]).toBe("La deuda ya fue cobrada.");

    // La única llamada válida es la de `checkRulesFields`, con su objeto vacío.
    for (const [recibido] of setErrorsDelForm.mock.calls) {
      expect(
        Array.isArray(recibido),
        "🔴 se le mandó un array al `setErrors` del formulario",
      ).toBe(false);
    }
    expect(setErrorsDelForm.mock.calls).toHaveLength(1);
  });

  it("CONTROL: un guardado exitoso sigue funcionando igual", async () => {
    execute.mockImplementation(async (_url: string, method: string) => {
      if (method === "POST") {
        return {
          data: { success: true, message: "Registro creado", data: { id: 9 } },
          error: null,
        };
      }
      return listaOk();
    });

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    const setErrorsDelForm = vi.fn();
    await guardar(runtime, setErrorsDelForm);

    expect(toastsVisibles()).toHaveLength(1);
    expect(toastsVisibles()[0][0]).toBe("Registro creado");
    expect(
      toastsVisibles()[0][1],
      "🔴 el arreglo se llevó puesto el caso bueno",
    ).toBe("success");

    // Y el formulario no queda con errores pintados encima de un éxito.
    const ultima = setErrorsDelForm.mock.calls.at(-1)![0];
    expect(Object.keys(ultima)).toHaveLength(0);
  });

  it("el EXPORT también dice lo que dijo el API, no su genérico fijo", async () => {
    // 🔴 Mismo defecto, en la puerta de al lado del mismo hook: `onExport`
    // destructuraba sólo `{ data: file }` y tiraba el error, así que ante
    // cualquier no-2xx mostraba siempre "Hubo un error al exportar el archivo".
    execute.mockImplementation(async (_url: string, _method: string, pay: any) => {
      if (pay?._export) {
        return rechazoDelApi(
          {
            success: false,
            message: "El listado supera las 10.000 filas: acotá el período.",
            errors: [],
          },
          413,
        );
      }
      return listaOk();
    });

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    await act(async () => {
      void runtime.current.onExport("xls");
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    expect(toastsVisibles()).toHaveLength(1);
    expect(toastsVisibles()[0][0]).toBe(
      "El listado supera las 10.000 filas: acotá el período.",
    );
  });

  it("el EXPORT con un 5xx cae a SU genérico, no al del guardado", async () => {
    execute.mockImplementation(async (_url: string, _method: string, pay: any) => {
      if (pay?._export) {
        return rechazoDelApi(
          { success: false, message: "Allowed memory size exhausted", errors: [] },
          500,
        );
      }
      return listaOk();
    });

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));

    await act(async () => {
      void runtime.current.onExport("pdf");
      await new Promise((resolve) => setTimeout(resolve, 80));
    });

    expect(toastsVisibles()).toHaveLength(1);
    // Cada puerta conserva SU genérico: el del export nombra el export.
    expect(toastsVisibles()[0][0]).toBe("Hubo un error al exportar el archivo");
  });

  it("el rechazo de negocio (HTTP 200 con `success: false`) sigue mostrando su mensaje", async () => {
    // Esta rama NO pasa por `error`: llega en `response`, con `err` en null.
    // Es la que ya cubría CDT-60 y no se puede perder al mirar el error.
    conElPostFallando({
      data: { success: false, message: "La unidad ya tiene esa deuda" },
      error: null,
    });

    const runtime = montar();
    await waitFor(() => expect(execute).toHaveBeenCalledTimes(1));
    await guardar(runtime);

    expect(toastsVisibles()).toHaveLength(1);
    expect(toastsVisibles()[0][0]).toBe("La unidad ya tiene esa deuda");
  });
});
