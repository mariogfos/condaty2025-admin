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
import Button from "@/mk/components/forms/Button/Button";
import StepProgressBar from "@/components/StepProgressBar/StepProgressBar";
import { FinancialDetailGrid } from "@/features/financial-records/FinancialDetailPrimitives";
import { IncomeSummary } from "./IncomeWizard";
import wizard from "./IncomeWizard.module.css";
import { getFullName } from "@/mk/utils/string";
import {
  MONTHS_S,
  formatToDayDDMMYYYY,
  getBusinessDate,
} from "@/mk/utils/date";
import EmptyData from "@/components/NoData/EmptyData";
import Select from "@/mk/components/forms/Select/Select";
import TextArea from "@/mk/components/forms/TextArea/TextArea";
import Input from "@/mk/components/forms/Input/Input";
import Toast from "@/mk/components/ui/Toast/Toast";
import styles from "./RenderForm.module.css";
import selectionStyles from "@/features/advance-payments/AdvancePaymentFields.module.css";
import Table from "@/mk/components/ui/Table/Table";
import { Check } from "lucide-react";
import UploadFileV3 from "@/mk/components/forms/UploadFileV3/UploadFileV3";
import { formatBs } from "@/mk/utils/numbers";
import { getTitular } from "@/mk/utils/adapters";
import { paymentsApi } from "../api";
import useSubmissionGuard from "@/mk/hooks/useSubmissionGuard";
import AdvancePaymentFields from "@/features/advance-payments/AdvancePaymentFields";
import { advanceApi, type AdvanceDraft } from "@/features/advance-payments/types";

interface Dpto {
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
interface Category {
  id: string | number;
  name: string;
  fixed?: string;
  hijos?: Subcategory[];
}

interface Subcategory {
  id: string | number;
  name: string;
  fixed?: string;
}

interface ClientConfig {
  cat_expensas: string | number;
  cat_reservations: string | number;
  cat_forgiveness: string | number;
  has_maintenance_value?: boolean;
}

interface ExtraData {
  dptos: Dpto[];
  categories: Category[];
  client_config: ClientConfig;
  bankAccounts: any[];
  subcategories: any[];
}
interface Deuda {
  reservation_charge?: { bank_account_id: number } | null;
  id: string | number;
  amount?: number;
  penalty_amount?: number;
  status?: string;
  debt_id?: string | null;
  dpto_id?: number;
  payment_id?: string | null;
  shared_id?: string | null;
  type?: number;
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

interface SelectedPeriodo {
  id: string | number;
  amount: number;
  bank_account_id?: string | number;
}

interface FormState {
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
  type?: string;
  owner_id?: string | number;
}

interface Errors {
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
  [key: string]: string | undefined;
}

interface RenderFormProps {
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

const RenderForm: React.FC<RenderFormProps> = ({
  open,
  onClose,
  item,
  extraData,
  execute,
  showToast,
  reLoad,
  debtId,
}) => {
  const [formState, setFormState] = useState<FormState>(() => {
    const isCategoryLocked = item?.isCategoryLocked || false;
    const isSubcategoryLocked = item?.isSubcategoryLocked || false;
    const isAmountLocked = item?.isAmountLocked || false;

    return {
      paid_at: item?.paid_at || getBusinessDate(),
      type: item?.type || "",
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
    };
  });
  const [errors, setErrors] = useState<Errors>({});
  const { begin: beginCreate, finish: finishCreate, submitting } = useSubmissionGuard();

  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<SelectedPeriodo[]>([]);
  const [periodoTotal, setPeriodoTotal] = useState(0);
  const [advance, setAdvance] = useState<AdvanceDraft | null>(null);
  const [advanceRevision, setAdvanceRevision] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  useEffect(() => { setStep(1); }, [open, formState.dpto_id, formState.type]);
  const advanceEnabled = formState.type === "E" || formState.type === "O";
  const advanceUnit = extraData?.dptos?.find(dpto => String(dpto.nro) === String(formState.dpto_id))
    ?? extraData?.dptos?.find(dpto => String(dpto.id) === String(formState.dpto_id));
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingDeudas, setIsLoadingDeudas] = useState(false);
  const [toast] = useState<{
    msg: string;
    method: "info" | "success" | "error" | "warning";
  }>({
    msg: "",
    method: "info",
  });
  const typeOptions = [
    // { id: 'T', name: 'Todas las deudas' },
    { id: "E", name: "Expensas" },
    { id: "R", name: "Reservas" },
    { id: "F", name: "Condonación" },
    // { id: 'P', name: 'Plan de pago' },
    { id: "O", name: "Otras deudas" },
    { id: "I", name: "Pago directo" },
    // { id: "M", name: "Multas" },
  ];

