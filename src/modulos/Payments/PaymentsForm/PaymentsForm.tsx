// @ts-nocheck
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import { getFullName } from "@/mk/utils/string";
import { MONTHS_S } from "@/mk/utils/date";
import EmptyData from "@/components/NoData/EmptyData";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Input from "@/mk/components/forms/Input/Input";
import { IconArrowDown, IconCheckOff, IconCheckSquare, IconDocs, IconPDF } from "@/components/layout/icons/IconsBiblioteca";

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
  user
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
  // Añadir esta línea con las otras definiciones de estado
const lastLoadedDeudas = useRef('');




  // Obtener cliente de los props
  const client = useMemo(() => {

    return user.clients?.find(item => item.id === user.client_id) || { id: 0, type_dpto: 'D' };
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

  // Función para cargar deudas por departamento - DEFINIDA ANTES DE SER USADA
  const getDeudas = useCallback(async (id) => {
    if (!id) return;
    
    setIsLoadingDeudas(true);
    try {
      // Pasar true como último parámetro para notWaiting
      const { data } = await execute("/payments", "GET", {
        perPage: -1,
        page: 1,
        fullType: "PDD",
        searchBy: id,
      }, false, true); // <-- El último true es para notWaiting
  
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
  }, [execute]);
  
  // Inicialización y limpieza
  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }
    
    if (!isInitialized && open) { 
      // Solo inicializar datos cuando se abre el modal
      setIsInitialized(true);
    }
    
    return () => {
      if (!open) {
        // Limpiar estados al cerrar
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
    if (_formState.dpto_id && 
        _formState.subcategory_id && 
        _formState.subcategory_id === extraData?.client_config?.cat_expensas) {
      
      // Verificar si ya cargamos estas deudas antes (prevenir carga repetida)
      const deudasKey = `${_formState.dpto_id}_${_formState.subcategory_id}`;
      if (deudasKey !== lastLoadedDeudas.current) {
        lastLoadedDeudas.current = deudasKey;
        getDeudas(_formState.dpto_id);
      }
    }
  }, [_formState.dpto_id, _formState.subcategory_id, extraData?.client_config?.cat_expensas]); // quitar getDeudas

  // Cargar subcategorías cuando cambia la categoría
  useEffect(() => {
    if (_formState.category_id && extraData?.categories) {
      const selectedCategory = extraData.categories.find(
        category => category.id === _formState.category_id
      );
      
      // Actualizar el estado del formulario con la subcategoría adecuada
      if (selectedCategory && selectedCategory.hijos) {
        _setFormState(prev => ({
          ...prev,
          subcategories: selectedCategory.hijos || []
        }));
      }
      
      // Si cambia a otra categoría que no es expensas, limpiar deudas
      if (_formState.subcategory_id !== extraData?.client_config?.cat_expensas) {
        setDeudas([]);
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
      }
    }
  }, [_formState.category_id, extraData?.categories, extraData?.client_config?.cat_expensas]);

  // Handler para cambio de campos del formulario
  const handleChangeInput = useCallback((e) => {
    const { name, value, type } = e.target;
    const newValue = type === "checkbox" ? (e.target.checked ? "Y" : "N") : value;
    
    _setFormState(prev => ({ 
      ...prev, 
      [name]: newValue 
    }));
  }, []);

  // Handler para selección de períodos de deuda
  const handleSelectPeriodo = useCallback((periodo) => {
    const periodoAmount = Number(periodo.amount) || 0;
    const periodoPenaltyAmount = Number(periodo.penalty_amount) || 0;
    const totalAmount = periodoAmount + periodoPenaltyAmount;

    setSelectedPeriodo(prev => {
      const exists = prev.some(item => item.id === periodo.id);
      
      if (exists) {
        // Quitar si ya existe
        setSelectPeriodoTotal(old => old - totalAmount);
        return prev.filter(item => item.id !== periodo.id);
      } else {
        // Agregar si no existe
        setSelectPeriodoTotal(old => old + totalAmount);
        return [...prev, { id: periodo.id, amount: totalAmount }];
      }
    });
  }, []);

  // Handler para manejo de archivos
  const onChangeFile = useCallback((e) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("El archivo debe ser menor a 2MB");
        return;
      }
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
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
        
        _setFormState(prev => ({
          ...prev,
          ext: partes[partes.length - 1],
          file: base64String,
        }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error al procesar el archivo:", error);
    }
  }, [extem]);

  // Manejadores de eventos para arrastrar y soltar
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    
    try {
      if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
      
      const droppedFile = e.dataTransfer.files[0];
      const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase() || '';
      
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
        
        _setFormState(prev => ({
          ...prev,
          ext: partes[partes.length - 1],
          file: base64String,
        }));
      };
      reader.readAsDataURL(droppedFile);
    } catch (error) {
      console.error("Error al procesar el archivo:", error);
    }
  }, [extem]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  }, []);

  // Validación del formulario
  const validar = useCallback(() => {
    let err = {};
    
    if (!_formState.type) {
      err.type = "Tiene que asignar un tipo de pago";
    }
    if (!_formState.dpto_id) {
      err.dpto_id = "Este campo es requerido";
    }
    if (deudas?.length === 0) {
      if (!_formState.amount) {
        err.amount = "Este campo es requerido";
      }
      if (!_formState.obs) {
        err.obs = "Este campo es requerido";
      }
    }
    if (!_formState.file) {
      err.file = "El comprobante es requerido";
    }
    if (!_formState.category_id) {
      err.category_id = "Este campo es requerido";
    }
    if (!_formState.subcategory_id) {
      err.subcategory_id = "Este campo es requerido";
    }
    
    setErrors(err);
    return Object.keys(err).length === 0;
  }, [_formState, deudas, setErrors]);

  // Handler para guardar el pago
  const _onSavePago = useCallback(async () => {
    if (!validar()) {
      return;
    }

    let params = {
        type: _formState.type,
        file: {
          file: _formState.file,
          ext: _formState.ext
        },
        voucher: _formState.voucher,
        obs: _formState.obs,
        category_id: _formState.subcategory_id,
        nro_id: _formState.dpto_id,
        user_id: client.id
      };

    // Verificar si es un pago de expensa y hay deudas seleccionadas
    if (extraData?.client_config?.cat_expensas === _formState.subcategory_id && selectedPeriodo.length > 0) {
      params = {
        ...params,
        asignados: selectedPeriodo,
        amount: selecPeriodoTotal
      };
    } else {
      params = {
        ...params,
        amount: parseFloat(_formState.amount || "0")
      };
    }

    try {
      console.log("Enviando datos:", params);
      const { data, error } = await execute("/payments", "POST", params);

      // En el método _onSavePago, modifica la sección de éxito/error
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
    }
  }, [_formState, extraData?.client_config?.cat_expensas, selectedPeriodo, selecPeriodoTotal, validar, execute, reLoad, onClose, setErrors]);

  // Handler para cerrar el modal
  const onCloseModal = useCallback(() => {
    setFileUploaded(false);
    setIsDraggingFile(false);
    setSelectedFiles({});
    onClose();
  }, [onClose]);

  return (
    <DataModal
      open={open}
      onClose={onCloseModal}
      onSave={_onSavePago}
      buttonCancel=""
      buttonText={"Guardar"}
      title={"Estás registrando un nuevo ingreso"}
    >
      <div className="income-form-container">
        <p className="form-title">
          Indica los datos para tu nuevo ingreso
        </p>
        <div className="section">
          <p className="section-title">
            Primero selecciona la unidad a la que pertenece este ingreso
          </p>
          <div className="input-container">
            <Select
              name="dpto_id"
              required={true}
              value={_formState.dpto_id}
              onChange={handleChangeInput}
              placeholder="Seleccionar la unidad"
              options={extraData?.dptos || []}
              optionLabel="description"
              optionValue="id"
              error={errors.dpto_id}
              filter={true}
            />
          </div>
        </div>
        
        <div className="section">
          <p className="section-title">
            A continuación selecciona la categoría y sub-categoría para
            este ingreso
          </p>
          <div className="input-container">
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
          <div className="input-container">
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
            />
          </div>
          
          {/* Sección para mostrar deudas cuando es categoría de expensas */}
          {_formState.subcategory_id === extraData?.client_config?.cat_expensas && (
            <>
                {!_formState.dpto_id ? (
                <EmptyData message="Seleccione una unidad para ver deudas" h={200} />
                ) : isLoadingDeudas ? (
                <EmptyData message="Cargando deudas..." h={200} />
                ) : deudas?.length === 0 ? (
                <EmptyData message="Esta unidad no tiene deudas pendientes" h={200} />
                ) : (
                <>
                  <p className="deudas-title">
                    Seleccione las expensas a pagar:
                  </p>
                  <div className="deudas-header">
                    <span className="header-item">Periodo</span>
                    <span className="header-item">Monto</span>
                    <span className="header-item">Multa</span>
                    <span className="header-item">SubTotal</span>
                  </div>

                  {deudas.map((periodo) => (
                    <div
                      key={String(periodo.id)}
                      onClick={() => handleSelectPeriodo(periodo)}
                      className="deuda-item"
                    >
                      <div className="deuda-row">
                        <div className="deuda-cell">
                          {periodo.debt ? 
                            MONTHS_S[periodo.debt.month] + "/" + periodo.debt.year 
                            : "N/A"}
                        </div>
                        <div className="deuda-cell">
                          {"Bs " + periodo.amount}
                        </div>
                        <div className="deuda-cell">
                          {"Bs " + periodo.penalty_amount}
                        </div>
                        <div className="deuda-cell">
                          {"Bs " + (Number(periodo.amount) + Number(periodo.penalty_amount))}
                        </div>
                        <div className="deuda-check">
                          {selectedPeriodo.some(
                            (item) => item.id === periodo.id
                          ) ? (
                            <IconCheckSquare className="check-icon selected" />
                          ) : (
                            <IconCheckOff className="check-icon" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="total-container">
                    <p>
                      Total a pagar: {selecPeriodoTotal} Bs.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
          
          {/* Sección de monto y medio de pago - SIEMPRE VISIBLE */}
          <div className="payment-section">
            <p className="section-title">
            {_formState.subcategory_id === extraData?.client_config?.cat_expensas && deudas?.length > 0
                ? "Seleccione el medio de pago"
                : "Ahora ingresa el monto y el medio de pago de este ingreso"}
            </p>
            <div className="payment-inputs">
              {/* El campo de monto se muestra si NO es categoría de expensas O si es pero no hay deudas */}
              {(_formState.category_id !== extraData?.client_config?.cat_expensas || deudas?.length === 0) && (
                <div className="amount-input">
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
              )}

              <div className="payment-type">
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
          
          {/* Sección de subir comprobante - SIEMPRE VISIBLE */}
          <div className="upload-section">
            <p className="section-title">
              Subir comprobante
            </p>
            <div
              className={`file-upload-area ${
                isDraggingFile ? "dragging" : ""
              } ${errors.file ? "error" : ""}`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnter={() => setIsDraggingFile(true)}
              onDragLeave={handleDragLeave}
            >
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                className="hidden-input"
                onChange={onChangeFile}
                required
              />
              {!_formState.file || _formState.file === "" ? (
                <div className="upload-instructions">
                  <div className="upload-text">
                    <label
                      htmlFor="file-upload"
                      className="upload-link"
                    >
                      <span>
                        Cargar un archivo
                      </span>
                    </label>
                    <p className="upload-alternative">
                      o arrastrar y soltar
                    </p>
                  </div>
                  <p className="file-types">
                    {extem.join(", ")}
                  </p>
                  {errors.file && (
                    <p className="error-message">{errors.file}</p>
                  )}
                </div>
              ) : (
                <div className="file-preview">
                  <div className="file-preview-content">
                    {selectedFiles && 'type' in selectedFiles && selectedFiles.type ? (
                      selectedFiles.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(selectedFiles)}
                          alt="Preview"
                          className="file-thumbnail"
                        />
                      ) : selectedFiles.type === "application/pdf" ? (
                        <IconPDF size={70} />
                      ) : (
                        <IconDocs size={70} />
                      )
                    ) : null}
                    <div className="file-info">
                      <p className="file-name">
                        Archivo seleccionado:{" "}
                        <span>
                          {'name' in selectedFiles ? selectedFiles.name : ''}
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
                        className="edit-file-button"
                      >
                        <span>
                          Editar elemento
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sección de código de comprobante - SIEMPRE VISIBLE */}
          <div className="voucher-section">
            <p className="section-title">
              Por último, agrega el número del comprobante
            </p>
            <div className="voucher-input">
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
          
          {/* Sección de descripción - SIEMPRE VISIBLE EXCEPTO CUANDO HAY DEUDA SELECCIONADA */}
          {(_formState.subcategory_id !== extraData?.client_config?.cat_expensas || deudas?.length === 0) && (
            <div className="obs-section">
              <p className="section-title">
                Indica una descripción para este ingreso
              </p>
              <div className="obs-input">
                <TextArea
                  label="Descripción"
                  name="obs"
                  onChange={handleChangeInput}
                  required
                  error={errors.obs}
                  value={_formState.obs}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </DataModal>
  );
};

export default IncomeForm;