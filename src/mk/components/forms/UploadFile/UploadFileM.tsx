"use client";
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
import { PropsTypeInputBase } from "../ControlLabel";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { resizeImage } from "@/mk/utils/images";
import ImageEditor from "./ImageEditor";

interface PropsType extends PropsTypeInputBase {
  ext: string[];
  setError: Function;
  img?: boolean;
  fileName?: string | null;
  autoOpen?: boolean;
  editor?: boolean | { width: number; height: number };
  sizePreview?: { width: string; height: string };
}
export const UploadFileM = ({
  className = "",
  onChange = (e: any) => {},
  value = "",
  fileName = null,
  autoOpen = false,
  editor = false,
  sizePreview = { width: "100px", height: "100px" },
  ...props
}: PropsType) => {
  const [selectedFiles, setSelectedFiles]: any = useState({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  // console.log(props, "props");
  const { showToast } = useAuth();
  const [editedImage, setEditedImage]: any = useState(value);
  const [loadedImage, setLoadedImage]: any = useState(false);

  const handleImageProcessed = (imageBase64: string) => {
    // setEditedImage(imageBase64);

    const partes = selectedFiles.name.split(".");
    let base64String = imageBase64.replace("data:", "").replace(/^.+,/, "");
    base64String = encodeURIComponent(base64String);
    setLoadedImage(false);
    setEditedImage(imageBase64);
    onChange({
      target: {
        name: props.name,
        value: { ext: partes[partes.length - 1], file: base64String },
      },
    });
  };

  const onError = (err: any) => {
    console.log("reader error", err);
  };

  useEffect(() => {
    if (value == "" || value == "delete") {
      setSelectedFiles({});
      setEditedImage(null);
    }
  }, [value]);

  // Nuevo useEffect para manejar cambios en value
  useEffect(() => {
    if (value && value !== "delete" && value !== "") {
      // Si hay un nuevo valor, actualizar editedImage
      setEditedImage("data:image/webp;base64," + decodeURIComponent(value));
    }
  }, [value]);

  useEffect(() => {
    if (!selectedFiles?.name && autoOpen) {
      const fileUpload = document.getElementById(props.name);
      if (fileUpload) {
        fileUpload.click();
      }
    }
    console.log("carga imagen", value, fileName);
  }, []);

  const deleteImg = (del = true) => {
    props.setError({ ...props.error, [props.name]: "" });
    setSelectedFiles({});
    onChange &&
      onChange({
        target: {
          name: props.name,
          value: { file: del == false ? "" : "delete", ext: "" },
        },
      });
  };

  const onChangeFile = async (e: any) => {
    // props.setError({});
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
        setEditedImage(image);
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
          // setEditedImage(null);
          // setLoadedImage(e.target.result);
          setEditedImage(e.target.result);
          onChange({
            target: {
              name: props.name,
              value: { ext: partes[partes.length - 1], file: base64String },
            },
          });
        };
        reader.onerror = onError;
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setSelectedFiles({});
      // setEditedImage(null);
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
    //   props.ext.map((ext) => {
    //     accept.push(`application/${ext}`);
    //   });
    //   return accept.join(",");

    props.ext.map((ext) => {
      accept.push(`.${ext}`);
    });
    return accept.join(",");
  };

  useEffect(() => {
    if (!selectedFiles?.name && autoOpen) {
      const fileUpload = document.getElementById(props.name);
      if (fileUpload) {
        fileUpload.click();
      }
    }
    console.log("carga imagen", value, fileName);
    // if (value?.indexOf("data:") == 0) {
    //   setEditedImage(value);
    // }
  }, []);

  return (
    <div className={styles.uploadFile + " " + styles[className]}>
      <div>
        <section
          // onClick={() => {
          //   const fileUpload = document.getElementById(props.name);
          //   if (fileUpload) {
          //     fileUpload.click();
          //   }
          // }}
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
            style={{ display: "none" }}
          />
          {
            // !selectedFiles?.name || selectedFiles?.name == "" && onlyImg?(
            //   <>
            //       <IconImage size={40} color={"white"} />
            //   <span>Adjunta o arrastra y suelta </span>
            //   <span>{`${placeholderMsg}`}</span>
            //   <span>{props.ext.join(", ")}</span>
            // </>
            // ):
            (!selectedFiles?.name || selectedFiles?.name == "") &&
            !fileName &&
            !value ? (
              <div
                onClick={() => {
                  const fileUpload = document.getElementById(props.name);
                  if (fileUpload) {
                    fileUpload.click();
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "2px",
                  fontSize: "10px",
                }}
              >
                {props.img ? (
                  <IconImage size={40} color={"var(--cWhite)"} />
                ) : (
                  <IconDocs size={40} color={"var(--cWhite)"} />
                )}
                <span>
                  {props.placeholder || "Cargar o arrastrar y soltar "}
                </span>
                <span>{props.ext.join(", ")}</span>
              </div>
            ) : (
              <div
                title={selectedFiles?.name}
                style={{
                  position: "relative",
                  backgroundColor: "var(--cBlackV1)",
                  padding: "4px",
                  borderRadius: "10px",
                  overflow: "visible", // Cambiar de "hidden" a "visible"
                  width: "100px",
                  height: "100px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {/* {JSON.stringify(value)} */}
                {(value && value != "delete"
                  ? "data:image/webp;base64," + value
                  : editedImage) ||
                selectedFiles?.type?.startsWith("image/") ||
                fileName ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      // Priorizar la nueva imagen (value) sobre la imagen original (fileName)
                      value && value !== "delete" && value !== ""
                        ? "data:image/webp;base64," + decodeURIComponent(value)
                        : editedImage
                        ? editedImage
                        : selectedFiles?.name
                        ? URL.createObjectURL(selectedFiles)
                        : fileName || ""
                    }
                    alt={selectedFiles?.name}
                    style={{
                      objectFit: "cover",
                      width: sizePreview?.width || "100px",
                      height: sizePreview?.height || "100px",
                    }}
                  />
                ) : selectedFiles.type === "application/pdf" ? (
                  <IconPDF size={80} color={"var(--cWhite)"} />
                ) : (
                  <IconDocs size={80} color={"var(--cWhite)"} />
                )}

                {/* Botones de acción */}
                <div
                  style={{
                    position: "absolute",
                    top: "-5px", // Más arriba (fuera del contenedor)
                    right: "-5px", // Más a la derecha (fuera del contenedor)
                    display: "flex",
                    gap: "5px",
                    zIndex: 10, // Asegurar que estén por encima
                  }}
                >
                  {value != "delete" && (
                    <div
                      onClick={() => {
                        const fileUpload = document.getElementById(props.name);
                        if (fileUpload) {
                          fileUpload.click();
                        }
                      }}
                      style={{
                        backgroundColor: "var(--cPrimary)",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)", // Sombra para mejor visibilidad
                      }}
                    >
                      <IconEdit size={16} color="white" />
                    </div>
                  )}

                  {value == "delete" ? (
                    <div
                      onClick={() => {
                        deleteImg(false);
                      }}
                      style={{
                        backgroundColor: "var(--cPrimary)",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      <IconArrowLeft size={16} color="white" />
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        deleteImg();
                      }}
                      style={{
                        backgroundColor: "var(--cError)",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                      }}
                    >
                      <IconTrash size={16} color="white" />
                    </div>
                  )}
                </div>

                {/* Mantener el ícono de trash grande cuando value == "delete" */}
                {value == "delete" && (
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
                )}
              </div>
            )
          }
        </section>
        {/* <div style={{ border: "1px solid red" }}>
          <img
            src={value ? "data:image/webp;base64," + value : ""}
            alt={selectedFiles?.name}
            style={{
              objectFit: "cover",
              width: sizePreview?.width || "100px",
              height: sizePreview?.height || "100px",
            }}
          />
        </div> */}
      </div>
      {loadedImage && (
        <ImageEditor
          imageBase64={loadedImage || false}
          onImageProcessed={handleImageProcessed}
          size={editor}
        />
      )}
    </div>
  );
};
