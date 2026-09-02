import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useFileUpload } from "../useFileUpload";
import { storage } from "@/mk/services/storage/storage.service";

vi.mock("@/mk/services/storage/storage.service", () => ({
  storage: {
    upload: vi.fn(),
    delete: vi.fn(),
  },
}));

/**
 * Una subida fallida NO borra la imagen anterior.
 *
 * ────────────────────────────────────────────────────────────────────────
 * 🔴 `hasError` SE ESCRIBÍA ADENTRO DEL UPDATER DE ESTADO
 * ────────────────────────────────────────────────────────────────────────
 *
 * Era un `let hasError = false` que se ponía en `true` dentro del callback de
 * `setFilePreviews`. Ese callback lo corre React **después**, durante el
 * render, no en la línea del `setState`: para cuando el código llegaba a los
 * dos `if` de abajo, `hasError` seguía valiendo `false`.
 *
 * Y las consecuencias no eran cosméticas. Con una subida fallida reemplazando
 * una imagen existente:
 *
 *  - el `if (hasError && isSingle && oldPreview)` **no restauraba** la anterior
 *    ni avisaba;
 *  - y el `if (!hasError && oldItemToDelete && deleteOldOnReplace)` **borraba
 *    la anterior del storage**.
 *
 * O sea: el usuario se quedaba sin la nueva **y sin la que tenía**.
 *
 * ⚠️ Además el updater de `useState` tiene que ser PURO: en `StrictMode` React
 * lo llama dos veces, así que escribir una variable de afuera desde adentro
 * corre dos veces por definición.
 */
describe("cuando la subida de la imagen falla", () => {
  const archivo = () =>
    new File(["contenido"], "avatar.png", { type: "image/png" });

  // ⚠️ La URL lleva `/upload/` a propósito: `extractPublicId()` busca ese
  // segmento y sin él devuelve `null`, y sin `publicId` la imagen anterior
  // nunca entra en `oldItemToDelete`. Con una URL cualquiera, la contraprueba
  // de abajo quedaría verde por el motivo equivocado.
  const montar = (formState: any = {}) => {
    const showToast = vi.fn();
    const setFormState = vi.fn();

    const hook = renderHook(() =>
      useFileUpload({
        name: "url_avatar",
        formState,
        setFormState,
        cant: 1,
        showToast,
        mode: "images",
      })
    );

    return { hook, showToast, setFormState };
  };

  beforeEach(() => {
    vi.mocked(storage.upload).mockReset();
    vi.mocked(storage.delete).mockReset();
    globalThis.URL.createObjectURL = vi.fn(() => "blob:nueva");
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  it("no borra la anterior del storage", async () => {
    vi.mocked(storage.upload).mockRejectedValue(new Error("500 del storage"));

    const { hook, showToast } = montar({
      url_avatar: "https://cdn.test/image/upload/v1/avatar-viejo.png",
    });

    await act(async () => {
      await hook.result.current.handleFiles([archivo()] as any);
    });

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith(
        expect.stringContaining("Se mantuvo la imagen anterior"),
        "error"
      )
    );

    expect(
      vi.mocked(storage.delete),
      "🔴 Ésta es la mitad que dejaba al usuario sin la nueva Y sin la que tenía."
    ).not.toHaveBeenCalled();
  });

  // ⚠️ La CONTRAPRUEBA: cuando la subida SÍ sale, la anterior se borra.
  // Sin esta mitad, un `hasError` clavado en `true` pasaría el test de arriba
  // y dejaría el storage llenándose de imágenes viejas para siempre.
  it("y cuando sale bien, la anterior sí se borra", async () => {
    vi.mocked(storage.upload).mockResolvedValue({
      url: "https://cdn.test/avatar-nuevo.png",
      path: "avatar-nuevo.png",
      resource_type: "image",
    } as any);
    vi.mocked(storage.delete).mockResolvedValue(undefined as any);

    const { hook } = montar({
      url_avatar: "https://cdn.test/image/upload/v1/avatar-viejo.png",
    });

    await act(async () => {
      await hook.result.current.handleFiles([archivo()] as any);
    });

    await waitFor(() => expect(storage.delete).toHaveBeenCalled());
  });
});
