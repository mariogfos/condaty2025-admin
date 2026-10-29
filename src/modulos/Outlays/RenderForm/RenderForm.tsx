"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import DataModal from "@/mk/components/ui/DataModal/DataModal";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Input from "@/mk/components/forms/Input/Input";
import styles from "./RenderForm.module.css";
import Toast from "@/mk/components/ui/Toast/Toast";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { checkRules } from "@/mk/utils/validate/Rules";

interface Category {
  id: number | string;
  name: string;
  padre?: Category | null;
  category_id?: number | string | null;
}

interface Subcategory {
  id: number | string;
  name: string;
  category_id: number | string;
  bank_account_id?: number | string | null;
  bank_account?: object | any;
}

interface User {
  id: string;
  name: string;
  last_name?: string | null;
  middle_name?: string | null;
  mother_last_name?: string | null;
  has_image?: string;
}

interface OutlayFormState {
  date_at: string;
  category_id?: number | string;
  subcategory_id?: number | string;
  description?: string;
  amount?: string | number;
  type?: string;
  url_file?: string[] | null;
  filename?: string | null;
  ext?: string | null;
  bank_account_id?: number | null;
  supplier_id?: number | string | null;
  cheque_id?: number | string | null;
  cheque_payee?: string;
}

interface FreeCheque {
  id: number;
  number: string;
  bank_account_id: number;
  book?: { name?: string | null };
}

interface ExtraData {
  categories?: Category[];
  subcategories?: Subcategory[];
  bankAccounts?: object[];
  suppliers?: { id: number; name: string; type: string }[];
}

interface Errors {
  [key: string]: string;
}

interface RenderFormProps {
  open: boolean;
  onClose: () => void;
  item?: Partial<OutlayFormState>;
  onSave?: (params: any) => void;
  extraData?: ExtraData;
  execute: (url: string, method: string, params: any, ...rest: any[]) => Promise<any>;
  showToast: (
    msg: string,
    type?: "info" | "success" | "error" | "warning"
  ) => void;
  reLoad: () => void;
  user?: User;
}

