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
import { getFullName } from "@/mk/utils/string";
import { MONTHS_S } from "@/mk/utils/date";
import EmptyData from "@/components/NoData/EmptyData";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Input from "@/mk/components/forms/Input/Input";
import {
  IconArrowDown,
  IconCheckOff,
  IconCheckSquare,
  IconDocs,
  IconPDF,
} from "@/components/layout/icons/IconsBiblioteca";
import { ToastType } from "@/mk/hooks/useToast";
import Toast from "@/mk/components/ui/Toast/Toast";
import { UnitsType } from '@/mk/utils/utils'
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./RenderForm.module.css"

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
    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    return {
      ...item || {},
      // Si no hay fecha en 'item', usa la fecha actual
      paid_at: (item && item.paid_at) || formattedDate,
      payment_method: (item && item.payment_method) || "" 
    };
  });
  const [deudas, setDeudas] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState([]);
  const [selecPeriodoTotal, setSelectPeriodoTotal] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingDeudas, setIsLoadingDeudas] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType }>({
    msg: "",
    type: "info",
  });
  const {store} = useAuth();
  
  // Verificamos si estamos en el caso de expensas sin deudas
  const isExpensasWithoutDebt = _formState.subcategory_id === extraData?.client_config?.cat_expensas && 
                              deudas?.length === 0 && 
                              !isLoadingDeudas && 
                              _formState.dpto_id;

  const lDptos = useMemo(
    () =>
      extraData?.dptos.map((dpto) => {
        return {
          id: dpto.nro,
          name:
          store.UnitsType +
          " " +
          dpto.nro +
          " - " +
          dpto.description +
          " - " +
          getFullName(dpto.titular?.owner),
          dpto_id: dpto.id
        };
      }),
    [extraData?.dptos]
  );
 
  const lastLoadedDeudas = useRef("");

  const client = useMemo(() => {
    return (
      user.clients?.find((item) => item.id === user.client_id) || {
        id: 0,
        type_dpto: "D",
      }
    );
  }, [user]);

  const extem = ["jpg", "pdf", "png", "jpeg", "doc", "docx"];

  const tipo = {
    D: "Departamento",
    C: "Casa",
    L: "Lote",
    O: "Oficina",
    _D: "Piso",
    _C: "Calle",
    _L: "Calle/Mz",
    _O: "Piso",
  };
  const showToast = (message: string, type: ToastType) => {
    setToast({ msg: message, type });

    setTimeout(() => setToast({ msg: "", type: "info" }), 5000);
  };

  const getDeudas = useCallback(
    async (nroDpto) => {
      if (!nroDpto) return;

      const selectedDpto = extraData?.dptos.find(dpto => dpto.nro === nroDpto);
      const realDptoId = selectedDpto?.id;
      
      if (!realDptoId) return; 
  
      setIsLoadingDeudas(true);
      try {
        const { data } = await execute(
          "/payments",
          "GET",
          {
            perPage: -1,
            page: 1,
            fullType: "PDD",
            searchBy: realDptoId, 
          },
          false,
          true
        );
  
        if (data?.success) {
          const deudasArray = data?.data?.deudas || [];
          setDeudas(deudasArray);
          if (deudasArray.length === 0) {
            setSelectedPeriodo([]);
            setSelectPeriodoTotal(0);
          }
        }
      } catch (err) {
        console.error("Error al obtener deudas:", err);
      } finally {
        setIsLoadingDeudas(false);
      }
    },
    [execute, extraData?.dptos]
  );

  // Inicialización y limpieza
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
        setDeudas([]);
        _setFormState({});
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
        setSelectedFiles({});
        setFileUploaded(false);
      }
    };
  }, [open]);
  
  // Efecto específico para cargar deudas cuando cambia dpto_id
  useEffect(() => {
    // Simple condición para evitar cargas innecesarias o cuando no hay datos suficientes
    if (
      _formState.dpto_id &&
      _formState.subcategory_id &&
      _formState.subcategory_id === extraData?.client_config?.cat_expensas
    ) {
      // Verificar si ya cargamos estas deudas antes (prevenir carga repetida)
      const deudasKey = `${_formState.dpto_id}_${_formState.subcategory_id}`;
      if (deudasKey !== lastLoadedDeudas.current) {
        lastLoadedDeudas.current = deudasKey;
        getDeudas(_formState.dpto_id);
      }
    }
  }, [
    _formState.dpto_id,
    _formState.subcategory_id,
    extraData?.client_config?.cat_expensas,
  ]); // quitar getDeudas

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (_formState.category_id && extraData?.categories) {
      const selectedCategory = extraData.categories.find(
        (category) => category.id === _formState.category_id
      );
  
      // Actualizar el estado del formulario con la subcategoría adecuada
      if (selectedCategory && selectedCategory.hijos) {
        // Verificar si entre los hijos está cat_expensas
        const catExpensasChild = selectedCategory.hijos.find(
          (hijo) => hijo.id === extraData?.client_config?.cat_expensas
        );
  
        if (catExpensasChild) {
          // Auto-seleccionar cat_expensas y actualizar el formulario
          _setFormState((prev) => ({
            ...prev,
            subcategories: selectedCategory.hijos || [],
            subcategory_id: extraData?.client_config?.cat_expensas,
            isSubcategoryLocked: true // Agregar este flag para bloquear el input
          }));
          
          // Si tenemos dpto_id, cargar las deudas
          if (_formState.dpto_id) {
            getDeudas(_formState.dpto_id);
          }
        } else {
          // No tiene cat_expensas como hijo, comportamiento normal
          _setFormState((prev) => ({
            ...prev,
            subcategories: selectedCategory.hijos || [],
            isSubcategoryLocked: false
          }));
          
          // Limpiar deudas si hay cambio de categoría
          setDeudas([]);
          setSelectedPeriodo([]);
          setSelectPeriodoTotal(0);
        }
      }
    }
  }, [
    _formState.category_id,
    _formState.dpto_id,
    extraData?.categories,
    extraData?.client_config?.cat_expensas,
    getDeudas
  ]);
  

  // Handler para cambio de campos del formulario
  const handleChangeInput = useCallback((e) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target.checked ? "Y" : "N") : value;

    _setFormState((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  }, []);

