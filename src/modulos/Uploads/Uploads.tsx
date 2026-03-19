"use client";
import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import {
  IconArrowUp,
  IconCash,
  IconDocs,
  IconDownload,
  IconHomeOwner,
} from "@/components/layout/icons/IconsBiblioteca";
import useAxios from "@/mk/hooks/useAxios";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./Uploads.module.css";

type UploadType = "propietarios" | "expensas" | "deudas";

const options = [
  {
    id: "propietarios" as UploadType,
    title: "Propietarios / Unidades",
    subtitle: "Gestionar información de propietarios.",
    icon: IconHomeOwner,
  },
  {
    id: "expensas" as UploadType,
    title: "Expensas",
    subtitle: "Gestionar información de expensas.",
    icon: IconCash,
  },
  {
    id: "deudas" as UploadType,
    title: "Deudas",
    subtitle: "Gestionar información de deudas.",
    icon: IconDocs,
  },
];

export default function Uploads() {
  const [selectedType, setSelectedType] = useState<UploadType>("propietarios");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { execute } = useAxios();
  const { showToast } = useAuth();

  const selectedTitle = useMemo(() => {
    return (
      options.find((item) => item.id === selectedType)?.title || "Propietarios"
    );
  }, [selectedType]);

  const isAllowedFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    return extension === "xls" || extension === "xlsx";
  };

  const apiTypeBySelection: Record<
    UploadType,
    "owners" | "expensas" | "deudas"
  > = {
    propietarios: "owners",
    expensas: "expensas",
    deudas: "deudas",
  };

  const templateUrlBySelection: Record<UploadType, string> = {
    propietarios:
      "https://docs.google.com/spreadsheets/d/1VXEh5m2MFjkWlQN71Jnww9hS4Hu-8UDF9NIuXoIW5SM/edit?gid=822536245#gid=822536245",
    expensas:
      "https://docs.google.com/spreadsheets/d/1na5SIOQ4bsACujQ3WHuhNDO_hola2Dca_Psya87Yv8c/edit?gid=53833243#gid=53833243",
    deudas:
      "https://docs.google.com/spreadsheets/d/1WiXlx-fTCtoEr3KTt90Ue0eALuGjOOtPthu57tW78YQ/edit?gid=765600991#gid=765600991",
  };

  const setNewFile = (file?: File) => {
    if (!file) return;
    if (!isAllowedFile(file)) {
      setSelectedFile(null);
      setFileError("Solo se permiten archivos .xls o .xlsx");
      setUploadMessage("");
      return;
    }
    setSelectedFile(file);
    setFileError("");
    setUploadMessage("");
  };

  const onInputFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setNewFile(event.dataTransfer.files?.[0]);
  };

  const onDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileError("");
    setUploadMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileSize = (size: number) => {
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const onUpload = async () => {
    if (!selectedFile || isUploading) return;
    if (!isAllowedFile(selectedFile)) {
      setFileError("Solo se permiten archivos .xls o .xlsx");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile, selectedFile.name);
    formData.append("type", apiTypeBySelection[selectedType]);
    formData.append("_debug", "2");

    setIsUploading(true);
    setUploadMessage("");

    const { data, error } = await execute("/masivexls", "POST", formData);

    if (data?.success) {
      const okMessage = data?.message || "Archivo procesado correctamente";
      setUploadMessage(okMessage);
      showToast(okMessage, "success");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
    } else {
      const errMessage =
        error?.data?.message ||
        data?.message ||
        "No se pudo procesar el archivo";
      setUploadMessage(errMessage);
      showToast(errMessage, "error");
    }

    setIsUploading(false);
  };

  const onDownloadTemplate = () => {
    const templateUrl = templateUrlBySelection[selectedType];
    if (!templateUrl) {
      showToast("No se encontró la plantilla seleccionada", "error");
      return;
    }
    window.open(templateUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section className={styles.container}>
      <h1 className={styles.title}>Carga Masiva de Datos</h1>

      <div className={styles.cardsGrid}>
        {options.map((option) => {
          const Icon = option.icon;
          const active = option.id === selectedType;

          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.card} ${active ? styles.cardActive : ""}`}
              onClick={() => setSelectedType(option.id)}
            >
              <Icon
                size={46}
                color={active ? "var(--cPrimary)" : "var(--cWhite)"}
              />
              <p className={styles.cardTitle}>{option.title}</p>
              <p className={styles.cardSubtitle}>{option.subtitle}</p>
            </button>
          );
        })}
      </div>

      <label
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        htmlFor="uploads-file-input"
      >
        <input
          id="uploads-file-input"
          ref={fileInputRef}
          type="file"
          className={styles.hiddenInput}
          accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={onInputFileChange}
        />
        <div className={styles.dropIconWrap}>
          <IconArrowUp size={30} color="#111111" />
        </div>
        <p className={styles.dropTitle}>
          Arrastra y suelta archivos aquí o haz clic para seleccionar
        </p>
        <p className={styles.dropSubtitle}>Archivos permitidos: .xls, .xlsx</p>
        {!!selectedFile && !fileError && (
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{selectedFile.name}</p>
            <p className={styles.fileMeta}>{getFileSize(selectedFile.size)}</p>
            <button
              type="button"
              className={styles.removeFileButton}
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                clearSelectedFile();
              }}
            >
              Quitar archivo
            </button>
          </div>
        )}
        {!!fileError && <p className={styles.errorText}>{fileError}</p>}
      </label>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onDownloadTemplate}
        >
          <IconDownload size={18} color="var(--cWhite)" />
          Descargar plantilla ({selectedTitle})
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={!selectedFile || !!fileError || isUploading}
          onClick={onUpload}
        >
          {isUploading ? "Subiendo..." : "Subir archivo"}
        </button>
      </div>
      {!!uploadMessage && (
        <p className={styles.uploadMessage}>{uploadMessage}</p>
      )}
    </section>
  );
}
