import { useEffect, useState } from "react";
import {
  IconDocs,
  IconImage,
  IconPDF,
} from "../../../../components/layout/icons/IconsBiblioteca";
import Button from "../Button/Button";
import styles from "./uploadFile.module.css";
import ControlLabel, { PropsTypeInputBase } from "../ControlLabel";
import { useAuth } from "@/mk/contexts/AuthProvider";

interface PropsType extends PropsTypeInputBase {
  ext: string[];
  setError: Function;
  img?: boolean;
}
export const UploadFile = ({
  className = "",
  onChange = (e: any) => {},
  value = "",
  ...props
}: PropsType) => {
  const [selectedFiles, setSelectedFiles]: any = useState({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  // console.log(props, "props");
  const { showToast } = useAuth();

  const onError = (err: any) => {
    console.log("reader error", err);
  };

  useEffect(() => {
    if (value == "" || value == "delete") {
      setSelectedFiles({});
    }
  }, [value]);

  const onChangeFile = (e: any) => {
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
      reader.onerror = onError;
      reader.readAsDataURL(file);
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

  return (
    <ControlLabel
      {...props}
      value={value}
      className={styles.uploadFile + " " + className}
    >
      <section
        onClick={() => {
          const fileUpload = document.getElementById(props.name);
          if (fileUpload) {
            fileUpload.click();
          }
        }}
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

        {
          // !selectedFiles?.name || selectedFiles?.name == "" && onlyImg?(
          //   <>
          //       <IconImage size={40} color={"white"} />
          //   <span>Adjunta o arrastra y suelta </span>
          //   <span>{`${placeholderMsg}`}</span>
          //   <span>{props.ext.join(", ")}</span>
          // </>
          // ):
          !selectedFiles?.name || selectedFiles?.name == "" ? (
            <>
              {props.img ? (
                <IconImage size={40} color={"var(--cWhite)"} />
              ) : (
                <IconDocs size={40} color={"var(--cWhite)"} />
              )}
              <span>
                {props.placeholder || "Cargar un archivo o arrastrar y soltar "}
              </span>
              <span>{props.ext.join(", ")}</span>
            </>
          ) : (
            <div>
              {selectedFiles?.type.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(selectedFiles)} alt="Preview" />
              ) : selectedFiles.type === "application/pdf" ? (
                <IconPDF size={80} color={"var(--cWhite)"} />
              ) : (
                <IconDocs size={80} color={"var(--cWhite)"} />
              )}
              <p>
                Archivo seleccionado: <span>{selectedFiles.name}</span>
              </p>
              <Button
                // onClick={() => {
                //   const fileUpload = document.getElementById(props.name);
                //   if (fileUpload) {
                //     fileUpload.click();
                //   }
                // }}
                variant="terciary"
              >
                Editar elemento
              </Button>
            </div>
          )
        }
      </section>
    </ControlLabel>
  );
};