// Handler para selección de períodos de deuda
const handleSelectPeriodo = useCallback((periodo) => {
  // El subtotal ya contiene la suma del monto + multa
  const subtotal = Number(periodo.amount) + Number(periodo.penalty_amount);

  setSelectedPeriodo((prev) => {
    const exists = prev.some((item) => item.id === periodo.id);
    
    let newSelectedPeriodos;
    if (exists) {
      // Quitar si ya existe
      newSelectedPeriodos = prev.filter((item) => item.id !== periodo.id);
    } else {
      // Agregar si no existe
      newSelectedPeriodos = [...prev, { id: periodo.id, amount: subtotal }];
    }
    
    // Recalcular el total basado en los períodos seleccionados
    const newTotal = newSelectedPeriodos.reduce((sum, item) => sum + item.amount, 0);
    setSelectPeriodoTotal(newTotal);
    
    return newSelectedPeriodos;
  });
}, []);

  // Handler para manejo de archivos
  const onChangeFile = useCallback(
    (e) => {
      try {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
       

        const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
        if (!extem.includes(fileExtension)) {
          alert("Solo se permiten archivos " + extem.join(", "));
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

  // Manejadores de eventos para arrastrar y soltar
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
          alert("Solo se permiten archivos " + extem.join(", "));
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

  // Validación del formulario
  const validar = useCallback(() => {
    let err = {};

    // Si es expensas sin deudas, bloqueamos completamente el guardado
    if (isExpensasWithoutDebt) {
      err.general = "No se puede registrar un pago de expensas cuando no hay deudas pendientes";
      setErrors(err);
      return false;
    }

    // Si es expensas con deudas pero ninguna seleccionada, también bloqueamos
    if (_formState.subcategory_id === extraData?.client_config?.cat_expensas && 
        deudas?.length > 0 && 
        selectedPeriodo.length === 0) {
      err.general = "Debe seleccionar al menos una deuda para pagar";
      setErrors(err);
      return false;
    }

    // Validaciones básicas siempre presentes
    if (!_formState.dpto_id) {
      err.dpto_id = "Este campo es requerido";
    }
    if (!_formState.category_id) {
      err.category_id = "Este campo es requerido";
    }
    if (!_formState.subcategory_id) {
      err.subcategory_id = "Este campo es requerido";
    }
    if (!_formState.type) {
      err.type = "Este campo es requerido";
    }
    if (!_formState.voucher) {
      err.voucher = "Este campo es requerido";
    } else if (!/^\d{1,10}$/.test(_formState.voucher)) {
      err.voucher = "Debe contener solo números (máximo 10 dígitos)";
    }

    // Validamos los demás campos
    if (!_formState.type) {
      err.type = "Tiene que asignar un tipo de pago";
    }
    
    if (deudas?.length === 0 && _formState.subcategory_id !== extraData?.client_config?.cat_expensas) {
      if (!_formState.amount) {
        err.amount = "Este campo es requerido";
      }
    }
    
    if (!_formState.file) {
      err.file = "El comprobante es requerido";
    }
    if (!_formState.paid_at) {
      err.paid_at = "Este campo es requerido";
    } else {
      // Validar que la fecha no sea futura
      const selectedDate = new Date(_formState.paid_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear la hora para comparar solo fechas
      
      if (selectedDate > today) {
        err.paid_at = "No se permiten fechas futuras";
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  }, [_formState, deudas, setErrors, isExpensasWithoutDebt, selectedPeriodo, extraData?.client_config?.cat_expensas]);

  const _onSavePago = useCallback(async () => {
    // Validar y salir temprano si hay errores
    if (!validar()) {
      // Si es el caso de expensas sin deudas, mostrar un mensaje al usuario
      if (isExpensasWithoutDebt) {
        showToast("No se puede registrar un pago de expensas cuando no hay deudas pendientes", "error");
        return;
      }
      
      // Si es expensas con deudas pero ninguna seleccionada
      if (_formState.subcategory_id === extraData?.client_config?.cat_expensas && 
          deudas?.length > 0 && 
          selectedPeriodo.length === 0) {
        showToast("Debe seleccionar al menos una deuda para pagar", "error");
        return;
      }
      
      return;
    }
    
    const selectedDpto = extraData?.dptos.find(dpto => dpto.nro === _formState.dpto_id);
    const owner_id = selectedDpto?.titular?.owner?.id;

    let params = {
      paid_at: _formState.paid_at, 
      type: _formState.type,
      file: {
        file: _formState.file,
        ext: _formState.ext,
      },
      voucher: _formState.voucher,
      obs: _formState.obs,
      category_id: _formState.subcategory_id,
      nro_id: _formState.dpto_id,
      owner_id: owner_id,
    };

    // Verificar si es un pago de expensa y hay deudas seleccionadas
    if (
      extraData?.client_config?.cat_expensas === _formState.subcategory_id &&
      selectedPeriodo.length > 0
    ) {
      params = {
        ...params,
        asignados: selectedPeriodo,
        amount: selecPeriodoTotal,
      };
    } else {
      params = {
        ...params,
        amount: parseFloat(_formState.amount || "0"),
      };
    }

    try {
      console.log("Enviando datos:", params);
      const { data, error } = await execute("/payments", "POST", params);

      if (data?.success) {
        showToast("Pago agregado con éxito", "success");
        reLoad();
        onClose();
      } else if (error) {
        console.error("Error al guardar el pago:", error);
        showToast("Error al guardar el pago", "error");
        if (error.data && error.data.errors) {
          setErrors(error.data.errors);
        }
      }
    } catch (err) {
      console.error("Error en _onSavePago:", err);
      showToast("Error inesperado al guardar el pago", "error");
    }
  }, [
    _formState,
    extraData?.client_config?.cat_expensas,
    selectedPeriodo,
    selecPeriodoTotal,
    validar,
    execute,
    reLoad,
    onClose,
    setErrors,
    showToast,
    isExpensasWithoutDebt
  ]);

  // Handler para cerrar el modal
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
        onSave={_onSavePago}
        buttonCancel={"Cancelar"}
        buttonText={"Registrar ingreso"}
        disabled={isExpensasWithoutDebt || (_formState.subcategory_id === extraData?.client_config?.cat_expensas && deudas?.length > 0 && selectedPeriodo.length === 0)}
        title={"Estás registrando un nuevo ingreso"}
      >
          <div className={styles.divider}></div>
        <div className={styles["income-form-container"]}>
          {/* Fecha de pago */}
          <div className={styles.section}>
            <div className={styles["input-container"]}>
            <Input
              type="date"
              name="paid_at"
              label="Fecha de pago"
              required={true}
              value={_formState.paid_at || ""}
              onChange={handleChangeInput}
              error={errors} 
              max={new Date().toISOString().split('T')[0]} // Impide seleccionar fechas futuras
            />
            </div>
          </div>
          
          <div className={styles.section}>
            <div className={styles["input-container"]}>
            <Select
              name="dpto_id"
              required={true}
              value={_formState.dpto_id}
              onChange={handleChangeInput}
              placeholder="Seleccionar la unidad"
              options={lDptos}
              error={errors} 
              filter={true}
            />
            </div>
          </div>
  
          <div className={styles.section}>
            {/* Categoría y Subcategoría en una misma fila */}
            <div className={styles["input-row"]}>
              <div className={styles["input-half"]}>
              <Select
              name="category_id"
              value={_formState.category_id}
              placeholder="Categoría*"
              onChange={handleChangeInput}
              options={extraData?.categories || []}
              error={errors} 
              required
              optionLabel="name"
              optionValue="id"
            />
              </div>
              <div className={styles["input-half"]}>
                <Select
                  name="subcategory_id"
                  value={_formState.subcategory_id}
                  placeholder="Subcategoría"
                  onChange={handleChangeInput}
                  options={_formState.subcategories || []}
                  error={errors} 
                  required
                  optionLabel="name"
                  optionValue="id"
                  disabled={_formState.isSubcategoryLocked}
                />
              </div>
            </div>
            {_formState.isSubcategoryLocked && (
              <p className={styles["locked-message"]}>
                Esta subcategoría se ha seleccionado automáticamente
              </p>
            )}
  
            
  
            {/* Mostramos las siguientes secciones SOLO si NO es expensas sin deudas */}
            {!isExpensasWithoutDebt && (
              <>
                {/* Sección de monto y medio de pago */}
                <div className={styles["payment-section"]}>
                  
                  <div className={styles["input-row"]}>
                      <div className={styles["input-half"]}>
                      <Input
                        type="text" // Cambiar a text para permitir nuestra validación personalizada
                        name="amount"
                        placeholder="Monto del ingreso"
                        onChange={(e) => {
                          // Solo permitir números y limitar a 10 dígitos
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value.length <= 10) { // Solo actualizar si no excede 10 dígitos
                            const newEvent = { ...e, target: { ...e.target, name: 'amount', value }};
                            handleChangeInput(newEvent);
                          }
                        }}
                        value={_formState.subcategory_id === extraData?.client_config?.cat_expensas && deudas?.length > 0 
                          ? selecPeriodoTotal 
                          : _formState.amount}
                        required={true}
                        error={errors} 
                        disabled={_formState.subcategory_id === extraData?.client_config?.cat_expensas && deudas?.length > 0}
                        maxLength={10} // Asegurar límite de 10 caracteres
                      />
                      </div>
                      <div className={styles["input-half"]}>
                      <Select
                      name="type"
                      value={_formState.type}
                      placeholder="Tipo de pago*"
                      onChange={handleChangeInput}
                      options={[
                        { id: "Q", name: "Pago QR" },
                        { id: "T", name: "Transferencia bancaria" },
                        { id: "E", name: "Efectivo" },
                        { id: "C", name: "Cheque" },
                        { id: "O", name: "Pago en oficina" }
                      ]}
                      error={errors} 
                      required
                      optionLabel="name"
                      optionValue="id"
                    />
                      </div>
                    </div>
                </div>
  
                {/* Sección de subir comprobante */}
                <div className={styles["upload-section"]}>
                  <p className={styles["section-title"]}>Subir comprobante</p>
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
  
                {/* Sección de código de comprobante */}
                <div className={styles["voucher-section"]}>
                  
               
                <div className={styles["voucher-input"]}>
                <Input
                  type="text"
                  label="Ingresar el número del comprobante"
                  name="voucher"
                  onChange={(e) => {
                    // Solo permitir números y limitar a 10 dígitos
                    const value = e.target.value.replace(/[^0-9]/g, "").substring(0, 10);
                    const newEvent = {
                      ...e,
                      target: { ...e.target, name: "voucher", value },
                    };
                    handleChangeInput(newEvent);

                    // Mostrar un mensaje de error inmediato si se ingresan caracteres no permitidos
                    if (e.target.value !== value) {
                      showToast(
                        "El número de comprobante solo puede contener números (máximo 10 dígitos)",
                        "warning"
                      );
                    }
                  }}
                  value={_formState.voucher || ""}
                  error={errors} 
                  maxLength={10}
                  required
                />
              </div>
              </div>
                {/* Sección para mostrar deudas cuando es categoría de expensas */}                     
                {_formState.subcategory_id === extraData?.client_config?.cat_expensas && (
                      <>
                        {!_formState.dpto_id ? (
                          <EmptyData
                            message="Seleccione una unidad para ver deudas"
                            h={200}
                          />
                        ) : isLoadingDeudas ? (
                          <EmptyData message="Cargando deudas..." h={200} />
                        ) : deudas?.length === 0 ? (
                          // Aquí es donde queremos modificar el mensaje
                          <div className={styles["no-deudas-container"]}>
                            <EmptyData
                              message="Esta unidad no tiene deudas pendientes"
                              h={200}
                            />
                            <p className={styles["no-deudas-message"]}>
                              No se encontraron deudas pendientes para esta unidad. No se puede registrar un pago de expensas.
                            </p>
                          </div>
                        ) : (
                        <div className={styles["deudas-container"]}>
                          <div className={styles["deudas-title-row"]}>
                            <p className={styles["deudas-title"]}>
                              Seleccione las expensas a pagar:
                            </p>
                            <div 
                              className={styles["select-all-container"]}
                              onClick={() => {
                                // Si todas están seleccionadas, deseleccionar todas
                                if (selectedPeriodo.length === deudas.length) {
                                  setSelectedPeriodo([]);
                                  setSelectPeriodoTotal(0);
                                } 
                                // Si no todas están seleccionadas, seleccionar todas
                                else {
                                  const allPeriodos = deudas.map(periodo => ({
                                    id: periodo.id,
                                    amount: Number(periodo.amount) + Number(periodo.penalty_amount)
                                  }));
                                  
                                  const totalAmount = allPeriodos.reduce((sum, item) => 
                                    sum + item.amount, 0
                                  );
                                  
                                  setSelectedPeriodo(allPeriodos);
                                  setSelectPeriodoTotal(totalAmount);
                                }
                              }}
                            >
                              <span className={styles["select-all-text"]}>Pagar todo</span>
                              {selectedPeriodo.length === deudas.length ? (
                                <IconCheckSquare className={`${styles["check-icon"]} ${styles.selected}`} />
                              ) : (
                                <IconCheckOff className={styles["check-icon"]} />
                              )}
                            </div>
                          </div>
                          
                          <div className={styles["deudas-table"]}>
                            <div className={styles["deudas-header"]}>
                              <span className={styles["header-item"]}>Periodo</span>
                              <span className={styles["header-item"]}>Monto</span>
                              <span className={styles["header-item"]}>Multa</span>
                              <span className={styles["header-item"]}>SubTotal</span>
                              <span className={styles["header-item"]}>Seleccionar</span>
                            </div>

                            {deudas.map((periodo) => (
                              <div
                                key={String(periodo.id)}
                                onClick={() => handleSelectPeriodo(periodo)}
                                className={styles["deuda-item"]}
                              >
                                <div className={styles["deuda-row"]}>
                                  <div className={styles["deuda-cell"]}>
                                    {periodo.debt
                                      ? MONTHS_S[periodo.debt.month] +
                                        "/" +
                                        periodo.debt.year
                                      : "N/A"}
                                  </div>
                                  <div className={styles["deuda-cell"]}>
                                    {"Bs " + periodo.amount}
                                  </div>
                                  <div className={styles["deuda-cell"]}>
                                    {"Bs " + periodo.penalty_amount}
                                  </div>
                                  <div className={styles["deuda-cell"]}>
                                    {"Bs " +
                                      (Number(periodo.amount) +
                                        Number(periodo.penalty_amount))}
                                  </div>
                                  <div className={styles["deuda-check"]}>
                                    {selectedPeriodo.some(
                                      (item) => item.id === periodo.id
                                    ) ? (
                                      <IconCheckSquare className={`${styles["check-icon"]} ${styles.selected}`} />
                                    ) : (
                                      <IconCheckOff className={styles["check-icon"]} />
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className={styles["total-container"]}>
                            <p>Total a pagar: {selecPeriodoTotal} Bs.</p>
                            {selectedPeriodo.length === 0 && (
                              <p className={styles["error-message"]}>Debe seleccionar al menos una deuda para pagar</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
  
                {/* Sección de descripción */}
                <div className={styles["obs-section"]}>
                  <p className={styles["section-title"]}>
                    Indica una descripción para este ingreso
                  </p>
                  <div className={styles["obs-input"]}>
                  <TextArea
                    label="Descripción"
                    placeholder="Escribe una descripción(Opcional)"
                    name="obs"
                    onChange={(e) => {
                      // Limitar a 500 caracteres
                      const value = e.target.value.substring(0, 500);
                      const newEvent = { ...e, target: { ...e.target, name: 'obs', value }};
                      handleChangeInput(newEvent);
                    }}
                    value={_formState.obs}
                    maxLength={500}
                  />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DataModal>
    </>
  );
};

export default RenderForm;
