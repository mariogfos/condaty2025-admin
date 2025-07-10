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
import { formatBs } from '@/mk/utils/numbers';

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

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];

    return {
      ...(item || {}),

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

  const isExpensasWithoutDebt =
    _formState.subcategory_id === extraData?.client_config?.cat_expensas &&
    extraData?.client_config?.cat_reservations;
  deudas?.length === 0 && !isLoadingDeudas && _formState.dpto_id;

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
      const subcatId = _formState.subcategory_id;

      if (!realDptoId || !subcatId) return;

      // Determinar el fullType según la subcategoría
      let fullType = "PDD";
      if (subcatId === extraData?.client_config?.cat_expensas) {
        fullType = "ED";
      } else if (subcatId === extraData?.client_config?.cat_reservations) {
        fullType = "RD";
      }

      setIsLoadingDeudas(true);
      try {
        const { data } = await execute(
          "/payments",
          "GET",
          {
            perPage: -1,
            page: 1,
            fullType,
            searchBy: realDptoId,
          },
          false,
          true
        );

        if (data?.success) {
          const deudasArray = data?.data?.deudas || [];

          const deudasArrayOrdenado = deudasArray.sort((a, b) => {
            return a.debt?.year - b.debt?.year || a.debt?.month - b.debt?.month;
          });
          setDeudas(deudasArrayOrdenado);
          if (deudasArrayOrdenado.length === 0) {
            setSelectedPeriodo([]);
            setSelectPeriodoTotal(0);
          }
        }
      } catch (err) {

      } finally {
        setIsLoadingDeudas(false);
      }
    },
    [execute, extraData?.dptos, _formState.subcategory_id, extraData?.client_config?.cat_expensas, extraData?.client_config?.cat_reservations]
  );

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


  useEffect(() => {


    const isExpensasSelected =
      _formState.subcategory_id === extraData?.client_config?.cat_expensas;
    const isReservationsSelected =
      _formState.subcategory_id === extraData?.client_config?.cat_reservations;

    // Consultar deudas si se selecciona expensas o reservas
    if (_formState.dpto_id && (isExpensasSelected || isReservationsSelected)) {
      const deudasKey = `${_formState.dpto_id}_${_formState.subcategory_id}`;
      if (deudasKey !== lastLoadedDeudas.current) {
        lastLoadedDeudas.current = deudasKey;
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
        getDeudas(_formState.dpto_id);
      }
    } else {
      if (deudas.length > 0 || isLoadingDeudas) {
        setDeudas([]);
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
        lastLoadedDeudas.current = "";
      }
    }
  }, [
    _formState.dpto_id,
    _formState.subcategory_id,
    extraData?.client_config?.cat_expensas,
    extraData?.client_config?.cat_reservations,
    getDeudas,
  ]);

  useEffect(() => {
    let newSubcategories = [];
    let newSubcategoryId = "";
    let lockSubcategory = false;

    if (_formState.category_id && extraData?.categories) {
      const selectedCategory = extraData.categories.find(
        (category) => category.id === _formState.category_id
      );

      if (selectedCategory && selectedCategory.hijos) {
        newSubcategories = selectedCategory.hijos || [];

        // Buscar si la subcategoría es cat_expensas o cat_reservations
        const catExpensasChild = newSubcategories.find(
          (hijo) => hijo.id === extraData?.client_config?.cat_expensas
        );
        const catReservationsChild = newSubcategories.find(
          (hijo) => hijo.id === extraData?.client_config?.cat_reservations
        );
        if (catExpensasChild) {
          newSubcategoryId = extraData.client_config.cat_expensas;
          lockSubcategory = true;
        } else if (catReservationsChild) {
          newSubcategoryId = extraData.client_config.cat_reservations;
          lockSubcategory = true;
        }
      }
    }

    _setFormState((prev) => {
      if (prev.subcategory_id !== newSubcategoryId || !_formState.category_id) {
        setDeudas([]);
        setSelectedPeriodo([]);
        setSelectPeriodoTotal(0);
        lastLoadedDeudas.current = "";
      }
      return {
        ...prev,
        subcategories: newSubcategories,
        subcategory_id:
          prev.subcategory_id !== newSubcategoryId || !_formState.category_id
            ? newSubcategoryId
            : prev.subcategory_id,
        isSubcategoryLocked: lockSubcategory,
      };
    });
  }, [
    _formState.category_id,
    extraData?.categories,
    extraData?.client_config?.cat_expensas,
  ]);

  const handleChangeInput = useCallback((e) => {
    const { name, value, type } = e.target;

    const newValue =
      type === "checkbox" ? (e.target.checked ? "Y" : "N") : value;

    _setFormState((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  }, []);

  const handleSelectPeriodo = useCallback((periodo) => {
    const subtotal = Number(periodo.amount) + Number(periodo.penalty_amount);

    setSelectedPeriodo((prev) => {
      const exists = prev.some((item) => item.id === periodo.id);

      let newSelectedPeriodos;
      if (exists) {

        newSelectedPeriodos = prev.filter((item) => item.id !== periodo.id);
      } else {
        newSelectedPeriodos = [...prev, { id: periodo.id, amount: subtotal }];
      }

      const newTotal = newSelectedPeriodos.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      setSelectPeriodoTotal(newTotal);

      return newSelectedPeriodos;
    });
  }, []);

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

      }
    },
    [exten]
  );

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validar = useCallback(() => {
    let err = {};

    if (isExpensasWithoutDebt) {
      err.general =
        "No se puede registrar un pago de expensas cuando no hay deudas pendientes";
      set_Errors(err);
      return false;
    }
    if (
      _formState.subcategory_id === extraData?.client_config?.cat_expensas &&
      deudas?.length > 0 &&
      selectedPeriodo.length === 0
    ) {
      err.general = "Debe seleccionar al menos una deuda para pagar";
      set_Errors(err);
      return false;
    }

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

    if (
      _formState.subcategory_id !== extraData?.client_config?.cat_expensas ||
      deudas?.length === 0
    ) {
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
      const selectedDate = new Date(_formState.paid_at + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        err.paid_at = "No se permiten fechas futuras";
      }
    }

    set_Errors(err);
    return Object.keys(err).length === 0;
  }, [
    _formState,
    deudas,
    isExpensasWithoutDebt,
    selectedPeriodo,
    extraData?.client_config?.cat_expensas,
    set_Errors,
  ]);

  const _onSavePago = useCallback(async () => {
    if (!validar()) {

      if (
        isExpensasWithoutDebt ||
        (_formState.subcategory_id === extraData?.client_config?.cat_expensas &&
          deudas?.length > 0 &&
          selectedPeriodo.length === 0)
      ) {
        showToast(_errors.general || "Por favor revise los errores", "error");
      } else {
        showToast("Por favor revise los campos marcados", "warning");
      }
      return;
    }

    const selectedDpto = extraData?.dptos.find(
      (dpto) => dpto.nro === _formState.dpto_id
    );
    const owner_id = selectedDpto?.titular?.owner?.id;

    let params: any = {
      paid_at: _formState.paid_at,
      type: _formState.type,
      file: _formState.file,
      voucher: _formState.voucher,
      obs: _formState.obs,
      category_id: _formState.subcategory_id,
      nro_id: _formState.dpto_id,
      owner_id: owner_id,
    };

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

      const { data, error } = await execute("/payments", "POST", params);

      if (data?.success) {
        showToast("Pago agregado con éxito", "success");
        reLoad();
        onClose();
      } else {
        showToast(
          error?.message || data?.message || "Error al guardar el pago",
          "error"
        );

        if (error?.data?.errors) {
          set_Errors(error.data.errors);
        } else if (data?.errors) {
          set_Errors(data.errors);
        }
      }
    } catch (err) {
      showToast("Error inesperado al guardar el pago", "error");
    }
  }, [

    _formState,
    extraData?.client_config?.cat_expensas,
    extraData?.dptos,
    selectedPeriodo,
    selecPeriodoTotal,
    validar,
    execute,
    reLoad,
    onClose,
    set_Errors,
    showToast,
    isExpensasWithoutDebt,
    deudas,
  ]);

  const onCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  let deudasContent;
  if (!_formState.dpto_id) {
    deudasContent = <EmptyData message="Seleccione una unidad para ver deudas" h={200} />;
  } else if (isLoadingDeudas) {
    deudasContent = <EmptyData message="Cargando deudas..." h={200} />;
  } else if (deudas?.length === 0) {
    deudasContent = (
      <div className={styles["no-deudas-container"]}>
        <EmptyData message="Esta unidad no tiene deudas pendientes" h={200} />
        <p className={styles["no-deudas-message"]}>
          No se encontraron deudas pendientes para esta unidad. No se puede registrar un pago de {(_formState.subcategory_id === extraData?.client_config?.cat_expensas) ? 'expensas' : 'reservas'}.
        </p>
      </div>
    );
  } else {
    deudasContent = (
      <div className={styles['deudas-container']}>
        <div className={styles['deudas-title-row']}>
          <p className={styles['deudas-title']}>
            Seleccione las{' '}
            {_formState.subcategory_id ===
            extraData?.client_config?.cat_expensas
              ? 'expensas'
              : 'reservas'}{' '}
            a pagar:
          </p>
          <div
            className={styles['select-all-container']}
            onClick={() => {
              if (selectedPeriodo.length === deudas.length) {
                setSelectedPeriodo([]);
                setSelectPeriodoTotal(0);
              } else {
                const allPeriodos = deudas.map(periodo => ({
                  id: periodo.id,
                  amount:
                    Number(periodo.amount) + Number(periodo.penalty_amount),
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
            <span className={styles['select-all-text']}>Pagar todo</span>
            {selectedPeriodo.length === deudas.length ? (
              <IconCheckSquare
                className={`${styles['check-icon']} ${styles.selected}`}
              />
            ) : (
              <IconCheckOff className={styles['check-icon']} />
            )}
          </div>
        </div>

        <div className={styles['deudas-table']}>
          <div className={styles['deudas-header']}>
            <span className={styles['header-item']}>Periodo</span>
            <span className={styles['header-item']}>Monto</span>
            <span className={styles['header-item']}>Multa</span>
            <span className={styles['header-item']}>SubTotal</span>
            <span className={styles['header-item']}>Seleccionar</span>
          </div>

          {deudas.map(periodo => (
            <div
              key={String(periodo.id)}
              onClick={() => handleSelectPeriodo(periodo)}
              className={styles['deuda-item']}
            >
              <div className={styles['deuda-row']}>
                <div className={styles['deuda-cell']}>
                  {periodo.debt &&
                  typeof periodo.debt === 'object' &&
                  periodo.debt.month &&
                  periodo.debt.year
                    ? `${MONTHS_S[periodo.debt.month] ?? '?'}/${
                        periodo.debt.year ?? '?'
                      }`
                    : 'N/A'}
                </div>
                <div className={styles['deuda-cell']}>
                  {'Bs ' + Number(periodo.amount ?? 0).toFixed(2)}{' '}
                </div>
                <div className={styles['deuda-cell']}>
                  {'Bs ' + Number(periodo.penalty_amount ?? 0).toFixed(2)}{' '}
                </div>
                <div className={styles['deuda-cell']}>
                  {'Bs ' +
                    (
                      Number(periodo.amount ?? 0) +
                      Number(periodo.penalty_amount ?? 0)
                    ).toFixed(2)}{' '}
                </div>

                <div
                  className={`${styles['deuda-cell']} ${styles['deuda-check']}`}
                >
                  {selectedPeriodo.some(item => item.id === periodo.id) ? (
                    <IconCheckSquare
                      className={`${styles['check-icon']} ${styles.selected}`}
                    />
                  ) : (
                    <IconCheckOff className={styles['check-icon']} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={styles['total-container']}>
          <p>Total a pagar: {formatBs(selecPeriodoTotal)}</p>
        </div>
      </div>
    );
  }

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
        title={"Registrar ingreso"}
      >
        <div className={styles["income-form-container"]}>
          {/* Fecha de pago */}
          <div className={styles.section}>
            <div className={styles["input-container"]}>
              <Input
                type="date"
                name="paid_at"
                label="Seleccionar fecha"
                required={true}
                value={_formState.paid_at || ""}
                onChange={handleChangeInput}
                error={_errors}
                max={new Date().toISOString().split("T")[0]}
                min={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles["input-container"]}>
              <Select
                name="dpto_id"
                label="Seleccionar Unidad"
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
            <div>
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
                      maxLength={20}
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
              <div
                className={styles["upload-section"]}
               
              >
                <p className={styles["section-title"]}>Subir comprobante</p>
                <UploadFile
                  name="file"
                  ext={exten}
                  value={_formState.file ? { file: _formState.file } : ""}
                  onChange={handleChangeInput}
                  img={true}
                  sizePreview={{ width: "40%", height: "auto" }}
                  error={_errors}
                  setError={set_Errors}
                  required={true}
                  placeholder="Cargar un archivo o arrastrar y soltar"
                />
              </div>

              <div className={styles["voucher-section"]}>
                <div className={styles["voucher-input"]}>
                  <Input
                    type="text"
                    label="Ingresar el número del comprobante"
                    name="voucher"
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .substring(0, 10);
                      const newEvent = {
                        ...e,
                        target: { ...e.target, name: "voucher", value },
                      };
                      handleChangeInput(newEvent);
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
              {(_formState.subcategory_id === extraData?.client_config?.cat_expensas ||
                _formState.subcategory_id === extraData?.client_config?.cat_reservations) && (
                <div>
                  {deudasContent}
                </div>
              )}
              <div className={styles["obs-section"]}>
                <div className={styles["obs-input"]}>
                  <TextArea
                    label="Descripción"
                    name="obs"
                    onChange={(e) => {

                      const value = e.target.value.substring(0, 250);
                      const newEvent = {
                        ...e,
                        target: { ...e.target, name: "obs", value },
                      };
                      handleChangeInput(newEvent);
                    }}
                    value={_formState.obs}
                    required={false}
                    maxLength={250}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DataModal>
    </>
  );
};

export default RenderForm;
