// @ts-nocheck
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Input from "@/mk/components/forms/Input/Input";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { formatNumber } from "@/mk/utils/numbers";
import styles from "./RenderForm.module.css";
import {
  IconDocs,
  IconPDF,
} from "@/components/layout/icons/IconsBiblioteca";
import { ToastType } from "@/mk/hooks/useToast";
import Toast from "@/mk/components/ui/Toast/Toast";

const RenderForm = ({
  open,
  onClose,
  item,
  onSave,
  extraData,
  execute,
  errors,
  setErrors,
  reLoad,
  user,
}) => {
  const [_formState, _setFormState] = useState(item || {});
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const { store } = useAuth();

  const extem = ["jpg", "pdf", "png", "jpeg", "doc", "docx", "xls", "xlsx"];
console.log("extraData", extraData);
  // Toast function
  const showToast = (message, type) => {
    setToast({ msg: message, type });
    setTimeout(() => setToast({ msg: "", type: "info" }), 5000);
  };

  // Initialize form state
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }

    if (!isInitialized && open) {
      setIsInitialized(true);
    }

    return () => {
      if (!open) {
        _setFormState({});
        setFilteredSubcategories([]);
        setSelectedFiles({});
        setFileUploaded(false);
      }
    };
  }, [open]);

  // Handler for form field changes
  const handleChangeInput = useCallback((e) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target.checked ? "Y" : "N") : value;

    // Handle category_id changes specifically
    if (name === "category_id") {
      // Clear subcategory when category changes
      _setFormState(prev => ({
        ...prev,
        [name]: newValue,
        subcategory_id: ""
      }));

      // Load subcategories for selected category
      if (newValue && extraData?.subcategories) {
        // Filter subcategories that belong to the selected category
        const filtered = extraData.subcategories.filter(
          subcat => subcat.category_id === parseInt(newValue)
        );
        setFilteredSubcategories(filtered || []);
      } else {
        setFilteredSubcategories([]);
      }
    } else {
      // Handle all other form fields
      _setFormState(prev => ({
        ...prev,
        [name]: newValue
      }));
    }
  }, [extraData?.subcategories]);

  // File upload handlers
  const onChangeFile = useCallback(
    (e) => {
      try {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        
        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
        if (!extem.includes(fileExtension)) {
          showToast("Solo se permiten archivos " + extem.join(", "), "error");
          return;
        }

        setSelectedFiles(file);
        setFileUploaded(true);
        let partes = file.name.split(".");

        const reader = new FileReader();
        reader.onload = (e) => {
          if (!e.target || !e.target.result) return;

          const result = e.target.result;
          let base64String = result.replace("data:", "").replace(/^.+,/, "");
          base64String = encodeURIComponent(base64String);

          _setFormState((prev) => ({
            ...prev,
            ext: partes[partes.length - 1],
            file: base64String,
          }));
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
      }
    },
    [extem]
  );

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);

      try {
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

        const droppedFile = e.dataTransfer.files[0];
        const fileExtension =
          droppedFile.name.split(".").pop()?.toLowerCase() || "";

        if (!extem.includes(fileExtension)) {
          showToast("Solo se permiten archivos " + extem.join(", "), "error");
          return;
        }

        setSelectedFiles(droppedFile);
        setFileUploaded(true);
        let partes = droppedFile.name.split(".");

        const reader = new FileReader();
        reader.onload = (e) => {
          if (!e.target || !e.target.result) return;

          const result = e.target.result;
          let base64String = result.replace("data:", "").replace(/^.+,/, "");
          base64String = encodeURIComponent(base64String);

          _setFormState((prev) => ({
            ...prev,
            ext: partes[partes.length - 1],
            file: base64String,
          }));
        };
        reader.readAsDataURL(droppedFile);
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
      }
    },
    [extem]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  }, []);

  // Form validation
  const validar = useCallback(() => {
    let err = {};

    if (!_formState.date_at) {
      err.date_at = "Este campo es requerido";
    }
    if (!_formState.category_id) {
      err.category_id = "Este campo es requerido";
    }
    if (!_formState.subcategory_id) {
      err.subcategory_id = "Este campo es requerido";
    }

    if (!_formState.amount) {
      err.amount = "Este campo es requerido";
    }
    if (!_formState.file) {
      err.file = "El comprobante es requerido";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  }, [_formState, setErrors]);

  // Save handler
  const _onSaveEgreso = useCallback(async () => {
    if (!validar()) {
      return;
    }

    let params = {
      date_at: _formState.date_at,
      category_id: _formState.subcategory_id,
      description: _formState.description,
      amount: parseFloat(_formState.amount || "0"),
      file: {
        file: _formState.file,
        ext: _formState.ext,
      },
    };

    try {
      console.log("Enviando datos:", params);
      const { data, error } = await execute("/expenses", "POST", params);

      if (data?.success) {
        showToast("Egreso agregado con éxito", "success");
        reLoad();
        onClose();
      } else if (error) {
        console.error("Error al guardar el egreso:", error);
        showToast("Error al guardar el egreso", "error");
        if (error.data && error.data.errors) {
          setErrors(error.data.errors);
        }
      }
    } catch (err) {
      console.error("Error en _onSaveEgreso:", err);
      showToast("Error inesperado al guardar el egreso", "error");
    }
  }, [_formState, validar, execute, reLoad, onClose, setErrors]);

  // Close handler
  const onCloseModal = useCallback(() => {
    setFileUploaded(false);
    setIsDraggingFile(false);
    setSelectedFiles({});
    onClose();
  }, [onClose]);

  return (
    <>
      <Toast toast={toast} showToast={showToast} />
      <DataModal
        open={open}
        onClose={onCloseModal}
        onSave={_onSaveEgreso}
        buttonCancel=""
        buttonText={"Guardar"}
        title={"Estás registrando un nuevo egreso"}
      >
        <div className={styles["outlays-form-container"]}>
          <p className={styles["form-title"]}>Indica los datos para tu nuevo egreso</p>
          
          <div className={styles.section}>
            <p className={styles["section-title"]}>Fecha del egreso</p>
            <div className={styles["input-container"]}>
              <Input
                type="date"
                name="date_at"
                label="Fecha"
                required={true}
                value={_formState.date_at || ""}
                onChange={handleChangeInput}
                error={errors.date_at}
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles["section-title"]}>Selecciona la categoría y subcategoría</p>
            <div className={styles["input-container"]}>
              <Select
                name="category_id"
                value={_formState.category_id}
                placeholder="Seleccionar una categoría"
                label="Categoría"
                onChange={handleChangeInput}
                options={extraData?.categories || []}
                error={errors.category_id}
                required
                optionLabel="name"
                optionValue="id"
              />
            </div>
            <div className={styles["input-container"]}>
              <Select
                name="subcategory_id"
                value={_formState.subcategory_id}
                placeholder="Seleccionar subcategoría"
                label="Subcategoría"
                onChange={handleChangeInput}
                options={filteredSubcategories}
                error={errors.subcategory_id}
                required
                optionLabel="name"
                optionValue="id"
                disabled={!_formState.category_id}
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles["section-title"]}>Descripción y monto</p>
            <div className={styles["input-container"]}>
              <TextArea
                name="description"
                label="Descripción"
                placeholder="Escribe una descripción detallada"
                value={_formState.description || ""}
                onChange={handleChangeInput}
             
              />
            </div>
            <div className={styles["input-container"]}>
              <Input
                type="number"
                name="amount"
                label="Monto (Bs)"
                placeholder="Ej: 100.00"
                value={_formState.amount || ""}
                onChange={handleChangeInput}
                error={errors.amount}
                required
              />
            </div>
          </div>

          <div className={styles.section}>
            <p className={styles["section-title"]}>Comprobante</p>
            <div
              className={`${styles["file-upload-area"]} ${
                isDraggingFile ? styles.dragging : ""
              } ${errors.file ? styles.error : ""}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnter={() => setIsDraggingFile(true)}
              onDragLeave={handleDragLeave}
            >
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className={styles["hidden-input"]}
                onChange={onChangeFile}
                required
              />
              {!_formState.file || _formState.file === "" ? (
                <div className={styles["upload-instructions"]}>
                  <div className={styles["upload-text"]}>
                    <label htmlFor="file-upload" className={styles["upload-link"]}>
                      <span>Cargar un archivo</span>
                    </label>
                    <p className={styles["upload-alternative"]}>o arrastrar y soltar</p>
                  </div>
                  <p className={styles["file-types"]}>{extem.join(", ")}</p>
                  {errors.file && (
                    <p className={styles["error-message"]}>{errors.file}</p>
                  )}
                </div>
              ) : (
                <div className={styles["file-preview"]}>
                  <div className={styles["file-preview-content"]}>
                    {selectedFiles &&
                    "type" in selectedFiles &&
                    selectedFiles.type ? (
                      selectedFiles.type.startsWith("image/") ? (
                        <img    
                          src={URL.createObjectURL(selectedFiles)}
                          alt="Preview"
                          className={styles["file-thumbnail"]}
                        />
                      ) : selectedFiles.type === "application/pdf" ? (
                        <IconPDF size={70} />
                      ) : (
                        <IconDocs size={70} />
                      )
                    ) : null}
                    <div className={styles["file-info"]}>
                      <p className={styles["file-name"]}>
                        Archivo seleccionado:{" "}
                        <span>
                          {"name" in selectedFiles ? selectedFiles.name : ""}
                        </span>
                      </p>
                      <button
                        onClick={() => {
                          const fileUpload =
                            document.getElementById("file-upload");
                          if (fileUpload) {
                            fileUpload.click();
                          }
                        }}
                        type="button"
                        className={styles["edit-file-button"]}
                      >
                        <span>Editar elemento</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DataModal>
    </>
  );
};

export default RenderForm;