/**
 * CDT-31 — Flujo de efectivo: al elegir una categoría la gráfica no dibujaba
 * nada, aunque el resumen de valores de abajo sí mostraba el dato.
 *
 * La causa: la API estampa `category_id` como CADENA
 * (`UtilsGraph::formatExpenseResultsWithAllMonths` hace
 * `'' . $category['category_id']`; un padre sin padre queda en `""`), y las
 * opciones del Select salen de `categI`/`categE`, cuyo `id` es bigint y viaja
 * como NÚMERO. El filtro del cliente comparaba con `includes()` estricto:
 * `[12].includes("12")` es `false`, así que la gráfica recibía SIEMPRE un
 * arreglo vacío. Las tablas comparaban contra `categI.id` —número contra
 * número—, y por eso el resumen seguía bien: ésa es exactamente la asimetría
 * que reportó el tester.
 *
 * Por eso el test entra por la PANTALLA y por el Select de verdad, no llamando
 * a una función con los tipos ya alineados: el defecto vive justo en el cruce
 * entre lo que emite el Select (número) y lo que manda la API (cadena). Una
 * entrada cómoda queda verde con el bug puesto.
 *
 * El doble de la API imita al back MEDIDO: filtra por categoría en SQL
 * (`whereIn('e.category_id', $categ)->orWhereIn('cat.category_id', $categ)`) y
 * devuelve las filas con `category_id` en texto.
 *
 * ## Reinyección verificada (2026-08-14)
 *
 * Con `ingresos={filtrarHastaMesActual(filtrarPorCategorias(...,"category_id"))}`
 * y las leyendas filtrando por `selectcategorias.includes(item.category_id)`,
 * se ponen ROJOS los cuatro casos: la gráfica recibe 0 filas y el título del
 * total queda en "Bs 0".
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/** Filas que captura el doble de la gráfica, para medir qué le llegó. */
const filasGrafica: { ingresos: any[]; egresos: any[] } = {
  ingresos: [],
  egresos: [],
};

