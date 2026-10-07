/**
 * El WhatsApp de soporte tiene que poder CARGARSE desde alguna pantalla.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 SEXTA VEZ, Y ESTA LA DEJE YO
 * ────────────────────────────────────────────────────────────────────────
 *
 * api#496 dejo el API completo: `GET /app-version` entrega
 * `support.whatsapp_phone` y `support.whatsapp_message`, y el `PUT` los acepta
 * como `support_whatsapp_phone` / `support_whatsapp_message`, normalizando el
 * telefono. La app de residentes los usa: el boton de ayuda de su login abre
 * ese WhatsApp con ese mensaje.
 *
 * Y `AppVersionModal` —la unica pantalla que edita `/app-version`— tenia
 * OCHO inputs, todos de version. Ninguno de soporte. El telefono se quedaba en
 * lo que hubiera en la base, sin forma de cambiarlo.
 *
 * ⚠️ La forma de ida y la de vuelta NO son la misma: el GET los entrega
 * ANIDADOS en `support` y el PUT los toma PLANOS con prefijo. Este test mide
 * las dos puntas, porque un mapeo a medias se ve igual que un campo vacio.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const execute = vi.fn();

vi.mock("@/mk/hooks/useAxios", () => ({ default: () => ({ execute }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }));

import AppVersionModal from "../AppVersionModal";

/** El sobre REAL de `GET /app-version` desde api#496. */
const elApiDevuelve = {
  data: {
    owner: { min_version: { android: "46", ios: "40" }, update_url: {} },
    guard: { min_version: { android: "45", ios: "41" }, update_url: {} },
    support: {
      whatsapp_phone: "59171234567",
      whatsapp_message: "Hola, necesito ayuda con Condaty",
    },
  },
  error: null,
};

const inputPorNombre = (name: string) =>
  document.querySelector(`input[name="${name}"]`) as HTMLInputElement | null;

beforeEach(() => {
  execute.mockReset();
  execute.mockResolvedValue(elApiDevuelve);
});

describe("los campos de soporte", () => {
  it("estan en la pantalla", async () => {
    render(<AppVersionModal />);

    await waitFor(() => {
      expect(inputPorNombre("support_whatsapp_phone")).not.toBeNull();
    });
    expect(inputPorNombre("support_whatsapp_message")).not.toBeNull();
  });

  it("se cargan con lo que el API devuelve ANIDADO en support", async () => {
    render(<AppVersionModal />);

    await waitFor(() => {
      expect(inputPorNombre("support_whatsapp_phone")!.value).toBe("59171234567");
    });
    expect(inputPorNombre("support_whatsapp_message")!.value).toBe(
      "Hola, necesito ayuda con Condaty",
    );
  });

  it("se mandan PLANOS con el prefijo que el PUT espera", async () => {
    render(<AppVersionModal />);

    await waitFor(() => {
      expect(inputPorNombre("support_whatsapp_phone")).not.toBeNull();
    });

    fireEvent.change(inputPorNombre("support_whatsapp_phone")!, {
      target: { name: "support_whatsapp_phone", value: "59177777777" },
    });

    execute.mockClear();
    execute.mockResolvedValue({ data: { success: true }, error: null });
    fireEvent.click(screen.getByText(/guardar/i));

    await waitFor(() => {
      const put = execute.mock.calls.find((c: any[]) => c[1] === "PUT");
      expect(put).toBeTruthy();
      expect(put![2]).toMatchObject({ support_whatsapp_phone: "59177777777" });
    });
  });
});

/**
 * The forced update obeys an INTEGER build (2026-10-07). The screen edits
 * `min_version_code_*` and sends them as numbers: the old text `min_version`
 * held `1.0.0`, which the apps turn into NaN and which blocks nobody.
 */
describe("el build minimo de cada app", () => {
  const conEnteros = {
    data: {
      ...elApiDevuelve.data,
      owner: { ...elApiDevuelve.data.owner, min_version_code: { android: 50, ios: 50 } },
      guard: { ...elApiDevuelve.data.guard, min_version_code: { android: 50, ios: null } },
    },
    error: null,
  };

  it("se carga del min_version_code anidado, no del texto", async () => {
    execute.mockResolvedValue(conEnteros);
    render(<AppVersionModal />);

    await waitFor(() => {
      expect(inputPorNombre("min_version_code_android")!.value).toBe("50");
    });
    expect(inputPorNombre("min_version_code_ios_guard")!.value).toBe("");
    expect(inputPorNombre("min_version_android")).toBeNull();
  });

  it("se manda como numero, y vacio como null", async () => {
    execute.mockResolvedValue(conEnteros);
    render(<AppVersionModal />);

    await waitFor(() => {
      expect(inputPorNombre("min_version_code_android")!.value).toBe("50");
    });
    fireEvent.change(inputPorNombre("min_version_code_ios")!, {
      target: { name: "min_version_code_ios", value: "51" },
    });

    execute.mockClear();
    execute.mockResolvedValue({ data: { success: true }, error: null });
    fireEvent.click(screen.getByText(/guardar/i));

    await waitFor(() => {
      const put = execute.mock.calls.find((c: any[]) => c[1] === "PUT");
      expect(put).toBeTruthy();
      expect(put![2]).toMatchObject({
        min_version_code_android: 50,
        min_version_code_ios: 51,
        min_version_code_android_guard: 50,
        min_version_code_ios_guard: null,
      });
      expect(put![2]).not.toHaveProperty("min_version_android");
    });
  });

  it("lo que no es un entero viaja tal cual, para que el API lo rechace", async () => {
    execute.mockResolvedValue(conEnteros);
    render(<AppVersionModal />);

    await waitFor(() => {
      expect(inputPorNombre("min_version_code_android")).not.toBeNull();
    });
    fireEvent.change(inputPorNombre("min_version_code_android")!, {
      target: { name: "min_version_code_android", value: "1.0.0" },
    });

    execute.mockClear();
    execute.mockResolvedValue({ data: { success: true }, error: null });
    fireEvent.click(screen.getByText(/guardar/i));

    await waitFor(() => {
      const put = execute.mock.calls.find((c: any[]) => c[1] === "PUT");
      expect(put![2]).toMatchObject({ min_version_code_android: "1.0.0" });
    });
  });
});
