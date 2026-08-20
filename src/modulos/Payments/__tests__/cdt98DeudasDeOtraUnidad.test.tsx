import React from "react";
import { renderHook, act, waitFor, render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePaymentsForm } from "../hooks/usePaymentsForm";
import RenderForm from "../RenderForm/RenderForm";
import { FormPaymentType, PaymentMethod } from "../Type/PaymentType";
import { paymentsApi } from "../api";

/**
 * CDT-98 — al cambiar de unidad, las deudas de la ANTERIOR no pueden quedar en
 * pantalla rotuladas como de la nueva.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 QUÉ SE ROMPÍA
 * ────────────────────────────────────────────────────────────────────────
 *
 * `getDeudas` sólo escribía la lista dentro de `if (data?.success)`, sin rama
 * `else`, y `useAxios` NO lanza: atrapa adentro y devuelve `{ data, error }`
 * con `data` en `null` (`useAxios.tsx:218`). O sea que el `catch` vacío que
 * había era código muerto y un pedido fallido no tocaba NADA:
 *
 * - la lista de la unidad A se quedaba renderizada bajo el rótulo de la B,
 * - `lastLoadedDeudas.current` ya se había pisado con la clave de B ANTES de
 *   pedir, así que el efecto tampoco iba a reintentar,
 * - y el botón de guardar seguía habilitado.
 *
 * Resultado: un cobro imputado a la unidad equivocada, sin ningún aviso.
 *
 * Si A no tenía deudas, el mismo fallo caía en el `EmptyData` — «Esta unidad no
 * tiene deudas pendientes» + «No se puede registrar un pago» — que es la
 * afirmación falsa de CDT-47, esta vez bloqueando un cobro legítimo.
 *
 * ⚠️ Los mensajes de error de los fixtures describen lo que manda el motor, no
 * lo copian: un texto crudo del servidor pegado acá se lee como una fuga.
 */

const mockShowToast = vi.fn();
const mockReLoad = vi.fn();
const mockOnClose = vi.fn();

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    store: { Unitstype: null },
  }),
}));

/** Las dos unidades del caso: A (la que se venía mirando) y B (la nueva). */
const UNIDAD_A = { id: 5, nro: "101", description: "Dpto 101", homeowner: { id: 9, name: "Mario" } };
const UNIDAD_B = { id: 8, nro: "202", description: "Dpto 202", homeowner: { id: 11, name: "Ana" } };

const DEUDA_DE_A = { id: "deuda-de-A", month: 3, year: 2026, amount: 1000, type: 1 };
const DEUDA_DE_B = { id: "deuda-de-B", month: 7, year: 2026, amount: 2500, type: 1 };

const GENERICO = "Revisa tu conexión e intenta de nuevo.";

const propsBase = (execute: any) =>
  ({
    item: {
      paid_at: "2026-08-19",
      type: FormPaymentType.EXPENSE,
      dpto_id: "101",
      method: String(PaymentMethod.CASH),
      amount: "",
    },
    extraData: {
      dptos: [UNIDAD_A, UNIDAD_B],
      categories: [],
      client_config: { cat_expensas: 100, cat_reservations: 200, cat_forgiveness: 300 },
      bankAccounts: [],
      subcategories: [],
    },
    execute,
    showToast: mockShowToast,
    reLoad: mockReLoad,
    onClose: mockOnClose,
  }) as any;

const okConDeudas = (deudas: any[]) => ({
  data: { success: true, data: { deudas } },
  error: null,
});

/** Lo que devuelve `useAxios` cuando no hubo respuesta HTTP (red caída). */
const redCaida = () => ({
  data: null,
  error: { message: "Network Error", data: {}, status: 0 },
});

/**
 * ⚠️ `propsBase()` se llama UNA vez por test y se congela: llamarla dentro del
 * callback de `renderHook` devuelve props nuevas en cada render, y con ellas un
 * `getDeudas` de identidad nueva, asi que el efecto que lo tiene en las
 * dependencias corre en cada render. Medido: el test se cuelga en 5 s.
 */

