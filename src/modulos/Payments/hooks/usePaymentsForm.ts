import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { getFullName } from "@/mk/utils/string";
import { MONTHS_S } from "@/mk/utils/date";
import { getTitular } from "@/mk/utils/adapters";
import { paymentsApi } from "../api";
import { useAuth } from "@/mk/contexts/AuthProvider";
import { FormPaymentType } from "../Type/PaymentType";
import { CategoryFixed } from "@/modulos/Categories/Type/CategoryType";

export interface Dpto {
  id: string | number;
  nro: string;
  description: string;
  holder?: "H" | "T";
  homeowner?: any;
  tenant?: any;
  type?: {
    id?: string | number;
    name?: string;
    description?: string;
  };
  titular?: {
    owner?: {
      id?: string | number;
      name?: string;
      [key: string]: unknown;
    };
  };
}

export interface Category {
  id: string | number;
  name: string;
  fixed?: string;
  hijos?: Subcategory[];
}

export interface Subcategory {
  id: string | number;
  name: string;
  fixed?: string;
}

export interface ClientConfig {
  cat_expensas: string | number;
  cat_reservations: string | number;
  cat_forgiveness: string | number;
}

export interface ExtraData {
  dptos: Dpto[];
  categories: Category[];
  client_config: ClientConfig;
  bankAccounts: any[];
  subcategories: any[];
}

export interface Deuda {
  id: string | number;
  amount?: number;
  penalty_amount?: number;
  status?: string;
  debt_id?: string | null;
  dpto_id?: number;
  payment_id?: string | null;
  shared_id?: string | null;
  type?: number;
  year?: number;
  month?: number;
  maintenance_amount?: string | null;
  begin_at?: string;
  due_at?: string;
  description?: string;
  subcategory?: object | any;
  penalty_reservation?: {
    id?: string;
    debt_id?: string;
    area_id?: string;
    date_at?: string;
    date_end?: string;
    paid_at?: string | null;
    created_at?: string;
    area?: {
      id?: string;
      title?: string;
      description?: string;
    };
  };
  reservation?: {
    id?: string;
    debt_id?: string;
    area_id?: string;
    date_at?: string;
    date_end?: string;
    paid_at?: string | null;
    created_at?: string;
    area?: {
      id?: string;
      title?: string;
      description?: string;
    };
  };
  debt?: {
    type?: number;
    month?: number;
    year?: number;
    method?: number;
    description?: string;
    due_at?: string;
    status?: string;
    reservation?: {
      id?: string;
      debt_id?: string;
      area_id?: string;
      date_at?: string;
      date_end?: string;
      paid_at?: string | null;
      created_at?: string;
      area?: {
        id?: string;
        title?: string;
        description?: string;
      };
    };
    penalty_reservation?: {
      id?: string;
      debt_id?: string;
      area_id?: string;
      date_at?: string;
      date_end?: string;
      paid_at?: string | null;
      created_at?: string;
      area?: {
        id?: string;
        title?: string;
        description?: string;
      };
    };
  } | null;
  shared?: {
    id?: string;
    year?: number;
    month?: number;
    type?: number;
    begin_at?: string;
    due_at?: string;
    description?: string;
    amount_type?: string;
  };
}

export interface SelectedPeriodo {
  id: string | number;
  amount: number;
  bank_account_id?: string | number;
}

export interface FormState {
  paid_at?: string;
  file?: string | null;
  url_file?: string[] | null;
  filename?: string | null;
  ext?: string | null;
  dpto_id?: string | number;
  category_id?: string | number;
  subcategory_id?: string | number;
  subcategories?: Subcategory[];
  isSubcategoryLocked?: boolean;
  isCategoryLocked?: boolean;
  isAmountLocked?: boolean;
  method?: string;
  voucher?: string;
  obs?: string;
  amount?: number | string;
  type?: FormPaymentType;
  owner_id?: string | number;
  // S86 inline-create-expense: cuando type === EXPENSE y el admin quiere
  // registrar una expensa que aún no fue creada (pago adelantado, etc.),
  // pineá createExpense=true + expenseMonth/Year/Description. El backend
  // crea la DebtDpto en la misma transacción que el pago.
  createExpense?: boolean;
  expenseMonth?: number | string;
  expenseYear?: number | string;
  expenseDescription?: string;
}

