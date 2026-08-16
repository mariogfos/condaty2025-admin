import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  cleanup,
  act,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import React from "react";

/**
 * El alta de una deuda individual manda BOOLEANOS, no `'Y'`/`'N'`.
 *
 * ## 🔴 Qué se rompía (CDT-60)
 *
 * "El botón Crear de Deudas Individuales no hace nada, ningún mensaje."
 *
 * La cadena, eslabón por eslabón:
 *
 * 1. El formulario armaba el payload con `has_mv: _formState.has_mv ? 'Y':'N'`
 *    y lo mismo con `is_forgivable`, `has_pp` e `is_blocking`.
 * 2. Las cuatro son `$fillable` en `DebtDpto`, así que entran por el request.
 * 3. 🔴 **Laravel NO castea al escribir.** El cast `'boolean'` actúa al LEER;
 *    al guardar viaja el string crudo.
 * 4. Las cuatro columnas son `tinyint(1)` desde la migración de 2026-06-30 y la
 *    base local es estricta:
 *    `ERROR 1366 (22007): Incorrect integer value: 'N' for column has_mv`.
 *    El INSERT falla.
 * 5. Sin sobre de respuesta el toast salía vacío y la pantalla no decía nada.
 *
 * ⚠️ El síntoma depende del `sql_mode`: donde no sea estricto el insert pasa y
 * guarda **0 en las cuatro** —el botón "anda" y las banderas quedan mal—. Los
 * dos casos son el mismo bug.
 *
 * ⚠️ El camino COMPARTIDO (`type: 4`) no moría porque `SharedDebtService`
 * traduce con `boolFlag()`. El individual (`type: 0`) va por `parent::store()`
 * del kernel, que no normaliza nada. Por eso el bug sólo se veía acá.
 *
 * ## Cómo mide
 *
 * 🔴 **Sobre el cuerpo del request que sale**, no sobre el texto del archivo.
 * Se monta el formulario REAL colgado del `onSave` REAL de `useCrud` —el mismo
 * que arma el payload con `getParamFields`— y se afirma sobre lo que recibe
 * `execute`. Un test que buscara `'Y'` en el código es justo el tipo de test
 * que se barrió en CDT-46.
 *
 * ## Reinyección, medida el 2026-08-16
 *
 * Con el `? 'Y' : 'N'` de vuelta: **3/4 rojos**.
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

vi.mock("@/mk/components/ui/Table/Table", () => ({ default: () => null }));
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
// ⚠️ `DetailModal` NO se mockea: es quien pinta el botón "Crear deuda
// individual" del `DataModal`. Sin él no hay nada que apretar y el test mediría
// el aire.
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

import useCrud, { ModCrudType } from "@/mk/hooks/useCrud/useCrud";
import RenderForm from "../RenderForm/RenderForm";

const BANDERAS = ["has_mv", "is_forgivable", "has_pp", "is_blocking"] as const;

/** `mod` y `fields` como los declara `IndividualDebts.tsx`. */
const mod: ModCrudType = {
  modulo: "v3/debt-dptos",
  singular: "Deuda",
  plural: "",
  permiso: "expense",
} as ModCrudType;

const fields = {
  id: { rules: [], api: "e" },
  begin_at: { rules: ["required"], api: "ae", label: "Fecha de inicio" },
  due_at: { rules: ["required"], api: "ae", label: "Vencimiento" },
  type: { rules: [], api: "ae", label: "Tipo" },
  description: { rules: [], api: "ae", label: "Descripción" },
  subcategory_id: { rules: ["required"], api: "ae", label: "Subcategoría" },
  dpto_id: { rules: ["required"], api: "ae", label: "Unidad" },
  amount: { rules: ["required"], api: "ae", label: "Monto" },
  interest: { rules: [], api: "ae", label: "Interés" },
  has_mv: { rules: [], api: "ae", label: "Tiene Mant. Valor" },
  is_forgivable: { rules: [], api: "ae", label: "Es condonable" },
  has_pp: { rules: [], api: "ae", label: "Tiene plan de pago" },
  is_blocking: { rules: [], api: "ae", label: "Es bloqueante" },
};

const user = {
  id: 1,
  client_id: 9,
  clients: [{ id: 9, has_maintenance_value: 1 }],
};

const extraData = {
  categories: [{ id: 1, name: "Servicios", hijos: [{ id: 55, name: "Agua" }] }],
  dptos: [{ id: 7, nro: "A-101", titular: { name: "Ana", last_name: "Paz" } }],
};

/** Una deuda válida: pasa la validación local y la del kernel. */
const deudaValida = {
  begin_at: "2026-08-01",
  due_at: "2026-09-01",
  amount: "150",
  subcategory_id: 55,
  dpto_id: 7,
  description: "Cuota extraordinaria",
};

const listaOk = () => ({
  data: { data: [], message: { total: 0 } },
  error: null,
});

/**
 * El formulario real, colgado del `onSave` real del kernel: el payload lo arma
 * `getParamFields` igual que en la pantalla.
 */
const montar = (
  item: Record<string, any> = deudaValida,
  fieldsDelModulo: Record<string, any> = fields,
) => {
  const Pantalla = () => {
    const crud: any = useCrud({
      paramsInitial: { page: 1, perPage: 20, fullType: "L", searchBy: "" },
      mod,
      fields: fieldsDelModulo,
    });

    return (
      <RenderForm
        open
        onClose={() => {}}
        item={item as any}
        extraData={extraData}
        execute={crud.execute}
        showToast={showToast}
        reLoad={crud.reLoad}
        user={user}
        setItem={crud.setFormState}
        onSave={crud.onSave}
        errors={crud.errors}
        setErrors={crud.setErrors}
      />
    );
  };

  render(<Pantalla />);
};

