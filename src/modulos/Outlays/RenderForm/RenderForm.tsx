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
  // --- IMPORTA TUS ICONOS DE EDITAR Y ELIMINAR ---
  // Ejemplo: import { IconEdit, IconDelete } from "@/components/layout/icons/IconsAcciones";
} from "@/components/layout/icons/IconsBiblioteca";
import { ToastType } from "@/mk/hooks/useToast";
import Toast from "@/mk/components/ui/Toast/Toast";

// --- COMPONENTES DE ICONOS (Placeholder si no los tienes) ---
// Si no tienes los componentes IconEdit/IconDelete, puedes usar esto temporalmente:
const IconEdit = ({ size = 20 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>✏️</span>; // O usa '📝' o texto '[Editar]'
const IconDelete = ({ size = 20 }) => <span style={{ fontSize: `${size}px`, cursor: 'pointer' }}>🗑️</span>; // O usa '❌' o texto '[Eliminar]'
// ¡Recuerda reemplazar esto con tus iconos reales!
// --- FIN Placeholder ---


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
  const [_formState, _setFormState] = useState(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    return {
      ...item || {},
      date_at: (item && item.date_at) || formattedDate,
      payment_method: (item && item.payment_method) || "",
      // Inicializa los campos de archivo como nulos o vacíos
      file: (item && item.file) || null,
      filename: (item && item.filename) || null,
      ext: (item && item.ext) || null,
    };
  });
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  // selectedFiles ahora guardará el objeto File o un objeto vacío
  const [selectedFiles, setSelectedFiles] = useState({});
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });
  const fileInputRef = useRef(null); // Referencia para el input de archivo

  const { store } = useAuth();

  const extem = ["jpg", "pdf", "png", "jpeg", "doc", "docx", "xls", "xlsx"];

  const showToast = (message, type) => {
    setToast({ msg: message, type });
    setTimeout(() => setToast({ msg: "", type: "info" }), 5000);
  };

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      // Limpia el estado al cerrar si no está inicializado
      _setFormState(prev => ({
           ...prev, // Conserva otros campos si es necesario reabrir con datos previos
           file: null,
           filename: null,
           ext: null
      }));
      setSelectedFiles({});
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Limpia el input de archivo
      }
      return;
    }

    if (!isInitialized && open) {
       // Al abrir, configura el estado inicial (incluyendo el archivo si 'item' lo tiene)
       const today = new Date();
       const formattedDate = today.toISOString().split('T')[0];
       _setFormState({
         ...item || {},
         date_at: (item && item.date_at) || formattedDate,
         payment_method: (item && item.payment_method) || "",
         file: (item && item.file) || null, // Asegúrate de manejar la estructura de 'item.file' si viene del backend
         filename: (item && item.filename) || null,
         ext: (item && item.ext) || null,
       });
       // Si hay un 'item' con archivo, podrías necesitar reconstruir el estado 'selectedFiles'
       // o simplemente confiar en _formState.filename para mostrarlo.
       // setSelectedFiles({}); // O lógica para pre-llenar si editas
       setIsInitialized(true);
    }


  }, [open, item, isInitialized]); // Depende de item también por si cambia

  const handleChangeInput = useCallback((e) => {
    const { name, value, type } = e.target;

    if (name === "amount") {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (numericValue.length > 10) return;
      _setFormState(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    const newValue = type === "checkbox" ? (e.target.checked ? "Y" : "N") : value;

    if (name === "category_id") {
      _setFormState(prev => ({ ...prev, [name]: newValue, subcategory_id: "" }));
      if (newValue && extraData?.subcategories) {
        const filtered = extraData.subcategories.filter(
          subcat => subcat.category_id === parseInt(newValue)
        );
        setFilteredSubcategories(filtered || []);
      } else {
        setFilteredSubcategories([]);
      }
    } else {
      _setFormState(prev => ({ ...prev, [name]: newValue }));
    }
  }, [extraData?.subcategories]);

  const processFile = (file) => {
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!extem.includes(fileExtension)) {
          showToast("Solo se permiten archivos " + extem.join(", "), "error");
          return false;
      }

      setSelectedFiles(file); // Guarda el objeto File para la previsualización

      const reader = new FileReader();
      reader.onload = (e) => {
          if (!e.target || !e.target.result) return;
          const result = e.target.result;
          let base64String = result.replace("data:", "").replace(/^.+,/, "");
          base64String = encodeURIComponent(base64String);

          _setFormState((prev) => ({
              ...prev,
              ext: fileExtension,
              file: base64String, // Guarda el base64 en el estado del formulario
              filename: file.name, // Guarda el nombre del archivo en el estado del formulario
          }));
          // Limpia el posible error de archivo requerido
          if (errors.file) {
            setErrors(prev => ({...prev, file: undefined}));
          }
      };
      reader.onerror = (error) => {
          console.error("Error al leer el archivo:", error);
          showToast("Error al leer el archivo", "error");
      };
      reader.readAsDataURL(file);
      return true;
  };

  const onChangeFile = useCallback((e) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      processFile(file);
  }, [extem, setErrors, errors.file]); // Añadido setErrors y errors.file

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  }, []);

  const handleDrop = useCallback((e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingFile(false);
      if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
  }, [extem, setErrors, errors.file]); // Añadido setErrors y errors.file

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  }, []);

  // --- NUEVA FUNCIÓN PARA ELIMINAR ARCHIVO ---
  const handleRemoveFile = useCallback(() => {
    _setFormState(prev => ({
      ...prev,
      file: null,
      filename: null,
      ext: null,
    }));
    setSelectedFiles({}); // Limpia el objeto File para la previsualización
    // Limpia el input de archivo para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
     // Si el archivo era requerido, podrías necesitar volver a mostrar el error
     // Opcional: setErrors(prev => ({...prev, file: "El comprobante es requerido"}));
  }, [/* setErrors */]); // Si necesitas setErrors, añádelo aquí

  // --- FUNCIÓN PARA SIMULAR CLICK EN INPUT (para botón/icono editar) ---
  const handleEditClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };


  const validar = useCallback(() => {
    let err = {};
    if (!_formState.date_at) err.date_at = "Este campo es requerido";
    if (!_formState.category_id) err.category_id = "Este campo es requerido";
    if (_formState.category_id && filteredSubcategories.length > 0 && !_formState.subcategory_id) {
        err.subcategory_id = "Este campo es requerido";
    }
    if (!_formState.description) err.description = "Este campo es requerido";
    else if (_formState.description.length > 500) err.description = "El concepto no puede exceder los 500 caracteres";
    if (!_formState.amount) err.amount = "Este campo es requerido";
    if (!_formState.payment_method) err.payment_method = "Este campo es requerido";
    // Valida que _formState.file (el base64) no esté vacío
    if (!_formState.file) {
        err.file = "El comprobante es requerido";
    }

    setErrors({...err});

    if (Object.keys(err).length > 0) {
      setTimeout(() => {
        const firstErrorElement = document.querySelector(`.${styles.error}`) || document.querySelector('.error'); // Busca error con estilo o clase general
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Fallback si no encuentra el elemento de error específico
            const modalBody = document.querySelector('.data-modal-body'); // Asume que tu modal tiene un cuerpo con esta clase
            if(modalBody) modalBody.scrollTop = 0; // Scroll al inicio del modal
        }
      }, 100);
    }

    return Object.keys(err).length === 0;
  }, [_formState, filteredSubcategories, setErrors]);

  const _onSaveEgreso = useCallback(async () => {
    if (!validar()) {
      showToast("Por favor complete todos los campos requeridos", "error");
      return;
    }

    let params = {
      date_at: _formState.date_at,
      category_id: _formState.category_id,
      subcategory_id: _formState.subcategory_id || null,
      description: _formState.description,
      amount: parseFloat(_formState.amount || "0"),
      payment_method: _formState.payment_method,
      // Asegúrate de que la estructura de 'file' es la esperada por tu backend
      file: {
        file: _formState.file, // base64 string
        ext: _formState.ext,
        filename: _formState.filename || "documento",
      },
    };

    try {
      console.log("Enviando datos:", params);
      const { data, error } = await execute("/expenses", "POST", params);

      if (data?.success) {
        showToast("Egreso agregado con éxito", "success");
        reLoad();
        onCloseModal(); // Llama a onCloseModal para limpiar estados
      } else if (error) {
        console.error("Error al guardar el egreso:", error);
        const errorMsg = error?.data?.message || "Error al guardar el egreso";
        showToast(errorMsg, "error");
        if (error.data && error.data.errors) {
          setErrors(error.data.errors);
        } else {
          // Si no hay errores específicos de campos, muestra un error general
           setErrors(prev => ({...prev, general: errorMsg}));
        }
      }
    } catch (err) {
      console.error("Error en _onSaveEgreso:", err);
      showToast("Error inesperado al guardar el egreso", "error");
       setErrors(prev => ({...prev, general: "Error inesperado al guardar el egreso"}));
    }
  }, [_formState, validar, execute, reLoad, onClose, setErrors, errors]); // Depende de errors para limpiarlos

  const onCloseModal = useCallback(() => {
    setIsInitialized(false); // Resetea la inicialización para la próxima apertura
    // Limpia estados específicos relacionados con el formulario y archivos
    _setFormState(prev => ({
         // Decide si quieres mantener algunos campos o limpiar todo
         // Ejemplo: limpiar todo excepto quizás la fecha por defecto
         date_at: new Date().toISOString().split('T')[0],
         payment_method: "",
         category_id: "",
         subcategory_id: "",
         description: "",
         amount: "",
         file: null,
         filename: null,
         ext: null,
    }));
    setFilteredSubcategories([]);
    setSelectedFiles({});
    if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Limpia el input de archivo
    }
    setErrors({}); // Limpiar errores
    onClose(); // Llama a la prop onClose original
  }, [onClose, setErrors]);

  const paymentMethods = [
    { id: "transferencia", name: "Transferencia bancaria" },
    { id: "efectivo", name: "Efectivo" },
    { id: "tarjeta", name: "Tarjeta de crédito/débito" },
    { id: "cheque", name: "Cheque" },
  ];

  const hasSubcategories = filteredSubcategories.length > 0;

  return (
    <>
      <Toast toast={toast} showToast={showToast} />
      <DataModal
        open={open}
        onClose={onCloseModal}
        onSave={_onSaveEgreso}
        buttonCancel="Cancelar"
        buttonText={"Registrar egreso"}
        title={"Estás registrando un nuevo egreso"}
        // Quitamos validateOnSubmit ya que lo hacemos manualmente
        // validateOnSubmit={true}
      >
       
          <div className={styles["outlays-form-container"]}>
            {/* Campos del formulario... (Fecha, Categoría, Subcategoría, Monto, Método) */}
            {/* ... (código de los inputs/selects igual que antes) ... */}

             {/* Fecha de pago */}
            <div className={styles.section}>
              <div className={styles["input-container"]}>
                <Input
                  type="date"
                  name="date_at"
                  label="Fecha de pago"
                  required={true}
                  value={_formState.date_at || ""}
                  onChange={handleChangeInput}
                  error={errors} 
                  className={errors.date_at ? styles.error : ""} // Aplicar clase de error si existe
                />
              </div>
            </div>

            {/* Categoría y Subcategoría (en dos columnas) */}
            <div className={styles.section}>
              <div className={styles["two-column-container"]}>
                <div className={styles.column}>
                  <div className={styles["input-container"]}>
                    <Select
                      name="category_id"
                      value={_formState.category_id || ""}
                      placeholder="Seleccionar una categoría"
                      label="Categoría"
                      onChange={handleChangeInput}
                      options={extraData?.categories || []}
                      error={errors} 
                      required
                      optionLabel="name"
                      optionValue="id"
                      className={errors.category_id ? styles.error : ""} // Aplicar clase de error si existe
                    />
                  </div>
                </div>
                <div className={styles.column}>
                  <div className={styles["input-container"]}>
                    <Select
                      name="subcategory_id"
                      value={_formState.subcategory_id || ""}
                      placeholder={hasSubcategories ? "Seleccionar subcategoría" : "No hay subcategorías"}
                      label="Subcategoría"
                      onChange={handleChangeInput}
                      options={filteredSubcategories}
                      error={errors} 
                      required={hasSubcategories} // Solo requerido si hay subcategorías
                      optionLabel="name"
                      optionValue="id"
                      disabled={!_formState.category_id || !hasSubcategories}
                       className={errors.subcategory_id ? styles.error : ""} // Aplicar clase de error si existe
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Monto y Método de pago (en dos columnas) */}
            <div className={styles["two-column-container"]}>
              <div className={styles.column}>
                <div className={styles.section}>
                  <div className={styles["input-container"]}>
                    <Input
                      type="text" // Cambiar a text para manejar la validación personalizada
                      name="amount"
                      label="Monto del pago"
                      placeholder="Ej: 10000"
                      value={_formState.amount || ""}
                      onChange={handleChangeInput}
                      error={errors} 
                      required
                      maxLength={10} // Limitar a 10 caracteres
                       className={errors.amount ? styles.error : ""} // Aplicar clase de error si existe
                    />
                  </div>
                </div>
              </div>
              <div className={styles.column}>
                <div className={styles.section}>
                  <div className={styles["input-container"]}>
                    <Select
                      name="payment_method"
                      value={_formState.payment_method || ""}
                      placeholder="Seleccionar método de pago"
                      label="Método de pago"
                      onChange={handleChangeInput}
                      options={paymentMethods}
                      error={errors} 
                      required
                      optionLabel="name"
                      optionValue="id"
                       className={errors.payment_method ? styles.error : ""} // Aplicar clase de error si existe
                    />
                  </div>
                </div>
              </div>
            </div>


            {/* --- SECCIÓN COMPROBANTE MODIFICADA --- */}
            <div className={styles.section}>
              <div className={styles["section-title"]}>Adjuntar comprobante o recibo del pago</div>
              <div
                className={`${styles["file-upload-area"]} ${
                  isDraggingFile ? styles.dragging : ""
                } ${errors.file ? styles.error : ""}`} // Usa la clase 'error' si hay error de archivo
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnter={() => setIsDraggingFile(true)}
                onDragLeave={handleDragLeave}
              >
                {/* Input de archivo oculto, ahora con ref */}
                <input
                  id="file-upload"
                  ref={fileInputRef} // Añadimos la referencia
                  name="file-upload"
                  type="file"
                  accept={extem.map(ext => `.${ext}`).join(",")} // Especifica tipos aceptados
                  className={styles["hidden-input"]}
                  onChange={onChangeFile}
                  // quitamos 'required' aquí, la validación JS es la principal
                />

                {/* --- VISTA CUANDO NO HAY ARCHIVO CARGADO --- */}
                {!_formState.file ? (
                  <div className={styles["upload-instructions"]}>
                    <div className={styles["upload-text"]}>
                      <label htmlFor="file-upload" className={styles["upload-link"]}>
                        <span>Cargar un archivo</span>
                      </label>
                      <p className={styles["upload-alternative"]}>o arrastrar y soltar</p>
                    </div>
                    <p className={styles["file-types"]}>{extem.join(", ")}</p>
                    {/* Muestra el mensaje de error si existe */}
                    {errors.file && (
                      <p className={styles["error-message"]}>{errors.file}</p>
                    )}
                  </div>
                ) : (
                  // --- VISTA CUANDO HAY UN ARCHIVO CARGADO ---
                  <div className={styles["file-preview"]}>
                    <div className={styles["file-preview-content"]}>
                      {/* Icono/Thumbnail del archivo */}
                      {selectedFiles instanceof File ? (
                          selectedFiles.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(selectedFiles)}
                            alt="Preview"
                            className={styles["file-thumbnail"]}
                            onLoad={() => URL.revokeObjectURL(selectedFiles)}
                          />
                          ) : selectedFiles.type === "application/pdf" ? (
                          <IconPDF size={40} /> // Tamaño ajustado
                          ) : (
                          <IconDocs size={40} /> // Tamaño ajustado
                          )
                      // Si no tenemos selectedFiles (ej. al editar un item existente sin recargar el File)
                      // mostramos icono basado en la extensión guardada en _formState
                      ) : _formState.ext === 'pdf' ? (
                           <IconPDF size={40} />
                      ) : ['jpg', 'jpeg', 'png'].includes(_formState.ext) ? (
                           // Podrías mostrar un icono genérico de imagen o intentar mostrar si tienes la URL/base64
                           <IconDocs size={40} /> // Placeholder para imagen si no hay preview
                      ) : (
                          <IconDocs size={40} /> // Icono genérico por defecto
                      )}

                      {/* Información y acciones del archivo */}
                      <div className={styles["file-info"]}>
                        {/* Nombre del archivo */}
                        <span className={styles["file-name"]}>
                          {_formState.filename || "archivo"} {/* Muestra el nombre */}
                        </span>
                        {/* Acciones: Editar y Eliminar */}
                        <div className={styles["file-actions"]}>
                          <button
                            type="button"
                            onClick={handleEditClick} // Llama a la función para abrir el selector
                            className={styles["icon-button"]} // Usa una clase genérica para botones de icono
                            aria-label="Editar archivo"
                          >
                            <IconEdit size={18} /> {/* Icono Editar */}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveFile} // Llama a la función para eliminar
                            className={styles["icon-button"]}
                            aria-label="Eliminar archivo"
                          >
                            <IconDelete size={18} /> {/* Icono Eliminar */}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
               {/* Muestra el mensaje de error del archivo debajo del área si existe (redundante pero puede ser útil) */}
               {/* {errors.file && !_formState.file && (
                  <p className={`${styles["error-message"]} ${styles["error-message-below"]}`}>{errors.file}</p>
               )} */}
            </div>
            {/* --- FIN SECCIÓN COMPROBANTE MODIFICADA --- */}


            {/* Concepto del pago */}
            <div className={styles.section}>
              <div className={styles["input-container"]}>
                <TextArea
                  name="description"
                  label="Concepto del pago"
                  placeholder="Describa el concepto del pago"
                  value={_formState.description || ""}
                  onChange={handleChangeInput}
                  error={errors} 
                  required
                  maxLength={500} // Limitar a 500 caracteres
                   className={errors.description ? styles.error : ""} // Aplicar clase de error si existe
                />
                {_formState.description && _formState.description.length > 0 && ( // Solo mostrar si hay descripción
                  <p className={styles["char-count"]}>
                    {_formState.description.length}/500 caracteres
                  </p>
                )}
              </div>
            </div>
            {/* Mostrar errores generales si existen */}
             {errors.general && (
                 <div className={`${styles.section} ${styles['error-general']}`}>
                     <p className={styles["error-message"]}>{errors.general}</p>
                 </div>
             )}
          </div>
      </DataModal>
    </>
  );
};

export default RenderForm;