'use client';
import React, { useState, useMemo, useEffect } from 'react';
import useCrud from '@/mk/hooks/useCrud/useCrud';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import styles from './Payments.module.css';
import { getDateStrMes } from '@/mk/utils/date';
import Button from '@/mk/components/forms/Button/Button';
import { useRouter } from 'next/navigation';
import RenderForm from './RenderForm/RenderForm';
import RenderView from './RenderView/RenderView';
import RenderDel from './RenderDel/RenderDel';
import { useAuth } from '@/mk/contexts/AuthProvider';

import { IconIngresos } from '@/components/layout/icons/IconsBiblioteca';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/Widgets/StatusBadge/StatusBadge';

const renderDptosCell = (props: any) => <div>{String(props.item.dptos).replace(/[,]/g, '')}</div>;

const renderPaidAtCell = (props: any) => (
  <div>{getDateStrMes(props.item.paid_at) || 'No pagado'}</div>
);

const renderCategoryCell = (props: any) => (
  <div>{props.item.category?.padre?.name || 'Sin categoría padre'}</div>
);

const renderSubcategoryCell = (props: any) => {
  const category = props.item.category;
  if (!category) return '-/-';
  if (category.padre && typeof category.padre === 'object') {
    return category.name || '-/-';
  } else {
    return '-/-';
  }
};

