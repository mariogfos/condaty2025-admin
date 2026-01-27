"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import styles from "./UploadFileV3.module.css";
import {
  IconCheck,
  IconDOC,
  IconDownload,
  IconX,
} from "@/components/layout/icons/IconsBiblioteca";
import { storage } from "@/mk/services/storage/storage.service";
import { StorageFile } from "@/mk/services/storage/types";
import DataModal from "../../ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";

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
interface UploadFileV3Props {
  name: string;
  formState: any;
  setFormState: (updater: (prev: any) => any) => void;
  cant?: number;
  onUploadStateChange?: (v: boolean) => void;
  maxMB?: number;
  mode?: "documents" | "images" | "all";
  error?: Record<string, string>;
  title?: string;
  subtitle?: string;
}

const extractPublicId = (url: string): string | null => {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

const extDocuments = ["pdf", "docx", "doc", "xlsx", "xls", "txt", "csv"];
const extImages = ["jpg", "jpeg", "png", "webp", "heic"];

const UploadFileV3 = ({
  name,
  formState,
  setFormState,
  cant = 12,
  onUploadStateChange,
  maxMB = 5,
  mode = "images",
  title,
  subtitle,
  error,
}: UploadFileV3Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [filePreviews, setFilePreviews] = useState<PreviewItem[]>([]);

  const { showToast } = useAuth();
  const [openPreview, setOpenPreview] = useState({
    open: false,
    item: null,
  } as { open: boolean; item: PreviewItem | null });

  const isSingle = cant === 1;

  const currentValues: string[] = formState?.[name] || [];

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

  const itemTextCapitalized =
    itemText.charAt(0).toUpperCase() + itemText.slice(1);

  const acceptStr =
    mode === "images"
      ? "image/*"
      : mode === "documents"
        ? extDocuments.map((ext) => `.${ext}`).join(",")
        : `image/*,${extDocuments.map((ext) => `.${ext}`).join(",")}`;

  const getFileType = (filename: string): "image" | "document" => {
    const ext = filename.toLowerCase().split(".").pop() || "";
    return extImages.includes(ext) ? "image" : "document";
  };

  const getPath = (filename: string) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

    const clean = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `uploads/${Date.now()}_${clean}`;
  };

  useEffect(() => {
    const initialUrls: string[] = formState?.[name] || [];
    if (initialUrls.length > 0) {
      const existingPreviews: PreviewItem[] = initialUrls.map((url: string) => {
        const originalName = decodeURIComponent(
          url.split("/").pop()?.split("?")[0] || "archivo",
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

  const uploadFiles = useCallback(
    async (files: FileList) => {
      if (!files.length) return;
      const fileArray = Array.from(files);

      const validFiles = fileArray.filter((file) => {
        const ext = file.name.toLowerCase().split(".").pop() || "";
        return allowedExtensions.has(ext) && file.size <= maxMB * 1024 * 1024;
      });

      if (validFiles.length === 0) {
        // alert(
        //   `Ningún archivo válido. Solo se permiten ${itemText} de hasta ${maxMB} MB.`
        // );
        showToast(
          `Ningún archivo válido. Solo se permiten ${itemText} de hasta ${maxMB} MB.`,
          "error",
        );
        return;
      }

      if (!isSingle && currentValues.length + validFiles.length > cant) {
        // alert(`Máximo ${cant} archivos permitidos`);
        showToast(`Máximo ${cant} archivos permitidos`, "error");
        return;
      }

      if (isSingle && currentValues.length > 0) {
        setFilePreviews((prev) => prev.slice(1)); // o simplemente []
      }

      // Crear previews locales (se añadirán arriba → último agregado al principio)
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

      // Nuevos arriba (más reciente primero)
      setFilePreviews((prev) => [...newPreviews, ...prev]);

      setUploading(true);
      onUploadStateChange?.(true);

      const paths = validFiles.map((file) => getPath(file.name));
      const uploadPromises = validFiles.map((file, index) =>
        storage.upload(file, paths[index]),
      );

      let results: any;
      try {
        results = await Promise.allSettled(uploadPromises);
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
                if (p.type === "image" && p.url) {
                  URL.revokeObjectURL(p.url);
                }
              }
            } else {
              // Antiguos completados
              kept.push(p);
            }
          });

          return kept;
        });
      } catch (error) {
        console.error("Error en upload batch", error);
        setFilePreviews((prev) =>
          prev.filter((p) => {
            if (p.isUploading && p.type === "image" && p.url) {
              URL.revokeObjectURL(p.url);
            }
            return !p.isUploading;
          }),
        );
      } finally {
        setUploading(false);
        onUploadStateChange?.(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [
      cant,
      currentValues.length,
      isSingle,
      maxMB,
      name,
      setFormState,
      onUploadStateChange,
      mode,
      itemText,
    ],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const handleDelete = async (index: number) => {
    const item = filePreviews[index];
    if (!item) return;
    if (!item.isUploading && item.publicId) {
      const fileToDelete: StorageFile = {
        path: item.publicId || "",
        url: item.url || "",
        name: item.originalName,
        resource_type: item.resourceType,
      };

      try {
        await storage.delete(fileToDelete);
      } catch (error) {
        console.error("Error eliminando de Cloudinary:", error);
        alert("No se pudo eliminar el archivo del servidor. Intenta de nuevo.");
        return;
      }
    }
    if (item.type === "image" && item.url?.startsWith("blob:")) {
      URL.revokeObjectURL(item.url);
    }
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };
  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptStr}
          multiple={!isSingle}
          onChange={handleInputChange}
          style={{ display: "none" }}
        />
        <div
          className={styles.box}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            cursor: "pointer",
            opacity: uploading ? 0.6 : 1,
            borderColor: isDragging ? "var(--cAccent)" : undefined,
          }}
        >
          <div className={styles.containerIcon}>
            <IconDownload color="var(--cWhite)" />
            <p className={styles.title}>
              {uploading
                ? "Subiendo archivos..."
                : title || `Arrastra y suelta tus ${itemText} aquí`}
            </p>
          </div>
          <p className={styles.subtitle}>
            {subtitle || "o haz clic para seleccionar desde tu computadora"}
          </p>
        </div>
      </div>

      <div className={styles.info}>
        <p>
          Archivos permitidos:{" "}
          {mode === "images"
            ? extImages.join(", ")
            : mode === "documents"
              ? extDocuments.join(", ")
              : extImages.concat(extDocuments).join(", ")}
        </p>
        <p>Máx: {maxMB} MB</p>
      </div>

      <p className={styles.error}>{error?.[name]}</p>
      {filePreviews?.length > 0 && (
        <>
          <p className={styles.titlePreviews}>{itemTextCapitalized}:</p>
          <div className={styles.previews}>
            {filePreviews.map((item, index) => {
              return (
                <div
                  key={index}
                  className={styles.preview}
                  onClick={() => setOpenPreview({ open: true, item: item })}
                >
                  <div
                    className={styles.containerImage}
                    style={{ position: "relative" }}
                  >
                    {item.type === "image" ? (
                      item.url && (
                        <img
                          src={item.url}
                          alt={item.originalName}
                          className={styles.previewImg}
                        />
                      )
                    ) : (
                      <IconDOC />
                    )}
                    <p className={styles.fileName}>{item.originalName}</p>
                    <div className={styles.status}>
                      <p>
                        {item.isUploading ? "Subiendo..." : "Archivo subido"}
                      </p>
                      {!item.isUploading && (
                        <IconCheck size={16} color="var(--cAccent)" />
                      )}
                    </div>
                  </div>

                  <IconX
                    onClick={(e: any) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
      {openPreview.open && (
        <DataModal
          buttonCancel=""
          buttonText=""
          open={openPreview.open}
          onClose={() => setOpenPreview({ open: false, item: null })}
          title="Vista previa del archivo"
        >
          <div className={styles.previewContainer}>
            {openPreview.item?.type === "image" ? (
              <img
                src={openPreview.item?.url || ""}
                alt={openPreview.item?.originalName || ""}
                style={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
            ) : (
              <iframe
                src={openPreview.item?.url || ""}
                title={openPreview.item?.originalName || ""}
                style={{ maxWidth: "100%", maxHeight: "80vh", height: 400 }}
              />
            )}
          </div>
        </DataModal>
      )}
    </div>
  );
};

export default UploadFileV3;