  const showCategoryFields = formState.type === "I";

  const isDebtBasedPayment = Boolean(formState.type && formState.type !== "I");

  const isExpensasWithoutDebt =
    formState.type === "E" && deudas.length === 0 && !isLoadingDeudas;

  const isReservationsWithoutDebt =
    formState.type === "R" && deudas.length === 0 && !isLoadingDeudas;

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
    [extraData?.dptos]
  );

  const lastLoadedDeudas = useRef<string>("");
  const findSelectedDpto = useCallback(
    (dptoKey: string | number) =>
      extraData?.dptos?.find(
        (dpto) => String(dpto.nro) === String(dptoKey)
      ) ?? extraData?.dptos?.find((dpto) => String(dpto.id) === String(dptoKey)),
    [extraData?.dptos]
  );

  const getDeudas = useCallback(
    async (nroDpto: string | number, paymentmethod: string) => {
      if (!nroDpto || !paymentmethod || paymentmethod === "I") return;
      if (paymentmethod === "E" || paymentmethod === "O") return;

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
              (a.debt?.year ?? 0) - (b.debt?.year ?? 0) ||
              (a.debt?.month ?? 0) - (b.debt?.month ?? 0)
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
    return list.filter((cat) => String(cat.fixed) !== "Y");
  }, [extraData?.categories]);

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

      if (item && item.dpto_id && item.type && item.type !== "I") {
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
  }, [open, item, getDeudas]);

  useEffect(() => {
    if (formState.dpto_id && formState.type && formState.type !== "I") {
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
            (hijo: Subcategory) => String(hijo.fixed) !== "Y"
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
  }, [debtId, deudas, formState.isAmountLocked]);

  const handleChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      let newValue: string | number | boolean = value;
      if (type === "checkbox" && e.target instanceof HTMLInputElement) {
        newValue = e.target.checked ? "Y" : "N";
      }

      if (name === "type") {
        setFormState((prev: FormState) => ({
          ...prev,
          [name]: newValue,
          category_id: "",
          subcategory_id: "",
          subcategories: [],
        }));
        setDeudas([]);
        setSelectedPeriodo([]);
        setPeriodoTotal(0);
        lastLoadedDeudas.current = "";
        if (newValue && newValue !== "I" && formState.dpto_id) {
          setTimeout(() => {
            const deudasKey = `${formState.dpto_id}_${newValue}`;
            lastLoadedDeudas.current = deudasKey;
            if (formState.dpto_id) {
              getDeudas(formState.dpto_id, newValue as string);
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

  const getDebtType = (type: number) => {
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
  };

  const getConceptByType = (periodo: Deuda) => {
    const type = periodo?.type;

    switch (type) {
      case 1: {
        // Expensas: mostrar periodo (MES y YEAR) usando MONTHS_S indexado desde 1
        const monthNum = periodo?.debt?.month ?? periodo?.shared?.month;
        const yearNum = periodo?.debt?.year ?? periodo?.shared?.year;
        if (monthNum != null && yearNum != null) {
          const monthIndex = Math.max(1, Math.min(12, Number(monthNum)));
          const monthName = MONTHS_S[monthIndex] || String(monthNum);
          return `${monthName} ${yearNum}`;
        }
        return "-/-";
      }
      case 2:
        // Reservas: mostrar el nombre del área social
        return `Reserva: ${
          periodo?.debt?.reservation?.area?.title ||
          periodo?.reservation?.area?.title ||
          "-/-"
        }`;
      case 3:
        // Multa por Cancelación
        return `Multa por Cancelación: ${
          periodo?.debt?.penalty_reservation?.area?.title ||
          periodo?.penalty_reservation?.area?.title ||
          "-/-"
        }`;
      case 0:
      case 4:
        // Individual o Compartida: usar descripción
        return periodo?.description || "-/-";
      default:
        // Fallback
        return (
          periodo?.description ||
          periodo?.shared?.description ||
          periodo?.debt?.description ||
          "-/-"
        );
    }
  };

  const getSubtotal = (periodo: Deuda) => {
    const totalRemainingAmount = Number((periodo as any)?.total_remaining_amount);
    if (Number.isFinite(totalRemainingAmount) && totalRemainingAmount > 0) {
      return Math.round(totalRemainingAmount * 100) / 100;
    }

    const amount = parseFloat(String(periodo?.amount)) || 0;
    const penaltyAmount = parseFloat(String(periodo?.penalty_amount)) || 0;
    const maintenanceAmount =
      parseFloat(String(periodo?.maintenance_amount)) || 0;

    let total;

    if (Number(periodo?.type ?? periodo?.debt?.type) === 3) {
      total = penaltyAmount + maintenanceAmount;
    } else {
      total = amount + penaltyAmount + maintenanceAmount;
    }

    return Math.round(total * 100) / 100;
  };

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
  }, [deudas, selectedPeriodo.length]);

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
  }, []);

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
      selectedPeriodo.length === 0
    ) {
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
    }

    // if (!formState.file) {
    //   err.file = "El comprobante es requerido";
    // }

    if (!formState.paid_at) {
      err.paid_at = "Este campo es requerido";
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
    setErrors,
  ]);

