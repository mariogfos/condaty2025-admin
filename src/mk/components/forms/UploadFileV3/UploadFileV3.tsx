import React, { useState, useEffect, useRef } from "react";
import styles from "./uploadFileV3.module.css";
import { IUploadFileProps } from "./types";
import {
  CloudinaryAdapter,
  LocalApiAdapter,
  IUploadAdapter,
} from "../../../utils/uploadAdapters";
import { useAuth } from "@/mk/contexts/AuthProvider";
import {
  IconDocs,
  IconImage,
  IconTrash,
  IconAttachFile,
  IconEdit,
  IconPlus,
} from "@/components/layout/icons/IconsBiblioteca";
import ControlLabel from "../ControlLabel";
import DataModal from "@/mk/components/ui/DataModal/DataModal";

const getAdapter = (): IUploadAdapter => {
  const strategy = process.env.NEXT_PUBLIC_UPLOAD_STRATEGY || "cloudinary";
  if (strategy === "cloudinary") {
    return new CloudinaryAdapter();
  }
  return new LocalApiAdapter();
};

export const UploadFileV3: React.FC<IUploadFileProps> = ({
  name,
  value,
  onChange,
  accept = ["jpg", "png", "jpeg", "webp", "pdf", "doc", "docx", "xls", "xlsx"],
  maxFiles = 1,
  maxSize = 5, // MB
  prefix = "DOC",
  global = false,
  disabled = false,
  required = false,
  className = "",
  style,
  label,
  error,
  placeholder,
  showPreview = true,
}) => {
  const [files, setFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const { showToast } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRefForEdit = useRef<HTMLInputElement>(null);
  const adapter = useRef<IUploadAdapter>(getAdapter());

  useEffect(() => {
    if (value) {
      if (Array.isArray(value)) {
        setFiles(value);
      } else {
        setFiles([value]);
      }
    } else {
      setFiles([]);
    }
  }, [value]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    await processFiles(droppedFiles);
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    indexToReplace?: number
  ) => {
    if (e.target.files && !disabled) {
      const selectedFiles = Array.from(e.target.files);
      if (indexToReplace !== undefined) {
        await replaceFile(selectedFiles[0], indexToReplace);
      } else {
        await processFiles(selectedFiles);
      }
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (fileInputRefForEdit.current) {
      fileInputRefForEdit.current.value = "";
    }
  };

  const processFiles = async (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      showToast(`Máximo ${maxFiles} archivos permitidos`, "error");
      return;
    }

    setIsLoading(true);
    const uploadedUrls: string[] = [];

    for (const file of newFiles) {
      // Validate extension
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!accept.includes(ext)) {
        showToast(
          `Archivo ${file.name} no permitido. Extensiones: ${accept.join(
            ", "
          )}`,
          "error"
        );
        continue;
      }

      // Validate size
      if (file.size > maxSize * 1024 * 1024) {
        showToast(
          `Archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`,
          "error"
        );
        continue;
      }

      try {
        const url = await adapter.current.upload(file, { prefix, global });
        uploadedUrls.push(url);
      } catch (err: any) {
        console.error("Upload error:", err);
        showToast(`Error subiendo ${file.name}: ${err.message}`, "error");
      }
    }

    if (uploadedUrls.length > 0) {
      const newFileList = [...files, ...uploadedUrls];
      setFiles(newFileList);
      updateParent(newFileList);
    }
    setIsLoading(false);
  };

  const replaceFile = async (newFile: File, indexToReplace: number) => {
    if (disabled) return;

    // Validate new file
    const ext = newFile.name.split(".").pop()?.toLowerCase() || "";
    if (!accept.includes(ext)) {
      showToast(
        `Archivo ${newFile.name} no permitido. Extensiones: ${accept.join(
          ", "
        )}`,
        "error"
      );
      return;
    }
    if (newFile.size > maxSize * 1024 * 1024) {
      showToast(
        `Archivo ${newFile.name} excede el tamaño máximo de ${maxSize}MB`,
        "error"
      );
      return;
    }

    setIsLoading(true);
    const oldFileUrl = files[indexToReplace];
    let newFileUrl = "";

    try {
      // 1. Upload the new file
      newFileUrl = await adapter.current.upload(newFile, { prefix, global });

      // 2. If successful, call adapter.delete(oldUrl) for the old file
      if (oldFileUrl) {
        const deleteSuccess = await adapter.current.delete(oldFileUrl);
        if (!deleteSuccess) {
          showToast(
            "Error al eliminar el archivo antiguo del servidor",
            "error"
          );
          // Decide whether to proceed or revert if old file deletion fails
          // For now, we'll log and proceed with the new file.
          console.warn("Failed to delete old file, but new file uploaded.");
        } else {
          showToast("Archivo antiguo eliminado correctamente", "success");
        }
      }

      // 3. Update the state to replace the old URL with the new URL at the correct index
      const newFileList = [...files];
      newFileList[indexToReplace] = newFileUrl;
      setFiles(newFileList);

      // 4. Trigger onChange
      updateParent(newFileList);
      showToast("Archivo reemplazado correctamente", "success");
    } catch (err: any) {
      console.error("Replace file error:", err);
      showToast(`Error reemplazando ${newFile.name}: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = async (index: number) => {
    if (disabled) return;
    const fileToRemove = files[index];

    if (fileToRemove) {
      // If the file has a URL, it means it was already uploaded, so attempt to delete it from the server
      try {
        setIsLoading(true);
        const success = await adapter.current.delete(fileToRemove);
        if (!success) {
          showToast("Error al eliminar el archivo del servidor", "error");
          setIsLoading(false);
          return;
        }
        showToast("Archivo eliminado correctamente", "success");
      } catch (err: any) {
        console.error("Error deleting file:", err);
        showToast(`Error eliminando ${fileToRemove}: ${err.message}`, "error");
        setIsLoading(false);
        return;
      } finally {
        setIsLoading(false);
      }
    }

    const newFileList = [...files];
    newFileList.splice(index, 1);
    setFiles(newFileList);
    updateParent(newFileList);
  };

  const updateParent = (newFiles: string[]) => {
    // If maxFiles is 1, we might want to return just the string, but the interface says string | string[]
    // Usually it's better to be consistent. If the prop 'value' came in as string, return string.
    // But here we don't know the original intent if it was empty.
    // Let's assume if maxFiles === 1, we return a string (or empty string).
    // If maxFiles > 1, we return array.

    let valueToEmit: string | string[] = newFiles;
    if (maxFiles === 1) {
      valueToEmit = newFiles.length > 0 ? newFiles[0] : "";
    }

    onChange({
      target: {
        name,
        value: valueToEmit,
      },
    });
  };

  const isImage = (url: string) => {
    const ext = url.split(".").pop()?.toLowerCase();
    // Check if url contains query params, remove them for ext check
    const cleanUrl = url.split("?")[0];
    const cleanExt = cleanUrl.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg"].includes(
      cleanExt || ""
    );
  };

  const getFileName = (url: string) => {
    return url.split("/").pop()?.split("?")[0] || "Archivo";
  };

  const handleImageClick = (url: string) => {
    setZoomImage(url);
  };

  const handleCloseZoom = () => {
    setZoomImage(null);
  };

  return (
    <ControlLabel
      label={label}
      error={error ? { [name]: error } : {}}
      name={name}
      value={value}
      required={required}
      className={className}
      styleContainer={style}
    >
      <div
        className={`${styles.container} ${
          files.length < maxFiles ? styles.droppable : ""
        }`}
        onDragOver={files.length < maxFiles ? handleDragOver : undefined}
        onDragLeave={files.length < maxFiles ? handleDragLeave : undefined}
        onDrop={files.length < maxFiles ? handleDrop : undefined}
        onClick={
          files.length < maxFiles
            ? () => !disabled && fileInputRef.current?.click()
            : undefined
        }
        aria-label="Zona de subida de archivos"
      >
        {files.length < maxFiles && (
          <div
            className={`${styles.dropzone} ${isDragging ? styles.active : ""} ${
              error ? styles.error : ""
            } ${disabled ? styles.disabled : ""}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
              multiple={maxFiles > 1}
              accept={accept.map((e) => "." + e).join(",")}
              disabled={disabled}
            />
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              <>
                <IconPlus size={40} color="var(--cTextSecondary)" />
                <p className={styles.placeholderText}>
                  {placeholder ||
                    "Arrastra archivos aquí o haz clic para subir"}
                </p>
                <small className={styles.placeholderSmallText}>
                  Extensiones: {accept.join(", ")} | Tamaño máximo: {maxSize}MB
                  | Máximo archivos: {maxFiles}
                </small>
              </>
            )}
          </div>
        )}

        {showPreview && files.length > 0 && (
          <div className={styles.previewList}>
            {files.length < maxFiles && (
              <div
                className={styles.previewItem}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: "pointer" }}
                aria-label="Agregar archivo"
              >
                <IconPlus size={32} color="var(--cTextSecondary)" />
              </div>
            )}
            {files.map((url, index) => (
              <div key={index} className={styles.previewItem}>
                {isImage(url) ? (
                  <img
                    src={url}
                    alt={`Preview ${index}`}
                    className={styles.previewImage}
                    onClick={() => handleImageClick(url)} // Add onClick for zoom
                  />
                ) : (
                  <div className={styles.previewIcon}>
                    <IconDocs size={32} color="var(--cTextSecondary)" />
                    <span style={{ fontSize: "10px", marginTop: "4px" }}>
                      {getFileName(url).substring(0, 10)}...
                    </span>
                  </div>
                )}
                {!disabled && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRefForEdit}
                      style={{ display: "none" }}
                      onChange={(e) => handleFileChange(e, index)}
                      accept={accept.map((e) => "." + e).join(",")}
                      disabled={disabled}
                    />
                    <button
                      type="button"
                      className={styles.editButton} // New edit button style
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRefForEdit.current?.click();
                      }}
                    >
                      <IconEdit size={12} />
                    </button>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <IconTrash size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>

      {zoomImage && (
        <DataModal open={!!zoomImage} onClose={handleCloseZoom} fullScreen>
          <img
            src={zoomImage}
            alt="Zoomed Image"
            className={styles.zoomedImage}
          />
        </DataModal>
      )}
    </ControlLabel>
  );
};
