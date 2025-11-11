'use client';
import { useMemo, useEffect, useState } from 'react';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import useCrudUtils from '../../../shared/useCrudUtils';
import { getDateStrMes, getDateStrMesShort, MONTHS } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import RenderItem from '../../../shared/RenderItem';
import { useAuth } from '@/mk/contexts/AuthProvider';
import Button from '@/mk/components/forms/Button/Button';
import { useRouter } from 'next/navigation';
import React from 'react';
import RenderView from '../AllDebts/RenderView/RenderView';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal'; interface IndividualDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
  onExtraDataChange?: (extraData: any) => void;
}

const IndividualDebts: React.FC<IndividualDebtsProps> = ({
  openView,
  setOpenView,
  viewItem,
  setViewItem,
  onExtraDataChange,
}) => {
  const { setStore, store, user } = useAuth();
  const router = useRouter();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const renderUnitCell = ({ item }: { item: any }) => (
    <div>{item?.dpto?.nro || item?.dpto_id}</div>
  );

  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.padre?.name || '-'}</div>
  );

  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.name || '-'}</div>
  );
  const renderMaintenanceAmountCell = ({ item }: { item: any }) => {
    const raw = item?.maintenance_amount;

    const hasValue =
      raw !== null && raw !== undefined && String(raw).trim() !== '' && !isNaN(Number(raw));

    if (!hasValue)
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          -/-
        </div>
      );

    return <FormatBsAlign value={parseFloat(raw)} alignRight />;
  };

  const renderStatusCell = ({ item }: { item: any }) => {
    const statusConfig: { [key: string]: { color: string; bgColor: string } } = {
      A: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl8)' },
      P: { color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' },
      S: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl4)' },
      R: { color: 'var(--cMediumAlert)', bgColor: 'var(--cMediumAlertHover)' },
      E: { color: 'var(--cWhite)', bgColor: 'var(--cHoverCompl1)' },
      M: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
      C: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
      F: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
      X: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
    };

    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'A': 'Por cobrar',
        'P': 'Cobrado',
        'S': 'Por confirmar',
        'M': 'En mora',
        'F': 'Condonada',
        'C': 'Cancelada',
        'X': 'Anulada'
      };
      return statusMap[status] || status;
    };

    let finalStatus = item?.status;

    // Obtener fecha actual solo como string YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dueAtString = item?.due_at;

    // Solo marcar en mora si la fecha de vencimiento es MENOR que hoy (no igual)
    if (dueAtString && dueAtString < todayString && item?.status === 'A') {
      finalStatus = 'M';

    }

    const statusText = getStatusText(finalStatus);
    const { color, bgColor } = statusConfig[finalStatus] || statusConfig.E;

    return (
      <StatusBadge
        color={color}
        backgroundColor={bgColor}
      >
        {statusText}
      </StatusBadge>
    );
  };

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-/-</div>;
    return (
      <div>
        {getDateStrMesShort(item.due_at)}
      </div>
    );
  };

  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  const renderPenaltyAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.penalty_amount) || 0} alignRight />
  );

  const renderBalanceDueCell = ({ item }: { item: any }) => {
    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    const maintenanceAmount = parseFloat(item?.maintenance_amount) || 0;
    const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;

    return <FormatBsAlign value={totalBalance} alignRight />;
  };

  const getStatusOptions = () => [
    { id: 'ALL', name: 'Todos los estados' },
    { id: 'A', name: 'Por cobrar' },
    { id: 'P', name: 'Cobrado' },
    { id: 'S', name: 'Por confirmar' },
    { id: 'M', name: 'En mora' },
    { id: 'F', name: 'Condonada' },
    { id: 'C', name: 'Cancelada' },
    { id: 'X', name: 'Anulada' }
  ];

  const getCategoryOptions = (extraData?: any) => {
    const options = [{ id: 'ALL', name: 'Todas las categorías' }];

    if (extraData?.categories && Array.isArray(extraData.categories)) {
      extraData.categories.forEach((category: any) => {
        options.push({
          id: category.id.toString(),
          name: category.name
        });
      });
    }

    return options;
  };

  const getSubcategoryOptions = (extraData?: any) => {
    const options = [{ id: 'ALL', name: 'Todas las subcategorías' }];

    if (extraData?.categories && Array.isArray(extraData.categories)) {
      extraData.categories.forEach((category: any) => {
        if (category.hijos && Array.isArray(category.hijos)) {
          category.hijos.forEach((subcategory: any) => {
            options.push({
              id: subcategory.id.toString(),
              name: subcategory.name
            });
          });
        }
      });
    }

    return options;
  };

  const getPeriodOptions = () => [
    { id: 'ALL', name: 'Todos los periodos' },
    { id: 'd', name: 'Hoy' },
    { id: 'ld', name: 'Ayer' },
    { id: 'w', name: 'Esta semana' },
    { id: 'lw', name: 'Semana anterior' },
    { id: 'm', name: 'Este mes' },
    { id: 'lm', name: 'Mes anterior' },
    { id: 'y', name: 'Este año' },
    { id: 'ly', name: 'Año anterior' },
    { id: 'custom', name: 'Personalizado' }
  ];

  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === "due_at" && value === "custom") {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === "" || value === null || value === undefined) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
    type: '0',
  };

  const goToCategories = (type = '') => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push('/categories');
    }
  };

  const extraButtons = [
    <Button
      key="categories-button"
      variant="secondary"
      onClick={() => goToCategories('D')}
      style={{
        padding: '8px 16px',
        width: 'auto',
        height: 48,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      Categorías
    </Button>,
  ];

  const mod: ModCrudType = {
    modulo: 'debt-dptos',
    singular: 'Deuda',
    plural: '',
    export: true,
    filter: true,
    permiso: 'expense',
    extraData: true,
    hideActions: {
      view: false,
      edit: true,
      del: true,
    },
    renderView: (props: any) => (
      <RenderView
        open={props.open}
        onClose={props.onClose}
        item={props.item}
        extraData={props.extraData}
        user={user}
        onEdit={props.onEdit}
        onDel={props.onDel}
        hideSharedDebtButton={false}
        hideEditAndDeleteButtons={false}
      />
    ),
    titleAdd: 'Crear',
    renderForm: (props: any) => <RenderForm {...props} />,
  };

  // Primero definimos los campos base sin extraData
  const fields = {
    id: { rules: [], api: 'e' },
    begin_at: { rules: ['required'], api: 'ae', label: 'Fecha de inicio' },
    type: { rules: [], api: 'ae', label: 'Tipo' },
    description: { rules: [], api: 'ae', label: 'Descripción' },
    subcategory_id: {
      rules: ['required'],
      api: 'ae',
      label: 'Subcategoría',
      filter: {
        label: 'Subcategoría',
        width: '100%',
        options: getSubcategoryOptions,
        optionLabel: 'name',
        optionValue: 'id',
      },
    },
    dpto_id: { rules: ['required'], api: 'ae', label: 'Unidad' },
    amount: { rules: ['required'], api: 'ae', label: 'Monto' },
    interest: { rules: [], api: 'ae', label: 'Interés' },
    has_mv: { rules: [], api: 'ae', label: 'Tiene Mant. Valor' },
    is_forgivable: { rules: [], api: 'ae', label: 'Es condonable' },
    has_pp: { rules: [], api: 'ae', label: 'Tiene plan de pago' },
    is_blocking: { rules: [], api: 'ae', label: 'Es bloqueante' },

    unit: {
      rules: [''],
      api: '',
      label: 'Unidad',
      list: {
        onRender: renderUnitCell,
        order: 1,
      },
    },
    due_at: {
      rules: ['required'],
      api: 'ae',
      label: 'Vencimiento',
      list: {
        onRender: renderDueDateCell,
        order: 6,
      },
      filter: {
        key: 'due_at',
        label: 'Periodo',
        width: '100%',
        options: getPeriodOptions,
        optionLabel: 'name',
        optionValue: 'id',
        order: 1,
      },
    },
    category: {
      rules: [''],
      api: '',
      label: 'Categoría',
      list: false /* {
        onRender: renderCategoryCell,
        order: 2,
      }, */,
    },
    subcategory: {
      rules: [''],
      api: '',
      label: 'Subcategoría',
      list: {
        onRender: renderSubcategoryCell,
        order: 3,
      },
    },

    status: {
      rules: [''],
      api: '',
      label: <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>Estado</span>,
      list: {
        onRender: renderStatusCell,
        order: 5,
      },
      filter: {
        key: 'status',
        label: 'Estado',
        width: '100%',
        options: getStatusOptions,
        optionLabel: 'name',
        optionValue: 'id',
        order: 1,
      },
    },

    debt_amount: {
      rules: [''],
      api: '',
      label: <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Deuda</span>,
      list: {
        onRender: renderDebtAmountCell,
        order: 7,
      },
    },
    penalty_amount: {
      rules: [''],
      api: '',
      label: <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</span>,
      list: {
        onRender: renderPenaltyAmountCell,
        order: 8,
      },
    },
    maintenance_amount: {
      rules: [''],
      api: '',
      label: (
        <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Mant. Valor</label>
      ),
      list: {
        order: 9,
        onRender: renderMaintenanceAmountCell,
      },
    },
    balance_due: {
      rules: [''],
      api: '',
      label: (
        <span style={{ display: 'block', textAlign: 'right', width: '100%' }}> Monto total</span>
      ),
      list: {
        onRender: renderBalanceDueCell,
        order: 9,
      },
    },
  };

  const { userCan, List, onEdit, onDel, extraData, execute, reLoad, showToast, onFilter } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons,
    getFilter: handleGetFilter,
  });


  useEffect(() => {
    if (extraData && onExtraDataChange) {
      onExtraDataChange(extraData);
    }
  }, [extraData, onExtraDataChange]);

  const { onLongPress, selItem } = useCrudUtils({
    onSearch: () => { },
    searchs: {},
    setStore,
    mod,
    onEdit,
    onDel,
  });

  const renderItem = (item: Record<string, any>) => {
    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'A': 'Por cobrar',
        'P': 'Pagada',
        'C': 'Cancelada',
        'X': 'Anulada',
        'M': 'En mora'
      };
      return statusMap[status] || status;
    };

    let finalStatus = item?.status;

    // Obtener fecha actual solo como string YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dueAtString = item?.due_at;

    // Solo marcar en mora si la fecha de vencimiento es MENOR que hoy (no igual)
    if (dueAtString && dueAtString < todayString && item?.status === 'A') {
      finalStatus = 'M';
    }

    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    const totalBalance = debtAmount + penaltyAmount;

    return (
      <RenderItem item={item} onClick={() => { }} onLongPress={onLongPress}>
        <ItemList
          title={`Unidad ${item?.dpto?.nro || item?.dpto_id} - ${getStatusText(finalStatus)}`}
          subtitle={`Deuda: Bs ${debtAmount.toFixed(2)} | Multa: Bs ${penaltyAmount.toFixed(2)} | Total: Bs ${totalBalance.toFixed(2)}`}
          variant="V1"
          active={selItem && selItem.id == item.id}
        />
      </RenderItem>
    );
  };

  const onClickDetail = (row: any) => {
  };

  return (
    <>
      <List
        height={'calc(100vh - 580px)'}
        onTabletRow={renderItem}
        onRowClick={onClickDetail}
        emptyMsg="Lista de deudas individuales vacía. Una vez generes las cuotas"
        emptyLine2="individuales las verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={2500}
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
          onFilter('due_at', customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </>
  );
};

export default IndividualDebts;