const renderTypeCell = (props: any) => {
  const typeMap: Record<string, string> = {
    T: 'Transferencia bancaria',
    E: 'Efectivo',
    C: 'Cheque',
    Q: 'Pago QR',
    O: 'Pago en oficina',
  };
  return <div>{typeMap[props.item.type] || props.item.type}</div>;
};

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const renderStatusCell = (props: any) => {
  const statusConfig: Record<string, StatusConfig> = {
    P: { label: 'Cobrado', color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' },
    S: { label: 'Por confirmar', color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl4)' },
    R: { label: 'Rechazado', color: 'var(--cMediumAlert)', bgColor: 'var(--cHoverCompl5)' },
    A: { label: 'Por pagar', color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
    M: { label: 'Moroso', color: 'var(--cMediumAlert)', bgColor: 'var(--cMediumAlertHover)' },
    X: { label: 'Anulado', color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
  };

  const defaultConfig: StatusConfig = { 
    label: 'No disponible',
    color: 'var(--cWhite)', 
    bgColor: 'var(--cHoverCompl1)' 
  };

  const { label, color, bgColor } = statusConfig[props.item.status as keyof typeof statusConfig] || defaultConfig;

  return (
    <StatusBadge 
      color={color} 
      backgroundColor={bgColor}
    >
      {label}
    </StatusBadge>
  );
};

const renderAmountCell = (props: any) => <FormatBsAlign value={props.item.amount} alignRight />;

const Payments = () => {
  const router = useRouter();
  
  // Obtener parámetros de URL
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const unitParam = searchParams.get('unit');
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const mod = {
    modulo: 'payments',
    singular: 'Ingreso',
    plural: 'Ingresos',
    permiso: '',
    extraData: true,
    renderForm: RenderForm,

    renderView: (props: any) => <RenderView {...props} payment_id={props?.item?.id} />,
    renderDel: (props: any) => <RenderDel {...props} />,
    loadView: { fullType: 'DET' },
    hideActions: {
      view: false,
      add: false,
      edit: true,
      del: true,
    },
    filter: true,
    export: true,
    titleAdd: 'Nuevo',
    titleDel: 'Anular',
    saveMsg: {
      add: 'Ingreso creado con éxito',
      edit: 'Ingreso actualizado con éxito',
      del: 'Ingreso anulado con éxito',
    },
  };

  const getPeriodOptions = () => [
    { id: 'ALL', name: 'Todos' },
    { id: 'd', name: 'Hoy' },
    { id: 'ld', name: 'Ayer' },
    { id: 'w', name: 'Esta semana' },
    { id: 'lw', name: 'Semana anterior' },
    { id: 'm', name: 'Este mes' },
    { id: 'lm', name: 'Mes anterior' },
    { id: 'y', name: 'Este año' },
    { id: 'ly', name: 'Año anterior' },
    { id: 'custom', name: 'Personalizado' },
  ];

  const getPaymentTypeOptions = () => [
    { id: 'ALL', name: 'Todos' },
    { id: 'T', name: 'Transferencia bancaria' },
    { id: 'E', name: 'Efectivo' },
    { id: 'C', name: 'Cheque' },
    { id: 'Q', name: 'Pago QR' },
    { id: 'O', name: 'Pago en oficina' },
  ];

  const getStatusOptions = () => [
    { id: 'ALL', name: 'Todos' },
    { id: 'P', name: 'Cobrado' },
    { id: 'S', name: 'Por confirmar' },
    { id: 'R', name: 'Rechazado' },
    { id: 'X', name: 'Anulado' },
  ];

  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: 'L',
    searchBy: unitParam || '',
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: 'e' },
      paid_at: {
        rules: [],
        api: 'ae',
        label: 'Fecha de cobro',
        form: {
          type: 'date',
        },
        list: {
          onRender: renderPaidAtCell,
        },
        filter: {
          key: 'paid_at',
          label: 'Periodo',

          options: getPeriodOptions,
        },
      },

      dptos: {
        api: 'ae',
        label: 'Unidad',
        list: {
          onRender: renderDptosCell,
        },
      },
      category_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Categoría',
        form: {
          type: 'select',
          optionsExtra: 'categories',
          placeholder: 'Seleccione una categoría',
        },
        list: {
          onRender: renderCategoryCell,
        },
        filter: {
          label: 'Categoría',
          options: (extraData: any) => {
            const categories = extraData?.categories || []; //esto?
            const categoryOptions = categories.map((category: any) => ({
              id: category.id,
              name: category.name,
            }));
            return [{ id: 'ALL', name: 'Todos' }, ...categoryOptions];
          },
        },
      },
      subcategory_id: {
        rules: ['required'],
        label: 'Subcategoría',
        form: {
          type: 'select',
          disabled: (formState: { category_id: any }) => !formState.category_id,
          options: () => [],
        },
        list: {
          onRender: renderSubcategoryCell,
        },
      },
      type: {
        rules: ['required'],
        api: 'ae',
        label: 'Forma de pago',
        form: {
          type: 'select',
          options: [
            { id: 'T', name: 'Transferencia' },
            { id: 'E', name: 'Efectivo' },
            { id: 'C', name: 'Cheque' },
          ],
        },
        list: {
          onRender: renderTypeCell,
        },
        filter: {
          label: 'Forma de pago',

          options: getPaymentTypeOptions,
        },
      },

      status: {
        rules: [],
        api: 'ae',
        label: <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>Estado</span>,
        list: {
          onRender: renderStatusCell,
        },
        filter: {
          label: 'Estado',
          options: getStatusOptions,
        },
      },
      amount: {
        rules: ['required', 'number'],
        api: 'ae',
        label: (
          <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Monto total</span>
        ),
        form: {
          type: 'number',
          placeholder: 'Ej: 100.00',
        },
        list: {
          onRender: renderAmountCell,
        },
      },
    }),
    []
  );

  const goToCategories = (type = '') => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push('/categories');
    }
  };

  const { setStore, store } = useAuth();
  useEffect(() => {
    setStore({ ...store, title: 'Ingresos' });
  }, []);
  //
  // This function updates the filter state for the payments list, handling custom date logic and removing empty filters. (EN)
  // Esta función actualiza el estado de los filtros para la lista de pagos, gestionando la lógica de fechas personalizadas y eliminando filtros vacíos. (ES)
  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === 'paid_at' && value === 'custom') {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === '' || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const extraButtons = [
    <Button
      key="categories-button"
      onClick={() => goToCategories('I')}
      className={styles.categoriesButton}
    >
      Categorías
    </Button>,
  ];

  const { userCan, List, onFilter } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
    getFilter: handleGetFilter,
  });
  if (!userCan(mod.permiso, 'R')) return <NotAccess />;
  return (
    <div className={styles.container}>
      <List
        height={'calc(100vh - 350px)'}
        emptyMsg="Lista de ingresos vacía. Cuando empieces a registrar los pagos"
        emptyLine2="de expensas y otros ingresos, los verás aquí."
        emptyIcon={<IconIngresos size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={1700}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = 'La fecha de inicio es obligatoria';
          if (!endDate) err.endDate = 'La fecha de fin es obligatoria';
          if (startDate && endDate && startDate > endDate)
            err.startDate = 'La fecha de inicio no puede ser mayor a la de fin';
          if (startDate && endDate && startDate.slice(0, 4) !== endDate.slice(0, 4)) {
            err.startDate = 'El periodo personalizado debe estar dentro del mismo año';
            err.endDate = 'El periodo personalizado debe estar dentro del mismo año';
          }
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          const customDateFilterString = `${startDate},${endDate}`;
          onFilter('paid_at', customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Payments;