/** Cambia la unidad seleccionada como lo hace el `Select` de la pantalla. */
const cambiarUnidad = async (result: any, nro: string) => {
  await act(async () => {
    result.current.handleChangeInput({
      target: { name: "dpto_id", value: nro, type: "text" },
    } as any);
  });
};

describe("CDT-98 — el cambio de unidad y el pedido de deudas fallido", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("🔴 EL DEL TICKET: si el pedido de la unidad B falla, NO queda ninguna deuda de A en pantalla", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      .mockResolvedValueOnce(redCaida());

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));

    // La unidad A carga bien: su deuda está en pantalla.
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));
    expect(result.current.deudas[0].id).toBe("deuda-de-A");

    await cambiarUnidad(result, "202");

    // Se espera al pedido de la unidad B, no al arreglo: asi la aserción que
    // sigue es la del ticket y no un efecto colateral de haber esperado bien.
    await waitFor(() =>
      expect(
        execute.mock.calls.filter((c: any[]) => c[0] === paymentsApi.adminDebts),
      ).toHaveLength(2),
    );

    // 🔴 Lo que mide el ticket: ni una sola deuda de A bajo el rótulo de B.
    expect(result.current.deudas.map((d: any) => String(d.id))).not.toContain(
      "deuda-de-A",
    );
    expect(result.current.deudas).toHaveLength(0);
    expect(result.current.deudasError).toBeTruthy();
    expect(result.current.selectedPeriodo).toHaveLength(0);
    expect(result.current.periodoTotal).toBe(0);

    // Red caída (status 0): no hay sobre, así que el genérico.
    expect(result.current.deudasError).toBe(GENERICO);

    // Y no se puede cobrar sobre una lista que no se pudo traer.
    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it("no afirma «esta unidad no tiene deudas» cuando lo que pasó es que falló el pedido", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      .mockResolvedValueOnce(redCaida());

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));
    await cambiarUnidad(result, "202");
    await waitFor(() => expect(result.current.deudasError).toBeTruthy());

    // La lista está vacía pero NO por ser una unidad sin deudas. Lo que se
    // mide es el texto que le llega al operador: nunca la frase de CDT-47.
    await act(async () => {
      await result.current._onSavePago();
    });
    expect(result.current.errors.general).not.toBe(
      "No se puede registrar un pago de expensas cuando no hay deudas pendientes",
    );
  });

  it("con la lista en estado de error, el cobro NO se dispara", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      .mockResolvedValueOnce(redCaida());

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));
    await cambiarUnidad(result, "202");
    await waitFor(() => expect(result.current.deudasError).toBeTruthy());

    await act(async () => {
      await result.current._onSavePago();
    });

    // Ni un POST a `/v3/payments`: `validar()` corta antes.
    const posteos = execute.mock.calls.filter(
      (c: any[]) => c[0] === paymentsApi.create && c[1] === "POST",
    );
    expect(posteos).toHaveLength(0);
    expect(result.current.errors.general).toBe(
      "No se pudieron cargar las deudas de esta unidad. Reintenta antes de registrar el pago.",
    );
  });

  it("CONTROL: un cambio de unidad EXITOSO sigue mostrando las deudas de la unidad nueva", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_B]));

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));
    expect(result.current.deudas[0].id).toBe("deuda-de-A");

    await cambiarUnidad(result, "202");

    await waitFor(() => expect(result.current.deudas[0]?.id).toBe("deuda-de-B"));
    expect(result.current.deudas).toHaveLength(1);
    expect(result.current.deudasError).toBeNull();
    expect(result.current.isSubmitDisabled).toBe(false);

    // El segundo GET pidió por el id REAL de la unidad B, no por el de A.
    const pedidos = execute.mock.calls.filter((c: any[]) => c[0] === paymentsApi.adminDebts);
    expect(pedidos).toHaveLength(2);
    expect(pedidos[1][2]).toMatchObject({ dptoId: UNIDAD_B.id });
  });

  it("CONTROL: una unidad SIN deudas sigue diciendo que no tiene, y sin error", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      .mockResolvedValueOnce(okConDeudas([]));

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));

    await cambiarUnidad(result, "202");

    await waitFor(() => expect(result.current.deudas).toHaveLength(0));
    expect(result.current.deudasError).toBeNull();

    // Acá la frase SÍ es cierta: la unidad contestó y no debe nada.
    await act(async () => {
      await result.current._onSavePago();
    });
    expect(result.current.errors.general).toBe(
      "No se puede registrar un pago de expensas cuando no hay deudas pendientes",
    );
  });

  it("un 4xx muestra el mensaje del API; un 5xx cae al genérico", async () => {
    const mensajeDeNegocio = "No tiene permisos para ver las deudas de esta unidad.";

    const execute403 = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Request failed",
        data: { success: false, message: mensajeDeNegocio, errors: [] },
        status: 403,
      },
    });
    const props403 = propsBase(execute403);
    const { result: r403 } = renderHook(() => usePaymentsForm(props403, true));
    await waitFor(() => expect(r403.current.deudasError).toBe(mensajeDeNegocio));

    // 5xx: el `message` viene del motor —trae usuario de base, host y rutas del
    // servidor— y `leerElErrorDelApi` lo descarta por CÓDIGO, sin mirar el texto.
    const execute500 = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: "Request failed",
        data: { success: false, message: "<volcado crudo del motor de base de datos>" },
        status: 500,
      },
    });
    const props500 = propsBase(execute500);
    const { result: r500 } = renderHook(() => usePaymentsForm(props500, true));
    await waitFor(() => expect(r500.current.deudasError).toBe(GENERICO));
    expect(r500.current.deudas).toHaveLength(0);
  });

  it("un HTTP 200 RECHAZADO en el cuerpo (success:false) tampoco deja la lista vieja", async () => {
    const mensajeDeNegocio = "La unidad no está habilitada para registrar pagos.";
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      // ⚠️ axios NO rechaza un 200: el sobre viaja en `data`, con `error` nulo.
      .mockResolvedValueOnce({
        data: { success: false, message: mensajeDeNegocio, errors: [] },
        error: null,
      });

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));

    await cambiarUnidad(result, "202");

    await waitFor(() => expect(result.current.deudasError).toBe(mensajeDeNegocio));
    expect(result.current.deudas).toHaveLength(0);
    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it("la respuesta que llega TARDE no pisa a la más nueva (A→B→A rápido)", async () => {
    // El pedido de B se resuelve DESPUÉS del de A, aunque salió antes.
    let resolverB: (v: any) => void = () => {};
    const execute = vi.fn().mockImplementation((url: string, _m: string, payload: any) => {
      if (url !== paymentsApi.adminDebts) return Promise.resolve({ data: { success: true }, error: null });
      if (payload.dptoId === UNIDAD_B.id) {
        return new Promise((res) => {
          resolverB = res;
        });
      }
      return Promise.resolve(okConDeudas([DEUDA_DE_A]));
    });

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas[0]?.id).toBe("deuda-de-A"));

    await cambiarUnidad(result, "202"); // sale el de B, queda colgado
    await cambiarUnidad(result, "101"); // vuelve a A: sale un pedido más nuevo
    await waitFor(() => expect(result.current.deudas[0]?.id).toBe("deuda-de-A"));

    // Ahora contesta el de B, tarde. La pantalla muestra A: no puede pisarla.
    await act(async () => {
      resolverB(okConDeudas([DEUDA_DE_B]));
    });

    expect(result.current.deudas).toHaveLength(1);
    expect(result.current.deudas[0].id).toBe("deuda-de-A");
    expect(result.current.isLoadingDeudas).toBe(false);
  });

  it("tras un fallo la clave de control NO queda reservada: se puede volver a pedir la misma unidad", async () => {
    // 🔴 La clave se escribe DESPUES del pedido exitoso. Escrita antes, el
    // pedido fallido dejaba `lastLoadedDeudas` diciendo «la B ya esta cargada»
    // y el efecto no volvia a intentar nunca mas para esa unidad.
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      .mockResolvedValueOnce(redCaida())
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_B]));

    const props = propsBase(execute);
    const { result, rerender } = renderHook(
      ({ p }: { p: any }) => usePaymentsForm(p, true),
      { initialProps: { p: props } },
    );
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));
    await cambiarUnidad(result, "202");
    await waitFor(() => expect(result.current.deudasError).toBeTruthy());

    // Un re-render del padre (props con identidad nueva) vuelve a correr el
    // efecto: la unidad B tiene que volver a pedirse.
    await act(async () => {
      rerender({ p: propsBase(execute) });
    });

    await waitFor(() => expect(result.current.deudas[0]?.id).toBe("deuda-de-B"));
    expect(result.current.deudasError).toBeNull();
  });

  it("un cambio de TIPO pide las deudas UNA sola vez", async () => {
    // El `setTimeout` que habia en `handleChangeInput` repetia el pedido que el
    // efecto de [dpto_id, type] ya hace en el mismo commit: dos GET por cada
    // cambio de tipo, contra el mismo endpoint.
    const execute = vi.fn().mockResolvedValue(okConDeudas([DEUDA_DE_A]));
    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));

    const antes = execute.mock.calls.filter(
      (c: any[]) => c[0] === paymentsApi.adminDebts,
    ).length;

    await act(async () => {
      result.current.handleChangeInput({
        target: {
          name: "type",
          value: String(FormPaymentType.RESERVATION),
          type: "text",
        },
      } as any);
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    const despues = execute.mock.calls.filter(
      (c: any[]) => c[0] === paymentsApi.adminDebts,
    ).length;
    expect(despues - antes).toBe(1);
  });

  it("reintentar vuelve a pedir la unidad seleccionada y repuebla la lista", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_A]))
      .mockResolvedValueOnce(redCaida())
      .mockResolvedValueOnce(okConDeudas([DEUDA_DE_B]));

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));
    await cambiarUnidad(result, "202");
    await waitFor(() => expect(result.current.deudasError).toBeTruthy());

    await act(async () => {
      result.current.reintentarDeudas();
    });

    await waitFor(() => expect(result.current.deudas[0]?.id).toBe("deuda-de-B"));
    expect(result.current.deudasError).toBeNull();
    expect(result.current.isSubmitDisabled).toBe(false);

    const pedidos = execute.mock.calls.filter((c: any[]) => c[0] === paymentsApi.adminDebts);
    expect(pedidos[2][2]).toMatchObject({ dptoId: UNIDAD_B.id });
  });
});

