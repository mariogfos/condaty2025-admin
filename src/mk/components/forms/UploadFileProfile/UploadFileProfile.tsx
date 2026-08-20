"use client";

import React, { useRef, useCallback } from "react";
import styles from "./UploadFileProfile.module.css";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { useFileUpload } from "@/mk/hooks/useFileUpload";
import Button from "../Button/Button";

interface UploadFileProfileProps {
  name: string;
  formState: any;
  setFormState: (updater: (prev: any) => any) => void;
  onUploadStateChange?: (v: boolean) => void;
  error?: Record<string, string>;
  user?: any;
}

const UploadFileProfile: React.FC<UploadFileProfileProps> = ({
  name,
  formState,
  setFormState,
  onUploadStateChange,
  error,
  user,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useAuth();
  const initials = user?.name?.charAt(0) + user?.last_name?.charAt(0);

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
  const hasPreview = !!preview;
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
        style={{ display: "none" }}
      />

      <div className={styles.topRow}>
        <div
          className={styles.circle}
          onClick={triggerUpload}
          style={{ cursor: uploading ? "default" : "pointer" }}
        >
          {preview?.url ? (
            <img
              src={preview?.url}
              alt="Foto de perfil"
              className={styles.profileImg}
            />
          ) : (
            <span className={styles.initials}>{initials}</span>
          )}

          {uploading && (
            <div className={styles.overlay}>
              <p>Subiendo...</p>
            </div>
          )}
        </div>
        <div className={styles.containerButtonsText}>
          <div className={styles.buttonGroup}>
            <Button className={styles.uploadBtn} onClick={triggerUpload}>
              {uploading ? "Subiendo foto..." : "Subir foto"}
            </Button>

            <Button
              className={styles.deleteBtn}
              variant="secondary"
              onClick={() => handleDelete(0)}
              disabled={uploading || !hasPreview}
            >
              Eliminar
            </Button>
          </div>
          <p className={styles.note}>
            El tamaño de la imagen no debe ser mayor a 2MB.
          </p>
        </div>
      </div>

      {error?.[name] && <p className={styles.error}>{error[name]}</p>}
    </div>
  );
};

export default UploadFileProfile;