  const _onSavePago = useCallback(async () => {
    if (advanceEnabled) {
      if (!advance?.ready || !advance.preview || !advanceUnit || Number(advanceUnit.id) !== advance.payload.unit_id || formState.type !== advance.payload.type) {
        showToast("Selecciona las deudas y revisa el resumen y el motivo antes de guardar.", "warning");
        return;
      }
      if (!formState.paid_at || (advance.preview.net > 0 && !formState.method)) {
        showToast("Indica la fecha y el método de pago.", "warning"); return;
      }
      if (!beginCreate()) return;
      try {
        const bank = advance.preview.items.find(row => row.net && row.net > 0)?.bank_account_id
          || extraData?.bankAccounts?.find((account: any) => formState.type === "E" && account.is_expense == 1)?.id
          || extraData?.bankAccounts?.find((account: any) => account.is_main == 1)?.id;
        const payment = {
          paid_at: formState.paid_at, method: formState.method || null, bank_account_id: bank || null,
          owner_id: formState.owner_id || getTitular(advanceUnit)?.id || null,
          voucher: formState.voucher || null, url_file: formState.url_file, obs: formState.obs,
        };
        const payload = advance.operation ? {
          ...advance.payload, ...payment, version: advance.preview.version, request_key: advance.requestKey, reason: advance.reason.trim(),
        } : { ...payment, amount: advance.preview.net / 100, expected_total: advance.preview.net / 100,
          asignados: advance.preview.items.map(row => ({ id: row.debt_id })) };
        const response = await execute(advance.operation ? advanceApi : paymentsApi.full, "POST", payload);
        if (response.data?.success) {
          showToast(advance.preview.net === 0 ? "Descuentos aplicados sin generar ingreso." : "Ingreso registrado correctamente.", "success");
          reLoad(); onClose();
        } else {
          showToast(response.data?.message || response.error?.data?.message || "No se pudo confirmar el ingreso. Revisa Pagos anticipados antes de reintentar.", "error");
          if (response.data || [409, 422].includes(response.error?.status)) setAdvanceRevision(value => value + 1);
        }
      } catch {
        showToast("No se pudo confirmar el ingreso. Revisa Pagos anticipados antes de reintentar.", "error");
      } finally { finishCreate(); }
      return;
    }
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
      case "E": {
        const id =
          extraData?.bankAccounts?.find((i: any) => i.is_expense == 1)?.id ||
          existBankAccount;
        bank_account_id = id;
        break;
      }
      case "R": {
        const frozenAccount = deudas.find(debt =>
          String(debt.id) === String(selectedPeriodo[0]?.id),
        )?.reservation_charge?.bank_account_id;
        const id =
          frozenAccount ||
          extraData?.bankAccounts?.find((i: any) => i.is_reserve == 1)?.id ||
          existBankAccount;
        bank_account_id = id;
        break;
      }
      case "F": {
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
      case "I": {
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
      case "O": {
        const id = selectedPeriodo?.[0]?.bank_account_id || existBankAccount;

        bank_account_id = id;
        break;
      }
    }

    let params: any = {
      paid_at: formState.paid_at,
      method: formState.method,
      url_file: formState.url_file,
      obs: formState.obs,
      nro_id: formState.dpto_id,
      owner_id: owner_id,
      type: formState.type,
      bank_account_id: bank_account_id,
    };

    if (formState.voucher && String(formState.voucher).length > 0) {
      params.voucher = formState.voucher;
    }

    if (showCategoryFields) {
      params.subcategory_id = formState.subcategory_id;
    }

    if (isDebtBasedPayment && selectedPeriodo.length > 0) {
      params = {
        ...params,
        asignados: selectedPeriodo,
        amount: periodoTotal,
      };
    } else {
      params = {
        ...params,
        amount: parseFloat(String(formState.amount || "0")),
      };
    }
    if (!beginCreate()) return;
    let saved = false;
    try {
      const endpoint = isDebtBasedPayment ? paymentsApi.full : "/payments";
      const { data, error } = await execute(endpoint, "POST", params);
      saved = data?.success === true;

      if (saved) {
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
      showToast("No se pudo confirmar el ingreso. Revisa la lista antes de reintentar.", "error");
    } finally {
      finishCreate();
    }
  }, [
    advanceEnabled, advance, advanceUnit,
    formState,
    extraData?.dptos,
    selectedPeriodo,
    periodoTotal,
    validar,
    execute,
    reLoad,
    onClose,
    setErrors,
    showToast,
    isExpensasWithoutDebt,
    isReservationsWithoutDebt,
    isDebtBasedPayment,
    beginCreate,
    finishCreate,
    deudas,
    showCategoryFields,
  ]);

  const onCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const isBankAccountSame = (periodo: any) => {
    if (
      periodo?.subcategory?.bank_account_id !==
        selectedPeriodo?.[0]?.bank_account_id &&
      selectedPeriodo.length > 0
    ) {
      return true;
    }
    return false;
  };

  const deudasContent = useMemo(() => {
    if (!formState.dpto_id) return <EmptyData message="Selecciona una unidad para consultar sus deudas" h={160} />;
    if (isLoadingDeudas) return <p role="status" className={wizard.note}>Consultando deudas…</p>;
    if (!deudas.length) return <EmptyData message="Esta unidad no tiene deudas disponibles para este tipo de ingreso" h={160} />;
    const maintenance = Boolean(extraData?.client_config?.has_maintenance_value);
    const header = [
      { key: "selected", label: "", responsive: "Seleccionar", width: "44px", className: selectionStyles.selectionColumn,
        onRender: ({ item: row }: { item: Deuda }) => <button type="button" className={selectionStyles.choice}
          aria-label={`Seleccionar deuda ${row.id}`} aria-pressed={selectedPeriodo.some(period => String(period.id) === String(row.id))}
          disabled={submitting || isBankAccountSame(row)} onClick={() => handleSelectPeriodo(row)}>
          {selectedPeriodo.some(period => String(period.id) === String(row.id)) && <Check size={14} strokeWidth={3} />}</button> },
      { key: "type", label: "Tipo", responsive: "Tipo", width: "96px", className: selectionStyles.typeColumn,
        onRender: ({ item: row }: { item: Deuda }) => getDebtType(row.type ?? 0) },
      { key: "concept", label: "Concepto", responsive: "Concepto", width: "100%", className: selectionStyles.copyColumn,
        onRender: ({ item: row }: { item: Deuda }) => <span className={selectionStyles.concept}>{getConceptByType(row)}</span> },
      { key: "amount", label: "Monto", responsive: "Monto", width: "124px", className: selectionStyles.amountColumn,
        onRender: ({ item: row }: { item: Deuda }) => formatBs(Number(row.amount ?? 0)) },
      { key: "penalty_amount", label: "Multa", responsive: "Multa", width: "104px", className: selectionStyles.feeColumn,
        onRender: ({ item: row }: { item: Deuda }) => formatBs(Number(row.penalty_amount ?? 0)) },
      ...(maintenance ? [{ key: "maintenance_amount", label: "Mant. Valor", responsive: "Mant. Valor", width: "124px", className: selectionStyles.amountColumn,
        onRender: ({ item: row }: { item: Deuda }) => formatBs(Number(row.maintenance_amount ?? 0)) }] : []),
    ];
    return <div className={selectionStyles.fields}>
      <div className={selectionStyles.toolbar}><span>{selectedPeriodo.length} deudas seleccionadas</span>
        <div className={selectionStyles.actions}><Button variant="secondary" small disabled={submitting} onClick={handleSelectAllPeriodos}>Seleccionar disponibles</Button></div>
      </div>
      <div className={selectionStyles.table} style={{ height: Math.min(340, 48 + deudas.length * 58) }}>
        <Table id="income-debt-selection" style={{ minWidth: maintenance ? 780 : 656 }} height="100%"
          className={`striped ${selectionStyles.selectionTable}`} header={header} data={deudas} />
      </div>
    </div>;
  }, [formState.dpto_id, formState.type, isLoadingDeudas, deudas, selectedPeriodo, extraData?.client_config?.has_maintenance_value, submitting]);

  const selectedUnit = findSelectedDpto(formState.dpto_id ?? "");
  const matchingPreview = Boolean(advance?.preview?.items.length && advanceUnit
    && Number(advanceUnit.id) === advance?.payload.unit_id && formState.type === advance?.payload.type);
  const selectionReady = Boolean(formState.dpto_id && formState.type
    && (advanceEnabled ? matchingPreview : showCategoryFields ? formState.category_id && formState.subcategory_id : selectedPeriodo.length));
  const zeroIncome = advanceEnabled && matchingPreview && advance?.preview?.net === 0;
  const detailsReady = Boolean(formState.paid_at && (zeroIncome || formState.method) && (!advanceEnabled || advance?.ready));
  const advanceStep = () => {
    if (step === 1) { if (selectionReady) setStep(2); return; }
    if (step === 2) {
      if (advanceEnabled ? !detailsReady : !validar()) return;
      setStep(3); return;
    }
    void _onSavePago();
  };
  const methods = [{ id: "Q", name: "Pago QR" }, { id: "T", name: "Transferencia bancaria" },
    { id: "E", name: "Efectivo" }, { id: "C", name: "Cheque" }, { id: "O", name: "Pago en oficina" }];
  const total = advanceEnabled ? (advance?.preview?.net ?? 0) / 100 : isDebtBasedPayment ? periodoTotal : Number(formState.amount || 0);
  const nextDisabled = submitting || (step === 1 ? !selectionReady : step === 2 ? advanceEnabled && !detailsReady : advanceEnabled && !advance?.ready);
  const voucherFields = <div className={wizard.panel}>
    <UploadFileV3 cant={8} name="url_file" setFormState={setFormState} formState={formState} mode="all" maxMB={20}
      error={errors} title="Comprobante de pago" subtitle="Adjunta el respaldo del ingreso, si corresponde" />
    <Input type="text" label="Número de respaldo de pago" name="voucher" disabled={submitting}
      value={formState.voucher || ""} error={errors} maxLength={50} onChange={event => {
        const value = event.target.value.replace(/[^a-zA-Z0-9]/g, "").substring(0, 50);
        handleChangeInput({ ...event, target: { ...event.target, name: "voucher", value } });
      }} />
  </div>;

  return <>
    <Toast toast={toast as any} showToast={showToast} />
    <DataModal open={open} onClose={submitting ? () => {} : onCloseModal} title="Registrar ingreso" titleClassName={wizard.modalTitle}
      minWidth={1120} maxWidth={1120} buttonText="" buttonCancel="" buttonExtra={
        <div className={wizard.footer}>
          <Button variant="secondary" disabled={submitting} onClick={() => step === 1 ? onCloseModal() : setStep((step - 1) as 1 | 2)}> {step === 1 ? "Cancelar" : "Anterior"}</Button>
          <Button disabled={Boolean(nextDisabled)} onClick={advanceStep}>
            {submitting ? "Guardando…" : step === 1 ? "Continuar" : step === 2 ? "Revisar ingreso" : zeroIncome ? "Aplicar descuentos" : "Registrar ingreso"}
          </Button>
        </div>
      }>
      <div className={wizard.wizard}>
        <StepProgressBar currentStep={step} totalSteps={3} steps={["Seleccionar deudas", "Descuento y pago", "Revisar y confirmar"]}
          disabled={submitting} onStepChange={value => setStep(value as 1 | 2 | 3)} />
        <div className={wizard.layout}>
          <div className={wizard.main}>
            <section className={wizard.panel} hidden={step !== 1}>
              <div className={wizard.heading}><h2>¿Qué vas a registrar?</h2><p>Selecciona la unidad y el tipo de ingreso.</p></div>
              <div className={wizard.row}>
                <Select name="dpto_id" label="Seleccionar Unidad" disabled={submitting} required value={formState.dpto_id}
                  onChange={handleChangeInput} options={lDptos} error={errors} filter />
                <Select name="type" label="Tipo" disabled={submitting} required value={formState.type} onChange={handleChangeInput}
                  options={typeOptions} error={errors} optionLabel="name" optionValue="id" />
              </div>
              {showCategoryFields && <div className={wizard.row}>
                <Select name="category_id" label="Categoría" value={formState.category_id} onChange={handleChangeInput}
                  options={filteredCategories} error={errors} required optionLabel="name" optionValue="id" disabled={formState.isCategoryLocked || submitting} />
                <Select name="subcategory_id" label="Subcategoría" value={formState.subcategory_id} onChange={handleChangeInput}
                  options={formState.subcategories || []} error={errors} required optionLabel="name" optionValue="id" disabled={formState.isSubcategoryLocked || submitting} />
              </div>}
              {isDebtBasedPayment && !advanceEnabled && deudasContent}
              {errors.selectedPeriodo && <p role="alert" className={styles["error-message"]}>{errors.selectedPeriodo}</p>}
            </section>

            {advanceEnabled && advanceUnit && <AdvancePaymentFields key={`${advanceUnit.id}:${formState.type}`}
              unitId={Number(advanceUnit.id)} type={formState.type as "E" | "O"} execute={execute} onChange={setAdvance}
              initialDebtId={debtId} disabled={submitting} revision={advanceRevision} paidAt={formState.paid_at}
              phase={step} maintenanceEnabled={extraData?.client_config?.has_maintenance_value} />}

            <section className={wizard.panel} hidden={step !== 2}>
              <div className={wizard.heading}><h2>{zeroIncome ? "Sin movimiento de dinero" : "Datos del ingreso"}</h2>
                <p>{zeroIncome ? "El descuento cubre el saldo seleccionado. Conservaremos el registro de esta operación." : "Indica cuándo y cómo se recibió el pago."}</p></div>
              <div className={wizard.row}>
                <Input type="date" name="paid_at" label="Fecha del ingreso" disabled={submitting} required value={formState.paid_at || ""}
                  onChange={handleChangeInput} error={errors} />
                {!zeroIncome && <Select name="method" label="Método de pago" disabled={submitting} required value={formState.method}
                  onChange={handleChangeInput} options={methods} error={errors} optionLabel="name" optionValue="id" />}
              </div>
              {showCategoryFields && <Input type="currency" name="amount" label="Monto del ingreso" value={formState.amount}
                onChange={handleChangeInput} disabled={submitting || formState.isAmountLocked} required maxLength={20} error={errors} />}
              {!zeroIncome && voucherFields}
              <TextArea label="Observaciones" name="obs" value={formState.obs || ""} required={false} maxLength={250}
                onChange={event => handleChangeInput({ ...event, target: { ...event.target, name: "obs", value: event.target.value.substring(0, 250) } })} error={errors} />
            </section>

            <section className={wizard.panel} hidden={step !== 3}>
              <div className={wizard.heading}><h2>Revisa antes de confirmar</h2><p>{zeroIncome ? "Se aplicarán los descuentos indicados." : "Se registrará el importe final del resumen."}</p></div>
              <FinancialDetailGrid fields={[
                { id: "unit", label: "Unidad", value: selectedUnit?.nro },
                { id: "type", label: "Tipo de ingreso", value: typeOptions.find(option => option.id === formState.type)?.name },
                { id: "date", label: "Fecha del ingreso", value: formState.paid_at?.split("-").reverse().join("/") },
                { id: "method", label: "Método de pago", value: zeroIncome ? "Saldada por descuento" : methods.find(option => option.id === formState.method)?.name },
                { id: "voucher", label: "Respaldo", value: formState.voucher || "Sin número adicional" },
                { id: "files", label: "Archivos adjuntos", value: String(formState.url_file?.length ?? 0) },
                ...(formState.obs ? [{ id: "obs", label: "Observaciones", value: formState.obs, wide: true }] : []),
              ]} />
            </section>
          </div>
          <IncomeSummary draft={advance} advanceEnabled={advanceEnabled} amount={total} count={selectedPeriodo.length}
            unit={selectedUnit?.nro} />
        </div>
      </div>
    </DataModal>
  </>;
};

export default RenderForm;
