"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { storage } from "@/mk/services/storage/storage.service";
import { StorageFile } from "@/mk/services/storage/types";

interface PreviewItem {
  id: number;
  url: string | null;
  size: number;
  originalName: string;
  publicId: string | null;
  resourceType: "image" | "raw";
  isUploading: boolean;
  file?: File;
  type: "image" | "document";
  persisted?: boolean;
}

interface UseFileUploadProps {
  name: string;
  formState: any;
  setFormState: (updater: (prev: any) => any) => void;
  cant?: number;
  onUploadStateChange?: (v: boolean) => void;
  maxMB?: number;
  mode?: "documents" | "images" | "all";
  showToast: any;
  resetInput?: () => void;
  deleteOldOnReplace?: boolean; // ← NUEVA PROP
  preserveExistingOnRemove?: boolean;
}

const extDocuments = ["pdf", "docx", "doc", "xlsx", "xls", "txt", "csv"];
const extImages = ["jpg", "jpeg", "png", "webp", "heic", "avif"];

const extractPublicId = (
  url: string,
  resourceType: "image" | "raw",
): string | null => {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?([^?#]+)/);
    if (!match) return null;

    let publicId = match[1];
    if (resourceType === "image") {
      publicId = publicId.replace(/\.[^./]+$/, "");
    }
    return publicId;
  } catch {
    return null;
  }
};

const getFileType = (filename: string): "image" | "document" => {
  const ext = filename.toLowerCase().split(".").pop() || "";
  return extImages.includes(ext) ? "image" : "document";
};

const getPath = (filename: string) => {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const clean = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `uploads/${Date.now()}_${clean}`;
};

export const useFileUpload = ({
  name,
  formState,
  setFormState,
  cant = 12,
  onUploadStateChange,
  maxMB = 5,
  mode = "images",
  showToast,
  resetInput,
  deleteOldOnReplace = true, // ← por defecto elimina la anterior
  preserveExistingOnRemove = false,
}: UseFileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const nextPreviewId = useRef(0);
  const uploadingRef = useRef(false);
  const deletingIds = useRef(new Set<number>());
  const isSingle = cant === 1;
  const [filePreviews, setFilePreviews] = useState<PreviewItem[]>(() => {
    const rawValue = formState?.[name];
    const initialUrls: string[] = Array.isArray(rawValue)
      ? rawValue.filter((url): url is string => typeof url === "string" && Boolean(url))
      : typeof rawValue === "string" && rawValue
        ? [rawValue]
        : [];

    return initialUrls.map((url) => {
      const encodedName = url.split("/").pop()?.split("?")[0] || "archivo";
      let originalName = encodedName;
      try {
        originalName = decodeURIComponent(encodedName);
      } catch {
        // Una URL antigua mal codificada no debe dejar inoperable el formulario.
      }
      const type = getFileType(originalName);

      return {
        id: ++nextPreviewId.current,
        url,
        size: 0,
        originalName,
        publicId: extractPublicId(url, type === "image" ? "image" : "raw"),
        resourceType: type === "image" ? "image" : "raw",
        isUploading: false,
        type,
        persisted: true,
      };
    });
  });

  const allowedExtensions = new Set(
    mode === "images"
      ? extImages
      : mode === "documents"
        ? extDocuments
        : [...extDocuments, ...extImages],
  );

  const itemText =
    mode === "images"
      ? "imágenes"
      : mode === "documents"
        ? "documentos"
        : "imágenes o documentos";

  // Sincronizar URLs completadas con el formState
  useEffect(() => {
    const completedUrls = filePreviews
      .filter((item) => !item.isUploading && item.url)
      .map((item) => item.url as string);

    setFormState((prev: any) => {
      const prevValue = prev?.[name];
      const prevUrls = Array.isArray(prevValue)
        ? prevValue
        : typeof prevValue === "string" && prevValue
          ? [prevValue]
          : [];
      if (
        prevUrls.length === completedUrls.length &&
        prevUrls.every((url: string, i: number) => url === completedUrls[i])
      ) {
        return prev;
      }
      return { ...prev, [name]: completedUrls };
    });
  }, [filePreviews, name, setFormState]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (uploadingRef.current) {
        showToast(
          "Espera a que termine la subida actual antes de añadir más archivos.",
          "info",
        );
        return;
      }

      let validFiles = Array.from(files).filter((file) => {
        const ext = file.name.toLowerCase().split(".").pop() || "";
        return allowedExtensions.has(ext) && file.size <= maxMB * 1024 * 1024;
      });

      if (validFiles.length === 0) {
        showToast(
          `Ningún archivo válido. Solo se permiten ${itemText} de hasta ${maxMB} MB.`,
          "error",
        );
        return;
      }

      // En modo single, solo permitir 1 archivo
      let oldItemToDelete: StorageFile | null = null;
      let oldPreview: PreviewItem | null = null;

      if (isSingle) {
        if (validFiles.length > 1) {
          validFiles = [validFiles[0]];
          showToast(
            "Se seleccionaron varios archivos. Solo se subió el primero.",
            "info",
          );
        }

        if (filePreviews.length > 0) {
          const old = filePreviews[0];
          if (!old.isUploading && old.publicId) {
            oldItemToDelete = {
              path: old.publicId,
              url: old.url || "",
              name: old.originalName,
              resource_type: old.resourceType,
            };
          }
          if (old.type === "image" && old.url?.startsWith("blob:")) {
            URL.revokeObjectURL(old.url);
          }
          oldPreview = { ...old };
        }
      } else {
        // Modo múltiple: validar cantidad
        if (filePreviews.length + validFiles.length > cant) {
          showToast(`Máximo ${cant} archivos permitidos`, "error");
          return;
        }
      }

      // Crear previews de los nuevos archivos
      const newPreviews: PreviewItem[] = validFiles.map((file) => {
        const fileType = getFileType(file.name);
        const previewUrl =
          fileType === "image" ? URL.createObjectURL(file) : null;
        return {
          id: ++nextPreviewId.current,
          url: previewUrl,
          size: file.size,
          originalName: file.name,
          publicId: null,
          resourceType: fileType === "image" ? "image" : "raw",
          isUploading: true,
          file,
          type: fileType,
        };
      });

      // Reemplazar previews en modo single, añadir en modo múltiple
      setFilePreviews((prev) =>
        isSingle ? newPreviews : [...newPreviews, ...prev],
      );

      uploadingRef.current = true;
      setUploading(true);
      onUploadStateChange?.(true);

      const paths = validFiles.map((file) => getPath(file.name));
      const uploadPromises = validFiles.map((file, index) =>
        storage.upload(file, paths[index]),
      );

      try {
        const results = await Promise.allSettled(uploadPromises);
        const hasError = results.some((result) => result.status === "rejected");
        const resultsById = new Map(
          newPreviews.map((preview, index) => [preview.id, results[index]] as const),
        );

        setFilePreviews((prev) => {
          const kept: PreviewItem[] = [];

          prev.forEach((p) => {
            const result = resultsById.get(p.id);
            if (p.isUploading && p.file && result) {
              if (result.status === "fulfilled") {
                const uploaded: any = result.value;
                if (p.type === "image" && p.url?.startsWith("blob:")) {
                  URL.revokeObjectURL(p.url);
                }
                kept.push({
                  ...p,
                  url: uploaded.url,
                  publicId: uploaded.path,
                  resourceType: uploaded.resource_type || p.resourceType,
                  isUploading: false,
                  file: undefined,
                });
              } else {
                if (p.type === "image" && p.url?.startsWith("blob:")) {
                  URL.revokeObjectURL(p.url);
                }
                // No se guarda el fallido
              }
            } else {
              kept.push(p);
            }
          });
          return kept;
        });

        // Si hubo error en modo single y había una imagen anterior → revertir
        if (hasError && isSingle && oldPreview) {
          setFilePreviews([oldPreview]);
          showToast(
            "Error al subir la nueva imagen. Se mantuvo la imagen anterior.",
            "error",
          );
        } else if (hasError) {
          showToast(
            "No se pudo subir la imagen. Revisa el archivo e intenta nuevamente.",
            "error",
          );
        }

        // Eliminar imagen anterior solo si: éxito, modo single, prop activa y había anterior
        if (!hasError && oldItemToDelete && deleteOldOnReplace) {
          try {
            await storage.delete(oldItemToDelete);
          } catch (error) {
            console.error("Error eliminando imagen anterior:", error);
            showToast(
              "No se pudo eliminar la imagen anterior del servidor.",
              "error",
            );
          }
        }
      } catch (error) {
        console.error("Error en upload batch", error);
        newPreviews.forEach((preview) => {
          if (preview.type === "image" && preview.url?.startsWith("blob:")) {
            URL.revokeObjectURL(preview.url);
          }
        });
        const newIds = new Set(newPreviews.map((preview) => preview.id));
        setFilePreviews((prev) =>
          prev.filter((preview) => !newIds.has(preview.id)),
        );
        if (isSingle && oldPreview) {
          setFilePreviews([oldPreview]);
          showToast(
            "Error al subir la imagen. Se mantuvo la anterior.",
            "error",
          );
        }
      } finally {
        uploadingRef.current = false;
        setUploading(false);
        onUploadStateChange?.(false);
        resetInput?.();
      }
    },
    [
      allowedExtensions,
      cant,
      formState,
      isSingle,
      itemText,
      maxMB,
      mode,
      name,
      onUploadStateChange,
      resetInput,
      showToast,
      deleteOldOnReplace,
      filePreviews,
    ],
  );

  const handleDelete = useCallback(
    async (index: number) => {
      const item = filePreviews[index];
      if (!item) return;
      if (uploadingRef.current) {
        showToast(
          "Espera a que termine la subida antes de quitar una foto.",
          "info",
        );
        return;
      }
      if (deletingIds.current.has(item.id)) return;
      deletingIds.current.add(item.id);

      try {
        if (
          !item.isUploading &&
          item.publicId &&
          !(preserveExistingOnRemove && item.persisted)
        ) {
          await storage.delete({
            path: item.publicId,
            url: item.url || "",
            name: item.originalName,
            resource_type: item.resourceType,
          });
        }

        if (item.type === "image" && item.url?.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
        setFilePreviews((prev) =>
          prev.filter((preview) => preview.id !== item.id),
        );
      } catch (error) {
        console.error("Error eliminando de Cloudinary:", error);
        showToast(
          "No se pudo eliminar el archivo del servidor. Intenta de nuevo.",
          "error",
        );
      } finally {
        deletingIds.current.delete(item.id);
      }
    },
    [filePreviews, preserveExistingOnRemove, showToast],
  );

  return {
    filePreviews,
    uploading,
    handleFiles,
    handleDelete,
  };
};
