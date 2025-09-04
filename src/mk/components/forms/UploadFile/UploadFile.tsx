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
    if (item?.type === 'D' && (item?.url === 'pdf' || item?.url?.endsWith('.pdf'))) {
      return true;
    }
    if (value && typeof value === 'object' && value.ext && ['pdf', 'doc', 'docx'].includes(value.ext)) {
      return true;
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

  const onChangeFile = async (e: any) => {
    props.setError({ ...props.error, [props.name]: "" });
    try {
      let file: any = null;
      if (e.dataTransfer) file = e.dataTransfer.files[0];
      else file = e.target.files[0];
      setSelectedFiles(file);

      if (
        !props.ext.includes(
          file.name
            .toLowerCase()
            .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2)
        )
      ) {
        props.setError({ ...props.error, [props.name]: "" });
        setSelectedFiles({});
        showToast("Solo se permiten archivos " + props.ext.join(", "), "error");
        return;
      }
      if (
        ["jpg", "png", "webp", "jpeg", "gif"].includes(
          file.name
            .toLowerCase()
            .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2)
        )
      ) {
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
      } else {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const partes = file.name.split(".");
          let base64String = e.target.result
            .replace("data:", "")
            .replace(/^.+,/, "");
          base64String = encodeURIComponent(base64String);
          onChange({
            target: {
              name: props.name,
              value: { ext: partes[partes.length - 1], file: base64String },
            },
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setSelectedFiles({});
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

    // Enviar valor "delete" para indicar eliminación
    onChange({
      target: {
        name: props.name,
        value: "delete",
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
    // Si value es "delete", no mostrar contenido
    if (value === "delete") {
      return false;
    }

    return (
      selectedFiles?.name ||
      (value && value !== "") ||
      editedImage ||
      hasExistingDocument()
    );
  };

  // useEffect para manejar cuando value cambia a "delete"
  useEffect(() => {
    if (value === "delete") {
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
          <div style={{ position: "relative" }}>
            {/* Mostrar imagen editada o seleccionada */}
            {(editedImage ||
              selectedFiles?.type?.startsWith("image/") ||
              (value &&
                typeof value === 'object' &&
                (value.ext == "webp" ||
                  (value.indexOf && value.indexOf(".webp") > -1)))) &&
            img ? (
              <img
                src={
                  editedImage ||
                  (selectedFiles?.name
                    ? URL.createObjectURL(selectedFiles)
                    : value || "")
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
                <IconPDF size={80} color={"var(--cWhite)"} />
                <span>{selectedFiles.name}</span>
              </>
            ) : hasExistingDocument() && value !== "delete" ? (
              /* Mostrar documento existente solo si no está marcado para eliminar */
              <>
                <IconPDF size={80} color={"var(--cWhite)"} />
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
            ) : (
              <>
                <IconDocs size={80} color={"var(--cWhite)"} />
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
