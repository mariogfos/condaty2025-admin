/**
 * Un filtro cuyo valor es CERO tiene que viajar al back y verse elegido.
 *
 * 🔴 El bug (CDT-38, lo reportó un tester sobre Egresos): al elegir el estado
 * "Anulado" la tabla seguía mostrando los pagados y todos los demás estados.
 *
 * La causa no estaba en Egresos sino acá, en el hook que usan los ~40 módulos:
 * `onFilter` armaba la cadena `campo:valor` con un chequeo de VERDAD
 * (`if (filterBy.filterBy[key])`). "Anulado" es `ExpenseStatus.CANCELLED = 0`,
 * así que la clave `status` nunca entraba al `filterBy` y el back —sano—
 * devolvía la lista SIN filtrar. Ningún error, ninguna lista vacía: filas que
 * el usuario cree.
 *
 * Y la mitad visual del mismo falsy: `value={filterSel[f.key] || ""}` dibujaba
 * el combo VACÍO después de elegir "Anulado", o sea que la pantalla decía que
 * no habías elegido nada.
 *
 * ⚠️ No es exclusivo de Egresos: `PaymentStatus.CANCELLED`,
 * `BankAccountStatus.INACTIVE` y `BankEntityStatus.INACTIVE` también valen 0 y
 * estaban rotos por la MISMA línea.
 *
 * Misma familia que el `0 == ""` del `Select` compartido (CDT-30).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// jsdom no trae `matchMedia` y `FilterResponsive` lo usa para decidir si
// dibuja los combos sueltos o el modal de filtros. Se responde "pantalla
// ancha": los dos caminos leen el mismo `filterSel`.
window.matchMedia = ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})) as any;

const paramsDeLaLista: Array<Record<string, any>> = [];
const valoresDelCombo: any[] = [];
const bordesDelCombo: any[] = [];

// Egresos pineá `perPage: 20`, o sea que va por la lista infinita: los params
// de cada request salen por `execute`, no por el `useAxios` declarativo.
vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({
    data: null,
    reLoad: vi.fn(),
    loaded: true,
    error: null,
    execute: vi.fn(async (_url: any, _method: any, params: any) => {
      paramsDeLaLista.push(params);
      return { data: { data: [], message: "", success: true }, error: null };
    }),
  }),
}));

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({
    user: { id: 1 },
    userCan: () => true,
    store: {},
    setStore: vi.fn(),
    showToast: vi.fn(),
    waiting: false,
    setWaiting: vi.fn(),
  }),
}));

/**
 * El `Select` real se reemplaza por un botón: lo que se mide es el cableado del
 * hook (qué `value` recibe el combo y qué `filterBy` sale hacia el back), no
 * cómo pinta el componente.
 */
vi.mock("@/mk/components/forms/Select/Select", () => ({
  default: ({ name, value, options, onChange, inputStyle }: any) => {
    valoresDelCombo.push(value);
    bordesDelCombo.push(inputStyle?.borderColor);
    return (
      <button
        type="button"
        data-testid={name}
        onClick={() =>
          onChange({ target: { name, value: options[options.length - 1].id } })
        }
      >
        combo
      </button>
    );
  },
}));

import useCrud, { ModCrudType } from "../useCrud";

// Los mismos valores que declara Egresos: "Anulado" es el CERO.
const OPCIONES_ESTADO = [
  { id: "ALL", name: "Todos" },
  { id: 1, name: "Pagado" },
  { id: 0, name: "Anulado" },
];

const campos = {
  id: { rules: [], api: "e" },
  description: { rules: [], api: "ae", label: "Concepto", list: true },
  status: {
    rules: [],
    api: "ae",
    label: "Estado",
    list: true,
    filter: { label: "Estado", options: () => OPCIONES_ESTADO },
  },
};

const montarYElegirAnulado = () => {
  const Comp = () => {
    const { List } = useCrud({
      paramsInitial: { perPage: 20, page: 1, fullType: "L", searchBy: "" },
      mod: {
        modulo: "v3/expenses",
        singular: "egreso",
        plural: "egresos",
        permiso: "outlays",
        filter: true,
        export: false,
      } as unknown as ModCrudType,
      fields: campos,
    });
    return <List emptyMsg="vacío" emptyLine2="" />;
  };
  render(<Comp />);
  fireEvent.click(screen.getAllByTestId("status_filter")[0]);
};

beforeEach(() => {
  paramsDeLaLista.length = 0;
  valoresDelCombo.length = 0;
  bordesDelCombo.length = 0;
});

describe("useCrud: un filtro que vale 0", () => {
  it("manda status:0 al back cuando se elige 'Anulado'", async () => {
    montarYElegirAnulado();

    await waitFor(() => {
      expect(
        paramsDeLaLista.at(-1)?.filterBy,
        "El filtro con valor 0 ('Anulado') no llegó al back: la lista sale SIN " +
          "filtrar y la tabla sigue mostrando los pagados, sin ningún error.",
      ).toBe("status:0");
    });
  });

  it("deja el 0 elegido en el combo, no lo dibuja vacío", () => {
    montarYElegirAnulado();

    expect(
      valoresDelCombo.at(-1),
      "El combo se dibujó vacío después de elegir 'Anulado': la pantalla dice " +
        "que no elegiste nada cuando sí elegiste.",
    ).toBe(0);
  });

  it("marca el combo como filtrado cuando el valor elegido es 0", () => {
    montarYElegirAnulado();

    expect(
      bordesDelCombo.at(-1),
      "El combo no se pinta como 'filtrado' con el 0 elegido: la pantalla no " +
        "avisa que hay un filtro activo.",
    ).toBe("var(--cPrimary)");
  });

  it("sigue tratando la cadena vacía como 'sin filtro'", async () => {
    const Comp = () => {
      const { List } = useCrud({
        paramsInitial: { perPage: 20, page: 1, fullType: "L", searchBy: "" },
        mod: {
          modulo: "v3/expenses",
          singular: "egreso",
          plural: "egresos",
          permiso: "outlays",
          filter: true,
          export: false,
        } as unknown as ModCrudType,
        fields: {
          ...campos,
          status: {
            ...campos.status,
            filter: { label: "Estado", options: () => [{ id: "", name: "—" }] },
          },
        },
      });
      return <List emptyMsg="vacío" emptyLine2="" />;
    };
    render(<Comp />);
    await waitFor(() => expect(paramsDeLaLista.length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByTestId("status_filter")[0]);

    await waitFor(() => {
      expect(
        paramsDeLaLista.at(-1)?.filterBy,
        "Un valor vacío se está mandando como filtro: `\"\"` es 'sin filtro', " +
          "no un criterio.",
      ).toBeUndefined();
    });
  });
});
