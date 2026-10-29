import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFileUpload } from "../useFileUpload";
import { storage } from "@/mk/services/storage/storage.service";

vi.mock("@/mk/services/storage/storage.service", () => ({
  storage: {
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

const fileList = (file: File) =>
  ({
    0: file,
    item: (index: number) => (index === 0 ? file : null),
    length: 1,
    *[Symbol.iterator]() { yield file; },
  }) as FileList;

describe("useFileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:guard-photo"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("informa el fallo de la primera foto en vez de dejar el formulario ambiguo", async () => {
    const showToast = vi.fn();
    const setFormState = vi.fn();
    vi.mocked(storage.upload).mockRejectedValueOnce(
      new Error("Cloudinary unavailable"),
    );

    const { result } = renderHook(() =>
      useFileUpload({
        formState: {},
        name: "url_avatar",
        setFormState,
        showToast,
      }),
    );

    await act(async () => {
      await result.current.handleFiles(
        fileList(new File(["photo"], "guard.jpg", { type: "image/jpeg" })),
      );
    });

    expect(showToast).toHaveBeenCalledWith(
      "No se pudo subir la imagen. Revisa el archivo e intenta nuevamente.",
      "error",
    );
    expect(result.current.filePreviews).toEqual([]);
  });

  it("conserva en Cloudinary una foto ya guardada al retirarla de un formulario aún no confirmado", async () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/vehicle.jpg";
    const { result } = renderHook(() => useFileUpload({
      formState: { images: [url] }, name: "images", setFormState: vi.fn(),
      showToast: vi.fn(), preserveExistingOnRemove: true,
    }));

    expect(result.current.filePreviews).toHaveLength(1);
    await act(async () => result.current.handleDelete(0));
    expect(storage.delete).not.toHaveBeenCalled();
    expect(result.current.filePreviews).toHaveLength(0);
  });

  it("no mezcla las respuestas de dos selecciones de fotos seguidas", async () => {
    const showToast = vi.fn();
    let finishUpload!: (value: any) => void;
    vi.mocked(storage.upload).mockImplementationOnce(
      () => new Promise((resolve) => { finishUpload = resolve; }),
    );

    const { result } = renderHook(() => useFileUpload({
      formState: { images: [] }, name: "images", setFormState: vi.fn(), showToast,
    }));

    await act(async () => {
      const firstUpload = result.current.handleFiles(
        fileList(new File(["first"], "first.jpg", { type: "image/jpeg" })),
      );
      await result.current.handleFiles(
        fileList(new File(["second"], "second.jpg", { type: "image/jpeg" })),
      );
      finishUpload({
        path: "condaty-admin/uploads/first",
        url: "https://res.cloudinary.com/demo/image/upload/v1/condaty-admin/uploads/first.jpg",
        name: "first.jpg", resource_type: "image",
      });
      await firstUpload;
    });

    expect(storage.upload).toHaveBeenCalledTimes(1);
    expect(result.current.filePreviews).toHaveLength(1);
    expect(result.current.filePreviews[0].isUploading).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "Espera a que termine la subida actual antes de añadir más archivos.", "info",
    );
  });

  it("conserva la foto visible si Cloudinary rechaza la eliminación", async () => {
    const showToast = vi.fn();
    const url = "https://res.cloudinary.com/demo/image/upload/v1/condaty-admin/area.jpg";
    vi.mocked(storage.delete).mockRejectedValueOnce(new Error("HTTP 500"));
    const { result } = renderHook(() => useFileUpload({
      formState: { images: [url] }, name: "images", setFormState: vi.fn(), showToast,
    }));

    await act(async () => result.current.handleDelete(0));

    expect(result.current.filePreviews).toHaveLength(1);
    expect(showToast).toHaveBeenCalledWith(
      "No se pudo eliminar el archivo del servidor. Intenta de nuevo.", "error",
    );
  });

  it("conserva la extensión en el public ID de documentos raw", async () => {
    const url = "https://res.cloudinary.com/demo/raw/upload/v1/condaty-admin/report.pdf";
    const { result } = renderHook(() => useFileUpload({
      formState: { documents: [url] }, name: "documents", mode: "documents",
      setFormState: vi.fn(), showToast: vi.fn(),
    }));

    await act(async () => result.current.handleDelete(0));

    expect(storage.delete).toHaveBeenCalledWith(expect.objectContaining({
      path: "condaty-admin/report.pdf", resource_type: "raw",
    }));
  });
});
