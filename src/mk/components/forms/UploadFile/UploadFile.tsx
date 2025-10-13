import { useEffect, useState } from "react";
import {
  IconArrowLeft,
  IconDocs,
  IconEdit,
  IconImage,
  IconPDF,
  IconTrash,
} from "../../../../components/layout/icons/IconsBiblioteca";
import styles from "./uploadFile.module.css";
import ControlLabel, { PropsTypeInputBase } from "../ControlLabel";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { resizeImage } from "@/mk/utils/images";
import ImageEditor from "./ImageEditor";
import { getUrlImages } from "@/mk/utils/string";
import { number } from "motion";

interface PropsType extends PropsTypeInputBase {
  ext: string[];
  setError: Function;
  img?: boolean;
  item?: any;
  editor?: boolean | { width: number; height: number };
  sizePreview?: { width: string; height: string };
}
export const UploadFile = ({
  className = "",
  onChange = (e: any) => {},
  value = "",
  item = {},
  img = false,
  editor = false,
  sizePreview = { width: "100px", height: "100px" },
  ...props
}: PropsType) => {
  const [selectedFiles, setSelectedFiles]: any = useState({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [editedImage, setEditedImage]: any = useState(null);
  const [loadedImage, setLoadedImage] = useState(false);
  const { showToast } = useAuth();

  // Función para verificar si hay un documento existente
  const hasExistingDocument = () => {
    // Verificar si es un documento existente
    if (item?.type === 'D' && item?.url) {
      return true;
    }
    // Verificar si value tiene información de documento
    if (value && typeof value === 'object') {
      if (value.existing && (value.ext === 'pdf' || value.ext === 'doc' || value.ext === 'docx' || value.ext === 'xls' || value.ext === 'xlsx')) {
        return true;
      }
      if (value.ext && ['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(value.ext) && value.file !== "delete") {
        return true;
      }
    }
    return false;
  };

  // Función para obtener el nombre del documento existente
  const getExistingDocumentName = () => {
    if (item?.title) {
      return item.title;
    }
    if (item?.description) {
      return item.description.substring(0, 30) + '...';
    }
    return 'Documento existente';
  };

  // Función para obtener la URL del documento existente
  const getExistingDocumentUrl = () => {
    if (item?.id && item?.type === 'D') {
      return getUrlImages(`/CONT-${item.id}.pdf?d=${item.updated_at}`);
    }
    return null;
  };

  const handleImageProcessed = (imageBase64: string) => {
    const partes = selectedFiles.name.split(".");
    let base64String = imageBase64.replace("data:", "").replace(/^.+,/, "");
    base64String = encodeURIComponent(base64String);
    setLoadedImage(false);
    setEditedImage(imageBase64);

    onChange({
      target: {
        name: props.name,
        value: { ext: "webp", file: base64String },
      },
    });
  };

  const resetFileInput = () => {
    const input = document.getElementById(props.name) as HTMLInputElement | null;
    if (input) input.value = "";
  };

  const onChangeFile = async (e: any) => {
    // limpiar error previo
    props.setError({ ...props.error, [props.name]: "" });

    try {
      let file: File | null = null;
      if (e?.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        file = e.dataTransfer.files[0];
      } else if (e?.target && e.target.files && e.target.files[0]) {
        file = e.target.files[0];
      }

      if (!file) {
        // nada seleccionado
        return;
      }

      // Guardar (opcional): no confiar en este estado para validación inmediata
      setSelectedFiles(file);

      // extensíon
      const fileExt = file.name
        .toLowerCase()
        .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2);

      // validar extensión
      if (!props.ext.includes(fileExt)) {
        props.setError({ ...props.error, [props.name]: "Extensión no permitida" });
        setSelectedFiles({});
        resetFileInput();
        showToast("Solo se permiten archivos " + props.ext.join(", "), "error");
        return;
      }

      // validar tamaño (usa bytes)
      const maxSizeMB = Number(props.maxSize ?? 5); // por si viene como string
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (typeof file.size === "number") {
        if (file.size > maxSizeBytes) {
          props.setError({ ...props.error, [props.name]: `El archivo supera ${maxSizeMB} MB` });
          setSelectedFiles({});
          resetFileInput();
          showToast(`El archivo supera el límite de ${maxSizeMB} MB`, "error");
          return;
        }
      }

      // Si es imagen: procesar/resize (pero la validación ya se hizo sobre file.size)
      if (["jpg", "png", "webp", "jpeg", "gif"].includes(fileExt)) {

        const image: any = await resizeImage(file, 720, 1024, 0.7);
        let base64String = image.replace("data:", "").replace(/^.+,/, "");
        base64String = encodeURIComponent(base64String);
        if (editor) setLoadedImage(image);
        onChange({
          target: {
            name: props.name,
            value: { ext: "webp", file: base64String },
          },
        });
        return;
      }

      // Para otros archivos (pdf, doc, xls...) usamos FileReader y validamos también el tamaño del base64 por si file.size no existía.
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        const result = ev.target.result as string; // data:...;base64,AAAA...
        // extraer base64 pura
        const base64Only = result.replace(/^data:[^;]+;base64,/, "");
        // estimación bytes desde base64
        const padding = (base64Only.endsWith("==") ? 2 : base64Only.endsWith("=") ? 1 : 0);
        const estBytes = Math.ceil((base64Only.length * 3) / 4) - padding;

        // si file.size no estaba definido, usamos la estimación
        if (typeof file.size !== "number" && props.maxSize && estBytes > maxSizeBytes) {
          props.setError({ ...props.error, [props.name]: `El archivo supera ${maxSizeMB} MB` });
          setSelectedFiles({});
          resetFileInput();
          showToast(`El archivo supera el límite de ${maxSizeMB} MB`, "error");
          return;
        }

        // si file.size existía ya lo validamos antes, aquí procedemos normalmente
        const partes = file.name.split(".");
        let base64String = base64Only;
        base64String = encodeURIComponent(base64String);
        onChange({
          target: {
            name: props.name,
            value: { ext: partes[partes.length - 1], file: base64String },
          },
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setSelectedFiles({});
      resetFileInput();
      onChange({
        target: {
          name: props.name,
          value: { ext: "", file: "" },
        },
      });
    }
  };

  const accept = () => {
    return props.ext.map((e: string) => "." + e).join(",");
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    onChangeFile(e);
  };

  // Función corregida para eliminar archivos
  const deleteFile = () => {
    // Limpiar estados locales
    setSelectedFiles({});
    setEditedImage(null);

    // Enviar objeto con formato correcto para eliminación
    onChange({
      target: {
        name: props.name,
        value: { ext: value?.ext || 'pdf', file: "delete" }, // Formato correcto
      },
    });
  };

  const editFile = () => {
    const fileUpload = document.getElementById(props.name);
    if (fileUpload) {
      fileUpload.click();
    }
  };

  // Verificar si hay contenido para mostrar (corregido)
  const hasContent = () => {
    // Si value.file es "delete", no mostrar contenido
    if (value && typeof value === 'object' && value.file === "delete") {
      return false;
    }

    return (
      selectedFiles?.name ||
      (value && value !== "") ||
      editedImage ||
      hasExistingDocument()
    );
  };

  // useEffect para manejar cuando value.file cambia a "delete"
  useEffect(() => {
    if (value && typeof value === 'object' && value.file === "delete") {
      setSelectedFiles({});
      setEditedImage(null);
    }
  }, [value]);

  return (
    <ControlLabel
      {...props}
      value={value}
      className={styles.uploadFile + " " + className}
    >
      <section
        style={{
          borderColor: props.error[props.name]
            ? "var(--cError)"
            : value?.file || isDraggingFile
            ? "var(--cPrimary)"
            : "var(--cWhiteV3)",
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnter={() => setIsDraggingFile(true)}
        onDragLeave={() => setIsDraggingFile(false)}
      >
        <input
          type="file"
          name={props.name}
          id={props.name}
          onChange={onChangeFile}
          value=""
          required={props.required}
          disabled={props.disabled}
          accept={accept()}
        />

        {!hasContent() ? (
          <div
            onClick={() => {
              const fileUpload = document.getElementById(props.name);
              if (fileUpload) {
                fileUpload.click();
              }
            }}
          >
            {img ? (
              <IconImage size={40} color={"var(--cWhite)"} />
            ) : (
              <IconDocs size={40} color={"var(--cWhite)"} />
            )}
            <span>
              {props.placeholder || "Cargar un archivo o arrastrar y soltar "}
            </span>
            <span>{props.ext.join(", ")}</span>
          </div>
        ) : (
          <div style={{ position: "relative", minWidth: "250px" }}>
            {/* Mostrar imagen editada o seleccionada */}
            {(editedImage ||
              selectedFiles?.type?.startsWith("image/") ||
              (value &&
                typeof value === 'object' &&
                (value.ext == "webp" ||
                  (value.indexOf && value.indexOf(".webp") > -1))) ||
              (value &&
                typeof value === 'string' &&
                (value.includes('.webp') || value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png')))) &&
            img ? (
              <img
                src={
                  editedImage ||
                  (selectedFiles?.name
                    ? URL.createObjectURL(selectedFiles)
                    : (typeof value === 'object' && value.url) || value || "")
                }
                alt={selectedFiles?.name}
                style={{
                  objectFit: "cover",
                  width: sizePreview?.width || "100px",
                  height: sizePreview?.height || "100px",
                }}
              />
            ) : selectedFiles.type === "application/pdf" ? (
              <>
                <IconDocs size={80} color={"var(--cWhite)"} />
                <span>{selectedFiles.name}</span>
              </>
            ) : hasExistingDocument() && !(value && typeof value === 'object' && value.file === "delete") ? (
              /* Mostrar documento existente solo si no está marcado para eliminar */
              <>
                <IconDocs size={80} color={"var(--cWhite)"} />
                <span>{getExistingDocumentName()}</span>
                {getExistingDocumentUrl() && (
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href={getExistingDocumentUrl() || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: 'var(--cAccent)',
                        textDecoration: 'none',
                        fontSize: '12px'
                      }}
                    >
                      Ver documento
                    </a>
                  </div>
                )}
              </>
            ) : value && typeof value === 'object' && ["pdf", "doc", "docx", "xls", "xlsx",].includes(value.ext) ? (
              /* Mostrar documento cargado */
              <>
                <IconDocs size={80} color={"var(--cWhite)"} />
                <span>{selectedFiles.name || "Documento cargado"}</span>
              </>
            ) : (
              <>
                <IconImage size={80} color={"var(--cWhite)"} />
                <span>{selectedFiles.name || "Archivo seleccionado"}</span>
              </>
            )}

            {/* Botones de acción */}
            <div
              style={{
                position: "absolute",
                top: "5px",
                right: "5px",
                display: "flex",
                gap: "5px",
              }}
            >
              <div
                onClick={editFile}
                style={{
                  backgroundColor: "var(--cPrimary)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <IconEdit size={16} color="white" />
              </div>
              <div
                onClick={deleteFile}
                style={{
                  backgroundColor: "var(--cError)",
                  borderRadius: "50%",
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <IconTrash size={16} color="white" />
              </div>
            </div>
          </div>
        )}

        {/* Editor de imagen si está habilitado */}
        {loadedImage && editor && (
          <ImageEditor
            imageSrc={loadedImage}
            onImageProcessed={handleImageProcessed}
            onCancel={() => setLoadedImage(false)}
            editor={editor}
          />
        )}
      </section>
    </ControlLabel>
  );
};
