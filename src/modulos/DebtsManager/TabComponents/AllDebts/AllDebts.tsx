'use client';
import { useMemo, useEffect } from 'react';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import useCrudUtils from '../../../shared/useCrudUtils';
import { MONTHS } from '@/mk/utils/date';
import RenderForm from '../../RenderForm/RenderForm';
import RenderView from './RenderView/RenderView';
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import RenderItem from '../../../shared/RenderItem';
import { useAuth } from '@/mk/contexts/AuthProvider';
import React from 'react';

interface AllDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
  onExtraDataChange?: (extraData: any) => void;
}

const AllDebts: React.FC<AllDebtsProps> = ({
  openView,
  setOpenView,
  viewItem,
  setViewItem,
  onExtraDataChange
}) => {
  const { setStore, store } = useAuth();

  // Renderizar columna Unidad
  const renderUnitCell = ({ item }: { item: any }) => (
    <div>{item?.dpto?.nro || item?.dpto_id}</div>
  );

  // Renderizar columna Categoría
  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{item?.debt?.subcategory?.category?.name || '-'}</div>
  );

  // Renderizar columna Subcategoría
  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.debt?.subcategory?.name || '-'}</div>
  );

  // Renderizar columna Distribución
  const renderDistributionCell = ({ item }: { item: any }) => (
    <div>{item?.debt?.distribution || 'Sin distribución'}</div>
  );

  // Renderizar columna Estado
  const renderStatusCell = ({ item }: { item: any }) => {
    const statusConfig: { [key: string]: { color: string; bgColor: string } } = {
      A: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
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

    const statusText = getStatusText(item?.status);
    const { color, bgColor } = statusConfig[item?.status] || statusConfig.E;

    return (
      <StatusBadge
        color={color}
        backgroundColor={bgColor}
      >
        {statusText}
      </StatusBadge>
    );
  };

  // Renderizar columna Vencimiento
  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.debt?.due_at) return <div>-</div>;
    const date = new Date(item.debt.due_at);
    return (
      <div>
        {date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </div>
    );
  };

  // Renderizar columna Deuda
  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  // Renderizar columna Multa
  const renderPenaltyAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.penalty_amount) || 0} alignRight />
  );

  // Renderizar columna Saldo a cobrar
  const renderBalanceDueCell = ({ item }: { item: any }) => {
    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    const maintenanceAmount = parseFloat(item?.maintenance_amount) || 0;
    const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;

    return <FormatBsAlign value={totalBalance} alignRight />;
  };

  const getYearOptions = () => {
    const lAnios: any = [{ id: 'ALL', name: 'Todos' }];
    const lastYear = new Date().getFullYear();
    for (let i = lastYear; i >= 2000; i--) {
      lAnios.push({ id: i, name: i.toString() });
    }
    return lAnios;
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: 'e' },
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
      distribution: {
        rules: [''],
        api: '',
        label: 'Distribución',
        list: {
          onRender: renderDistributionCell,
          order: 4,
        },
      },
      status: {
        rules: [''],
        api: '',
        label: 'Estado',
        list: {
          onRender: renderStatusCell,
          order: 5,
        },
      },
      due_at: {
        rules: [''],
        api: '',
        label: 'Vencimiento',
        list: {
          onRender: renderDueDateCell,
          order: 6,
        },
      },
      debt_amount: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Deuda</label>
        ),
        list: {
          onRender: renderDebtAmountCell,
          order: 7,
        },
      },
      penalty_amount: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</label>
        ),
        list: {
          onRender: renderPenaltyAmountCell,
          order: 8,
        },
      },
      balance_due: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Saldo a cobrar</label>
        ),
        list: {
          onRender: renderBalanceDueCell,
          order: 9,
        },
      },
      // Campos de filtros
      year: {
        rules: ['required'],
        api: 'ae',
        label: 'Año',
        form: { type: 'text' },
        list: false,
        filter: {
          label: 'Año',
          width: '100%',
          options: getYearOptions,
          optionLabel: 'name',
        },
      },
      month: {
        rules: ['required'],
        api: 'ae',
        label: 'Mes',
        form: {
          type: 'select',
          options: MONTHS.map((month, index) => ({
            id: index,
            name: month,
          })),
        },
        list: false,
        filter: {
          label: 'Meses',
          width: '100%',
          options: () =>
            MONTHS.map((month, index) => ({
              id: index == 0 ? 'ALL' : index,
              name: index == 0 ? 'Todos' : month,
            })),
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
      />
    ),
    renderForm: (props: any) => (
      <RenderForm {...props} />
    ),
  };

  const { userCan, List, onEdit, onDel, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
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
        'X': 'Anulada'
      };
      return statusMap[status] || status;
    };

    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    const totalBalance = debtAmount + penaltyAmount;

    return (
      <RenderItem item={item} onClick={() => {}} onLongPress={onLongPress}>
        <ItemList
          title={`Unidad ${item?.dpto?.nro || item?.dpto_id} - ${getStatusText(item?.status)}`}
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
        emptyMsg="Lista de todas las deudas vacía. Una vez generes las cuotas"
        emptyLine2="de los residentes las verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={2500}
      />
    </>
  );
};

export default AllDebts;