const RenderForm: React.FC<RenderFormProps> = ({
  open,
  onClose,
  item,
  extraData,
  showToast,
  onSave,
  execute,
}) => {
  const [_formState, _setFormState] = useState<OutlayFormState>(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    return {
      ...(item || {}),
      ...(item || {}),
      date_at: (item && item.date_at) || formattedDate,
      type: (item && item.type) || "",
      url_file: Array.isArray((item as any)?.url_file)
        ? ((item as any).url_file as string[])
        : [],
    };
  });
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [showBank, setShowBank] = useState<boolean>(false);
  const [bankEnabled, setBankEnabled] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [toast] = useState<{
    msg: string;
    type: "info" | "success" | "error" | "warning";
  }>({ msg: "", type: "info" });
  const [_errors, set_Errors] = useState<Errors>({});
  const [freeCheques, setFreeCheques] = useState<FreeCheque[]>([]);
  const [chequesLoading, setChequesLoading] = useState(false);
  const [chequesError, setChequesError] = useState(false);
  const executeRef = useRef(execute);
  useEffect(() => { executeRef.current = execute; }, [execute]);

  useEffect(() => {
    if (!open || _formState.type !== "C") return;
    let active = true;
    setChequesLoading(true);
    setChequesError(false);
    executeRef.current("/cheques/available", "GET", {}, false, true).then(({ data }: any) => {
      if (!active) return;
      setFreeCheques(data?.success && Array.isArray(data.data) ? data.data : []);
      setChequesError(!data?.success);
    }).catch(() => {
      if (active) { setFreeCheques([]); setChequesError(true); }
    }).finally(() => { if (active) setChequesLoading(false); });
    return () => { active = false; };
  }, [open, _formState.type]);

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      _setFormState((prev) => ({
        ...prev,
        url_file: [],
      }));
      return;
    }
    if (!isInitialized && open) {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      _setFormState({
        ...(item || {}),
        date_at: (item && item.date_at) || formattedDate,
        type: (item && item.type) || "",
        url_file: Array.isArray((item as any)?.url_file)
          ? ((item as any).url_file as string[])
          : [],
      });
      setIsInitialized(true);
    }
  }, [open, item, isInitialized]);

  const handleChangeInput = useCallback(
    (
      e:
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | {
            target: {
              name: string;
              value: any;
              type?: string;
              checked?: boolean;
            };
          }
    ) => {
      const { name, value, type } = e.target;
      let newValue = value;
      if (type === "checkbox" && "checked" in e.target) {
        newValue = (e.target as HTMLInputElement).checked ? "Y" : "N";
      }
      if (name === "category_id") {
        _setFormState((prev) => ({
          ...prev,
          [name]: newValue,
          subcategory_id: "",
        }));
        if (newValue && extraData?.subcategories) {
          const filtered = extraData.subcategories.filter(
            (subcat) => subcat.category_id === Number(String(newValue))
          );
          setFilteredSubcategories(filtered || []);
        } else {
          setFilteredSubcategories([]);
        }
      } else if (name === "type") {
        _setFormState((prev) => ({ ...prev, type: newValue, cheque_id: null, cheque_payee: newValue === "C" ? prev.cheque_payee : "" }));
      } else if (name === "cheque_id") {
        const selected = freeCheques.find((cheque) => String(cheque.id) === String(newValue));
        _setFormState((prev) => ({ ...prev, cheque_id: newValue, bank_account_id: selected?.bank_account_id ?? prev.bank_account_id }));
      } else if (name === "supplier_id") {
        const supplier = extraData?.suppliers?.find((entry) => String(entry.id) === String(newValue));
        _setFormState((prev) => {
          const previousSupplier = extraData?.suppliers?.find((entry) => String(entry.id) === String(prev.supplier_id));
          const payeeWasAutomatic = !prev.cheque_payee?.trim() || prev.cheque_payee === previousSupplier?.name;
          return { ...prev, supplier_id: newValue, cheque_payee: payeeWasAutomatic ? supplier?.name || "" : prev.cheque_payee };
        });
      } else {
        _setFormState((prev) => ({ ...prev, [name]: newValue }));
      }
    },
    [extraData?.subcategories, extraData?.suppliers, freeCheques]
  );
  const validar = useCallback(() => {
    let errs: Errors = {};

    const addError = (
      result: string | Record<string, string> | null,
      key: string
    ) => {
      if (typeof result === "string" && result) {
        errs[key] = result;
      } else if (result && typeof result === "object") {
        Object.entries(result).forEach(([k, v]) => {
          if (v) errs[k] = v;
        });
      }
    };

    addError(
      checkRules({
        value: _formState.date_at,
        rules: ["required"],
        key: "date_at",
        errors: errs,
      }),
      "date_at"
    );
    addError(
      checkRules({
        value: _formState.category_id,
        rules: ["required"],
        key: "category_id",
        errors: errs,
      }),
      "category_id"
    );
    addError(
      checkRules({
        value: _formState.subcategory_id,
        rules: ["required"],
        key: "subcategory_id",
        errors: errs,
      }),
      "subcategory_id"
    );
    addError(
      checkRules({
        value: _formState.description,
        rules: ["required", "max:500"],
        key: "description",
        errors: errs,
      }),
      "description"
    );
    addError(
      checkRules({
        value: _formState.amount,
        rules: ["required", "max:10"],
        key: "amount",
        errors: errs,
      }),
      "amount"
    );
    addError(
      checkRules({
        value: _formState.type,
        rules: ["required"],
        key: "type",
        errors: errs,
      }),
      "type"
    );
    if (_formState.type === "C") {
      if (!_formState.cheque_id) errs.cheque_id = "Selecciona un cheque libre";
      if (!_formState.cheque_payee?.trim()) errs.cheque_payee = "Ingresa el beneficiario del cheque";
    }


    const filteredErrs = Object.fromEntries(
      Object.entries(errs).filter(
        ([_, v]) => typeof v === "string" && v !== undefined
      )
    );
    set_Errors(filteredErrs);

    if (Object.keys(errs).length > 0) {
      setTimeout(() => {
        const firstErrorElement =
          document.querySelector(`.${styles.error}`) ||
          document.querySelector(".error");
        if (firstErrorElement) {
          (firstErrorElement as HTMLElement).scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        } else {
          const modalBody = document.querySelector(".data-modal-body");
          if (modalBody) (modalBody as HTMLElement).scrollTop = 0;
        }
      }, 100);
    }
    return Object.keys(errs).length === 0;
  }, [_formState]);

  const onCloseModal = useCallback(() => {
    setIsInitialized(false);
    _setFormState((prev) => ({
      date_at: new Date().toISOString().split("T")[0],
      type: "",
      category_id: "",
      subcategory_id: "",
      description: "",
      amount: "",
      url_file: [],
      cheque_id: null,
      cheque_payee: "",
    }));
    setFilteredSubcategories([]);
    set_Errors({});
    onClose();
  }, [onClose, set_Errors]);

  const paymentMethods = [
    { id: "T", name: "Transferencia bancaria" },
    { id: "O", name: "Pago en oficina" },
    { id: "Q", name: "Pago QR" },
    { id: "E", name: "Efectivo" },
    { id: "C", name: "Cheque" },
  ];

  const handleSave = useCallback(() => {
    if (!validar()) return;

    const {
      date_at,
      category_id,
      subcategory_id,
      description,
      amount,
      type,
      url_file,
      supplier_id,
      cheque_id,
      cheque_payee,
    } = _formState;

    const searchSubcategory: any = extraData?.subcategories?.find(
      (subcat) => subcat.id === _formState.subcategory_id
    );
    const mainAccount: any = extraData?.bankAccounts?.find(
      (bank: any) => bank.is_main == 1
    );

    const resolvedDefault =
      searchSubcategory?.bank_account_id ??
      searchSubcategory?.padre?.bank_account_id ??
      (mainAccount ? mainAccount.id : null);

    // Prefer user-selected bank_account_id; if absent, use resolved default
    let bank_account_id =
      _formState.bank_account_id !== undefined &&
      _formState.bank_account_id !== null &&
      String(_formState.bank_account_id).trim() !== ""
        ? _formState.bank_account_id
        : resolvedDefault;

    const params = {
      date_at,
      category_id,
      subcategory_id: subcategory_id || null,
      description,
      amount: parseFloat(String(amount || "0")),
      type,
      url_file: Array.isArray(url_file) ? url_file : [],
      bank_account_id: type === "C" && cheque_id
        ? freeCheques.find((cheque) => String(cheque.id) === String(cheque_id))?.bank_account_id || null
        : bank_account_id || null,
      supplier_id: supplier_id && supplier_id !== "NONE" ? Number(supplier_id) : null,
      ...(type === "C" ? { cheque_id: Number(cheque_id), cheque_payee: cheque_payee?.trim() } : {}),
    };

    onSave?.(params);
  }, [_formState, validar, onSave, freeCheques]);

  useEffect(() => {
    const searchSubcategory: any = extraData?.subcategories?.find(
      (subcat) => subcat.id === _formState.subcategory_id
    );

    const resolved = (() => {
      if (!searchSubcategory) return null;
      if (searchSubcategory?.bank_account_id) return searchSubcategory.bank_account_id;
      if (searchSubcategory?.padre?.bank_account_id) return searchSubcategory.padre.bank_account_id;
      return null;
    })();

    // Enable bank select only when category+subcategory selected and subcategory has linked account
    if (_formState.category_id && _formState.subcategory_id && resolved !== null) {
      setBankEnabled(true);
      // if no explicit bank_account_id in form state, set the resolved default
      _setFormState((prev) => ({
        ...prev,
        bank_account_id: prev.bank_account_id ?? resolved,
      }));
    } else {
      setBankEnabled(false);
      // clear bank_account_id if disabling
      _setFormState((prev) => ({ ...prev, bank_account_id: prev.bank_account_id ?? null }));
    }
  }, [_formState.subcategory_id, _formState.category_id, extraData?.subcategories]);

  const resolveBankAccountId = () => {
    const searchSubcategory: any = extraData?.subcategories?.find(
      (subcat) => subcat.id === _formState.subcategory_id
    );
    const mainAccount: any = extraData?.bankAccounts?.find(
      (bank: any) => bank.is_main == 1
    );

    if (searchSubcategory?.bank_account_id) return searchSubcategory.bank_account_id;
    if (searchSubcategory?.padre?.bank_account_id) return searchSubcategory.padre.bank_account_id;
    if (mainAccount) return mainAccount.id;
    return null;
  };
  const getOptionsBankAccounts = useCallback(() => {
    return extraData?.bankAccounts?.map((bank: any) => ({
      id: bank.id,
      name:
        bank.holder + " - " + bank.alias_holder + " - " + bank.account_number,
    }));
  }, [extraData?.bankAccounts]);
  return (
    <>
      <Toast toast={toast} showToast={showToast} />
      <DataModal
        open={open}
        onClose={onCloseModal}
        onSave={handleSave}
        buttonCancel="Cancelar"
        buttonText={"Crear egreso"}
        title={"Crear egreso"}
        variant={"mini"}
      >
        <div className={styles["outlays-form-container"]}>
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
                error={_errors}
                className={_errors.date_at ? styles.error : ""}
              />
            </div>
          </div>
          {/* Categoría y Subcategoría */}
          <div className={styles.section}>
            <div className={styles["two-column-container"]}>
              <div className={styles.column}>
                <div className={styles["input-container"]}>
                  <Select
                    name="category_id"
                    value={_formState.category_id || ""}
                    label="Categoría"
                    onChange={handleChangeInput}
                    options={extraData?.categories || []}
                    error={_errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    className={_errors.category_id ? styles.error : ""}
                  />
                </div>
              </div>
              <div className={styles.column}>
                <div className={styles["input-container"]}>
                  <Select
                    name="subcategory_id"
                    value={_formState.subcategory_id || ""}
                    label="Subcategoría"
                    onChange={handleChangeInput}
                    options={filteredSubcategories}
                    error={_errors}
                    required={true}
                    optionLabel="name"
                    optionValue="id"
                    disabled={!_formState.category_id}
                    className={_errors.subcategory_id ? styles.error : ""}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.section}>
            <Select
              name="supplier_id"
              value={_formState.supplier_id ?? "NONE"}
              label="Proveedor (opcional)"
              onChange={handleChangeInput}
              options={[
                { id: "NONE", name: "Sin proveedor" },
                ...(extraData?.suppliers || []),
              ]}
              filter
              required={false}
              optionLabel="name"
              optionValue="id"
            />
          </div>
          <div className={styles['input-container']}>
            <Select
              name="bank_account_id"
              value={
                bankEnabled
                  ? (_formState.bank_account_id !== undefined && _formState.bank_account_id !== null
                      ? String(_formState.bank_account_id)
                      : (resolveBankAccountId() !== null ? String(resolveBankAccountId()) : "") )
                  : ""
              }
              label="Cuenta bancaria"
              onChange={handleChangeInput}
              options={getOptionsBankAccounts() || []}
              error={_errors}
              optionLabel="name"
              optionValue="id"
              disabled={!bankEnabled || (_formState.type === "C" && Boolean(_formState.cheque_id))}
              className={_errors.bank_account_id ? styles.error : ""}
            />
          </div>
          {/* Monto y Método de pago */}
          <div className={styles["two-column-container"]}>
            <div className={styles.column}>
              <div className={styles.section}>
                <div className={styles["input-container"]}>
                  <Input
                    type="currency"
                    name="amount"
                    label="Monto del pago"
                    value={_formState.amount || ""}
                    onChange={handleChangeInput}
                    error={_errors}
                    required
                    maxLength={10}
                    className={_errors.amount ? styles.error : ""}
                  />
                </div>
              </div>
            </div>
            <div className={styles.column}>
              <div className={styles.section}>
                <div className={styles["input-container"]}>
                  <Select
                    name="type"
                    value={_formState.type || ""}
                    label="Método de pago"
                    onChange={handleChangeInput}
                    options={paymentMethods}
                    error={_errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    className={_errors.type ? styles.error : ""}
                  />
                </div>
              </div>
            </div>
          </div>
          {_formState.type === "C" ? <div className={styles.section}>
            <Select
              name="cheque_id"
              value={_formState.cheque_id || ""}
              label="Cheque libre"
              onChange={handleChangeInput}
              options={freeCheques.map((cheque) => {
                const account: any = extraData?.bankAccounts?.find((bank: any) => Number(bank.id) === Number(cheque.bank_account_id));
                return { id: cheque.id, name: `N.º ${cheque.number} · ${account?.alias_holder || "Cuenta"}${cheque.book?.name ? ` · ${cheque.book.name}` : ""}` };
              })}
              filter required error={_errors} disabled={chequesLoading || chequesError}
            />
            {chequesLoading ? <p>Buscando cheques libres…</p> : null}
            {chequesError ? <p>No se pudieron cargar los cheques. Cierra y vuelve a abrir el formulario.</p> : null}
            {!chequesLoading && !chequesError && !freeCheques.length ? <p>No hay cheques libres. Crea un talonario en Finanzas → Cheques.</p> : null}
            <Input name="cheque_payee" label="Beneficiario del cheque" value={_formState.cheque_payee || ""}
              onChange={handleChangeInput} error={_errors} maxLength={160} required />
          </div> : null}
          {/* Comprobante */}
          <div className={styles.section}>
            <div className={styles["input-container"]}>
              {open && (
                <UploadFileV3
                  name="url_file"
                  formState={_formState}
                  setFormState={_setFormState}
                  mode="all"
                  cant={10}
                  maxMB={20}
                  error={_errors}
                  title="Cargar comprobantes"
                  subtitle="Adjunta imágenes, PDF o archivos de oficina"
                />
              )}
            </div>
          </div>
          {/* Concepto del pago */}
          <div className={styles.section}>
            <TextArea
              name="description"
              label="Concepto"
              value={_formState.description || ""}
              onChange={handleChangeInput}
              error={_errors}
              required
              maxLength={500}
              className={_errors.description ? styles.error : ""}
            />
            {_formState.description && _formState.description.length > 0 && (
              <p className={styles["char-count"]}>
                {_formState.description.length}/500 caracteres
              </p>
            )}
          </div>
          {/* Mostrar errores generales si existen */}
          {_errors.general && (
            <div className={`${styles.section} ${styles["error-general"]}`}>
              <p className={styles["error-message"]}>{_errors.general}</p>
            </div>
          )}
        </div>
      </DataModal>
    </>
  );
};

export default RenderForm;