const apretarCrear = async () => {
  const boton = await screen.findByText("Crear deuda individual", {
    selector: "button, button *",
  });
  await act(async () => {
    fireEvent.click(boton);
    await new Promise((resolve) => setTimeout(resolve, 80));
  });
};

/** El cuerpo del POST que salió a `/v3/debt-dptos`. */
const cuerpoDelPost = () => {
  const post = execute.mock.calls.find((c) => c[1] === "POST");
  return post?.[2];
};

describe("Deudas Individuales: el cuerpo del alta", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
    execute.mockImplementation(async (_url: string, method: string) => {
      if (method === "POST") {
        return { data: { success: true, message: "Deuda creada" }, error: null };
      }
      return listaOk();
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("el POST sale con las cuatro banderas como booleanos", async () => {
    montar();
    await waitFor(() => expect(execute).toHaveBeenCalled());
    await apretarCrear();

    const cuerpo = cuerpoDelPost();
    expect(cuerpo, "el alta tiene que despachar un POST").toBeDefined();

    for (const bandera of BANDERAS) {
      // 🔴 Acá viajaba `'N'` (string) contra una columna `tinyint(1)`.
      expect(
        typeof cuerpo[bandera],
        `${bandera} tiene que viajar como boolean, no como ${JSON.stringify(
          cuerpo[bandera],
        )}`,
      ).toBe("boolean");
    }
  });

  it("ninguna bandera viaja como 'Y' ni como 'N'", async () => {
    montar();
    await waitFor(() => expect(execute).toHaveBeenCalled());
    await apretarCrear();

    const cuerpo = cuerpoDelPost();
    for (const bandera of BANDERAS) {
      expect([cuerpo[bandera]]).not.toContain("Y");
      expect([cuerpo[bandera]]).not.toContain("N");
    }
  });

  it("una bandera prendida viaja como `true`, no como 'Y'", async () => {
    montar({ ...deudaValida, is_blocking: true, has_pp: true });
    await waitFor(() => expect(execute).toHaveBeenCalled());
    await apretarCrear();

    const cuerpo = cuerpoDelPost();
    expect(cuerpo.is_blocking).toBe(true);
    expect(cuerpo.has_pp).toBe(true);
    expect(cuerpo.has_mv).toBe(false);
    expect(cuerpo.is_forgivable).toBe(false);
  });

  it("el alta con datos válidos termina en éxito visible", async () => {
    montar();
    await waitFor(() => expect(execute).toHaveBeenCalled());
    await apretarCrear();

    const avisos = showToast.mock.calls.filter(([msg]) => !!msg);
    expect(avisos.length, "el alta tiene que decir algo").toBeGreaterThan(0);
    expect(avisos.some(([, tipo]) => tipo === "success")).toBe(true);
  });
});

describe("Deudas Individuales: el rechazo del kernel se ve", () => {
  beforeEach(() => {
    execute.mockReset();
    showToast.mockReset();
    execute.mockImplementation(async () => listaOk());
  });

  afterEach(() => {
    cleanup();
  });

  it("un error del kernel se pinta en el campo, no sólo en una clase CSS", async () => {
    // 🔴 Tiene que rechazar EL KERNEL, no la validación local.
    //
    // Un campo que el formulario también valida (`amount`, `dpto_id`…) frena en
    // `validar()` y `onSave` del kernel ni corre: ese test estaría midiendo el
    // error local, que siempre se pintó, y quedaría verde con el bug puesto.
    //
    // `description` es el caso real de la divergencia: las reglas viven en el
    // `fields` del módulo y el `validar()` del formulario está escrito a mano,
    // así que el kernel puede exigir algo que el formulario no mira.
    const fieldsConDescripcionRequerida = {
      ...fields,
      description: { rules: ["required"], api: "ae", label: "Descripción" },
    };

    montar(
      { ...deudaValida, description: "" },
      fieldsConDescripcionRequerida,
    );
    await waitFor(() => expect(execute).toHaveBeenCalled());
    await apretarCrear();

    expect(
      execute.mock.calls.some((c) => c[1] === "POST"),
      "el kernel rechazó: no puede haber POST",
    ).toBe(false);

    // 🔴 Antes `currentErrors` era `externalErrors || _errors` —y `{}` es
    // truthy, así que se quedaba SIEMPRE con el del kernel— y encima los inputs
    // pintaban `_errors` a mano: el rechazo no aparecía en ningún lado y el
    // click se perdía en el vacío.
    const mensajes = await screen.findAllByText(/Este campo es requerido/i);
    expect(
      mensajes.length,
      "el rechazo del kernel tiene que verse en el formulario",
    ).toBeGreaterThan(0);
  });

  it("y el error local sigue pintándose (el merge no se come ninguno)", async () => {
    montar({ ...deudaValida, amount: "" });
    await waitFor(() => expect(execute).toHaveBeenCalled());
    await apretarCrear();

    const mensajes = await screen.findAllByText(/Este campo es requerido/i);
    expect(mensajes.length).toBeGreaterThan(0);
  });
});
