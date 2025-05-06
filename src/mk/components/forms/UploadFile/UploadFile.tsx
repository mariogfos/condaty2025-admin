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

interface PropsType extends PropsTypeInputBase {
  ext: string[];
  setError: Function;
  img?: boolean;
  item?: any;
  editor?: boolean | { width: number; height: number };
  sizePreview?: { width: string | number; height: string | number };
  onError?: Function;
}
export const UploadFile = ({
  className = "",
  onChange = (e: any) => {},
  value = "",
  item = {},
  img = false,
  editor = false,
  sizePreview = { width: "100px", height: "100px" },
  onError,
  ...props
}: PropsType) => {
  const [selectedFiles, setSelectedFiles]: any = useState({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isFileError, setIsFileError] = useState(false);
  const { showToast } = useAuth();

  const _onError = (err: any) => {
    console.log("reader error", err);
  };

  const [editedImage, setEditedImage]: any = useState(null);
  const [loadedImage, setLoadedImage]: any = useState(false);

  const handleImageProcessed = (imageBase64: string) => {
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

  // Verificar si el archivo es una imagen por extensión
  const isImageFile = (fileName: string) => {
    if (!fileName) return false;
    const ext = fileName
      .toLowerCase()
      .slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
    return ["jpg", "png", "webp", "jpeg", "gif"].includes(ext);
  };

  const onChangeFile = async (e: any) => {
    setIsFileError(false);
    props.setError({ ...props.error, [props.name]: "" });
    try {
      let file: any = null;
      if (e.dataTransfer) file = e.dataTransfer.files[0];
      else file = e.target.files[0];

      if (!file) return;

      setSelectedFiles(file);

      const fileExt = file.name
        .toLowerCase()
        .slice(((file.name.lastIndexOf(".") - 1) >>> 0) + 2);

      if (!props.ext.includes(fileExt)) {
        props.setError({ ...props.error, [props.name]: "" });
        setSelectedFiles({});
        showToast("Solo se permiten archivos " + props.ext.join(", "), "error");
        return;
      }

      const isImage = ["jpg", "png", "webp", "jpeg", "gif"].includes(fileExt);

      if (isImage) {
        try {
          const image: any = await resizeImage(file, 720, 1024, 0.7);
          let base64String = image.replace("data:", "").replace(/^.+,/, "");
          base64String = encodeURIComponent(base64String);

          if (editor) setLoadedImage(image);

          // Mantener la extensión original para webp (evita conversiones extra)
          const outputExt = fileExt === "webp" ? "webp" : "webp";

          onChange({
            target: {
              name: props.name,
              value: { ext: outputExt, file: base64String },
            },
          });
        } catch (error) {
          console.error("Error resizing image:", error);
          setIsFileError(true);
          showToast("Error al procesar la imagen", "error");
        }
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
        reader.onerror = _onError;
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Error en onChangeFile:", error);
      setSelectedFiles({});
      setIsFileError(true);
      onChange({
        target: {
          name: props.name,
          value: { ext: "", file: "" },
        },
      });
    }
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    onChangeFile(e);
  };

  const accept = () => {
    let accept: any = [];
    props.ext.map((ext) => {
      accept.push(`.${ext}`);
    });
    return accept.join(",");
  };

  const deleteImg = (del = true) => {
    props.setError({ ...props.error, [props.name]: "" });
    setIsFileError(false);

    if (value && value.file != "") {
      onChange({
        target: {
          name: props.name,
          value: null,
        },
      });
    } else {
      onChange({
        target: {
          name: props.name,
          value: { ext: "", file: del == false ? "" : "delete" },
        },
      });
    }
    setSelectedFiles({});
  };

  // Determinar qué mostrar según el tipo de archivo
  const renderFilePreview = () => {
    // Si estamos cargando una imagen pero hay un error
    if (isFileError) {
      return img ? (
        <IconImage size={40} color={"var(--cWhite)"} />
      ) : (
        <IconDocs size={40} color={"var(--cWhite)"} />
      );
    }

    // Función para construir URL de imagen desde base64 si es necesario
    const getImageUrl = () => {
      if (editedImage) {
        return editedImage;
      }

      if (selectedFiles?.name) {
        return URL.createObjectURL(selectedFiles);
      }

      // Si value es un objeto con formato {ext, file} y contiene datos base64
      if (typeof value === "object" && value?.file && value?.ext) {
        // Decodificar el base64 que está codificado con encodeURIComponent
        try {
          const decoded = decodeURIComponent(value.file);
          return `data:image/${value.ext};base64,${decoded}`;
        } catch (e) {
          console.error("Error decodificando image:", e);
          return "";
        }
      }

      // Si value es una string (url directa)
      if (typeof value === "string") {
        return value;
      }

      return "";
    };

    // Si es una imagen basada en las condiciones
    const isImageToShow =
      (editedImage ||
        selectedFiles?.type?.startsWith("image/") ||
        (selectedFiles?.name && isImageFile(selectedFiles.name)) ||
        (typeof value === "object" && value?.ext) ||
        (typeof value === "string" && value)) &&
      img;

    if (isImageToShow) {
      const imageUrl = getImageUrl();
      return (
        <>
          <img
            src={imageUrl}
            onError={(e) => {
              console.log("error imagen", e);
              setIsFileError(true);
              onError && onError();
            }}
            alt={selectedFiles?.name || "Preview"}
            style={{
              objectFit: "cover",
              width: getSizeWithUnit(sizePreview?.width),
              height: getSizeWithUnit(sizePreview?.height),
            }}
          />
          <p>
            Archivo: <span>{selectedFiles?.name || "Imagen"}</span>
          </p>
        </>
      );
    }

    // Si es un PDF
    if (selectedFiles.type === "application/pdf") {
      return (
        <>
          <IconPDF size={80} color={"var(--cWhite)"} />
          <p>
            Archivo seleccionado: <br />
            <span>{selectedFiles.name}</span>
          </p>
        </>
      );
    }

    // Si es otro tipo de documento
    if (selectedFiles.name) {
      return (
        <>
          <IconDocs size={40} color={"var(--cWhite)"} />
          <p>
            Archivo seleccionado: <br />
            <span>{selectedFiles.name}</span>
          </p>
        </>
      );
    }

    // Si no hay archivo seleccionado
    return img ? (
      <IconImage size={40} color={"var(--cWhite)"} />
    ) : (
      <IconDocs size={40} color={"var(--cWhite)"} />
    );
  };

  // Verificar si el valor es un número y devolver con 'px', o usar el valor como está si es string
  const getSizeWithUnit = (size: any) => {
    if (size === undefined || size === null) return "100px";
    if (typeof size === "number") return `${size}px`;
    return size;
  };

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
        {(!selectedFiles?.name || selectedFiles?.name == "") &&
        (!value || value == "") ? (
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
            {renderFilePreview()}

            <IconEdit
              size={20}
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                padding: 2,
                backgroundColor: "var(--cBlack)",
              }}
              color={"var(--cWarning)"}
              circle
              onClick={() => {
                const fileUpload = document.getElementById(props.name);
                if (fileUpload) {
                  fileUpload.click();
                }
              }}
            />

            {item[props.name]?.file == "delete" ? (
              <>
                <IconTrash
                  size={100}
                  style={{
                    cursor: "",
                    padding: "2px",
                    position: "absolute",
                    color: "red",
                    top: 0,
                    left: 0,
                  }}
                />
                <IconArrowLeft
                  size={20}
                  circle={true}
                  color="var(--cSuccess)"
                  style={{
                    position: "absolute",
                    top: 2,
                    left: 2,
                    padding: 2,
                    backgroundColor: "var(--cBlack)",
                  }}
                  onClick={() => {
                    deleteImg(false);
                  }}
                />
              </>
            ) : (
              <IconTrash
                size={20}
                style={{
                  position: "absolute",
                  top: 2,
                  left: 2,
                  padding: 2,
                  backgroundColor: "var(--cBlack)",
                }}
                color={"var(--cError)"}
                circle
                onClick={() => {
                  deleteImg();
                }}
              />
            )}
          </div>
        )}
      </section>
      {loadedImage && (
        <ImageEditor
          imageBase64={loadedImage || false}
          onImageProcessed={handleImageProcessed}
          size={
            typeof editor === "object" ? editor : { width: 720, height: 1024 }
          }
        />
      )}
    </ControlLabel>
  );
};
