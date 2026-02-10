"use client";

import React, { useRef, useState, useCallback } from "react";
import styles from "./UploadFileV3.module.css";
import {
  IconCheck,
  IconDOC,
  IconDownload,
  IconX,
} from "@/components/layout/icons/IconsBiblioteca";
import DataModal from "../../ui/DataModal/DataModal";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useFileUpload } from "@/mk/hooks/useFileUpload";

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
  error,
  title,
  subtitle,
}: UploadFileV3Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [openPreview, setOpenPreview] = useState<{
    open: boolean;
    item: PreviewItem | null;
  }>({ open: false, item: null });

  const { showToast } = useAuth();

  const resetInput = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const { filePreviews, uploading, handleFiles, handleDelete } = useFileUpload({
    name,
    formState,
    setFormState,
    cant,
    onUploadStateChange,
    maxMB,
    mode,
    showToast,
    resetInput,
  });

  const isSingle = cant === 1;

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

  const allowedDisplay =
    mode === "all"
      ? [...extImages, ...extDocuments].join(", ")
      : mode === "images"
        ? extImages.join(", ")
        : extDocuments.join(", ");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
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
                : title || `Arrastre y suelta tus ${itemText} aquí`}
            </p>
          </div>
          <p className={styles.subtitle}>
            {subtitle || "o haz clic para seleccionar desde tu computadora"}
          </p>
        </div>
      </div>

      <div className={styles.info}>
        <p>Archivos permitidos: {allowedDisplay}</p>
        <p>Máx: {maxMB} MB</p>
      </div>

      <p className={styles.error}>{error?.[name]}</p>

      {filePreviews.length > 0 && (
        <>
          <p className={styles.titlePreviews}>{itemTextCapitalized}:</p>
          <div className={styles.previews}>
            {filePreviews.map((item, index) => (
              <div
                key={`${item.originalName}-${index}`}
                className={styles.preview}
                onClick={() => setOpenPreview({ open: true, item })}
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
                    <p>{item.isUploading ? "Subiendo..." : "Archivo subido"}</p>
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
            ))}
          </div>
        </>
      )}

      {openPreview.open && openPreview.item && (
        <DataModal
          buttonCancel=""
          buttonText=""
          open={openPreview.open}
          onClose={() => setOpenPreview({ open: false, item: null })}
          title="Vista previa del archivo"
        >
          <div className={styles.previewContainer}>
            {openPreview.item.type === "image" ? (
              <img
                src={openPreview.item.url || ""}
                alt={openPreview.item.originalName || ""}
                style={{ maxWidth: "100%", maxHeight: "80vh" }}
              />
            ) : (
              <iframe
                src={openPreview.item.url || ""}
                title={openPreview.item.originalName || ""}
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
