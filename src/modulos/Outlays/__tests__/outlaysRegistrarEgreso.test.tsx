/**
 * CDT-37 — Registro de nuevo egreso: la Subcategoría tiene que ofrecer opciones.
 *
 * Lo que reportó el tester: "Subcategoría es obligatorio pero el desplegable no
 * ofrece ninguna opción". El flujo de gastos quedó bloqueado entero.
 *
 * Este test NO verifica que exista un componente. Verifica el camino que aprieta
 * el usuario: monta el formulario QUE EL MÓDULO DECLARA (`mod.renderForm`, no un
 * import directo), elige una categoría y mira qué ofrece el desplegable de
 * Subcategoría. Se entra por el `mod` a propósito: la causa raíz de CDT-37 fue
 * que la mudanza del `mod` a la factory perdió la clave `renderForm`, así que un
 * test que importara `RenderForm` directo habría quedado VERDE con el bug puesto
 * —justo lo que pasa con el test de anular, que mide un componente que nadie
 * renderea.
 *
 * Las dos formas del id se prueban por separado porque cada una rompe por su
 * lado:
 *  - numérica: es lo que manda el back hoy.
 *  - texto: el filtro comparaba `subcat.category_id === Number(String(valor))`,
 *    o sea `===` contra un Number. Con el id como texto no matcheaba NADA y la
 *    Subcategoría volvía a quedar vacía: mismo síntoma, otra causa.
 */
import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getOutlaysMod } from "../config/outlaysMod";
import { PaymentMethod } from "@/modulos/Payments/Type/PaymentType";

// El modal real anima y monta en un portal propio; acá sólo estorba. Se deja
// pasar el contenido y se expone el botón de guardar para poder apretarlo.
vi.mock("@/mk/components/ui/DataModal/DataModal", () => ({
  default: ({ open, children, onSave, buttonText }: any) =>
    open ? (
      <div>
        {children}
        <button type="button" onClick={onSave}>
          {buttonText}
        </button>
      </div>
    ) : null,
}));

// La subida de comprobantes no participa de la cascada y arrastra medio storage.
vi.mock("@/mk/components/forms/UploadFileV3/UploadFileV3", () => ({
  default: () => <div data-testid="upload-comprobantes" />,
}));

vi.mock("@/mk/components/ui/Toast/Toast", () => ({
  default: () => null,
}));

/**
 * `extraData` con la forma exacta que devuelve `ExpenseController` en
 * `fullType=EXTRA`: `categories` son SÓLO los padres (`whereNull('category_id')`)
 * y `subcategories` son los hijos, cada uno con su `category_id`.
 */
const buildExtraData = (id: (n: number) => number | string) => ({
  categories: [
    { id: id(1), name: "Servicios básicos" },
    { id: id(2), name: "Mantenimiento" },
  ],
  subcategories: [
    { id: id(10), name: "Agua", category_id: id(1) },
    { id: id(11), name: "Luz", category_id: id(1) },
    { id: id(20), name: "Jardinería", category_id: id(2) },
  ],
  bankAccounts: [],
});

const asNumber = (n: number) => n;
const asString = (n: number) => String(n);

/** El disparador de un `Select`, buscado por su etiqueta visible. */
const selectTrigger = (label: string) =>
  screen.getByText(label).closest("button") as HTMLButtonElement;

/** Abre un `Select` y devuelve el panel de opciones (vive en el portal). */
const openSelect = (label: string) => {
  fireEvent.click(selectTrigger(label));
  const portal = document.getElementById("portal-root") as HTMLElement;
  return within(portal);
};

const renderOutlayForm = (extraData: any, onSave = vi.fn()) => {
  const mod = getOutlaysMod();

  // 🔴 El módulo tiene que declarar su form. Sin esto `useCrud` renderea el
  // form genérico, que es donde el tester vio la Subcategoría vacía.
  expect(mod.renderForm).toBeDefined();

  const Form = mod.renderForm as React.FC<any>;
  render(
    <Form
      open
      onClose={vi.fn()}
      onSave={onSave}
      extraData={extraData}
      execute={vi.fn()}
      showToast={vi.fn()}
      reLoad={vi.fn()}
    />,
  );
  return { onSave };
};

describe("CDT-37 — el formulario de Egresos ofrece subcategorías", () => {
  beforeEach(() => {
    const portal = document.createElement("div");
    portal.id = "portal-root";
    document.body.appendChild(portal);
  });

  afterEach(() => {
    document.getElementById("portal-root")?.remove();
    vi.clearAllMocks();
  });

  it.each([
    ["numéricos (lo que manda el back hoy)", asNumber],
    ["de texto (si el JSON los serializa como string)", asString],
  ])(
    "con ids %s, elegir una categoría llena el desplegable de Subcategoría",
    (_caso, id) => {
      renderOutlayForm(buildExtraData(id));

      // Antes de elegir categoría no hay nada que elegir, y el campo está
      // deshabilitado: ése es el estado legítimo, no el que reportó el tester.
      expect(selectTrigger("Subcategoría")).toBeDisabled();

      fireEvent.click(openSelect("Categoría").getByText("Servicios básicos"));

      const opciones = openSelect("Subcategoría");
      expect(opciones.getByText("Agua")).toBeInTheDocument();
      expect(opciones.getByText("Luz")).toBeInTheDocument();
      // Y sólo las de ESA categoría.
      expect(opciones.queryByText("Jardinería")).toBeNull();
    },
  );

  it("cambiar de categoría reemplaza las subcategorías ofrecidas", () => {
    renderOutlayForm(buildExtraData(asNumber));

    fireEvent.click(openSelect("Categoría").getByText("Servicios básicos"));
    fireEvent.click(openSelect("Categoría").getByText("Mantenimiento"));

    const opciones = openSelect("Subcategoría");
    expect(opciones.getByText("Jardinería")).toBeInTheDocument();
    expect(opciones.queryByText("Agua")).toBeNull();
  });

  /**
   * 🔴 `ExpenseController::beforeCreate` colapsa `subcategory_id` adentro de
   * `category_id` antes de guardar. Si el form dejara de mandar los DOS, el
   * egreso quedaría colgado del padre, la columna Subcategoría del listado
   * mostraría "-/-" y el defecto se volvería invisible.
   */
  it("guarda mandando category_id Y subcategory_id, no sólo el padre", () => {
    const { onSave } = renderOutlayForm(buildExtraData(asNumber));

    fireEvent.click(openSelect("Categoría").getByText("Servicios básicos"));
    fireEvent.click(openSelect("Subcategoría").getByText("Luz"));
    fireEvent.click(openSelect("Método de pago").getByText("Efectivo"));

    fireEvent.change(document.getElementById("amount") as HTMLInputElement, {
      target: { name: "amount", value: "350" },
    });
    fireEvent.change(
      document.getElementById("description") as HTMLTextAreaElement,
      { target: { name: "description", value: "Factura de luz de julio" } },
    );

    fireEvent.click(screen.getByRole("button", { name: "Crear egreso" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        category_id: 1,
        subcategory_id: 11,
        type: PaymentMethod.CASH,
        amount: 350,
      }),
    );
  });
});
