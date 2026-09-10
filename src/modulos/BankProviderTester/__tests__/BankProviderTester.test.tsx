import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BankProviderTester from "../BankProviderTester";

const executeMock = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

vi.mock("motion/react", () => ({
  // Render the real tag (motion.button must stay a <button>) and drop the
  // animation-only props so React does not warn about unknown attributes.
  motion: new Proxy({} as any, {
    get: (_t, tag: string) =>
      ({ initial, animate, exit, transition, whileHover, whileTap, ...rest }: any) =>
        React.createElement(tag, rest),
  }),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const ACCOUNTS = [
  { id: 7, alias: "Recaudadora", account_number: "1234", qr_dynamic_enabled: 1 },
];

const CONFIG = {
  bank_account_id: 7,
  client_id: "c1",
  qr_dynamic_enabled: true,
  has_credentials: true,
  qr_dynamic_username_masked: "co****23",
  account_reference: "REF-99",
  bank_code: "BG",
  bank_name: "Banco Ganadero",
  bank_is_active: true,
  environment: "S",
  environment_label: "Sandbox",
  base_url: "https://sandbox.bg.test",
};

/** Faithful double: a 2xx body is res.data, a non-2xx body is res.error.data. */
const ok = (data: any, message = "") => ({
  data: { success: true, data, message },
  error: null,
});

const routeApi = () =>
  executeMock.mockImplementation(async (url?: string) => {
    const u = String(url ?? "");
    if (u.includes("bank-accounts")) return ok(ACCOUNTS);
    if (u.includes("tester/config")) return ok(CONFIG);
    return ok({ authenticated: true });
  });

const pickAccount = async () => {
  await waitFor(() =>
    expect(screen.getByRole("combobox")).toBeInTheDocument(),
  );
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "7" } });
};

describe("BankProviderTester", () => {
  beforeEach(() => executeMock.mockReset());

  it("no pide la configuracion hasta que se elige una cuenta", async () => {
    routeApi();
    render(<BankProviderTester />);

    await waitFor(() => expect(executeMock).toHaveBeenCalled());
    expect(
      executeMock.mock.calls.some((c) =>
        String(c[0] ?? "").includes("tester/config"),
      ),
    ).toBe(false);
  });

  it("pide la configuracion de la cuenta elegida y muestra el usuario enmascarado", async () => {
    routeApi();
    render(<BankProviderTester />);
    await pickAccount();

    await waitFor(() =>
      expect(executeMock).toHaveBeenCalledWith("qr-dynamic/tester/config", "GET", {
        bank_account_id: 7,
      }),
    );
    await waitFor(() => expect(screen.getByText("co****23")).toBeInTheDocument());
    expect(screen.getByText("REF-99")).toBeInTheDocument();
  });

  it("no llama al banco sin cuenta elegida", async () => {
    routeApi();
    render(<BankProviderTester />);
    await waitFor(() => expect(executeMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /Execute|Ejecutar/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/Elegí una cuenta bancaria antes de llamar al banco/),
      ).toBeInTheDocument(),
    );
    expect(
      executeMock.mock.calls.some((c) =>
        String(c[0] ?? "").includes("tester/authenticate"),
      ),
    ).toBe(false);
  });

  it("manda bank_account_id y ninguna credencial al autenticar", async () => {
    routeApi();
    render(<BankProviderTester />);
    await pickAccount();
    await waitFor(() => expect(screen.getByText("co****23")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Execute|Ejecutar/i }));

    await waitFor(() => {
      const call = executeMock.mock.calls.find((c) =>
        String(c[0] ?? "").includes("tester/authenticate"),
      );
      expect(call).toBeTruthy();
      const body = call![2] as Record<string, unknown>;
      expect(body.bank_account_id).toBe(7);
      expect(body).not.toHaveProperty("user_password");
      expect(body).not.toHaveProperty("api_key");
      expect(body).not.toHaveProperty("user_name");
    });
  });

  it("ninguna ruta del tester conserva el prefijo publico bank-qr", async () => {
    routeApi();
    render(<BankProviderTester />);
    await pickAccount();
    await waitFor(() => expect(screen.getByText("co****23")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Execute|Ejecutar/i }));

    await waitFor(() =>
      expect(
        executeMock.mock.calls.some((c) => String(c[0] ?? "").includes("bank-qr")),
      ).toBe(false),
    );
  });
});
