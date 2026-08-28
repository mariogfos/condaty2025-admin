import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrAccountConfig from "../QrAccountConfig/QrAccountConfig";

const executeMock = vi.fn();

vi.mock("@/mk/contexts/AuthProvider", () => ({
  useAuth: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/mk/hooks/useAxios", () => ({
  default: () => ({ execute: executeMock, loaded: true }),
}));

const CONFIG = {
  bank_account_id: 7,
  qr_dynamic_enabled: true,
  qr_dynamic_bank_id: "uuid-bg",
  qr_dynamic_account_reference: "CTA-001",
  has_credentials: true,
  qr_dynamic_username_masked: "co•••••er",
};

const PROVIDERS = [{ id: "uuid-bg", bank_code: "BG", bank_name: "Banco Ganadero" }];

const mockApi = () => {
  executeMock.mockImplementation(async (url: string, method: string) => {
    if (url.includes("/providers"))
      return { data: { success: true, data: { providers: PROVIDERS } } };
    if (method === "GET")
      return { data: { success: true, data: CONFIG } };
    return { data: { success: true, message: "ok", data: CONFIG } };
  });
};

describe("QrAccountConfig (DES-20/21)", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("muestra el usuario enmascarado y nunca una credencial en claro", async () => {
    mockApi();
    const { container } = render(<QrAccountConfig bankAccountId={7} />);

    await waitFor(() =>
      expect(screen.getByText(/co•••••er/)).toBeInTheDocument(),
    );
    // Los campos de credenciales arrancan VACÍOS: el backend no las devuelve
    // y la UI no debe precargar nada (RN-ADM-03)
    expect(container.innerHTML).not.toContain("super-secret");
    const apiKeyInput = container.querySelector(
      'input[name="qr_dynamic_api_key"]',
    ) as HTMLInputElement;
    expect(apiKeyInput.value).toBe("");
  });

  it("el PUT es parcial: solo viaja lo tocado y los vacíos no se mandan", async () => {
    mockApi();
    const { container } = render(<QrAccountConfig bankAccountId={7} />);
    await waitFor(() =>
      expect(screen.getByText(/co•••••er/)).toBeInTheDocument(),
    );

    const refInput = container.querySelector(
      'input[name="qr_dynamic_account_reference"]',
    ) as HTMLInputElement;
    fireEvent.change(refInput, {
      target: { name: "qr_dynamic_account_reference", value: "CTA-002" },
    });
    fireEvent.click(screen.getByText("Guardar configuración QR"));

    await waitFor(() => {
      const putCall = executeMock.mock.calls.find((c) => c[1] === "PUT");
      expect(putCall).toBeTruthy();
      // Solo la referencia: ni credenciales vacías ni el toggle sin tocar
      expect(putCall?.[2]).toEqual({
        qr_dynamic_account_reference: "CTA-002",
      });
    });
  });

  it("sin acceso (403) no renderiza nada", async () => {
    executeMock.mockResolvedValue({
      data: { success: false, message: "No autorizado" },
    });
    const { container } = render(<QrAccountConfig bankAccountId={7} />);
    await waitFor(() =>
      expect(container.querySelector("#qr-account-config")).toBeNull(),
    );
    expect(screen.queryByText(/Guardar configuración QR/)).toBeNull();
  });
});
