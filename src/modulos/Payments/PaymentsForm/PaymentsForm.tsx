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
import styles from "./PaymentsForm.module.css"

const IncomeForm = ({
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
        if (file.size > 2 * 1024 * 1024) {
          alert("El archivo debe ser menor a 2MB");
          return;
        }

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
        buttonCancel=""
        buttonText={"Guardar"}
        disabled={isExpensasWithoutDebt || (_formState.subcategory_id === extraData?.client_config?.cat_expensas && deudas?.length > 0 && selectedPeriodo.length === 0)}
        title={"Estás registrando un nuevo ingreso"}
      >
        <div className={styles["income-form-container"]}>
          <p className={styles["form-title"]}>Indica los datos para tu nuevo ingreso</p>
          <div className={styles.section}>
            <p className={styles["section-title"]}>
              Primero selecciona la unidad a la que pertenece este ingreso
            </p>
            <div className={styles["input-container"]}>
              <Select
                name="dpto_id"
                required={true}
                value={_formState.dpto_id}
                onChange={handleChangeInput}
                placeholder="Seleccionar la unidad"
                options={lDptos}
                error={errors.dpto_id}
                filter={true}
              />
            </div>
          </div>
  
          <div className={styles.section}>
            <p className={styles["section-title"]}>
              A continuación selecciona la categoría y sub-categoría para este
              ingreso
            </p>
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
              placeholder="Seleccionar sub-categoría"
              label="Subcategoría"
              onChange={handleChangeInput}
              options={_formState.subcategories || []}
              error={errors.subcategory_id}
              required
              optionLabel="name"
              optionValue="id"
              disabled={_formState.isSubcategoryLocked}
            />
            {_formState.isSubcategoryLocked && (
              <p className={styles["locked-message"]}>
                Esta subcategoría se ha seleccionado automáticamente
              </p>
            )}
          </div>
  
            {/* Sección para mostrar deudas cuando es categoría de expensas */}
            {_formState.subcategory_id ===
              extraData?.client_config?.cat_expensas && (
              <>
                {!_formState.dpto_id ? (
                  <EmptyData
                    message="Seleccione una unidad para ver deudas"
                    h={200}
                  />
                ) : isLoadingDeudas ? (
                  <EmptyData message="Cargando deudas..." h={200} />
                ) : deudas?.length === 0 ? (
                  <EmptyData
                    message="Esta unidad no tiene deudas pendientes. No se puede registrar un pago."
                    h={200}
                  />
                ) : (
                  <div className={styles["deudas-container"]}>
                    <p className={styles["deudas-title"]}>
                      Seleccione las expensas a pagar:
                    </p>
                    <div className={styles["deudas-header"]}>
                      <span className={styles["header-item"]}>Periodo</span>
                      <span className={styles["header-item"]}>Monto</span>
                      <span className={styles["header-item"]}>Multa</span>
                      <span className={styles["header-item"]}>SubTotal</span>
                      <span className={styles["header-item"]}></span>
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
  
            {/* Mostramos las siguientes secciones SOLO si NO es expensas sin deudas */}
            {!isExpensasWithoutDebt && (
              <>
                {/* Sección de monto y medio de pago */}
                <div className={styles["payment-section"]}>
                  <p className={styles["section-title"]}>
                    {_formState.subcategory_id ===
                      extraData?.client_config?.cat_expensas && deudas?.length > 0
                      ? "Seleccione el medio de pago"
                      : "Ahora ingresa el monto y el medio de pago de este ingreso"}
                  </p>
                  <div className={styles["payment-inputs"]}>
                  {(_formState.subcategory_id !== extraData?.client_config?.cat_expensas) ? (
                      <div className={styles["amount-input"]}>
                        <Input
                          type="number"
                          label="Monto"
                          name="amount"
                          onChange={handleChangeInput}
                          value={_formState.amount}
                          required={true}
                          error={errors.amount || ""}
                        />
                      </div>
                    ) : (
                      <div className={`${styles["amount-input"]} ${styles["amount-input-disabled"]}`}>
                        <Input
                          type="number"
                          label="Monto (calculado de expensas)"
                          name="amount"
                          value={selecPeriodoTotal}
                          disabled={true}
                        />
                      </div>
                    )}
    
                    <div className={styles["payment-type"]}>
                    <Select
                      name="type"
                      value={_formState.type}
                      placeholder="Seleccionar tipo de pago"
                      label="Pago por:"
                      onChange={handleChangeInput}
                      options={[
                        { id: "Q", name: "Qr simple" },
                        { id: "T", name: "Transferencia bancaria" },
                        { id: "O", name: "Pago en efectivo" },
                      ]}
                      error={errors.type}
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
                  <p className={styles["section-title"]}>
                    Por último, agrega el número del comprobante
                  </p>
                  <div className={styles["voucher-input"]}>
                    <Input
                      type="text"
                      label="Código de comprobante"
                      name="voucher"
                      onChange={handleChangeInput}
                      value={_formState.voucher}
                      error={errors.voucher || ""}
                    />
                  </div>
                </div>
    
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
                      onChange={handleChangeInput}
                      value={_formState.obs}
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

export default IncomeForm;
