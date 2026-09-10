import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BankProviderTester from "../BankProviderTester";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

/**
 * `motion` se reduce a la etiqueta que envuelve, conservando el rol.
 *
 * ⚠️ Un doble que devuelva siempre un `div` le saca el rol a `motion.button`, y
 * `getByRole("button")` deja de encontrarlo: el test se pondría rojo por el
 * doble, no por el componente.
 */
vi.mock("motion/react", async () => {
  const React = await import("react");
  return {
    AnimatePresence: ({ children }: any) => children,
    motion: new Proxy(
      {},
      {
        get: (_t, tag: string) =>
          React.forwardRef(function MotionDoble(props: any, ref: any) {
            const {
              initial, animate, exit, transition, whileHover, whileTap,
              layout, variants, ...resto
            } = props;
            return React.createElement(tag, { ...resto, ref });
          }),
      },
    ),
  };
});

/**
 * ⚠️ La cuenta a medio configurar va PRIMERA, y no es casual.
 *
 * Con la que puede cobrar en la cabeza, «elegir la primera» y «elegir la
 * primera que puede cobrar» dan lo mismo, y el test pasa con el criterio malo
 * puesto. Medido: así montada, esa reinyección quedaba verde.
 */
const LAS_CUENTAS = [
  {
    bank_account_id: 9,
    client_id: "cli-2",
    client_name: "Condominio Dos",
    alias: "A medio configurar",
    account_number: "456",
    qr_dynamic_bank_id: 3,
    has_credentials: false,
    puede_cobrar: false,
  },
  {
    bank_account_id: 7,
    client_id: "cli-1",
    client_name: "Condominio Uno",
    alias: "Cuenta principal",
    account_number: "123",
    qr_dynamic_bank_id: 3,
    has_credentials: true,
    puede_cobrar: true,
  },
];

const elApiContesta = () => {
  // ⚠️ `String(url)` y no `url.includes(...)`: el componente también llama a
  // `execute` sin url en algún camino, y un doble que asume string revienta
  // con un error que no tiene nada que ver con lo que el test mide.
  executeMock.mockImplementation(async (url: unknown) => {
    if (String(url).includes("/config")) {
      return { data: { success: true, data: { accounts: LAS_CUENTAS } } };
    }
    return {
      data: { success: true, message: "ok", data: { authenticated: true } },
    };
  });
};

const yaCargo = () =>
  waitFor(() =>
    expect(screen.getByText(/Condominio Uno/)).toBeInTheDocument(),
  );

const ejecutar = () =>
  fireEvent.click(screen.getByText("Execute Request").closest("button")!);

describe("El probador del proveedor de QR", () => {
  beforeEach(() => executeMock.mockReset());

  /**
   * 🔴🔴 Ninguna credencial se pide por pantalla.
   *
   * La versión anterior traía usuario, clave y API key como campos del
   * formulario: el operador escribía la clave del banco en una página web y
   * viajaba en cada prueba. Viven cifradas en la cuenta; desde el navegador se
   * elige la CUENTA.
   */
  it("no pide ninguna credencial por pantalla", async () => {
    elApiContesta();
    const { container } = render(<BankProviderTester />);
    await yaCargo();

    const html = container.innerHTML;
    for (const secreto of ["user_password", "api_key", "user_name"]) {
      expect(html, `el formulario pide «${secreto}»`).not.toContain(secreto);
    }
  });

  /** 🔴 Toda operación viaja con la cuenta: las credenciales son de ella. */
  it("manda la cuenta elegida en cada operacion", async () => {
    elApiContesta();
    render(<BankProviderTester />);
    await yaCargo();

    ejecutar();

    await waitFor(() => {
      const llamada = executeMock.mock.calls.find(
        (c) => typeof c[0] === "string" && c[0].includes("authenticate"),
      );
      expect(llamada, "no se llamó a autenticar").toBeTruthy();
      expect((llamada?.[2] as any)?.bank_account_id).toBe(7);
    });
  });

  /**
   * Se preselecciona la primera cuenta que PUEDE cobrar. Probar contra una a
   * medio configurar da un error del backend, no del banco, y manda a buscar
   * el problema al lugar equivocado.
   */
  it("preselecciona una cuenta que puede cobrar", async () => {
    elApiContesta();
    const { container } = render(<BankProviderTester />);
    await yaCargo();

    const select = container.querySelector("select") as HTMLSelectElement;
    expect(select.value).toBe("7");
  });

  /** Y avisa antes de probar contra una que no está lista. */
  it("avisa cuando la cuenta elegida no puede cobrar", async () => {
    elApiContesta();
    const { container } = render(<BankProviderTester />);
    await yaCargo();

    fireEvent.change(container.querySelector("select") as HTMLSelectElement, {
      target: { value: "9" },
    });

    await waitFor(() =>
      expect(screen.getByText(/le falta el banco/i)).toBeInTheDocument(),
    );
  });

  /**
   * 🔴🔴 El token del banco no se muestra ni se guarda.
   *
   * Autoriza a emitir y anular códigos de cobro: quien lo tuviera podía operar
   * la cuenta del condominio por fuera de Condaty.
   */
  it("no muestra ningun token aunque el sobre trajera uno", async () => {
    executeMock.mockImplementation(async (url: unknown) => {
      if (String(url).includes("/config")) {
        return { data: { success: true, data: { accounts: LAS_CUENTAS } } };
      }
      // Un backend viejo, o mal desplegado, todavía podría mandarlo.
      return {
        data: {
          success: true,
          data: { authenticated: true, token: "el-token-del-banco" },
        },
      };
    });

    const { container } = render(<BankProviderTester />);
    await yaCargo();

    ejecutar();

    await waitFor(() =>
      expect(
        executeMock.mock.calls.some((c) => String(c[0]).includes("authenticate")),
      ).toBe(true),
    );

    expect(container.innerHTML).not.toContain("Active Token");
  });

  /** Sin cuentas configuradas lo dice, en vez de ofrecer un probador inerte. */
  it("sin cuentas configuradas lo dice", async () => {
    executeMock.mockResolvedValue({
      data: { success: true, data: { accounts: [] } },
    });

    render(<BankProviderTester />);

    await waitFor(() =>
      expect(
        screen.getByText(/Ninguna cuenta tiene un proveedor/i),
      ).toBeInTheDocument(),
    );
  });
});
