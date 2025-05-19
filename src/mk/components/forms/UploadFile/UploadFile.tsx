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
  img = false, // Renombrado a props.img en renderVisualElement para evitar conflicto si se desestructura img allí
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

  const isImageFile = (fileName: string) => {
    if (!fileName) return false;
    const ext: any = (fileName + "?")
      .split("?")[0]
      .split(".")
      .pop()
      ?.toLowerCase();
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

      const isAnImage = ["jpg", "png", "webp", "jpeg", "gif"].includes(fileExt); // Renombrada para evitar conflicto con la prop 'img'

      if (isAnImage) {
        try {
          const image: any = await resizeImage(file, 720, 1024, 0.7);
          let base64String = image.replace("data:", "").replace(/^.+,/, "");
          base64String = encodeURIComponent(base64String);

          if (editor) setLoadedImage(image);

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
    let acceptArray: any = []; // Renombrada para evitar conflicto con la prop
    props.ext.map((ext) => {
      acceptArray.push(`.${ext}`);
    });
    return acceptArray.join(",");
  };

  const deleteImg = (del = true) => {
    props.setError({ ...props.error, [props.name]: "" });
    setIsFileError(false);

    if (value && (value as any).file != "") {
      // Asegurar que value se trate como objeto con 'file'
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

  const getSizeWithUnit = (sizeValue: any) => {
    // Renombrado parámetro para claridad
    if (sizeValue === undefined || sizeValue === null) return "100px";
    if (typeof sizeValue === "number") return `${sizeValue}px`;
    return sizeValue;
  };

  // Función para construir URL de imagen desde base64 si es necesario
  const getImageUrl = () => {
    if (editedImage) {
      return editedImage;
    }

    if (selectedFiles?.name) {
      return URL.createObjectURL(selectedFiles);
    }

    if (
      typeof value === "object" &&
      value &&
      (value as any).file &&
      (value as any).ext
    ) {
      try {
        const decoded = decodeURIComponent((value as any).file);
        return `data:image/${(value as any).ext};base64,${decoded}`;
      } catch (e) {
        console.error("Error decodificando image:", e);
        return "";
      }
    }

    if (typeof value === "string" && value) {
      // Asegurar que no sea un string vacío
      return value;
    }

    return "";
  };

  // Función para renderizar solo el elemento visual (imagen o icono)
  const renderVisualElement = () => {
    if (isFileError) {
      return img ? ( // Aquí 'img' es la prop desestructurada
        <IconImage className={styles.visualElementIcon} />
      ) : (
        <IconDocs className={styles.visualElementIcon} />
      );
    }

    const shouldShowImage =
      (editedImage ||
        selectedFiles?.type?.startsWith("image/") ||
        (selectedFiles?.name && isImageFile(selectedFiles.name)) ||
        (typeof value === "object" &&
          value &&
          (value as any).ext &&
          isImageFile(`.${(value as any).ext}`)) ||
        (typeof value === "string" && value && isImageFile(value))) &&
      img; // Aquí 'img' es la prop desestructurada
    console.log("renderVisualElement2", isImageFile(value));
    if (shouldShowImage) {
      const imageUrl = getImageUrl();
      console.log("imageUrl", imageUrl);
      if (!imageUrl) {
        return <IconImage className={styles.visualElementIcon} />;
      }
      return (
        <img
          src={imageUrl}
          onError={(e) => {
            console.log("error imagen", e);
            setIsFileError(true);
          }}
          alt={selectedFiles?.name || "Preview"}
          className={styles.previewImageTag}
        />
      );
    }

    if (selectedFiles.type === "application/pdf") {
      return <IconPDF className={styles.visualElementIcon} />;
    }

    if (selectedFiles.name) {
      return <IconDocs className={styles.visualElementIcon} />;
    }

    return img ? ( // Aquí 'img' es la prop desestructurada
      <IconImage className={styles.visualElementIcon} />
    ) : (
      <IconDocs className={styles.visualElementIcon} />
    );
  };
  return (
    <ControlLabel
      {...props}
      value={value}
      className={`${styles.uploadFile} ${className}`}
    >
      <section
        className={styles.uploadSection} // Añadida clase para posible estilizado general de la sección
        style={{
          borderColor: props.error[props.name]
            ? "var(--cError)"
            : (value && (value as any).file) || isDraggingFile // Asegurar que value se trate como objeto con 'file'
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
          value="" // Siempre vacío para permitir reseleccionar el mismo archivo
          required={props.required}
          disabled={props.disabled}
          accept={accept()}
          className={styles.fileInput} // Añadida clase
        />
        {!selectedFiles?.name && !(value && (value != "" || value.file)) ? ( // Modificada la condición para chequear 'value.file'
          <div
            className={styles.uploadPlaceholder} // Añadida clase
            onClick={() => {
              const fileUpload = document.getElementById(props.name);
              if (fileUpload) {
                fileUpload.click();
              }
            }}
          >
            {img ? ( // Aquí 'img' es la prop desestructurada
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
          // ----- NUEVA ESTRUCTURA PARA LA PREVISUALIZACIÓN -----
          <div className={styles.filePreviewRow}>
            <div
              className={styles.imageActionColumn}
              style={{
                width: getSizeWithUnit(sizePreview?.width),
                height: getSizeWithUnit(sizePreview?.height),
              }}
            >
              {renderVisualElement()}
              <IconEdit
                size={20}
                className={styles.editButton}
                color={"var(--cWhiteV1)"}
                circle
                onClick={() => {
                  const fileUpload = document.getElementById(props.name);
                  if (fileUpload) {
                    fileUpload.click();
                  }
                }}
                style={{ backgroundColor: "black" }}
              />
              {item[props.name]?.file == "delete" ? (
                <>
                  <IconTrash
                    size={30}
                    className={styles.mainDeleteIconWhenMarked}
                    style={{ backgroundColor: "black" }}
                  />
                  <IconArrowLeft
                    size={20}
                    circle={true}
                    color="var(--cWhiteV1)"
                    className={styles.undoDeleteButton}
                    onClick={() => {
                      deleteImg(false);
                    }}
                  />
                </>
              ) : (
                <IconTrash
                  size={20}
                  className={styles.deleteButton}
                  color={"var(--cWhiteV1)"}
                  circle
                  onClick={() => {
                    deleteImg();
                  }}
                  style={{ backgroundColor: "black" }}
                />
              )}
            </div>

            <div className={styles.fileNameColumn}>
              <p>
                <span>
                  {selectedFiles?.name ||
                    (typeof value === "object" &&
                      value &&
                      (value as any).name &&
                      typeof value === "string" &&
                      value != "" &&
                      (img ? "Imagen" : "Archivo"))}
                </span>
              </p>
            </div>
          </div>
          // ----- FIN DE LA NUEVA ESTRUCTURA -----
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
