/* eslint-disable react-hooks/exhaustive-deps */
'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { getFullName } from '@/mk/utils/string';
import { MONTHS_S, formatToDayDDMMYYYY } from '@/mk/utils/date';
import EmptyData from '@/components/NoData/EmptyData';
import Select from '@/mk/components/forms/Select/Select';
import TextArea from '@/mk/components/forms/TextArea/TextArea';
import Input from '@/mk/components/forms/Input/Input';
import { IconCheckOff, IconCheckSquare } from '@/components/layout/icons/IconsBiblioteca';
import Toast from '@/mk/components/ui/Toast/Toast';
import { useAuth } from '@/mk/contexts/AuthProvider';
import styles from './RenderForm.module.css';
import { UploadFile } from '@/mk/components/forms/UploadFile/UploadFile';
import { formatBs, formatNumber } from '@/mk/utils/numbers';
import { getTitular } from '@/mk/utils/adapters';

interface Dpto {
  id: string | number;
  nro: string;
  description: string;
  holder?: 'H' | 'T';
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
}

interface ExtraData {
  dptos: Dpto[];
  categories: Category[];
  client_config: ClientConfig;
  bankAccounts: any[];
  subcategories: any[];
}
interface Deuda {
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
  showToast: (msg: string, type: 'info' | 'success' | 'error' | 'warning') => void;
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
      paid_at: item?.paid_at || new Date().toISOString().split('T')[0],
      type: item?.type || '',
      file: item?.file || null,
      filename: item?.filename || null,
      ext: item?.ext || null,
      dpto_id: item?.dpto_id || '',
      category_id: item?.category_id || '',
      subcategory_id: item?.subcategory_id || '',
      subcategories: [],
      isCategoryLocked,
      isSubcategoryLocked,
      isAmountLocked,
      method: item?.method || '',
      voucher: item?.voucher || '',
      obs: item?.obs || '',
      amount: item?.amount || '',
      owner_id: item?.owner_id || '',
    };
  });
  const [errors, setErrors] = useState<Errors>({});

  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<SelectedPeriodo[]>([]);
  const [periodoTotal, setPeriodoTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingDeudas, setIsLoadingDeudas] = useState(false);
  const [toast] = useState<{
    msg: string;
    method: 'info' | 'success' | 'error' | 'warning';
  }>({
    msg: '',
    method: 'info',
  });
  const { store } = useAuth();
  const typeOptions = [
    { id: 'E', name: 'Expensas' },
    { id: 'R', name: 'Reservas' },
    { id: 'F', name: 'Condonación' },
    { id: 'O', name: 'Otras deudas' },
    { id: 'I', name: 'Pago directo' },
  ];

  const showCategoryFields = formState.type === 'I';

  const isDebtBasedPayment = Boolean(formState.type && formState.type !== 'I');

  const isExpensasWithoutDebt = formState.type === 'E' && deudas.length === 0 && !isLoadingDeudas;

  const isReservationsWithoutDebt =
    formState.type === 'R' && deudas.length === 0 && !isLoadingDeudas;

  const isDebtBasedCategory =
    formState.subcategory_id === extraData?.client_config?.cat_expensas ||
    formState.subcategory_id === extraData?.client_config?.cat_reservations;

  const lDptos = useMemo(
    () =>
      extraData?.dptos?.map((dpto: Dpto) => {
        const titular = getTitular(dpto);
        return {
          id: dpto.nro,
          name:
            dpto?.type?.name +
            ' ' +
            dpto.nro +
            ' - ' +
            dpto.description +
            ' - ' +
            getFullName(titular ?? {}),
          dpto_id: dpto.id,
        };
      }) || [],
    [extraData?.dptos, store.Unitstype]
  );

  const lastLoadedDeudas = useRef<string>('');
  const exten = ['jpg', 'pdf', 'png', 'jpeg', 'doc', 'docx'];

  const getDeudas = useCallback(
    async (nroDpto: string | number, paymentmethod: string) => {
      if (!nroDpto || !paymentmethod || paymentmethod === 'I') return;

      const selectedDpto = extraData?.dptos?.find(dpto => dpto.nro === nroDpto);
      const realDptoId = selectedDpto?.id;

      if (!realDptoId) return;

      setIsLoadingDeudas(true);
      try {
        const { data } = await execute(
          '/payments',
          'GET',
          {
            fullType: 'DEBT',
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
    [execute, extraData?.dptos]
  );

  const filteredCategories = useMemo(() => {
    const list = extraData?.categories || [];
    return list.filter(cat => String(cat.fixed) !== 'Y');
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

      if (item && item.dpto_id && item.type && item.type !== 'I') {
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
    if (formState.dpto_id && formState.type && formState.type !== 'I') {
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
        lastLoadedDeudas.current = '';
      }
    }
  }, [formState.dpto_id, formState.type, getDeudas, deudas.length]);

  useEffect(() => {
    if (
      showCategoryFields &&
      (!item || (!formState.isCategoryLocked && !formState.isSubcategoryLocked))
    ) {
      let newSubcategories: Subcategory[] = [];
      let newSubcategoryId: string | number = '';
      let lockSubcategory = false;

      if (formState.category_id && extraData?.categories) {
        const selectedCategory = extraData.categories?.find(
          (category: Category) => String(category.id) === String(formState.category_id)
        );

        if (selectedCategory?.hijos) {
          newSubcategories = (selectedCategory.hijos || []).filter(
            (hijo: Subcategory) => String(hijo.fixed) !== 'Y'
          );

          const catExpensasChild = newSubcategories.find(
            (hijo: Subcategory) =>
              String(hijo.id) === String(extraData?.client_config?.cat_expensas)
          );
          const catReservationsChild = newSubcategories.find(
            (hijo: Subcategory) =>
              String(hijo.id) === String(extraData?.client_config?.cat_reservations)
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
          lastLoadedDeudas.current = '';
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
      const targetDebt = deudas.find(deuda => String(deuda.id) === String(debtId));
      if (targetDebt) {
        const calculatedAmount = getSubtotal(targetDebt);

        const newSelectedPeriodo: SelectedPeriodo = {
          id: targetDebt.id,
          amount: calculatedAmount,
        };

        setSelectedPeriodo([newSelectedPeriodo]);
        setPeriodoTotal(calculatedAmount);

        setFormState(prev => ({
          ...prev,
          amount: calculatedAmount.toFixed(2),
        }));
      }
    }
  }, [debtId, deudas]);

  const handleChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      let newValue: string | number | boolean = value;
      if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
        newValue = e.target.checked ? 'Y' : 'N';
      }

      if (name === 'type') {
        setFormState((prev: FormState) => ({
          ...prev,
          [name]: newValue,
          category_id: '',
          subcategory_id: '',
          subcategories: [],
        }));
        setDeudas([]);
        setSelectedPeriodo([]);
        setPeriodoTotal(0);
        lastLoadedDeudas.current = '';
        if (newValue && newValue !== 'I' && formState.dpto_id) {
          setTimeout(() => {
            const deudasKey = `${formState.dpto_id}_${newValue}`;
            lastLoadedDeudas.current = deudasKey;
            if (formState.dpto_id) {
              getDeudas(formState.dpto_id, newValue as string);
            }
          }, 0);
        }
      } else if (name === 'amount') {
        setFormState((prev: FormState) => ({
          ...prev,
          amount: newValue,
        }));
        if (isDebtBasedPayment && selectedPeriodo.length === 1) {
          const parsed = parseFloat(String(newValue || '0'));
          setSelectedPeriodo(prev =>
            prev.length === 1
              ? [
                  {
                    ...prev[0],
                    amount: Math.round(parsed * 100) / 100,
                  },
                ]
              : prev
          );
        }
      } else {
        setFormState((prev: FormState) => ({
          ...prev,
          [name]: newValue,
        }));
      }
    },
    [formState.dpto_id, getDeudas, isDebtBasedPayment, selectedPeriodo]
  );

  const getDebtType = (type: number) => {
    switch (type) {
      case 0:
        return 'Individual';
      case 1:
        return 'Expensas';
      case 2:
        return 'Reservas';
      case 3:
        return 'Multa por Cancelación';
      case 4:
        return 'Compartida';
      case 5:
        return 'Condonación';
      default:
        return 'Desconocido';
    }
  };

  const getConceptByType = (periodo: Deuda) => {
    const type = periodo?.type;

    switch (type) {
      case 1: {
        const monthNum = periodo?.debt?.month ?? periodo?.shared?.month;
        const yearNum = periodo?.debt?.year ?? periodo?.shared?.year;
        if (monthNum != null && yearNum != null) {
          const monthIndex = Math.max(1, Math.min(12, Number(monthNum)));
          const monthName = MONTHS_S[monthIndex] || String(monthNum);
          return `${monthName} ${yearNum}`;
        }
        return '-/-';
      }
      case 2:
        return `Reserva: ${
          periodo?.debt?.reservation?.area?.title || periodo?.reservation?.area?.title || '-/-'
        }`;
      case 3:
        return `Multa por Cancelación: ${
          periodo?.debt?.penalty_reservation?.area?.title ||
          periodo?.penalty_reservation?.area?.title ||
          '-/-'
        }`;
      case 0:
      case 4:
        return periodo?.description || '-/-';
      default:
        return (
          periodo?.description ||
          periodo?.shared?.description ||
          periodo?.debt?.description ||
          '-/-'
        );
    }
  };

  const getSubtotal = (periodo: Deuda) => {
    const amount = parseFloat(String(periodo?.amount)) || 0;
    const penaltyAmount = parseFloat(String(periodo?.penalty_amount)) || 0;
    const maintenanceAmount = parseFloat(String(periodo?.maintenance_amount)) || 0;

    let total;

    if (periodo.debt?.method === 3) {
      total = penaltyAmount + maintenanceAmount;
    } else {
      total = amount + penaltyAmount + maintenanceAmount;
    }

    return Math.round(total * 100) / 100;
  };

  const handleSelectPeriodo = useCallback((periodo: Deuda) => {
    const subtotal = getSubtotal(periodo);

    setSelectedPeriodo(prev => {
      const isSameSelected = prev.length === 1 && prev[0].id === periodo.id;
      if (isSameSelected) {
        setPeriodoTotal(0);
        setFormState(ps => ({ ...ps, amount: '' }));
        return [];
      }

      setPeriodoTotal(subtotal);
      setFormState(ps => ({ ...ps, amount: subtotal.toFixed(2) }));

      return [
        {
          id: periodo.id,
          amount: subtotal,
          bank_account_id: periodo?.subcategory?.bank_account_id,
        },
      ];
    });
  }, []);

  const validar = useCallback(() => {
    const err: Errors = {};
    if (!formState.type) {
      err.type = 'Este campo es requerido';
    }

    if (isExpensasWithoutDebt) {
      err.general = 'No se puede registrar un pago de expensas cuando no hay deudas pendientes';
    }
    if (isReservationsWithoutDebt) {
      err.general = 'No se puede registrar un pago de reservas cuando no hay deudas pendientes';
    }
    if (isDebtBasedPayment && deudas?.length > 0 && selectedPeriodo.length !== 1) {
      err.selectedPeriodo = 'Debe seleccionar una sola deuda para pagar';
    }

    if (!formState.dpto_id) {
      err.dpto_id = 'Este campo es requerido';
    }

    if (showCategoryFields) {
      if (!formState.category_id) {
        err.category_id = 'Este campo es requerido';
      }
      if (!formState.subcategory_id) {
        err.subcategory_id = 'Este campo es requerido';
      }
    }

    if (!formState.method) {
      err.method = 'Este campo es requerido';
    }

    if (!formState.paid_at) {
      err.paid_at = 'Este campo es requerido';
    }

    if (isDebtBasedPayment) {
      const amt = parseFloat(String(formState.amount || '0'));
      if (!formState.amount || isNaN(amt) || amt <= 0) {
        err.amount = 'Este campo es requerido';
      }
    } else if (!isDebtBasedPayment || deudas?.length === 0) {
      if (!formState.amount) {
        err.amount = 'Este campo es requerido';
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
    setErrors,
  ]);

  const _onSavePago = useCallback(async () => {
    const isValid = validar();
    if (!isValid) {
      if (errors.general) {
        showToast(errors.general, 'error');
      } else {
        showToast('Por favor revise los campos marcados', 'warning');
      }
      return;
    }

    let owner_id = formState.owner_id;
    if (!owner_id) {
      const selectedDpto = extraData?.dptos?.find(
        (dpto: Dpto) => String(dpto.nro) === String(formState.dpto_id)
      );
      const titular = getTitular(selectedDpto);
      owner_id = titular?.id;
    }
    let bank_account_id;
    const existBankAccount = extraData?.bankAccounts?.find((item: any) => item.is_main == 1)?.id;

    switch (formState.type) {
      case 'E': {
        const id =
          extraData?.bankAccounts?.find((i: any) => i.is_expense == 1)?.id || existBankAccount;
        bank_account_id = id;
        break;
      }
      case 'R': {
        const id =
          extraData?.bankAccounts?.find((i: any) => i.is_reserve == 1)?.id || existBankAccount;
        bank_account_id = id;
        break;
      }
      case 'F': {
        const sub = extraData?.subcategories?.find(
          (i: any) => i.id == extraData?.client_config?.cat_forgiveness
        );

        const id = sub?.bank_account_id || sub?.padre?.bank_account_id || existBankAccount;

        bank_account_id = id;
        break;
      }
      case 'I': {
        const category: any = extraData?.categories?.find(
          (i: any) => i.id == formState.category_id
        );

        const id =
          category?.hijos?.find((i: any) => i.id == formState.subcategory_id)?.bank_account_id ||
          category?.bank_account_id ||
          existBankAccount;

        bank_account_id = id;
        break;
      }
      case 'O': {
        const id = selectedPeriodo?.[0]?.bank_account_id || existBankAccount;

        bank_account_id = id;
        break;
      }
    }

    let params: any = {
      paid_at: formState.paid_at,
      method: formState.method,
      file: formState.file,
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
      const enteredAmount = parseFloat(String(formState.amount || '0'));
      const asignados = [
        {
          ...selectedPeriodo[0],
          amount: Math.round(enteredAmount * 100) / 100,
        },
      ];
      params = {
        ...params,
        asignados,
        amount: Math.round(enteredAmount * 100) / 100,
      };
    } else {
      params = {
        ...params,
        amount: parseFloat(String(formState.amount || '0')),
      };
    }
    try {
      const { data, error } = await execute('/payments', 'POST', params);

      if (data?.success) {
        showToast('Pago agregado con éxito', 'success');
        reLoad();
        onClose();
      } else {
        showToast(error?.message || data?.message || 'Error al guardar el pago', 'error');

        if (error?.data?.errors) {
          setErrors(error.data.errors);
        } else if (data?.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {}
  }, [
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
    deudas,
    showCategoryFields,
  ]);

  const onCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const deudasContent = useMemo(() => {
    if (!formState.dpto_id) {
      return <EmptyData message="Seleccione una unidad para ver deudas" h={200} />;
    } else if (isLoadingDeudas) {
      return <EmptyData message="Cargando deudas..." h={200} />;
    } else if (deudas.length === 0) {
      return (
        <div className={styles['no-deudas-container']}>
          <EmptyData message="Esta unidad no tiene deudas pendientes" h={200} />
          <p className={styles['no-deudas-message']}>
            No se encontraron deudas pendientes para esta unidad. No se puede registrar un pago de
            {formState.type === 'E'
              ? ' expensas'
              : formState.type === 'R'
              ? ' reservas'
              : ' este tipo'}
            .
          </p>
        </div>
      );
    } else {
      return (
        <div className={styles['deudas-container']}>
          <div className={styles['deudas-title-row']}>
            <p className={styles['deudas-title']}>Seleccione la deuda a pagar:</p>
          </div>

          <div className={styles['deudas-table']}>
            <div className={styles['deudas-header']}>
              <span className={styles['header-item']}>Tipo</span>
              <span className={styles['header-item']}>Concepto</span>
              <span className={`${styles['header-item']} ${styles['header-amount']}`}>Monto</span>
              <span className={`${styles['header-item']} ${styles['header-amount']}`}>Multa</span>
              <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                Mant. Valor
              </span>
              <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                Subtotal
              </span>
              <span className={styles['header-item']}>Seleccionar</span>
            </div>

            {deudas.map(periodo => (
              <button
                type="button"
                key={String(periodo.id)}
                onClick={() => {
                  handleSelectPeriodo(periodo);
                }}
                className={styles['deuda-item']}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  width: '100%',
                  textAlign: 'inherit',
                }}
              >
                <div className={styles['deuda-row']}>
                  <div className={styles['deuda-cell']}>{getDebtType(periodo.type || 0)}</div>
                  <div className={styles['deuda-cell']}>{getConceptByType(periodo)}</div>
                  <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                    {'Bs ' + formatNumber(Number(periodo.amount ?? 0))}
                  </div>
                  <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                    {'Bs ' + formatNumber(Number(periodo.penalty_amount ?? 0))}
                  </div>
                  <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                    {'Bs ' + formatNumber(Number(periodo.maintenance_amount ?? 0))}
                  </div>
                  <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                    {'Bs ' + formatNumber(getSubtotal(periodo))}
                  </div>

                  <div className={`${styles['deuda-cell']} ${styles['deuda-check']}`}>
                    {selectedPeriodo.some(item => item.id === periodo.id) ? (
                      <IconCheckSquare className={`${styles['check-icon']} ${styles.selected}`} />
                    ) : (
                      <IconCheckOff className={styles['check-icon']} />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className={styles['total-container']}>
            <p>Subtotal de la deuda seleccionada: {formatBs(periodoTotal)}</p>
          </div>
        </div>
      );
    }
  }, [
    formState.dpto_id,
    formState.type,
    isLoadingDeudas,
    deudas,
    selectedPeriodo.length,
    periodoTotal,
    handleSelectPeriodo,
  ]);

  return (
    <>
      <Toast toast={toast as any} showToast={showToast} />
      <DataModal
        open={open}
        onClose={onCloseModal}
        onSave={_onSavePago}
        buttonCancel={'Cancelar'}
        buttonText={'Crear ingreso'}
        title={'Crear ingreso'}
        minWidth={680}
        maxWidth={860}
      >
        <div className={styles['income-form-container']}>
          <div className={styles.section}>
            <div className={styles['input-container']}>
              <Input
                type="date"
                name="paid_at"
                label="Seleccionar fecha"
                required={true}
                value={formState.paid_at || ''}
                onChange={handleChangeInput}
                error={errors}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles['input-container']}>
              <Select
                name="dpto_id"
                label="Seleccionar Unidad"
                required={true}
                value={formState.dpto_id}
                onChange={handleChangeInput}
                options={lDptos}
                error={errors}
                filter={true}
                filterStyle={{ backgroundColor: '#323232' }}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles['input-container']}>
              <Select
                name="type"
                label="Tipo"
                required={true}
                value={formState.type}
                onChange={handleChangeInput}
                options={typeOptions}
                error={errors}
                optionLabel="name"
                optionValue="id"
              />
            </div>
          </div>

          {showCategoryFields && (
            <div className={styles.section}>
              <div className={styles['input-row']}>
                <div className={styles['input-half']}>
                  <Select
                    name="category_id"
                    label="Categoría"
                    value={formState.category_id}
                    onChange={handleChangeInput}
                    options={filteredCategories}
                    error={errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    disabled={formState.isCategoryLocked}
                  />
                </div>
                <div className={styles['input-half']}>
                  <Select
                    name="subcategory_id"
                    label="Subcategoría"
                    value={formState.subcategory_id}
                    onChange={handleChangeInput}
                    options={formState.subcategories || []}
                    error={errors}
                    required
                    optionLabel="name"
                    optionValue="id"
                    disabled={formState.isSubcategoryLocked}
                  />
                </div>
              </div>
            </div>
          )}

          <div className={styles.section}>
            <div>
              <div className={styles['payment-section']}>
                <div className={styles['input-row']}>
                  <div className={styles['input-half']}>
                    <Input
                      type="currency"
                      name="amount"
                      label="Monto del ingreso"
                      onChange={e => {
                        handleChangeInput(e);
                      }}
                      value={formState.amount}
                      required={false}
                      error={errors}
                      disabled={formState.isAmountLocked}
                      maxLength={20}
                    />
                  </div>
                  <div className={styles['input-half']}>
                    <Select
                      name="method"
                      label="Método de pago"
                      value={formState.method}
                      onChange={handleChangeInput}
                      options={[
                        { id: 'Q', name: 'Pago QR' },
                        { id: 'T', name: 'Transferencia bancaria' },
                        { id: 'E', name: 'Efectivo' },
                        { id: 'C', name: 'Cheque' },
                        { id: 'O', name: 'Pago en oficina' },
                      ]}
                      error={errors}
                      required
                      optionLabel="name"
                      optionValue="id"
                    />
                  </div>
                </div>
              </div>

              {isDebtBasedPayment && (
                <div>
                  {deudasContent}
                  {errors.selectedPeriodo && (
                    <div className={styles['error-message']} style={{ color: 'red', marginTop: 8 }}>
                      {errors.selectedPeriodo}
                    </div>
                  )}
                </div>
              )}

              <div className={styles['upload-section']}>
                <UploadFile
                  name="file"
                  ext={exten}
                  value={formState.file ? { file: formState.file } : ''}
                  onChange={handleChangeInput}
                  img={true}
                  sizePreview={{ width: '40%', height: 'auto' }}
                  error={errors}
                  setError={setErrors}
                  required={true}
                  placeholder="Cargar un archivo o arrastrar y soltar"
                />
              </div>

              <div className={styles['voucher-section']}>
                <div className={styles['voucher-input']}>
                  <Input
                    type="text"
                    label="Número de respaldo de pago"
                    name="voucher"
                    onChange={e => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 50);
                      const newEvent = {
                        ...e,
                        target: { ...e.target, name: 'voucher', value },
                      } as any;
                      handleChangeInput(newEvent);
                    }}
                    value={formState.voucher || ''}
                    error={errors}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className={styles['obs-section']}>
                <div className={styles['obs-input']}>
                  <TextArea
                    label="Observaciones"
                    name="obs"
                    onChange={e => {
                      const value = e.target.value.substring(0, 250);
                      const newEvent = {
                        ...e,
                        target: { ...e.target, name: 'obs', value },
                      } as any;
                      handleChangeInput(newEvent);
                    }}
                    value={formState.obs}
                    required={false}
                    maxLength={250}
                    error={errors}
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
