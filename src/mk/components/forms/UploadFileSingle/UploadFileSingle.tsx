"use client";
import React, { useRef, useCallback } from "react";
import styles from "./UploadFileSingle.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useFileUpload } from "@/mk/hooks/useFileUpload";
import {
  IconEdit,
  IconGallery,
  IconTrash,
} from "@/components/layout/icons/IconsBiblioteca";

interface UploadFileSingleProps {
  name: string;
  formState: any;
  setFormState: (updater: (prev: any) => any) => void;
  onUploadStateChange?: (v: boolean) => void;
  error?: Record<string, string>;
  height?: number;
  label?: string;
  title?: string;
}

const UploadFileSingle: React.FC<UploadFileSingleProps> = ({
  name,
  formState,
  setFormState,
  onUploadStateChange,
  error,
  height = 220,
  label,
  title = "Cargar imagen",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useAuth();

  const resetInput = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const { filePreviews, uploading, handleFiles, handleDelete } = useFileUpload({
    name,
    formState,
    setFormState,
    cant: 1,
    onUploadStateChange,
    maxMB: 2,
    mode: "images",
    showToast,
    resetInput,
  });

  const preview = filePreviews[0] || null;

  const triggerUpload = () => {
    if (!uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };
  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className={styles.hiddenInput}
      />
      {label && <label style={{ color: "var(--cWhiteV1)" }}>{label}</label>}
      <div
        onClick={triggerUpload}
        className={`${styles.uploadArea} ${uploading ? styles.disabled : ""}`}
        style={{ height: `${height}px` }}
      >
        {preview?.url ? (
          <img
            src={preview.url}
            alt="Foto de perfil"
            className={styles.previewImage}
          />
        ) : (
          <div className={styles.placeholder}>
            <IconGallery size={50} color="var(--cWhite)" />
            <p>{title}</p>
          </div>
        )}

        {preview?.url && (
          <div className={styles.actions}>
            <div
              className={styles.editButton}
              onClick={(e) => {
                e.stopPropagation();
                triggerUpload();
              }}
            >
              <IconEdit size={18} color="var(--cWhite)" />
            </div>

            <div
              className={styles.deleteButton}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(0);
              }}
            >
              <IconTrash size={18} color="var(--cWhite)" />
            </div>
          </div>
        )}

        {uploading && (
          <div className={styles.overlay}>
            <p>Subiendo...</p>
          </div>
        )}
      </div>

      <p className={styles.error}>{error?.[name]}</p>
    </div>
  );
};

export default UploadFileSingle;