/*
 * Lo que encontró el review de CDT-98. Los tres son puertas que ABRIÓ o dejó
 * abiertas el arreglo, no el defecto original.
 */
describe("CDT-98 (review) — lo que el arreglo no podía dejar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Deja el pedido de deudas colgado para siempre. */
  const pedidoColgado = () => {
    const execute = vi.fn().mockImplementation((url: string) => {
      if (url === paymentsApi.adminDebts) return new Promise(() => {});
      return Promise.resolve({ data: { success: true }, error: null });
    });
    return execute;
  };

  const cambiarTipo = async (result: any, tipo: FormPaymentType) => {
    await act(async () => {
      result.current.handleChangeInput({
        target: { name: "type", value: String(tipo), type: "text" },
      } as any);
    });
  };

  it("🔴 un pago DIRECTO no queda con el botón muerto por un pedido de deudas en vuelo", async () => {
    // La compuerta de carga apagaba el guardado sin decir NADA: para DIRECTO el
    // panel de deudas ni se renderiza, asi que no habia texto ni reintento.
    //
    // ⚠️ Medido: este caso tiene DOS cerraduras —la cancelacion apaga el estado
    // de carga y la compuerta no aplica a los tipos que no usan deudas— y se
    // pone rojo con las dos reinyectadas, no con una sola. Pinea el resultado
    // (el boton no queda muerto), no cual de las dos lo consigue.
    const execute = pedidoColgado();
    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));

    await waitFor(() => expect(result.current.isLoadingDeudas).toBe(true));
    expect(result.current.isSubmitDisabled).toBe(true); // EXPENSE: sí bloquea

    await cambiarTipo(result, FormPaymentType.DIRECT);

    // El pedido sigue colgado: nunca va a contestar.
    expect(result.current.isSubmitDisabled).toBe(false);
    expect(result.current.isLoadingDeudas).toBe(false);
  });

  it("🔴 el pedido en vuelo se CANCELA al pasar a DIRECTO: su respuesta no repuebla la lista NI POR UN RENDER", async () => {
    let responder: (v: any) => void = () => {};
    const execute = vi.fn().mockImplementation((url: string) => {
      if (url === paymentsApi.adminDebts) {
        return new Promise((res) => {
          responder = res;
        });
      }
      return Promise.resolve({ data: { success: true }, error: null });
    });

    // 🔴 Se mira CADA render, no el estado final: si la respuesta cancelada se
    // admite, `deudas` se repuebla y el efecto siguiente la limpia enseguida.
    // Mirando solo el final la carrera queda tapada y el test no mide nada.
    const largosVistos: number[] = [];
    const props = propsBase(execute);
    const { result } = renderHook(() => {
      const hook = usePaymentsForm(props, true);
      largosVistos.push(hook.deudas.length);
      return hook;
    });
    await waitFor(() => expect(result.current.isLoadingDeudas).toBe(true));

    await cambiarTipo(result, FormPaymentType.DIRECT);
    const rendersAntes = largosVistos.length;

    // Contesta el pedido de un tipo que ya no está elegido.
    await act(async () => {
      responder(okConDeudas([DEUDA_DE_A]));
    });

    expect(largosVistos.slice(rendersAntes)).not.toContain(1);
    expect(result.current.deudas).toHaveLength(0);
  });

  it("🔴 un simulate FALLIDO no deja el desglose anterior presentado como verificado", async () => {
    // El guard de sobrepago vive dentro del `if (data?.success)`: un simulate
    // que revienta lo saltea entero y deja el resultado del monto viejo.
    const execute = vi.fn().mockImplementation((url: string) => {
      if (url === paymentsApi.adminDebts) {
        return Promise.resolve(okConDeudas([DEUDA_DE_A]));
      }
      return Promise.resolve({ data: { success: true }, error: null });
    });

    const props = propsBase(execute);
    const { result } = renderHook(() => usePaymentsForm(props, true));
    await waitFor(() => expect(result.current.deudas).toHaveLength(1));

    await act(async () => {
      result.current.handleSelectPeriodo(DEUDA_DE_A as any);
    });
    await act(async () => {
      result.current.handleChangeInput({
        target: { name: "amount", value: "1000", type: "text" },
      } as any);
    });

    // 1) simulate OK con 1.000: hay desglose en pantalla y ningún aviso.
    execute.mockImplementationOnce(() =>
      Promise.resolve({
        data: { success: true, data: { payment_is_partial: true, is_overpayment: false, items: [] } },
        error: null,
      }),
    );
    await act(async () => {
      result.current.handleAmountBlur();
    });
    await waitFor(() => expect(result.current.simulateResult).not.toBeNull());
    expect(result.current.simulateError).toBeNull();

    // 2) el operador sube el monto por encima de la deuda y ESE simulate falla.
    await act(async () => {
      result.current.handleChangeInput({
        target: { name: "amount", value: "999999", type: "text" },
      } as any);
    });
    execute.mockImplementationOnce(() =>
      Promise.resolve({
        data: null,
        error: { message: "Request failed", data: {}, status: 0 },
      }),
    );
    await act(async () => {
      result.current.handleAmountBlur();
    });
    await waitFor(() => expect(result.current.isSimulating).toBe(false));

    // Sin resultado en mano no hay nada verificado que mostrar: el desglose de
    // 1.000 no puede seguir en pantalla junto a un monto de 999.999.
    expect(result.current.simulateResult).toBeNull();
  });
});

