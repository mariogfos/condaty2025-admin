import { beforeEach, describe, expect, it, vi } from "vitest";
import { storage } from "@/mk/services/storage/storage.service";
import { removeUnlinkedAreaImages } from "../RenderForm/areaImageCleanup";

vi.mock("@/mk/services/storage/storage.service", () => ({
  storage: { delete: vi.fn() },
}));

describe("limpieza de fotos de áreas tras guardar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("elimina únicamente fotos anteriores desvinculadas y de Cloudinary", async () => {
    const old = "https://res.cloudinary.com/demo/image/upload/v1/condaty-admin/old.jpg";
    const retained = "https://res.cloudinary.com/demo/image/upload/v1/condaty-admin/keep.jpg";
    const external = "https://example.com/legacy.jpg";

    const failures = await removeUnlinkedAreaImages(
      [old, retained, external], [retained],
    );

    expect(failures).toBe(0);
    expect(storage.delete).toHaveBeenCalledTimes(1);
    expect(storage.delete).toHaveBeenCalledWith({
      path: old, url: old, name: "", resource_type: "image",
    });
  });

  it("informa un fallo de limpieza sin interrumpir la actualización ya guardada", async () => {
    vi.mocked(storage.delete).mockRejectedValueOnce(new Error("HTTP 500"));
    const old = "https://res.cloudinary.com/demo/image/upload/v1/condaty-admin/old.jpg";

    await expect(removeUnlinkedAreaImages([old], [])).resolves.toBe(1);
  });
});
