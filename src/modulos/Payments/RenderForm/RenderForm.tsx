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
  hijos?: Subcategory[];
}

interface Subcategory {
  id: string | number;
  name: string;
}

interface ClientConfig {
  cat_expensas: string | number;
  cat_reservations: string | number;
}

interface ExtraData {
  dptos: Dpto[];
  categories: Category[];
  client_config: ClientConfig;
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
  isAmountLocked?: boolean; // Nuevo campo para bloquear el monto
  method?: string;
  voucher?: string;
  obs?: string;
  amount?: number | string;
  type?: string; // Nuevo campo para el tipo de pago
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
  type?: string; // Nuevo campo de error
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
  debtId?: string | number; // Nueva prop para el ID de la deuda específica
}

const RenderForm: React.FC<RenderFormProps> = ({
  open,
  onClose,
  item,
  extraData,
  execute,
  showToast,
  reLoad,
  debtId, // Nueva prop
}) => {
  const [formState, setFormState] = useState<FormState>(() => {
    const isCategoryLocked = item?.isCategoryLocked || false;
    const isSubcategoryLocked = item?.isSubcategoryLocked || false;
    const isAmountLocked = item?.isAmountLocked || false; // Nuevo campo

    return {
      paid_at: item?.paid_at || new Date().toISOString().split('T')[0],
      type: item?.type || '',
      file: item?.file || null,
      filename: item?.filename || null,
      ext: item?.ext || null,
      dpto_id: item?.dpto_id || '',
      category_id: item?.category_id || '',
      subcategory_id: item?.subcategory_id || '',
      subcategories: [], // Inicializar vacío, se cargará en useEffect
      isCategoryLocked,
      isSubcategoryLocked,
      isAmountLocked, // Nuevo campo
      method: item?.method || '',
      voucher: item?.voucher || '',
      obs: item?.obs || '',
      amount: item?.amount || '',
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

  // Opciones para el select de tipo de pago
  const typeOptions = [
    { id: 'T', name: 'Todas las deudas' },
    { id: 'E', name: 'Expensas' },
    { id: 'R', name: 'Reservas' },
    { id: 'F', name: 'Condonación' },
    { id: 'P', name: 'Plan de pago' },
    { id: 'O', name: 'Otras deudas' },
    { id: 'I', name: 'Pago directo' },
    { id: 'M', name: 'Multas' },
  ];

  // Determinar si se debe mostrar categorías y subcategorías (solo para pago directo)
  const showCategoryFields = formState.type === 'I';

  // Determinar si es una categoría basada en deudas (para tipos diferentes a pago directo)
  const isDebtBasedPayment = Boolean(formState.type && formState.type !== 'I');

  const isExpensasWithoutDebt =
    formState.type === 'E' && deudas.length === 0 && !isLoadingDeudas;

  const isReservationsWithoutDebt =
    formState.type === 'R' && deudas.length === 0 && !isLoadingDeudas;

  const isDebtBasedCategory =
    formState.subcategory_id === extraData?.client_config?.cat_expensas ||
    formState.subcategory_id === extraData?.client_config?.cat_reservations;

  const lDptos = useMemo(
    () =>
      extraData?.dptos.map((dpto: Dpto) => {
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
      }),
    [extraData?.dptos, store.Unitstype]
  );

  const lastLoadedDeudas = useRef<string>('');
  const exten = ['jpg', 'pdf', 'png', 'jpeg', 'doc', 'docx'];

  const getDeudas = useCallback(
    async (nroDpto: string | number, paymentmethod: string) => {
      if (!nroDpto || !paymentmethod || paymentmethod === 'I') return;

      const selectedDpto = extraData?.dptos.find(dpto => dpto.nro === nroDpto);
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
        console.error(err);
      } finally {
        setIsLoadingDeudas(false);
      }
    },
    [execute, extraData?.dptos]
  );

  // Nuevo useEffect para cargar subcategorías cuando extraData esté disponible
  useEffect(() => {
    if (extraData?.categories && formState.category_id && showCategoryFields) {
      const selectedCategory = extraData.categories.find(
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

  // Nuevo useEffect para cargar subcategorías iniciales cuando se abre el modal con item precargado
  useEffect(() => {
    if (
      open &&
      item &&
      item.category_id &&
      item.subcategory_id &&
      extraData?.categories &&
      showCategoryFields
    ) {
      const selectedCategory = extraData.categories.find(
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

      // Si hay item con datos precargados y es un tipo de pago basado en deudas, cargar deudas automáticamente
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
    // Consultar deudas si se selecciona un tipo de pago basado en deudas
    if (formState.dpto_id && formState.type && formState.type !== 'I') {
      const deudasKey = `${formState.dpto_id}_${formState.type}`;
      if (deudasKey !== lastLoadedDeudas.current) {
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
  }, [formState.dpto_id, formState.type, getDeudas]);

  useEffect(() => {
    // CORRECCIÓN: Solo ejecutar si no hay item (formulario nuevo) o si los campos no están bloqueados
    // Para deudas individuales, expensas y reservas, los campos deben permanecer bloqueados
    if (
      showCategoryFields &&
      (!item || (!formState.isCategoryLocked && !formState.isSubcategoryLocked))
    ) {
      let newSubcategories: Subcategory[] = [];
      let newSubcategoryId: string | number = '';
      let lockSubcategory = false;

      if (formState.category_id && extraData?.categories) {
        const selectedCategory = extraData.categories.find(
          (category: Category) => String(category.id) === String(formState.category_id)
        );

        if (selectedCategory?.hijos) {
          newSubcategories = selectedCategory.hijos || [];

          // Buscar si la subcategoría es cat_expensas o cat_reservations
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
        // CORRECCIÓN: Si hay item y los campos están bloqueados, mantener los valores originales
        if (item && (prev.isCategoryLocked || prev.isSubcategoryLocked)) {
          return {
            ...prev,
            subcategories: newSubcategories,
            // Mantener los valores originales de categoría y subcategoría si están bloqueados
          };
        }

        // Solo limpiar deudas si realmente cambió la subcategoría
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

  // Nuevo useEffect para seleccionar automáticamente la deuda específica
  useEffect(() => {
    if (debtId && deudas.length > 0) {
      const targetDebt = deudas.find(deuda => String(deuda.id) === String(debtId));
      if (targetDebt) {
        const newSelectedPeriodo: SelectedPeriodo = {
          id: targetDebt.id,
          amount: (targetDebt.amount || 0) + (targetDebt.penalty_amount || 0)
        };

        setSelectedPeriodo([newSelectedPeriodo]);
        setPeriodoTotal(newSelectedPeriodo.amount);

        // Si el monto está bloqueado, actualizar el formState con el monto de la deuda
        if (formState.isAmountLocked) {
          setFormState(prev => ({
            ...prev,
            amount: newSelectedPeriodo.amount
          }));
        }
      }
    }
  }, [debtId, deudas, formState.isAmountLocked]);

  const handleChangeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      let newValue: string | number | boolean = value;
      if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
        newValue = e.target.checked ? 'Y' : 'N';
      }

      // Si cambia el tipo de pago, limpiar campos relacionados
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
      } else {
        setFormState((prev: FormState) => ({
          ...prev,
          [name]: newValue,
        }));
      }
    },
    []
  );

  const handleSelectPeriodo = useCallback((periodo: Deuda) => {
    // Para multas (type 3), solo usar penalty_amount, para otros casos usar amount + penalty_amount
    const subtotal =
      periodo.type === 3
        ? Number(periodo.penalty_amount ?? 0)
        : Number(periodo.amount ?? 0) + Number(periodo.penalty_amount ?? 0);

    setSelectedPeriodo(prev => {
      const exists = prev.some(item => item.id === periodo.id);

      let newSelectedPeriodos;
      if (exists) {
        newSelectedPeriodos = prev.filter(item => item.id !== periodo.id);
      } else {
        newSelectedPeriodos = [...prev, { id: periodo.id, amount: subtotal }];
      }

      const newTotal = newSelectedPeriodos.reduce((sum, item) => sum + item.amount, 0);
      setPeriodoTotal(newTotal);

      return newSelectedPeriodos;
    });
  }, []);

  const validar = useCallback(() => {
    // 1. Inicia un objeto de errores vacío.
    const err: Errors = {};

    // Validación del tipo de pago
    if (!formState.type) {
      err.type = 'Este campo es requerido';
    }

    // Validación general: No se puede pagar si no hay deuda.
    if (isExpensasWithoutDebt) {
      err.general = 'No se puede registrar un pago de expensas cuando no hay deudas pendientes';
    }
    if (isReservationsWithoutDebt) {
      err.general = 'No se puede registrar un pago de reservas cuando no hay deudas pendientes';
    }

    // Validación de período seleccionado (para tipos basados en deudas)
    if (isDebtBasedPayment && deudas?.length > 0 && selectedPeriodo.length === 0) {
      err.selectedPeriodo = 'Debe seleccionar al menos una deuda para pagar';
    }

    // Validaciones de campos individuales
    if (!formState.dpto_id) {
      err.dpto_id = 'Este campo es requerido';
    }

    // Solo validar categoría y subcategoría para pago directo
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
    if (!formState.voucher) {
      err.voucher = 'Este campo es requerido';
    } else if (!/^\d{1,10}$/.test(formState.voucher)) {
      err.voucher = 'Debe contener solo números (máximo 10 dígitos)';
    }

    // Validación del monto (solo si no es un tipo basado en deudas con deudas)
    if (!isDebtBasedPayment || deudas?.length === 0) {
      if (!formState.amount) {
        err.amount = 'Este campo es requerido';
      }
    }

    if (!formState.file) {
      err.file = 'El comprobante es requerido';
    }

    if (!formState.paid_at) {
      err.paid_at = 'Este campo es requerido';
    } else {
      const selectedDate = new Date(formState.paid_at + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        err.paid_at = 'No se permiten fechas futuras';
      }
    }

    // 3. Al final, actualiza el estado con TODOS los errores encontrados.
    setErrors(err);

    // 4. Retorna true solo si el objeto de errores está vacío.
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
    if (!validar()) {
      if (
        isExpensasWithoutDebt ||
        isReservationsWithoutDebt ||
        (isDebtBasedPayment && deudas.length > 0 && selectedPeriodo.length === 0)
      ) {
        showToast('Por favor revise los errores', 'error');
      } else {
        showToast('Por favor revise los campos marcados', 'warning');
      }
      return;
    }

    const selectedDpto = extraData?.dptos.find(
      (dpto: Dpto) => String(dpto.nro) === String(formState.dpto_id)
    );
    const titular = getTitular(selectedDpto);
    const owner_id = titular?.id;

    let params: any = {
      paid_at: formState.paid_at,
      method: formState.method,
      file: formState.file,
      voucher: formState.voucher,
      obs: formState.obs,
      nro_id: formState.dpto_id,
      owner_id: owner_id,
      type: formState.type,
    };

    // Solo agregar category_id si es pago directo
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
    } catch (error) {
      console.error(error);
    }
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
            No se encontraron deudas pendientes para esta unidad. No se puede registrar un pago de{' '}
            {formState.type === 'E'
              ? 'expensas'
              : formState.type === 'R'
              ? 'reservas'
              : 'este tipo'}
            .
          </p>
        </div>
      );
    } else {
      return (
        <div className={styles['deudas-container']}>
          <div className={styles['deudas-title-row']}>
            <p className={styles['deudas-title']}>Seleccione las deudas a pagar:</p>
            <button
              type="button"
              className={styles['select-all-container']}
              onClick={() => {
                if (selectedPeriodo.length === deudas.length) {
                  setSelectedPeriodo([]);
                  setPeriodoTotal(0);
                } else {
                  const allPeriodos: SelectedPeriodo[] = deudas.map(periodo => ({
                    id: periodo.id,
                    amount:
                      periodo.type === 3
                        ? Number(periodo.penalty_amount ?? 0)
                        : Number(periodo.amount ?? 0) + Number(periodo.penalty_amount ?? 0),
                  }));

                  const totalAmount = allPeriodos.reduce((sum, item) => sum + item.amount, 0);

                  setSelectedPeriodo(allPeriodos);
                  setPeriodoTotal(totalAmount);
                }
              }}
            >
              <span className={styles['select-all-text']}>Pagar todo</span>
              {selectedPeriodo.length === deudas.length ? (
                <IconCheckSquare className={`${styles['check-icon']} ${styles.selected}`} />
              ) : (
                <IconCheckOff className={styles['check-icon']} />
              )}
            </button>
          </div>

          <div className={styles['deudas-table']}>
            <div
              className={`${styles['deudas-header']} ${
                formState.type === 'R' ? styles['deudas-header-reservations-simple'] : ''
              } ${
                formState.type === 'O' ? styles['deudas-header-other-debts'] : ''
              }`}
            >
              {formState.type === 'R' ? (
                <>
                  <span className={styles['header-item']}>Fecha</span>
                  <span className={styles['header-item']}>Concepto</span>
                  <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                    Total
                  </span>
                  <span className={styles['header-item']}>Seleccionar</span>
                </>
              ) : formState.type === 'O' ? (
                <>
                  <span className={styles['header-item']}>Descripción</span>
                  <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                    Monto
                  </span>
                  <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                    Multa
                  </span>
                  <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                    SubTotal
                  </span>
                  <span className={styles['header-item']}>Seleccionar</span>
                </>
              ) : (
                <>
                  <span className={styles['header-item']}>Periodo</span>
                  <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                    Monto
                  </span>
                  <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                    Multa
                  </span>
                  <span className={`${styles['header-item']} ${styles['header-amount']}`}>
                    SubTotal
                  </span>
                  <span className={styles['header-item']}>Seleccionar</span>
                </>
              )}
            </div>

            {deudas.map(periodo => (
              <button
                type="button"
                key={String(periodo.id)}
                onClick={() => handleSelectPeriodo(periodo)}
                className={styles['deuda-item']}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  width: '100%',
                  textAlign: 'inherit',
                }}
              >
                <div
                  className={`${styles['deuda-row']} ${
                    formState.type === 'R' ? styles['deuda-row-reservations-simple'] : ''
                  } ${
                    formState.type === 'O' ? styles['deuda-row-other-debts'] : ''
                  }`}
                >
                  {formState.type === 'R' ? (
                    <>
                      <div className={styles['deuda-cell']}>
                        {periodo.type === 3
                          ? formatToDayDDMMYYYY(periodo.penalty_reservation?.date_at) || '-/-'
                          : formatToDayDDMMYYYY(periodo.reservation?.date_at) || '-/-'}
                      </div>
                      <div className={styles['deuda-cell']}>
                        {periodo.type === 3
                          ? `Multa: Cancelación del área ${
                              periodo.penalty_reservation?.area?.title || '-/-'
                            }`
                          : periodo.reservation?.area?.title || '-/-'}
                      </div>
                      <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                        {'Bs ' +
                          formatNumber(
                            periodo.type === 3
                              ? Number(periodo.penalty_amount ?? 0)
                              : Number(periodo.amount ?? 0) + Number(periodo.penalty_amount ?? 0)
                          )}
                      </div>
                    </>
                  ) : formState.type === 'O' ? (
                    <>
                      <div className={styles['deuda-cell']}>
                        {periodo.description || periodo.shared?.description || periodo.debt?.description || '-/-'}
                      </div>
                      <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                        {'Bs ' + formatNumber(Number(periodo.amount ?? 0))}
                      </div>
                      <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                        {'Bs ' + formatNumber(Number(periodo.penalty_amount ?? 0))}
                      </div>
                      <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                        {'Bs ' +
                          formatNumber(
                            Number(periodo.amount ?? 0) + Number(periodo.penalty_amount ?? 0)
                          )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles['deuda-cell']}>
                        {periodo.debt &&
                        typeof periodo.debt === 'object' &&
                        periodo.debt.month !== undefined &&
                        periodo.debt.year !== undefined
                          ? `${MONTHS_S[periodo.debt.month] ?? '?'}/${periodo.debt.year ?? '?'}`
                          : '-/-'}
                      </div>
                      <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                        {'Bs ' + formatNumber(Number(periodo.amount ?? 0))}
                      </div>
                      <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                        {'Bs ' + formatNumber(Number(periodo.penalty_amount ?? 0))}
                      </div>
                      <div className={`${styles['deuda-cell']} ${styles['amount-cell']}`}>
                        {'Bs ' +
                          formatNumber(
                            Number(periodo.amount ?? 0) + Number(periodo.penalty_amount ?? 0)
                          )}
                      </div>
                    </>
                  )}

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
            <p>Total a pagar: {formatBs(periodoTotal)}</p>
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
      >
        <div className={styles['income-form-container']}>
          {/* Fecha de pago */}
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
                max={new Date().toISOString().split('T')[0]}
                min={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
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
              />
            </div>
          </div>

          {/* Nuevo select de tipo de pago */}
          <div className={styles.section}>
            <div className={styles['input-container']}>
              <Select
                name="type"
                label="Tipo de Pago"
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

          {/* Mostrar categoría y subcategoría solo para pago directo */}
          {showCategoryFields && (
            <div className={styles.section}>
              <div className={styles['input-row']}>
                <div className={styles['input-half']}>
                  <Select
                    name="category_id"
                    label="Categoría"
                    value={formState.category_id}
                    onChange={handleChangeInput}
                    options={extraData?.categories || []}
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
                      value={
                        isDebtBasedPayment && deudas?.length > 0 ? periodoTotal : formState.amount
                      }
                      required={true}
                      error={errors}
                      disabled={isDebtBasedPayment || formState.isAmountLocked}
                      maxLength={20}
                    />
                  </div>
                  <div className={styles['input-half']}>
                    <Select
                      name="method"
                      label="Forma de pago"
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

              {/* Mostrar deudas solo para tipos basados en deudas */}
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

              {/* Sección de subir comprobante */}
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
                    label="Ingresar el número del comprobante"
                    name="voucher"
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').substring(0, 10);
                      const newEvent = {
                        ...e,
                        target: { ...e.target, name: 'voucher', value },
                      };
                      handleChangeInput(newEvent);
                      if (e.target.value !== value) {
                        showToast(
                          'El número de comprobante solo puede contener números (máximo 10 dígitos)',
                          'warning'
                        );
                      }
                    }}
                    value={formState.voucher || ''}
                    error={errors}
                    maxLength={10}
                    required
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
                      };
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