/*
 * La otra mitad: que el ERROR y el VACÍO no se vean iguales. Es la condición
 * que puso Alexander en CDT-42 y la forma que dejó CDT-47 (ícono ámbar +
 * título + renglón + botón de reintentar).
 */
const mockHookBase = {
  formState: { paid_at: "2026-08-19", dpto_id: "101", type: FormPaymentType.EXPENSE, method: "1", amount: "", subcategories: [], obs: "" },
  setFormState: vi.fn(),
  errors: {},
  deudas: [] as any[],
  selectedPeriodo: [],
  periodoTotal: 0,
  isLoadingDeudas: false,
  deudasError: null as string | null,
  reintentarDeudas: vi.fn(),
  lDptos: [{ id: "101", name: "Dpto 101 - Mario" }],
  filteredCategories: [],
  showCategoryFields: false,
  isDebtBasedPayment: true,
  handleChangeInput: vi.fn(),
  handleSelectAllPeriodos: vi.fn(),
  handleSelectPeriodo: vi.fn(),
  _onSavePago: vi.fn(),
  isBankAccountSame: vi.fn(() => false),
  getSubtotal: vi.fn(() => 0),
  getConceptByType: vi.fn(() => ""),
  getDebtType: vi.fn(() => ""),
  simulateResult: null,
  isSimulating: false,
  simulateError: null,
  handleAmountBlur: vi.fn(),
  isSubmitDisabled: false,
  addNewExpense: vi.fn(),
  updateNewExpense: vi.fn(),
  removeNewExpense: vi.fn(),
  newExpensesTotal: 0,
};

