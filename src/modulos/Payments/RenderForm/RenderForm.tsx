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
import { UnitsType } from "@/mk/utils/utils";
import { useAuth } from "@/mk/contexts/AuthProvider";
import styles from "./RenderForm.module.css";
import { UploadFile } from "@/mk/components/forms/UploadFile/UploadFile";
import { formatNumber } from "@/mk/utils/numbers";

const RenderForm = ({
  open,
  onClose,
  item,
  onSave,
  extraData,
  execute,
  showToast,
  reLoad,
  user,
}) => {
  const [_formState, _setFormState] = useState(() => {
    // Obtener la fecha actual en formato YYYY-MM-DD
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    return {
      ...(item || {}),
      // Si no hay fecha en 'item', usa la fecha actual
      paid_at: (item && item.paid_at) || formattedDate,
      payment_method: (item && item.payment_method) || "",
      file: (item && item.file) || null,
      filename: (item && item.filename) || null,
      ext: (item && item.ext) || null,
    };
  });
  const [_errors, set_Errors] = useState({});

  const [deudas, setDeudas] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState([]);
  const [selecPeriodoTotal, setSelectPeriodoTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingDeudas, setIsLoadingDeudas] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType }>({
    msg: "",
    type: "info",
  });
  const { store } = useAuth();

  // Verificamos si estamos en el caso de expensas sin deudas
  const isExpensasWithoutDebt =
    _formState.subcategory_id === extraData?.client_config?.cat_expensas &&
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
          dpto_id: dpto.id,
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

  const exten = ["jpg", "pdf", "png", "jpeg", "doc", "docx"];

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


  const getDeudas = useCallback(
    async (nroDpto) => {
      if (!nroDpto) return;

      const selectedDpto = extraData?.dptos.find(
        (dpto) => dpto.nro === nroDpto
      );
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
      }
    };
  }, [open]);

  // Efecto específico para cargar deudas cuando cambia dpto_id
  // --- NUEVO useEffect para dpto_id / subcategory_id (Carga de Deudas) ---
  useEffect(() => {
    console.log(
      "Effect dpto/subcat:",
      _formState.dpto_id,
      _formState.subcategory_id
    ); // Debug

    const isExpensasSelected =
      _formState.subcategory_id === extraData?.client_config?.cat_expensas;

    if (_formState.dpto_id && isExpensasSelected) {
      // Si es expensas y hay dpto, intentar cargar deudas
      const deudasKey = `${_formState.dpto_id}_${_formState.subcategory_id}`;
      if (deudasKey !== lastLoadedDeudas.current) {
        console.log("Cargando deudas para:", deudasKey); // Debug
        lastLoadedDeudas.current = deudasKey;
        // Importante resetear selección al cargar NUEVAS deudas para una unidad
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
        getDeudas(_formState.dpto_id);
      }
    } else {
      // Si no es expensas o no hay dpto_id, limpiar las deudas
      if (deudas.length > 0 || isLoadingDeudas) {
        // Evita limpieza innecesaria
        console.log("Limpiando deudas"); // Debug
        setDeudas([]);
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
        lastLoadedDeudas.current = "";
      }
    }
  }, [
    // Dependencias CLAVE:
    _formState.dpto_id,
    _formState.subcategory_id,
    extraData?.client_config?.cat_expensas,
    getDeudas, // Es estable por useCallback
  ]);

  useEffect(() => {
    let newSubcategories = [];
    let newSubcategoryId = ""; // Por defecto, resetea la subcategoría seleccionada
    let lockSubcategory = false;

    if (_formState.category_id && extraData?.categories) {
      const selectedCategory = extraData.categories.find(
        (category) => category.id === _formState.category_id
      );

      if (selectedCategory && selectedCategory.hijos) {
        newSubcategories = selectedCategory.hijos || [];

        // ¿Es el caso de auto-selección de expensas?
        const catExpensasChild = newSubcategories.find(
          (hijo) => hijo.id === extraData?.client_config?.cat_expensas
        );

        if (catExpensasChild) {
          newSubcategoryId = extraData.client_config.cat_expensas; // Auto-seleccionar
          lockSubcategory = true;
        }
      }
    }

    // Actualiza el estado preservando los demás campos existentes
    _setFormState((prev) => {
      // Si la subcategoría va a cambiar (de ID o a ''), resetea las deudas/selección
      // O si la categoría se está limpiando
      if (prev.subcategory_id !== newSubcategoryId || !_formState.category_id) {
        setDeudas([]);
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
        lastLoadedDeudas.current = ""; // Permite recargar deudas si se vuelve a seleccionar expensas
      }

      // Devuelve el nuevo estado completo
      return {
        ...prev,
        subcategories: newSubcategories,
        // Solo actualiza subcategory_id si es diferente al valor actual O si se limpia la categoría
        subcategory_id:
          prev.subcategory_id !== newSubcategoryId || !_formState.category_id
            ? newSubcategoryId
            : prev.subcategory_id,
        isSubcategoryLocked: lockSubcategory,
      };
    });
  }, [
    // Dependencias CLAVE: Solo estas deben estar aquí
    _formState.category_id,
    extraData?.categories,
    extraData?.client_config?.cat_expensas,
    // NO incluir _formState.dpto_id aquí
  ]);
  // --- FIN DEL NUEVO useEffect para category_id ---

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
      const newTotal = newSelectedPeriodos.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      setSelectPeriodoTotal(newTotal);

      return newSelectedPeriodos;
    });
  }, []);



  // Manejadores de eventos para arrastrar y soltar
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

        const droppedFile = e.dataTransfer.files[0];
        const fileExtension =
          droppedFile.name.split(".").pop()?.toLowerCase() || "";

        if (!exten.includes(fileExtension)) {
          alert("Solo se permiten archivos " + exten.join(", "));
          return;
        }

        _setFormState((prev) => ({
          ...prev,
          ext: fileExtension,
          file: droppedFile.name,
        }));
      } catch (error) {
        console.error("Error al procesar el archivo:", error);
      }
    },
    [exten]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);


  // Validación del formulario (usa set_Errors interno)
  const validar = useCallback(() => {
    let err = {}; // Usa un objeto local para acumular errores

    // Si es expensas sin deudas, bloqueamos completamente el guardado
    if (isExpensasWithoutDebt) {
      err.general =
        "No se puede registrar un pago de expensas cuando no hay deudas pendientes";
      set_Errors(err); // Actualiza el estado INTERNO de errores
      return false; // Indica que la validación falló
    }

    // Si es expensas con deudas pero ninguna seleccionada, también bloqueamos
    if (
      _formState.subcategory_id === extraData?.client_config?.cat_expensas &&
      deudas?.length > 0 &&
      selectedPeriodo.length === 0
    ) {
      err.general = "Debe seleccionar al menos una deuda para pagar";
      set_Errors(err); // Actualiza el estado INTERNO de errores
      return false; // Indica que la validación falló
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
      // Expresión regular para validar número de 1 a 10 dígitos
      err.voucher = "Debe contener solo números (máximo 10 dígitos)";
    }

    // Validación de Monto (solo si NO es expensas con deudas)
    if (
      _formState.subcategory_id !== extraData?.client_config?.cat_expensas ||
      deudas?.length === 0
    ) {
      if (!_formState.amount) {
        err.amount = "Este campo es requerido";
      }
      // Puedes añadir más validaciones para amount si es necesario (ej: > 0)
    }

    // Validación de archivo
    if (!_formState.file) {
      err.file = "El comprobante es requerido";
    }

    // Validación de fecha de pago
    if (!_formState.paid_at) {
      err.paid_at = "Este campo es requerido";
    } else {
      // Validar que la fecha no sea futura
      const selectedDate = new Date(_formState.paid_at + 'T00:00:00'); // Asegura comparar solo fecha
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear la hora para comparar solo fechas

      if (selectedDate > today) {
        err.paid_at = "No se permiten fechas futuras";
      }
    }

    set_Errors(err); // Actualiza el estado INTERNO de errores con todos los encontrados
    return Object.keys(err).length === 0; // Devuelve true si NO hay errores
  }, [
    _formState, // Depende del estado del formulario
    deudas, // Depende de las deudas cargadas
    isExpensasWithoutDebt, // Depende de la variable calculada
    selectedPeriodo, // Depende de los periodos seleccionados
    extraData?.client_config?.cat_expensas, // Depende de la config
    set_Errors, // Depende del setter de errores INTERNO
  ]);


  // Función para guardar el pago (usa set_Errors interno)
  const _onSavePago = useCallback(async () => {

    if (!validar()) {

      // Los mensajes específicos de error ya se muestran en la validación
      // showToast(...) ya no es necesario aquí para esos casos específicos.
      // Solo nos aseguramos de no continuar si la validación falla.
      if (isExpensasWithoutDebt || (_formState.subcategory_id === extraData?.client_config?.cat_expensas && deudas?.length > 0 && selectedPeriodo.length === 0) ){
        showToast( _errors.general || "Por favor revise los errores", "error"); // Muestra el error general si existe
      }else{
         showToast("Por favor revise los campos marcados", "warning");
      }
      return;
    
    }

    // 2. Obtener owner_id (sin cambios)
    const selectedDpto = extraData?.dptos.find(
      (dpto) => dpto.nro === _formState.dpto_id
    );
    const owner_id = selectedDpto?.titular?.owner?.id;

    // 3. Construir payload (sin cambios, pero verifica la lógica)
    let params: any = { // Usa 'any' o una interfaz más específica
      paid_at: _formState.paid_at,
      type: _formState.type,
      file: _formState.file,
      voucher: _formState.voucher,
      obs: _formState.obs,
      category_id: _formState.subcategory_id, // Envía la subcategoría
      nro_id: _formState.dpto_id, // Parece que nro_id es el nro del dpto
      owner_id: owner_id,
    };

    // Ajusta el payload si es un pago de expensa con deudas seleccionadas
    if (
      extraData?.client_config?.cat_expensas === _formState.subcategory_id &&
      selectedPeriodo.length > 0
    ) {
      params = {
        ...params,
        asignados: selectedPeriodo, // Array de {id, amount} de las deudas seleccionadas
        amount: selecPeriodoTotal, // El total calculado
      };
    } else {
      // Si no es expensas, usa el monto ingresado manualmente
      params = {
        ...params,
        amount: parseFloat(_formState.amount || "0"),
      };
    }

    // 4. Ejecutar la llamada a la API (sin cambios)
    try {
      console.log("Enviando datos:", params);
      // Asume que 'execute' viene de las props y es para guardar/crear
      const { data, error } = await execute("/payments", "POST", params);
      console.log("data", JSON.stringify(data))
      console.log("aqui arriba esta lo que devuelve la api")
      // 5. Manejar la respuesta
      if (data?.success) {
        showToast("Pago agregado con éxito", "success");
        console.log("si entra")
        reLoad(); // Recarga la lista en el componente padre (Payments)
        onClose(); // Cierra el modal
      } else {
        // Si la API devuelve success:false o hay un error estructurado
        console.error("Error al guardar el pago:", error || data?.message);
        showToast(error?.message || data?.message || "Error al guardar el pago", "error");
        // Intenta establecer los errores de validación del backend si existen
        if (error?.data?.errors) {
          set_Errors(error.data.errors); // Actualiza el estado INTERNO de errores
        } else if (data?.errors){
           set_Errors(data.errors); // Si vienen en data.errors
        }
      }
    } catch (err) {
      // Captura errores de red u otros errores inesperados
   
      showToast("Error inesperado al guardar el pago", "error");
    }
  }, [
    // Dependencias: todas las variables/estados/props que usa la función
    _formState,
    extraData?.client_config?.cat_expensas,
    extraData?.dptos, // Añadido porque se usa para buscar owner_id
    selectedPeriodo,
    selecPeriodoTotal,
    validar, // Depende de la función validar (que ya está con useCallback)
    execute,
    reLoad,
    onClose,
    set_Errors, // Depende del setter de errores INTERNO
    showToast,
    isExpensasWithoutDebt, // Variable calculada, pero depende de estado
    deudas, // Añadido porque se usa en la validación y lógica condicional
  ]);

  // Handler para cerrar el modal
  const onCloseModal = useCallback(() => {
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
        disabled={
          isExpensasWithoutDebt ||
          (_formState.subcategory_id ===
            extraData?.client_config?.cat_expensas &&
            deudas?.length > 0 &&
            selectedPeriodo.length === 0)
        }
        title={"Nuevo ingreso"}
      >
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
                error={_errors}
                max={new Date().toISOString().split("T")[0]} // Impide seleccionar fechas futuras
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles["input-container"]}>
              <Select
                name="dpto_id"
                label="Unidad"
                required={true}
                value={_formState.dpto_id}
                onChange={handleChangeInput}
                
                options={lDptos}
                error={_errors}
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
                  label="Categoría"
                  value={_formState.category_id}
                 
                  onChange={handleChangeInput}
                  options={extraData?.categories || []}
                  error={_errors}
                  required
                  optionLabel="name"
                  optionValue="id"
                />
              </div>
              <div className={styles["input-half"]}>
                <Select
                  name="subcategory_id"
                  label="Subcategoría"
                  value={_formState.subcategory_id}
                  
                  onChange={handleChangeInput}
                  options={_formState.subcategories || []}
                  error={_errors}
                  required
                  optionLabel="name"
                  optionValue="id"
                  disabled={_formState.isSubcategoryLocked}
                />
              </div>
            </div>
           

            {/* Mostramos las siguientes secciones SOLO si NO es expensas sin deudas */}

            <>
              {/* Sección de monto y medio de pago */}
              <div className={styles["payment-section"]}>
                <div className={styles["input-row"]}>
                  <div className={styles["input-half"]}>
                    <Input
                      type="currency"
                      name="amount"
                      label="Monto del ingreso"
                      onChange={(e) => {
                        handleChangeInput(e);
                      }}
                      value={
                        _formState.subcategory_id ===
                          extraData?.client_config?.cat_expensas &&
                        deudas?.length > 0
                          ? selecPeriodoTotal
                          : _formState.amount
                      }
                      required={true}
                      error={_errors}
                      disabled={
                        _formState.subcategory_id ===
                          extraData?.client_config?.cat_expensas &&
                        deudas?.length > 0
                      }
                      maxLength={20} // Asegurar límite de 10 caracteres
                    />
                  </div>
                  <div className={styles["input-half"]}>
                    <Select
                      name="type"
                      label="Forma de pago"
                      value={_formState.type}
                      
                      onChange={handleChangeInput}
                      options={[
                        { id: "Q", name: "Pago QR" },
                        { id: "T", name: "Transferencia bancaria" },
                        { id: "E", name: "Efectivo" },
                        { id: "C", name: "Cheque" },
                        { id: "O", name: "Pago en oficina" },
                      ]}
                      error={_errors}
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
                <UploadFile
                  name="file"
                  ext={exten}
                  value={
                    _formState.file
                      ? { file: _formState.file }
                      : ""
                  }
                  onChange={handleChangeInput}
                  img={true}
                  sizePreview={{ width: "40%", height: "auto" }}
                  error={_errors}
                  setError={set_Errors}
                  required={true}
                  placeholder="Cargar un archivo o arrastrar y soltar"
                />
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
                      const value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .substring(0, 10);
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
                    error={_errors}
                    maxLength={10}
                    required
                  />
                </div>
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
                    // Aquí es donde queremos modificar el mensaje
                    <div className={styles["no-deudas-container"]}>
                      <EmptyData
                        message="Esta unidad no tiene deudas pendientes"
                        h={200}
                      />
                      <p className={styles["no-deudas-message"]}>
                        No se encontraron deudas pendientes para esta unidad. No
                        se puede registrar un pago de expensas.
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
                              const allPeriodos = deudas.map((periodo) => ({
                                id: periodo.id,
                                amount:
                                  Number(periodo.amount) +
                                  Number(periodo.penalty_amount),
                              }));

                              const totalAmount = allPeriodos.reduce(
                                (sum, item) => sum + item.amount,
                                0
                              );

                              setSelectedPeriodo(allPeriodos);
                              setSelectPeriodoTotal(totalAmount);
                            }
                          }}
                        >
                          <span className={styles["select-all-text"]}>
                            Pagar todo
                          </span>
                          {selectedPeriodo.length === deudas.length ? (
                            <IconCheckSquare
                              className={`${styles["check-icon"]} ${styles.selected}`}
                            />
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
                          <span className={styles["header-item"]}>
                            SubTotal
                          </span>
                          <span className={styles["header-item"]}>
                            Seleccionar
                          </span>
                        </div>

                        {deudas.map((periodo) => (
                          <div
                            key={String(periodo.id)}
                            onClick={() => handleSelectPeriodo(periodo)}
                            className={styles["deuda-item"]}
                          >
                            {/* Asegúrate de que este div tenga 5 hijos directos */}
                            <div className={styles["deuda-row"]}>
                              {/* 1. Celda Periodo */}
                              <div className={styles["deuda-cell"]}>
                                {periodo.debt &&
                                typeof periodo.debt === "object" &&
                                periodo.debt.month &&
                                periodo.debt.year
                                  ? `${MONTHS_S[periodo.debt.month] ?? "?"}/${
                                      periodo.debt.year ?? "?"
                                    }`
                                  : "N/A"}
                              </div>

                              {/* 2. Celda Monto (¡ESTA FALTABA!) */}
                              <div className={styles["deuda-cell"]}>
                                {"Bs " + Number(periodo.amount ?? 0).toFixed(2)}{" "}
                                {/* Muestra el monto base */}
                              </div>

                              {/* 3. Celda Multa */}
                              <div className={styles["deuda-cell"]}>
                                {"Bs " +
                                  Number(periodo.penalty_amount ?? 0).toFixed(
                                    2
                                  )}{" "}
                                {/* Muestra la multa */}
                              </div>

                              {/* 4. Celda SubTotal */}
                              <div className={styles["deuda-cell"]}>
                                {"Bs " +
                                  (
                                    Number(periodo.amount ?? 0) +
                                    Number(periodo.penalty_amount ?? 0)
                                  ).toFixed(2)}{" "}
                                {/* Calcula y muestra subtotal */}
                              </div>

                              {/* 5. Celda Seleccionar (Checkbox) */}
                              {/* Puedes aplicar ambas clases si ayuda o solo deuda-check si ya centra */}
                              <div
                                className={`${styles["deuda-cell"]} ${styles["deuda-check"]}`}
                              >
                                {selectedPeriodo.some(
                                  (item) => item.id === periodo.id
                                ) ? (
                                  <IconCheckSquare
                                    className={`${styles["check-icon"]} ${styles.selected}`}
                                  />
                                ) : (
                                  <IconCheckOff
                                    className={styles["check-icon"]}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={styles["total-container"]}>
                     

                        <p>Total a pagar: {formatNumber(selecPeriodoTotal, 2)} Bs.</p>
                        
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
                    
                    name="obs"
                    onChange={(e) => {
                      // Limitar a 500 caracteres
                      const value = e.target.value.substring(0, 500);
                      const newEvent = {
                        ...e,
                        target: { ...e.target, name: "obs", value },
                      };
                      handleChangeInput(newEvent);
                    }}
                    value={_formState.obs}
                    maxLength={500}
                  />
                </div>
              </div>
            </>
          </div>
        </div>
      </DataModal>
    </>
  );
};

export default RenderForm;
