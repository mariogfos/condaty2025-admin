"use client";

import React, { useState, useCallback, useEffect } from "react";
import { storage } from "@/mk/services/storage/storage.service";
import { StorageFile } from "@/mk/services/storage/types";

interface PreviewItem {
  url: string | null;
  size: number;
  originalName: string;
  publicId: string | null;
  resourceType: "image" | "raw";
  isUploading: boolean;
  file?: File;
  type: "image" | "document";
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
}

const extDocuments = ["pdf", "docx", "doc", "xlsx", "xls", "txt", "csv"];
const extImages = ["jpg", "jpeg", "png", "webp", "heic", "avif"];

const extractPublicId = (url: string): string | null => {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?([^?#]+)/);
    if (!match) return null;

    let publicId = match[1];
    publicId = publicId.replace(/\.[^./]+$/, "");
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
}: UseFileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [filePreviews, setFilePreviews] = useState<PreviewItem[]>([]);
  const isSingle = cant === 1;

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

  // Cargar archivos existentes al montar
  useEffect(() => {
    const rawValue = formState?.[name];

    const initialUrls: string[] = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === "string" && rawValue
        ? [rawValue]
        : [];

    if (initialUrls.length > 0) {
      const existingPreviews: PreviewItem[] = initialUrls.map((url) => {
        const originalName = decodeURIComponent(
          url?.split("/")?.pop()?.split("?")[0] || "archivo",
        );
        const type = getFileType(originalName);

        return {
          url,
          size: 0,
          originalName,
          publicId: extractPublicId(url),
          resourceType: type === "image" ? "image" : "raw",
          isUploading: false,
          type,
        };
      });

      setFilePreviews(existingPreviews);
    } else {
      setFilePreviews([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar URLs completadas con el formState
  useEffect(() => {
    const completedUrls = filePreviews
      .filter((item) => !item.isUploading && item.url)
      .map((item) => item.url as string);

    setFormState((prev: any) => {
      const prevUrls = prev?.[name] || [];
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

      let fileArray = Array.from(files);
      let validFiles = fileArray.filter((file) => {
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
        const currentValues: string[] = formState?.[name] || [];
        if (currentValues.length + validFiles.length > cant) {
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

      setUploading(true);
      onUploadStateChange?.(true);

      const paths = validFiles.map((file) => getPath(file.name));
      const uploadPromises = validFiles.map((file, index) =>
        storage.upload(file, paths[index]),
      );

      try {
        const results = await Promise.allSettled(uploadPromises);

        let hasError = false;

        setFilePreviews((prev) => {
          const kept: PreviewItem[] = [];
          let newIdx = 0;

          prev.forEach((p) => {
            if (p.isUploading && p.file) {
              const result = results[newIdx];
              newIdx++;
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
                hasError = true;
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
        if (isSingle && oldPreview) {
          setFilePreviews([oldPreview]);
          showToast(
            "Error al subir la imagen. Se mantuvo la anterior.",
            "error",
          );
        }
      } finally {
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
    ],
  );

  const handleDelete = useCallback(
    async (index: number) => {
      const item = filePreviews[index];
      if (!item) return;

      if (!item.isUploading && item.publicId) {
        try {
          await storage.delete({
            path: item.publicId,
            url: item.url || "",
            name: item.originalName,
            resource_type: item.resourceType,
          });
        } catch (error) {
          console.error("Error eliminando de Cloudinary:", error);
          showToast(
            "No se pudo eliminar el archivo del servidor. Intenta de nuevo.",
            "error",
          );
        }
      }

      if (item.type === "image" && item.url?.startsWith("blob:")) {
        URL.revokeObjectURL(item.url);
      }
      setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    },
    [filePreviews, showToast],
  );

  return {
    filePreviews,
    uploading,
    handleFiles,
    handleDelete,
  };
};