vi.mock("@/mk/hooks/useAxios", async () => {
  const React = await import("react");

  /**
   * Categorías padre del condominio. `id` bigint → NÚMERO en el JSON, que es
   * lo que termina emitiendo el Select.
   */
  const CATEGORIAS = [
    { id: 11, name: "Servicios básicos" },
    { id: 12, name: "Mantenimiento" },
    { id: 13, name: "Expensas" },
  ];

  /**
   * Filas históricas tal como las arma `UtilsGraph`: `categ_id` y
   * `category_id` en TEXTO, `amount` en texto y `mes` entero. La última fila
   * es una categoría padre con movimiento directo: ahí `category_id` llega
   * como `""` (el `null` de la base concatenado con cadena vacía).
   */
  const HIST = [
    { categ_id: "110", name: "Agua", category_id: "11", amount: "1500.00", mes: 8 },
    { categ_id: "111", name: "Luz", category_id: "11", amount: "2300.50", mes: 8 },
    { categ_id: "120", name: "Jardinería", category_id: "12", amount: "800.00", mes: 8 },
    { categ_id: "13", name: "Expensas", category_id: "", amount: "5000.00", mes: 8 },
  ];

  /** El filtro del back: la fila entra por su categoría padre o por sí misma. */
  const filtrarComoElBack = (categ: any) => {
    const ids = (Array.isArray(categ) ? categ : []).map(String);
    if (ids.length === 0) return HIST;
    return HIST.filter(
      (fila) =>
        ids.includes(String(fila.category_id)) ||
        ids.includes(String(fila.categ_id)),
    );
  };

  const useAxiosFalso = () => {
    const [params, setParams] = React.useState<any>({});
    // El hook de verdad baja `loaded` mientras vuela el request y lo sube al
    // responder; la pantalla apaga su spinner local con ese flanco.
    const [loaded, setLoaded] = React.useState(true);
    const reLoad = React.useCallback((p: any) => {
      setLoaded(false);
      setParams(p);
    }, []);
    React.useEffect(() => {
      setLoaded(true);
    }, [params]);

    const data = React.useMemo(() => {
      const hist = filtrarComoElBack(params?.filter_categ);
      return {
        data: {
          saldoInicial: "0.00",
          categI: CATEGORIAS,
          categE: CATEGORIAS,
          ingresosHist: hist,
          egresosHist: hist,
        },
      };
    }, [params]);

    return { data, loaded, reLoad, execute: vi.fn() };
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

vi.mock("@/mk/components/ui/LoadingScreen/LoadingScreen", () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/Widgets/WidgetGrafIngresos/WidgetGrafIngresos", () => ({
  default: ({ ingresos, title }: any) => {
    filasGrafica.ingresos = ingresos ?? [];
    return <div data-testid="graf-ingresos">{title}</div>;
  },
}));

vi.mock("@/components/Widgets/WidgetGrafEgresos/WidgetGrafEgresos", () => ({
  default: ({ egresos, title }: any) => {
    filasGrafica.egresos = egresos ?? [];
    return <div data-testid="graf-egresos">{title}</div>;
  },
}));

vi.mock("@/components/Widgets/WidgetGrafBalance/WidgetGrafBalance", () => ({
  default: () => <div data-testid="graf-balance" />,
}));

import Balance from "../Balance";

/** El disparador de un `Select`, buscado por su etiqueta visible. */
const selectTrigger = (label: string) =>
  screen.getByText(label).closest("button") as HTMLButtonElement;

/** Abre un `Select` y devuelve el panel de opciones (vive en el portal). */
const abrirSelect = (label: string) => {
  fireEvent.click(selectTrigger(label));
  return within(document.getElementById("portal-root") as HTMLElement);
};

const elegir = (label: string, opcion: string) =>
  fireEvent.click(abrirSelect(label).getByText(opcion));

describe("CDT-31 — la gráfica dibuja al filtrar por categoría", () => {
  beforeEach(() => {
    const portal = document.createElement("div");
    portal.id = "portal-root";
    document.body.appendChild(portal);
    filasGrafica.ingresos = [];
    filasGrafica.egresos = [];
  });

  afterEach(() => {
    document.getElementById("portal-root")?.remove();
    vi.clearAllMocks();
  });

  it.each([
    ["Ingresos", "graf-ingresos", "ingresos" as const],
    ["Egresos", "graf-egresos", "egresos" as const],
  ])(
    "en %s, elegir una categoría deja las filas de esa categoría en la gráfica",
    (movimiento, testId, clave) => {
      render(<Balance />);

      elegir("Tipo de transacción", movimiento);
      expect(screen.getByTestId(testId)).toBeInTheDocument();

      elegir("Categoría", "Servicios básicos");

      // Lo que mide el ticket: la gráfica recibe filas, no un arreglo vacío.
      expect(filasGrafica[clave]).toHaveLength(2);
      expect(filasGrafica[clave].map((f: any) => f.name).sort()).toEqual([
        "Agua",
        "Luz",
      ]);

      // Y el total del título sale de esas mismas filas: 1500 + 2300,50.
      expect(screen.getByTestId(testId)).toHaveTextContent("Bs 3,800.50");
    },
  );

  it.each([
    ["Ingresos", "graf-ingresos", "ingresos" as const],
    ["Egresos", "graf-egresos", "egresos" as const],
  ])(
    "en %s, una categoría padre con movimiento directo (category_id vacío) también dibuja",
    (movimiento, testId, clave) => {
      render(<Balance />);

      elegir("Tipo de transacción", movimiento);
      elegir("Categoría", "Expensas");

      expect(filasGrafica[clave]).toHaveLength(1);
      expect(filasGrafica[clave][0].category_id).toBe("");
      expect(screen.getByTestId(testId)).toHaveTextContent("Bs 5,000.00");
    },
  );

  it("sin categoría elegida la gráfica recibe todo lo que mandó la API", () => {
    render(<Balance />);

    elegir("Tipo de transacción", "Egresos");

    expect(filasGrafica.egresos).toHaveLength(4);
  });
});