export interface Errors {
  general?: string;
  selectedPeriodo?: string;
  dpto_id?: string;
  category_id?: string;
  subcategory_id?: string;
  method?: string;
  voucher?: string;
  amount?: string;
  file?: string;
  paid_at?: string;
  type?: string;
  expenseMonth?: string;
  expenseYear?: string;
  [key: string]: string | undefined;
}

export interface RenderFormProps {
  open: boolean;
  onClose: () => void;
  item?: FormState;
  onSave?: () => void;
  extraData: ExtraData;
  execute: (...args: any[]) => Promise<any>;
  showToast: (
    msg: string,
    type: "info" | "success" | "error" | "warning"
  ) => void;
  reLoad: () => void;
  debtId?: string | number;
}

export const usePaymentsForm = (
  props: Omit<RenderFormProps, "open">,
  open: boolean
) => {
  const { item, extraData, execute, showToast, reLoad, onClose, debtId } = props;
  const { store } = useAuth();

  const [formState, setFormState] = useState<FormState>(() => {
    const isCategoryLocked = item?.isCategoryLocked || false;
    const isSubcategoryLocked = item?.isSubcategoryLocked || false;
    const isAmountLocked = item?.isAmountLocked || false;

    return {
      paid_at: item?.paid_at || new Date().toISOString().split("T")[0],
      type: item?.type,
      file: item?.file || null,
      url_file: Array.isArray(item?.url_file) ? item.url_file : [],
      filename: item?.filename || null,
      ext: item?.ext || null,
      dpto_id: item?.dpto_id || "",
      category_id: item?.category_id || "",
      subcategory_id: item?.subcategory_id || "",
      subcategories: [],
      isCategoryLocked,
      isSubcategoryLocked,
      isAmountLocked,
      method: item?.method || "",
      voucher: item?.voucher || "",
      obs: item?.obs || "",
      amount: item?.amount || "",
      owner_id: item?.owner_id || "",
      // S86 inline-create-expense: si el item entrante ya tiene el flag (caso
      // deep-link / re-edición), lo respetamos; si no, default false.
      createExpense: item?.createExpense || false,
      expenseMonth: item?.expenseMonth ?? new Date().getMonth() + 1,
      expenseYear: item?.expenseYear ?? new Date().getFullYear(),
      expenseDescription: item?.expenseDescription || "",
    };
  });

  const [errors, setErrors] = useState<Errors>({});
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<SelectedPeriodo[]>([]);
  const [periodoTotal, setPeriodoTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingDeudas, setIsLoadingDeudas] = useState(false);
  const [simulateResult, setSimulateResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateError, setSimulateError] = useState<string | null>(null);
  // Guard doble-submit: el estado deshabilita el botón del DataModal; el ref
  // corta la reentrada sincrónica (dos clicks antes del re-render de React).
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const showCategoryFields = formState.type === FormPaymentType.DIRECT;
  const isDebtBasedPayment = Boolean(formState.type && formState.type !== FormPaymentType.DIRECT);

  const isExpensasWithoutDebt = useMemo(() => {
    // S86 inline-create-expense: si el flag está activo, vamos a crear la
    // deuda AHORA, así que "no hay deudas" ya no es un estado de error.
    if (formState.createExpense) return false;
    return formState.type === FormPaymentType.EXPENSE && deudas.length === 0 && !isLoadingDeudas;
  }, [formState.type, formState.createExpense, deudas.length, isLoadingDeudas]);

  const isReservationsWithoutDebt = useMemo(() => {
    return formState.type === FormPaymentType.RESERVATION && deudas.length === 0 && !isLoadingDeudas;
  }, [formState.type, deudas.length, isLoadingDeudas]);

  const lDptos = useMemo(
    () =>
      extraData?.dptos?.map((dpto: Dpto) => {
        const titular = getTitular(dpto);
        const unidad = [dpto?.type?.name, dpto?.nro].filter(Boolean).join(" ");
        const name = [unidad, dpto?.description, getFullName(titular ?? {})]
          .filter(Boolean)
          .join(" - ");

        return {
          id: dpto.nro,
          name,
          dpto_id: dpto.id,
        };
      }) || [],
    [extraData?.dptos, store.Unitstype]
  );

  const lastLoadedDeudas = useRef<string>("");

  const findSelectedDpto = useCallback(
    (dptoKey: string | number) =>
      extraData?.dptos?.find(
        (dpto) =>
          String(dpto.nro) === String(dptoKey) ||
          String(dpto.id) === String(dptoKey)
      ),
    [extraData?.dptos]
  );

  const getDeudas = useCallback(
    async (nroDpto: string | number, paymentmethod: FormPaymentType) => {
      if (!nroDpto || !paymentmethod || paymentmethod === FormPaymentType.DIRECT) return;

      const selectedDpto = findSelectedDpto(nroDpto);
      const realDptoId = selectedDpto?.id;

      if (!realDptoId) return;

      setIsLoadingDeudas(true);
      try {
        const { data } = await execute(
          paymentsApi.adminDebts,
          "GET",
          {
            dptoId: realDptoId,
            type: paymentmethod,
          },
          false,
          true
        );

        if (data?.success) {
          const deudasArray: Deuda[] = data?.data?.deudas || [];

          const deudasArrayOrdenado = deudasArray.toSorted(
            (a, b) =>
              (a.year ?? 0) - (b.year ?? 0) ||
              (a.month ?? 0) - (b.month ?? 0)
          );
          setDeudas(deudasArrayOrdenado);
          if (deudasArrayOrdenado.length === 0) {
            setSelectedPeriodo([]);
            setPeriodoTotal(0);
          }
        }
      } catch (err) {
      } finally {
        setIsLoadingDeudas(false);
      }
    },
    [execute, findSelectedDpto]
  );

  const filteredCategories = useMemo(() => {
    const list = extraData?.categories || [];
    return list.filter((cat) => Number(cat.fixed) !== CategoryFixed.YES);
  }, [extraData?.categories]);

  const getSubtotal = useCallback((periodo: Deuda) => {
    const totalRemainingAmount = Number((periodo as any)?.total_remaining_amount);
    if (Number.isFinite(totalRemainingAmount) && totalRemainingAmount > 0) {
      return Math.round(totalRemainingAmount * 100) / 100;
    }

    const amount = parseFloat(String(periodo?.amount)) || 0;
    const penaltyAmount = parseFloat(String(periodo?.penalty_amount)) || 0;
    const maintenanceAmount = parseFloat(String(periodo?.maintenance_amount)) || 0;

    let total;
    if (Number(periodo?.type) === 3) {
      total = penaltyAmount + maintenanceAmount;
    } else {
      total = amount + penaltyAmount + maintenanceAmount;
    }

    return Math.round(total * 100) / 100;
  }, []);

  const getConceptByType = useCallback((periodo: Deuda) => {
    const type = periodo?.type;

    switch (type) {
      case 1: {
        const monthNum = periodo?.month ?? periodo?.shared?.month;
        const yearNum = periodo?.year ?? periodo?.shared?.year;
        if (monthNum != null && yearNum != null) {
          const monthIndex = Math.max(1, Math.min(12, Number(monthNum)));
          const monthName = MONTHS_S[monthIndex] || String(monthNum);
          return `${monthName} ${yearNum}`;
        }
        return "-/-";
      }
      case 2:
        return `Reserva: ${periodo?.reservation?.area?.title || "-/-"}`;
      case 3:
        return `Multa por Cancelación: ${
          periodo?.penalty_reservation?.area?.title || "-/-"
        }`;
      case 0:
      case 4:
        return periodo?.description || "-/-";
      default:
        return (
          periodo?.description ||
          periodo?.shared?.description ||
          "-/-"
        );
    }
  }, []);

  const getDebtType = useCallback((type: number) => {
    switch (type) {
      case 0:
        return "Individual";
      case 1:
        return "Expensas";
      case 2:
        return "Reservas";
      case 3:
        return "Multa por Cancelación";
      case 4:
        return "Compartida";
      case 5:
        return "Condonación";
      default:
        return "Desconocido";
    }
  }, []);

  useEffect(() => {
    if (extraData?.categories && formState.category_id && showCategoryFields) {
      const selectedCategory = extraData.categories?.find(
        (cat: Category) => String(cat.id) === String(formState.category_id)
      );

      if (selectedCategory?.hijos) {
        setFormState((prev: FormState) => ({
          ...prev,
          subcategories: selectedCategory.hijos || [],
        }));
      }
    }
  }, [extraData?.categories, formState.category_id, showCategoryFields]);

  useEffect(() => {
    if (
      open &&
      item &&
      item.category_id &&
      item.subcategory_id &&
      extraData?.categories &&
      showCategoryFields
    ) {
      const selectedCategory = extraData.categories?.find(
        (cat: Category) => String(cat.id) === String(item.category_id)
      );

      if (selectedCategory?.hijos) {
        setFormState((prev: FormState) => ({
          ...prev,
          subcategories: selectedCategory.hijos || [],
        }));
      }
    }
  }, [open, item, extraData?.categories, showCategoryFields]);

  useEffect(() => {
    if (!open) {
      setIsInitialized(false);
      return;
    }

    if (!isInitialized && open) {
      setIsInitialized(true);

      if (item && item.dpto_id && item.type && item.type !== FormPaymentType.DIRECT) {
        const deudasKey = `${item.dpto_id}_${item.type}`;
        lastLoadedDeudas.current = deudasKey;
        getDeudas(item.dpto_id, item.type);
      }
    }

    return () => {
      if (!open) {
        setDeudas([]);
        setFormState({});
        setSelectedPeriodo([]);
        setPeriodoTotal(0);
      }
    };
  }, [open, item, getDeudas, isInitialized]);

  useEffect(() => {
    if (formState.dpto_id && formState.type && formState.type !== FormPaymentType.DIRECT) {
      const deudasKey = `${formState.dpto_id}_${formState.type}`;
      if (deudasKey !== lastLoadedDeudas.current || deudas.length === 0) {
        lastLoadedDeudas.current = deudasKey;
        setSelectedPeriodo([]);
        setPeriodoTotal(0);
        getDeudas(formState.dpto_id, formState.type);
      }
    } else {
      if (deudas.length > 0 || isLoadingDeudas) {
        setDeudas([]);
        setSelectedPeriodo([]);
        setPeriodoTotal(0);
        lastLoadedDeudas.current = "";
      }
    }
  }, [formState.dpto_id, formState.type, getDeudas, deudas.length]);

  useEffect(() => {
    if (
      showCategoryFields &&
      (!item || (!formState.isCategoryLocked && !formState.isSubcategoryLocked))
    ) {
      let newSubcategories: Subcategory[] = [];
      let newSubcategoryId: string | number = "";
      let lockSubcategory = false;

      if (formState.category_id && extraData?.categories) {
        const selectedCategory = extraData.categories?.find(
          (category: Category) =>
            String(category.id) === String(formState.category_id)
        );

        if (selectedCategory?.hijos) {
          newSubcategories = (selectedCategory.hijos || []).filter(
            (hijo: Subcategory) => Number(hijo.fixed) !== CategoryFixed.YES
          );

          const catExpensasChild = newSubcategories.find(
            (hijo: Subcategory) =>
              String(hijo.id) === String(extraData?.client_config?.cat_expensas)
          );
          const catReservationsChild = newSubcategories.find(
            (hijo: Subcategory) =>
              String(hijo.id) ===
              String(extraData?.client_config?.cat_reservations)
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

      setFormState((prev: FormState) => {
        if (item && (prev.isCategoryLocked || prev.isSubcategoryLocked)) {
          return {
            ...prev,
            subcategories: newSubcategories,
          };
        }

        if (prev.subcategory_id !== newSubcategoryId || !prev.category_id) {
          setDeudas([]);
          setSelectedPeriodo([]);
          setPeriodoTotal(0);
          lastLoadedDeudas.current = "";
        }

        return {
          ...prev,
          subcategories: newSubcategories,
          subcategory_id:
            prev.subcategory_id !== newSubcategoryId || !prev.category_id
              ? newSubcategoryId
              : prev.subcategory_id,
          isSubcategoryLocked: lockSubcategory,
        };
      });
    }
  }, [
    formState.category_id,
    extraData?.categories,
    extraData?.client_config?.cat_expensas,
    item,
    formState.isCategoryLocked,
    formState.isSubcategoryLocked,
    showCategoryFields,
  ]);

  useEffect(() => {
    if (debtId && deudas.length > 0) {
      const targetDebt = deudas.find(
        (deuda) => String(deuda.id) === String(debtId)
      );
      if (targetDebt) {
        const calculatedAmount = getSubtotal(targetDebt);

        const newSelectedPeriodo: SelectedPeriodo = {
          id: targetDebt.id,
          amount: calculatedAmount,
        };

        setSelectedPeriodo([newSelectedPeriodo]);
        setPeriodoTotal(calculatedAmount);

        if (formState.isAmountLocked) {
          setFormState((prev) => ({
            ...prev,
            amount: calculatedAmount.toFixed(2),
          }));
        }
      }
    }
  }, [debtId, deudas, formState.isAmountLocked, getSubtotal]);

  const handleChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      let newValue: string | number | boolean = value;
      if (type === "checkbox" && e.target instanceof HTMLInputElement) {
        newValue = e.target.checked ? "Y" : "N";
      }

      if (name === "type") {
        // El Select emite el id numérico del enum; lo normalizamos a FormPaymentType.
        const typeValue =
          newValue === "" || newValue == null
            ? undefined
            : (Number(newValue) as FormPaymentType);
        setFormState((prev: FormState) => ({
          ...prev,
          type: typeValue,
          category_id: "",
          subcategory_id: "",
          subcategories: [],
          // Cambio de tipo → reset del flag createExpense y del amount (si era
          // debt-based con periodoTotal pre-rellenado, ya no aplica).
          createExpense: false,
          amount: "",
        }));
        setDeudas([]);
        setSelectedPeriodo([]);
        setPeriodoTotal(0);
        setSimulateResult(null);
        setSimulateError(null);
        lastLoadedDeudas.current = "";
        if (typeValue && typeValue !== FormPaymentType.DIRECT && formState.dpto_id) {
          setTimeout(() => {
            const deudasKey = `${formState.dpto_id}_${typeValue}`;
            lastLoadedDeudas.current = deudasKey;
            if (formState.dpto_id) {
              getDeudas(formState.dpto_id, typeValue);
            }
          }, 0);
        }
      } else {
        setFormState((prev: FormState) => ({
          ...prev,
          [name]: newValue,
        }));
      }
    },
    [formState.dpto_id, getDeudas]
  );

  const handleSelectAllPeriodos = useCallback(() => {
    if (selectedPeriodo.length === deudas.length) {
      setSelectedPeriodo([]);
      setPeriodoTotal(0);
    } else {
      const allPeriodos = deudas.map((periodo) => ({
        id: periodo.id,
        amount: getSubtotal(periodo),
      }));

      const totalAmount = allPeriodos.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const roundedTotal = Math.round(totalAmount * 100) / 100;

      setSelectedPeriodo(allPeriodos);
      setPeriodoTotal(roundedTotal);
    }
  }, [deudas, selectedPeriodo.length, getSubtotal]);

  const handleSelectPeriodo = useCallback((periodo: Deuda) => {
    const subtotal = getSubtotal(periodo);

    setSelectedPeriodo((prev) => {
      const exists = prev.some((item) => item.id === periodo.id);

      let newSelectedPeriodos;
      if (exists) {
        newSelectedPeriodos = prev.filter((item) => item.id !== periodo.id);
      } else {
        newSelectedPeriodos = [
          ...prev,
          {
            id: periodo.id,
            amount: subtotal,
            bank_account_id: periodo?.subcategory?.bank_account_id,
          },
        ];
      }

      const newTotal = newSelectedPeriodos.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      const roundedTotal = Math.round(newTotal * 100) / 100;
      setPeriodoTotal(roundedTotal);

      return newSelectedPeriodos;
    });
  }, [getSubtotal]);

  const runSimulate = useCallback(async () => {
    if (!isDebtBasedPayment || !formState.amount || selectedPeriodo.length === 0) return;
    // S86 inline-create-expense: si la deuda todavía no existe (createExpense=true),
    // no hay nada que simular — el backend la crea con el monto que mandemos y
    // la cascade la paga en la misma transacción. Skip silencioso.
    if (formState.createExpense) return;

    setIsSimulating(true);
    try {
      const { data } = await execute(
        paymentsApi.simulate,
        "POST",
        {
          amount: parseFloat(String(formState.amount)),
          debt_dpto_ids: selectedPeriodo.map((p) => Number(p.id)),
        },
        false,
        true
      );

      if (data?.success) {
        const result = data.data;
        setSimulateResult(result);
        if (result?.is_overpayment === true) {
          setSimulateError("El monto supera la deuda total");
        } else {
          setSimulateError(null);
        }
      }
    } catch (_err) {
      // silent — don't block form submission
    } finally {
      setIsSimulating(false);
    }
  }, [isDebtBasedPayment, formState.amount, formState.createExpense, selectedPeriodo, execute]);

  const handleAmountBlur = useCallback(() => {
    runSimulate();
  }, [runSimulate]);

  const validar = useCallback(() => {
    const err: Errors = {};
    if (!formState.type) {
      err.type = "Este campo es requerido";
    }

    if (isExpensasWithoutDebt) {
      err.general =
        "No se puede registrar un pago de expensas cuando no hay deudas pendientes";
    }
    if (isReservationsWithoutDebt) {
      err.general =
        "No se puede registrar un pago de reservas cuando no hay deudas pendientes";
    }
    if (
      isDebtBasedPayment &&
      deudas?.length > 0 &&
      selectedPeriodo.length === 0 &&
      !formState.createExpense
    ) {
      // S86: si createExpense=true, la deuda todavía no existe; el backend
      // la crea dentro de la misma transacción. selectedPeriodo queda vacío
      // intencionalmente.
      err.selectedPeriodo = "Debe seleccionar al menos una deuda para pagar";
    }

    if (!formState.dpto_id) {
      err.dpto_id = "Este campo es requerido";
    }

    if (showCategoryFields) {
      if (!formState.category_id) {
        err.category_id = "Este campo es requerido";
      }
      if (!formState.subcategory_id) {
        err.subcategory_id = "Este campo es requerido";
      }
    }

    if (!formState.method) {
      err.method = "Este campo es requerido";
    }

    if (!isDebtBasedPayment || deudas?.length === 0) {
      if (!formState.amount) {
        err.amount = "Este campo es requerido";
      }
    } else {
      // Pago basado en deudas: el monto sigue siendo obligatorio. Si el usuario
      // no escribió nada, el submit usa el periodoTotal como fallback para
      // no romper el flujo, pero el error bloquea el guardado para forzar
      // confirmación explícita del monto a registrar.
      if (
        !formState.amount ||
        (typeof formState.amount === "string" && formState.amount.trim() === "") ||
        (typeof formState.amount === "number" && formState.amount <= 0)
      ) {
        err.amount = "Este campo es requerido";
      }
    }

    if (!formState.paid_at) {
      err.paid_at = "Este campo es requerido";
    }

    // S86 inline-create-expense: validar mes/año si createExpense=true.
    if (formState.createExpense) {
      const month = Number(formState.expenseMonth);
      const year = Number(formState.expenseYear);
      if (!month || month < 1 || month > 12) {
        err.expenseMonth = "Mes inválido (1-12)";
      }
      if (!year || year < 2000 || year > 2100) {
        err.expenseYear = "Año inválido";
      }
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  }, [
    formState,
    deudas,
    isExpensasWithoutDebt,
    isReservationsWithoutDebt,
    isDebtBasedPayment,
    selectedPeriodo,
    showCategoryFields,
  ]);

  const _onSavePago = useCallback(async () => {
    if (isSubmittingRef.current) return;
    const isValid = validar();
    if (!isValid) {
      if (errors.general) {
        showToast(errors.general, "error");
      } else {
        showToast("Por favor revise los campos marcados", "warning");
      }
      return;
    }

    let owner_id = formState.owner_id;
    if (!owner_id) {
      const selectedDpto = findSelectedDpto(formState.dpto_id || "");
      const titular = getTitular(selectedDpto);
      owner_id = titular?.id;
    }
    let bank_account_id;
    const existBankAccount = extraData?.bankAccounts?.find(
      (item: any) => item.is_main == 1
    )?.id;

    switch (formState.type) {
      case FormPaymentType.EXPENSE: {
        const id =
          extraData?.bankAccounts?.find((i: any) => i.is_expense == 1)?.id ||
          existBankAccount;
        bank_account_id = id;
        break;
      }
      case FormPaymentType.RESERVATION: {
        const id =
          extraData?.bankAccounts?.find((i: any) => i.is_reserve == 1)?.id ||
          existBankAccount;
        bank_account_id = id;
        break;
      }
      case FormPaymentType.CONDONATION: {
        const sub = extraData?.subcategories?.find(
          (i: any) => i.id == extraData?.client_config?.cat_forgiveness
        );

        const id =
          sub?.bank_account_id ||
          sub?.padre?.bank_account_id ||
          existBankAccount;

        bank_account_id = id;
        break;
      }
      case FormPaymentType.DIRECT: {
        const category: any = extraData?.categories?.find(
          (i: any) => i.id == formState.category_id
        );

        const id =
          category?.hijos?.find((i: any) => i.id == formState.subcategory_id)
            ?.bank_account_id ||
          category?.bank_account_id ||
          existBankAccount;

        bank_account_id = id;
        break;
      }
      case FormPaymentType.OTHER: {
        const id = selectedPeriodo?.[0]?.bank_account_id || existBankAccount;
        bank_account_id = id;
        break;
      }
    }

    const selectedDpto = findSelectedDpto(formState.dpto_id || "");
    const dptoId = Number(selectedDpto?.id || formState.dpto_id);

    // S86 inline-create-expense: si el flag está activo, dejamos debt_dpto_ids
    // vacío y pineamos create_expense + expense_data. El backend crea la
    // DebtDpto dentro de la misma transacción que el pago.
    const shouldCreateExpense = Boolean(
      formState.createExpense && formState.type === FormPaymentType.EXPENSE
    );

    const params: any = {
      dpto_id: dptoId,
      paid_at: formState.paid_at,
      method: Number(formState.method),
      amount: parseFloat(String(
        isDebtBasedPayment && selectedPeriodo.length > 0
          ? formState.amount || periodoTotal
          : formState.amount || "0"
      )),
      debt_dpto_ids:
        shouldCreateExpense
          ? []
          : isDebtBasedPayment
            ? selectedPeriodo.map((p) => Number(p.id))
            : [],
      bank_account_id: bank_account_id,
      obs: formState.obs || "",
      voucher: formState.voucher || "",
      url_file: formState.url_file || [],
    };

    if (shouldCreateExpense) {
      const month = Number(formState.expenseMonth);
      const year = Number(formState.expenseYear);
      // due_at: fin del mes pineado. Si el usuario quiere otra fecha, podría
      // agregarse después; por ahora usamos el último día del mes como
      // convención consistente con el formato Y-m-d que espera el backend.
      const lastDay = new Date(year, month, 0).getDate();
      const dueAt = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

      params.create_expense = true;
      params.expense_data = {
        dpto_id: dptoId,
        amount: params.amount,
        due_at: dueAt,
        description: (formState.expenseDescription || "").trim(),
        month: month,
        year: year,
        // pinear la subcategoría "expensas" del cliente si está disponible,
        // para mantener la consistencia con el resto del módulo que usa
        // client_config.cat_expensas como SSoT.
        subcategory_id: extraData?.client_config?.cat_expensas ?? null,
      };
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const endpoint = paymentsApi.create;
      const { data, error } = await execute(endpoint, "POST", params);

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
          setErrors(error.data.errors);
        } else if (data?.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [
    formState,
    extraData,
    selectedPeriodo,
    periodoTotal,
    validar,
    execute,
    reLoad,
    onClose,
    showToast,
    isDebtBasedPayment,
    showCategoryFields,
    findSelectedDpto,
    errors.general,
  ]);

  const isBankAccountSame = useCallback((periodo: Deuda) => {
    if (
      periodo?.subcategory?.bank_account_id !==
        selectedPeriodo?.[0]?.bank_account_id &&
      selectedPeriodo.length > 0
    ) {
      return true;
    }
    return false;
  }, [selectedPeriodo]);

  const isSubmitDisabled = Boolean(simulateError) || isSubmitting;

  return {
    formState,
    setFormState,
    errors,
    deudas,
    selectedPeriodo,
    periodoTotal,
    isLoadingDeudas,
    lDptos,
    filteredCategories,
    showCategoryFields,
    isDebtBasedPayment,
    handleChangeInput,
    handleSelectAllPeriodos,
    handleSelectPeriodo,
    _onSavePago,
    isBankAccountSame,
    getSubtotal,
    getConceptByType,
    getDebtType,
    simulateResult,
    isSimulating,
    simulateError,
    handleAmountBlur,
    isSubmitDisabled,
  };
};
