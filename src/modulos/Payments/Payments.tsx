'use client';
import React, { useState, useMemo, useEffect } from 'react';
import useCrud from '@/mk/hooks/useCrud/useCrud';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import styles from './Payments.module.css';
import { getDateStrMes, MONTHS } from '@/mk/utils/date';
import Button from '@/mk/components/forms/Button/Button';
import { useRouter } from 'next/navigation';
import RenderForm from './RenderForm/RenderForm';
import RenderView from './RenderView/RenderView';
import RenderDel from './RenderDel/RenderDel';
import { useAuth } from '@/mk/contexts/AuthProvider';
import { IconIngresos } from '@/components/layout/icons/IconsBiblioteca';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { PaymentStatus, getPaymentStatusConfig } from '@/types/payment';

const renderDptosCell = (props: any) => <div>{String(props.item.dptos).replace(/,/g, '')}</div>;

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

const renderMethodCell = (props: any) => {
  const methodMap: Record<string, string> = {
    T: 'Transferencia bancaria',
    E: 'Efectivo',
    C: 'Cheque',
    Q: 'Pago QR',
    O: 'Pago en oficina',
  };
  return <div>{methodMap[props.item.method] || props.item.method}</div>;
};

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

const renderStatusCell = (props: any) => {
  const status = props.item.status as PaymentStatus;
  const info = getPaymentStatusConfig(status);
  return (
    <StatusBadge color={info.color} backgroundColor={info.backgroundColor}>
      {info.label}
    </StatusBadge>
  );
};

const renderAmountCell = (props: any) => <FormatBsAlign value={props.item.amount} alignRight />;

const renderConceptCell = (props: any) => {
  const item = props.item ?? {};
  const details = Array.isArray(item.details) ? (item.details as any[]) : [];

  const truncate = (s: string, max = 30) => (s.length > max ? s.slice(0, max) + '…' : s);

  const linesFromDetails: string[] = details.map((d: any) => {
    const base = d?.subcategory?.padre?.name || d?.subcategory?.name || '-/-';
    const debtObj = d?.debt_dpto?.debt;
    const resArea = d?.debt_dpto?.reservation?.area;

    if (debtObj) {
      const period = debtObj?.period ?? debtObj?.periodo ?? debtObj?.month ?? debtObj?.mes;
      const year = debtObj?.year ?? debtObj?.anio ?? debtObj?.y ?? debtObj?.yr;
      const toMonthName = (m: any) => {
        const num = Number(m);
        if (!Number.isNaN(num) && num >= 1 && num <= 12) return MONTHS[num] || undefined;
        const s = String(m);
        const match = s.match(/^(\d{4})-(\d{1,2})(?:-\d{1,2})?$/);
        if (match) {
          const mm = Number(match[1] ? match[2] : match[2]);
          if (mm >= 1 && mm <= 12) return MONTHS[mm] || undefined;
        }
        return undefined;
      };
      const periodName =
        period !== undefined && period !== null ? toMonthName(period) ?? String(period) : undefined;
      const parts = [periodName, year].filter(v => v !== undefined && v !== null).map(String);
      const extra = parts.length ? parts.join(' ') : '';
      return extra ? `${base} · ${extra}` : base;
    }

    if (resArea) {
      const areaText = resArea?.title ?? resArea?.name ?? resArea?.id;
      const txt = areaText ? truncate(String(areaText)) : '';
      return txt ? `${base} · ${txt}` : base;
    }

    const subName = d?.subcategory?.name ? truncate(String(d?.subcategory?.name)) : '';
    return subName ? `${base} · ${subName}` : base;
  });

  if (linesFromDetails.length > 0) {
    return (
      <div>
        {linesFromDetails.map((n: string, i: number) => (
          <div key={`c-${i}`}> {n}</div>
        ))}
      </div>
    );
  }

  const concepts: string[] = Array.isArray(item.concept) ? (item.concept as string[]) : [];
  if (concepts.length > 0) {
    return (
      <div>
        {concepts.map((n: string, i: number) => (
          <div key={`cx-${i}`}> {n}</div>
        ))}
      </div>
    );
  }

  if (item.concepto) {
    return <div>{String(item.concepto)}</div>;
  }

  return <div>-/-</div>;
};

const Payments = () => {
  const router = useRouter();
  const { userCan, setStore, store } = useAuth();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const mod = {
    modulo: 'payments',
    singular: 'Ingreso',
    plural: 'Ingresos',
    permiso: 'payments',
    extraData: true,
    renderForm: RenderForm,

    renderView: (props: any) => <RenderView {...props} />,
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

  const getPaymentMethodOptions = () => [
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
    { id: 'E', name: 'Por subir comprobante' },
    { id: 'X', name: 'Anulado' },
  ];

  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: 'L',
    searchBy: '',
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
          width: 90,
          onRender: renderDptosCell,
        },
      },
      method: {
        rules: ['required'],
        api: 'ae',
        label: 'Método de pago',
        form: {
          type: 'select',
          options: [
            { id: 'T', name: 'Transferencia' },
            { id: 'E', name: 'Efectivo' },
            { id: 'C', name: 'Cheque' },
          ],
        },
        list: {
          width: 200,
          onRender: renderMethodCell,
        },
        filter: {
          label: 'Método de pago',

          options: getPaymentMethodOptions,
        },
      },
      concepto: {
        rules: ['required'],
        api: 'ae',
        label: 'Concepto',
        form: {
          type: 'text',
          placeholder: 'Ej: Pago de servicios',
        },
        list: {
          onRender: renderConceptCell,
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

  useEffect(() => {
    setStore({ ...store, title: 'Ingresos' });
  }, []);
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

  const { List, onFilter } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
    getFilter: handleGetFilter,
  });

  // Verificación de permisos DESPUÉS de todos los hooks
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