let mockHookOverrides: Partial<typeof mockHookBase> = {};

vi.mock("../hooks/usePaymentsForm", async (importOriginal) => {
  const original: any = await importOriginal();
  return {
    ...original,
    usePaymentsForm: (...args: any[]) =>
      Object.keys(mockHookOverrides).length > 0
        ? { ...mockHookBase, ...mockHookOverrides }
        : original.usePaymentsForm(...args),
  };
});

describe("CDT-98 — el error y el vacío no se ven iguales", () => {
  const props = {
    open: true,
    onClose: vi.fn(),
    extraData: {
      dptos: [],
      categories: [],
      client_config: { cat_expensas: 1, cat_reservations: 2, cat_forgiveness: 3 },
      bankAccounts: [],
      subcategories: [],
    },
    execute: vi.fn(),
    showToast: vi.fn(),
    reLoad: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHookOverrides = {};
  });

  it("con error pinta el estado de error CON botón de reintentar, y no el vacío mentiroso", () => {
    const reintentar = vi.fn();
    mockHookOverrides = {
      deudasError: "Revisa tu conexión e intenta de nuevo.",
      reintentarDeudas: reintentar,
      isSubmitDisabled: true,
    };
    render(<RenderForm {...props} />);

    expect(
      screen.getByText("No se pudieron cargar las deudas de esta unidad."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    expect(
      screen.queryByText("Esta unidad no tiene deudas pendientes"),
    ).not.toBeInTheDocument();

    screen.getByRole("button", { name: "Reintentar" }).click();
    expect(reintentar).toHaveBeenCalledTimes(1);
  });

  it("sin error y sin deudas sigue el mensaje de siempre, SIN botón de reintentar", () => {
    mockHookOverrides = { deudasError: null, deudas: [] };
    render(<RenderForm {...props} />);

    expect(
      screen.getByText("Esta unidad no tiene deudas pendientes"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No se pudieron cargar las deudas de esta unidad."),
    ).not.toBeInTheDocument();
  });
});
