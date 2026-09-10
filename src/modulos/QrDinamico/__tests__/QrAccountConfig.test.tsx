import { createRef } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrAccountConfig, {
  QrAccountConfigHandle,
} from "../QrAccountConfig/QrAccountConfig";

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
    const ref = createRef<QrAccountConfigHandle>();
    const { container } = render(
      <QrAccountConfig ref={ref} bankAccountId={7} />,
    );
    await waitFor(() =>
      expect(screen.getByText(/co•••••er/)).toBeInTheDocument(),
    );

    const refInput = container.querySelector(
      'input[name="qr_dynamic_account_reference"]',
    ) as HTMLInputElement;
    fireEvent.change(refInput, {
      target: { name: "qr_dynamic_account_reference", value: "CTA-002" },
    });
    // La sección ya no tiene botón propio: guarda el formulario que la contiene
    await ref.current!.save();

    await waitFor(() => {
      const putCall = executeMock.mock.calls.find((c) => c[1] === "PUT");
      expect(putCall).toBeTruthy();
      // Solo la referencia: ni credenciales vacías ni el toggle sin tocar
      expect(putCall?.[2]).toEqual({
        qr_dynamic_account_reference: "CTA-002",
      });
    });
  });

  it("no tiene boton propio: el formulario padre es el unico que guarda", async () => {
    mockApi();
    render(<QrAccountConfig bankAccountId={7} />);
    await waitFor(() =>
      expect(screen.getByText(/co•••••er/)).toBeInTheDocument(),
    );

    expect(screen.queryByText("Guardar configuración QR")).toBeNull();
  });

  it("sin cambios no llama al backend y no bloquea al formulario", async () => {
    mockApi();
    const ref = createRef<QrAccountConfigHandle>();
    render(<QrAccountConfig ref={ref} bankAccountId={7} />);
    await waitFor(() =>
      expect(screen.getByText(/co•••••er/)).toBeInTheDocument(),
    );

    await expect(ref.current!.save()).resolves.toBe(true);
    expect(executeMock.mock.calls.some((c) => c[1] === "PUT")).toBe(false);
  });

  it("un rechazo del backend devuelve false para que el modal no se cierre", async () => {
    executeMock.mockImplementation(async (url: string, method: string) => {
      if (url.includes("/providers"))
        return { data: { success: true, data: { providers: PROVIDERS } } };
      if (method === "GET") return { data: { success: true, data: CONFIG } };
      return {
        data: null,
        error: { status: 422, data: { success: false, message: "Referencia inválida" } },
      };
    });
    const ref = createRef<QrAccountConfigHandle>();
    const { container } = render(
      <QrAccountConfig ref={ref} bankAccountId={7} />,
    );
    await waitFor(() =>
      expect(screen.getByText(/co•••••er/)).toBeInTheDocument(),
    );

    fireEvent.change(
      container.querySelector(
        'input[name="qr_dynamic_account_reference"]',
      ) as HTMLInputElement,
      { target: { name: "qr_dynamic_account_reference", value: "X" } },
    );

    await expect(ref.current!.save()).resolves.toBe(false);
  });

  it("con el QR deshabilitado esconde el resto de los campos", async () => {
    executeMock.mockImplementation(async (url: string, method: string) => {
      if (url.includes("/providers"))
        return { data: { success: true, data: { providers: PROVIDERS } } };
      return {
        data: {
          success: true,
          data: { ...CONFIG, qr_dynamic_enabled: false },
        },
      };
    });
    const { container } = render(<QrAccountConfig bankAccountId={7} />);

    await waitFor(() =>
      expect(
        container.querySelector('input[name="qr_dynamic_enabled"]'),
      ).toBeTruthy(),
    );
    expect(
      container.querySelector('input[name="qr_dynamic_account_reference"]'),
    ).toBeNull();
    expect(
      container.querySelector('input[name="qr_dynamic_api_key"]'),
    ).toBeNull();

    // Al encenderlo, los campos aparecen (el Switch es un checkbox real)
    fireEvent.click(
      container.querySelector(
        'input[name="qr_dynamic_enabled"]',
      ) as HTMLInputElement,
    );

    await waitFor(() =>
      expect(
        container.querySelector('input[name="qr_dynamic_account_reference"]'),
      ).toBeTruthy(),
    );
  });

  it("sin acceso (403) no renderiza nada", async () => {
    // Forma REAL de useAxios ante un 403: data null, cuerpo en error.data
    executeMock.mockResolvedValue({
      data: null,
      error: { status: 403, data: { success: false, message: "No autorizado" } },
    });
    const { container } = render(<QrAccountConfig bankAccountId={7} />);
    await waitFor(() =>
      expect(container.querySelector("#qr-account-config")).toBeNull(),
    );
    expect(screen.queryByText(/Guardar configuración QR/)).toBeNull();
    expect(container.querySelector("#qr-account-config-error")).toBeNull();
  });

  it("un 404 muestra un error visible, no una sección vacía (QR-07)", async () => {
    // Forma REAL de useAxios ante un 404: axios TIRA, data null
    executeMock.mockResolvedValue({
      data: null,
      error: {
        status: 404,
        data: { success: false, message: "Cuenta no encontrada" },
      },
    });
    const { container } = render(<QrAccountConfig bankAccountId={7} />);

    await waitFor(() =>
      expect(container.querySelector("#qr-account-config-error")).not.toBeNull(),
    );
    expect(
      screen.getByText(/No se pudo cargar la configuración del QR dinámico/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cuenta no encontrada/)).toBeInTheDocument();
    // La sección se anuncia igual: el usuario ve que existe y que falló
    expect(screen.getByText(/QR Dinámico \(solo FOS\)/)).toBeInTheDocument();
    expect(screen.getByText("Reintentar")).toBeInTheDocument();
  });

  it("una caída de red muestra un mensaje accionable", async () => {
    // Sin respuesta HTTP: status 0 y sin message del backend
    executeMock.mockResolvedValue({
      data: null,
      error: { status: 0, message: "Network Error", data: {} },
    });
    const { container } = render(<QrAccountConfig bankAccountId={7} />);

    await waitFor(() =>
      expect(container.querySelector("#qr-account-config-error")).not.toBeNull(),
    );
    expect(
      screen.getByText(/Revisá tu conexión y volvé a intentar/),
    ).toBeInTheDocument();
  });

  it("Reintentar vuelve a pedir la configuración", async () => {
    executeMock.mockResolvedValue({
      data: null,
      error: { status: 500, data: { success: false, message: "Error interno" } },
    });
    const { container } = render(<QrAccountConfig bankAccountId={7} />);
    await waitFor(() =>
      expect(container.querySelector("#qr-account-config-error")).not.toBeNull(),
    );

    mockApi();
    fireEvent.click(screen.getByText("Reintentar"));
    await waitFor(() =>
      expect(screen.getByText(/co•••••er/)).toBeInTheDocument(),
    );
    expect(container.querySelector("#qr-account-config-error")).toBeNull();
  });
});
