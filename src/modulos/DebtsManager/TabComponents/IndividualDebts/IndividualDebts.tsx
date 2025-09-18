'use client';
import { useMemo, useEffect } from 'react';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import useCrudUtils from '../../../shared/useCrudUtils';
import { getDateStrMes, MONTHS } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import RenderView from './RenderView/RenderView';
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import RenderItem from '../../../shared/RenderItem';
import { useAuth } from '@/mk/contexts/AuthProvider';
import Button from '@/mk/components/forms/Button/Button';
import { useRouter } from 'next/navigation';
import React from 'react';

interface IndividualDebtsProps {
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
  const { setStore, store } = useAuth();
  const router = useRouter();

  // Renderizar columna Unidad
  const renderUnitCell = ({ item }: { item: any }) => (
    <div>{item?.dpto?.nro || item?.dpto_id}</div>
  );

  // Renderizar columna Categoría
  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.padre?.name || '-'}</div>
  );

  // Renderizar columna Subcategoría
  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.name || '-'}</div>
  );



  // Renderizar columna Estado
  const renderStatusCell = ({ item }: { item: any }) => {
    const statusConfig: { [key: string]: { color: string; bgColor: string } } = {
      A: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl8)' },
      P: { color: 'var(--cSuccess)', bgColor: 'var(--cHoverCompl2)' },
      S: { color: 'var(--cWarning)', bgColor: 'var(--cHoverCompl4)' },
      R: { color: 'var(--cMediumAlert)', bgColor: 'var(--cMediumAlertHover)' },
      E: { color: 'var(--cWhite)', bgColor: 'var(--cHoverCompl1)' },
      M: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
      C: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
      X: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
    };

    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        'A': 'Por cobrar',
        'P': 'Cobrado',
        'S': 'Por confirmar',
        'M': 'En mora',
        'C': 'Cancelada',
        'X': 'Anulada'
      };
      return statusMap[status] || status;
    };

    // NUEVA LÓGICA: Verificar si está en mora por fecha vencida
    let finalStatus = item?.status;
    const today = new Date();
    const dueDate = item?.due_at ? new Date(item.due_at) : null;

    // Si la fecha de vencimiento es menor a hoy y el estado es 'A' (Por cobrar), cambiar a 'M' (En mora)
    if (dueDate && dueDate < today && item?.status === 'A') {
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

  // Renderizar columna Vencimiento - ACTUALIZADO
  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-/-</div>;
    return (
      <div>
        {getDateStrMes(item.due_at)}
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

  // Opciones para filtros
  const getStatusOptions = () => [
    { id: 'ALL', name: 'Todos los estados' },
    { id: 'A', name: 'Por cobrar' },
    { id: 'P', name: 'Cobrado' },
    { id: 'S', name: 'Por confirmar' },
    { id: 'M', name: 'En mora' },
    { id: 'C', name: 'Cancelada' },
    { id: 'X', name: 'Anulada' }
  ];



  const getCategoryOptions = () => [
    { id: 'ALL', name: 'Todas las categorías' },
    { id: 'expense', name: 'Expensa' },
    { id: 'reserve', name: 'Reserva' },
    { id: 'other', name: 'Otro' }
  ];

  const getSubcategoryOptions = () => [
    { id: 'ALL', name: 'Todas las subcategorías' },
    { id: 'water', name: 'Agua' },
    { id: 'electricity', name: 'Electricidad' },
    { id: 'gas', name: 'Gas' },
    { id: 'internet', name: 'Internet' },
    { id: 'cleaning', name: 'Limpieza' },
    { id: 'maintenance', name: 'Mantenimiento' },
    { id: 'security', name: 'Seguridad' }
  ];

  const getPeriodOptions = () => {
    const periods = [{ id: 'ALL', name: 'Todos los periodos' }];
    const currentYear = new Date().getFullYear();

    // Generar periodos de los últimos 3 años
    for (let year = currentYear; year >= currentYear - 2; year--) {
      MONTHS.slice(1).forEach((month, index) => {
        periods.push({
          id: `${year}-${String(index + 1).padStart(2, '0')}`,
          name: `${month} ${year}`
        });
      });
    }

    return periods;
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
    type: '0',
  };

  const fields = useMemo(() => {
    return {
      // Campos principales para el formulario
      id: { rules: [], api: 'e' },
      begin_at: { rules: ['required'], api: 'ae', label: 'Fecha de inicio' },
      type: { rules: [], api: 'ae', label: 'Tipo' },
      description: { rules: [], api: 'ae', label: 'Descripción' },
      subcategory_id: { rules: ['required'], api: 'ae', label: 'Subcategoría' },
      dpto_id: { rules: ['required'], api: 'ae', label: 'Unidad' },
      amount: { rules: ['required'], api: 'ae', label: 'Monto' },
      interest: { rules: [], api: 'ae', label: 'Interés' },
      has_mv: { rules: [], api: 'ae', label: 'Tiene MV' },
      is_forgivable: { rules: [], api: 'ae', label: 'Es condonable' },
      has_pp: { rules: [], api: 'ae', label: 'Tiene plan de pago' },
      is_blocking: { rules: [], api: 'ae', label: 'Es bloqueante' },

      // Campos solo para visualización (sin api)
      unit: {
        rules: [''],
        api: '',
        label: 'Unidad',
        list: {
          onRender: renderUnitCell,
          order: 1,
        },
      },
      category: {
        rules: [''],
        api: '',
        label: 'Categoría',
        list: {
          onRender: renderCategoryCell,
          order: 2,
        },
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
      },
      due_at: {
        rules: ['required'],
        api: 'ae',
        label: 'Vencimiento',
        list: {
          onRender: renderDueDateCell,
          order: 6,
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
      balance_due: {
        rules: [''],
        api: '',
        label: <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Saldo a cobrar</span>,
        list: {
          onRender: renderBalanceDueCell,
          order: 9,
        },
      },

      // Filtros
      status_filter: {
        rules: [],
        api: 'ae',
        label: 'Estado',
        form: { type: 'select' },
        list: false,
        filter: {
          label: 'Estado',
          width: '100%',
          options: getStatusOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
      category_filter: {
        rules: [],
        api: 'ae',
        label: 'Categoría',
        form: { type: 'select' },
        list: false,
        filter: {
          label: 'Categoría',
          width: '100%',
          options: getCategoryOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
      subcategory_filter: {
        rules: [],
        api: 'ae',
        label: 'Subcategoría',
        form: { type: 'select' },
        list: false,
        filter: {
          label: 'Subcategoría',
          width: '100%',
          options: getSubcategoryOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
      period_filter: {
        rules: [],
        api: 'ae',
        label: 'Periodo',
        form: { type: 'select' },
        list: false,
        filter: {
          label: 'Periodo',
          width: '100%',
          options: getPeriodOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
    };
  }, []);

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
        user={props.user}
        onEdit={props.onEdit}
        onDel={props.onDel}
        execute={props.execute}
        reLoad={props.reLoad}
        showToast={props.showToast}
      />
    ),
    titleAdd: 'Crear',
    renderForm: (props: any) => <RenderForm {...props} />, // Simplificar como en SharedDebts
  };

  // Función para ir a categorías
  const goToCategories = (type = '') => {
    if (type) {
      router.push(`/categories?type=${type}`);
    } else {
      router.push('/categories');
    }
  };

  // Botones extra para incluir el botón de categorías
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

  const { userCan, List, onEdit, onDel, extraData, execute, reLoad, showToast } = useCrud({
    paramsInitial,
    mod,
    fields,
    extraButtons, // Agregar extraButtons aquí
  });

  // Pasar extraData al componente padre cuando cambie
  useEffect(() => {
    if (extraData && onExtraDataChange) {
      onExtraDataChange(extraData);
    }
  }, [extraData, onExtraDataChange]);

  const { onLongPress, selItem } = useCrudUtils({
    onSearch: () => {},
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

    // NUEVA LÓGICA: Verificar si está en mora por fecha vencida
    let finalStatus = item?.status;
    const today = new Date();
    const dueDate = item?.due_at ? new Date(item.due_at) : null;

    // Si la fecha de vencimiento es menor a hoy y el estado es 'A' (Por cobrar), cambiar a 'M' (En mora)
    if (dueDate && dueDate < today && item?.status === 'A') {
      finalStatus = 'M';
    }

    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    const totalBalance = debtAmount + penaltyAmount;

    return (
      <RenderItem item={item} onClick={() => {}} onLongPress={onLongPress}>
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
    // No hacer nada - evitar redirección
  };

  return (
    <>
      <List
        height={'calc(100vh - 500px)'}
        onTabletRow={renderItem}
        onRowClick={onClickDetail}
        emptyMsg="Lista de deudas individuales vacía. Una vez generes las cuotas"
        emptyLine2="individuales las verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={2500}
      />
    </>
  );
};

export default IndividualDebts;
