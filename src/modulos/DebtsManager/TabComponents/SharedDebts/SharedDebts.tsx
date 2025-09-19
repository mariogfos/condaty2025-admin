'use client';
import { useMemo, useEffect, useState } from 'react';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import useCrudUtils from '../../../shared/useCrudUtils';
import { getDateStrMes, MONTHS } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import RenderItem from '../../../shared/RenderItem';
import { useAuth } from '@/mk/contexts/AuthProvider';
import Button from '@/mk/components/forms/Button/Button';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import React from 'react';
import { formatNumber } from '@/mk/utils/numbers';

import { useRouter } from 'next/navigation';

interface SharedDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
  onExtraDataChange?: (extraData: any) => void;
}

const SharedDebts: React.FC<SharedDebtsProps> = ({
  openView,
  setOpenView,
  viewItem,
  setViewItem,
  onExtraDataChange,
}) => {
  const { setStore, store } = useAuth();
  const router = useRouter();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const renderConceptCell = ({ item }: { item: any }) => (
    <div>{item?.description || 'Sin descripción'}</div>
  );

  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.padre?.name || '-/-'}</div>
  );

  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.name || '-/-'}</div>
  );

  const renderDistributionCell = ({ item }: { item: any }) => {
    const getDistributionText = (amountType: string) => {
      const distributionMap: { [key: string]: string } = {
        M: 'Por m²',
        P: 'Promedio',
        F: 'Fijo',
        V: 'Variable',
        A: 'Promedio',
      };
      return distributionMap[amountType] || '-/-';
    };

    return <div>{getDistributionText(item?.amount_type)}</div>;
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
      X: { color: 'var(--cError)', bgColor: 'var(--cHoverError)' },
    };

    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        A: 'Por cobrar',
        P: 'Cobrado',
        S: 'Por confirmar',
        M: 'En mora',
        C: 'Cancelada',
        X: 'Anulada',
      };
      return statusMap[status] || status;
    };

    let finalStatus = item?.status;
    const today = new Date();
    const dueDate = item?.due_at ? new Date(item.due_at) : null;

    if (dueDate && dueDate < today && item?.status === 'A') {
      finalStatus = 'M';
    }

    const statusText = getStatusText(finalStatus);
    const { color, bgColor } = statusConfig[finalStatus] || statusConfig.E;

    return (
      <StatusBadge color={color} backgroundColor={bgColor}>
        {statusText}
      </StatusBadge>
    );
  };

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

  const renderPenaltyAmountCell = ({ item }: { item: any }) => {
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;

    return <FormatBsAlign value={totalPenalty} alignRight />;
  };

  const renderBalanceDueCell = ({ item }: { item: any }) => {
    const debtAmount = parseFloat(item?.amount) || 0;
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;
    const totalBalance = debtAmount + totalPenalty;

    return <FormatBsAlign value={totalBalance} alignRight />;
  };

  const getStatusOptions = () => [
    { id: 'ALL', name: 'Todos los estados' },
    { id: 'A', name: 'Por cobrar' },
    { id: 'P', name: 'Cobrado' },
    { id: 'S', name: 'Por confirmar' },
    { id: 'M', name: 'En mora' },
    { id: 'C', name: 'Cancelada' },
    { id: 'X', name: 'Anulada' },
  ];

  const getDistributionOptions = () => [
    { id: 'ALL', name: 'Todas las distribuciones' },
    { id: 'F', name: 'Fijo' },
    { id: 'V', name: 'Variable' },
    { id: 'P', name: 'Porcentual' },
    { id: 'M', name: 'Por m²' },
    { id: 'A', name: 'Promedio' }
  ];

  const getCategoryOptions = (extraData?: any) => {
    const options = [{  }];

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
    const options = [{ }];

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

    if (value === "" || value === null || value === undefined ) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const renderTotalWithGreenBorder = (value: number, isHighlighted = false) => (
    <div style={{
      fontWeight: 'bold',
      fontSize: '14px',
      color: isHighlighted ? '#10b981' : 'var(--cWhite)',
      textAlign: 'right',
      backgroundColor: isHighlighted ? 'rgba(16, 185, 129, 0.1)' : 'var(--cBlackV2)',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '2px solid #10b981',
      minWidth: '80px',
      margin: '4px 0'
    }}>
      Bs {formatNumber(value || 0, 2)}
    </div>
  );

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
    type: 4,
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: 'e' },
      begin_at: { rules: ['required'], api: 'ae', label: 'Fecha de inicio' },
      type: { rules: [], api: 'ae', label: 'Tipo' },
      description: { rules: [], api: 'ae', label: 'Descripción' },
      category_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Categoría',
        filter: {
          label: 'Categoría',
          width: '100%',
          options: getCategoryOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
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
      asignar: { rules: ['required'], api: 'ae', label: 'Asignación' },
      dpto_id: { rules: [], api: 'ae', label: 'Departamentos' },
      amount_type: {
        rules: ['required'],
        api: 'ae',
        label: 'Tipo de monto',
        filter: {
          key: 'amount_type',
          label: 'Distribución',
          width: '100%',
          options: getDistributionOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
      amount: { rules: ['required'], api: 'ae', label: 'Monto' },
      is_advance: { rules: [], api: 'ae', label: 'Es adelanto' },
      interest: { rules: [], api: 'ae', label: 'Interés' },
      has_mv: { rules: [], api: 'ae', label: 'Tiene MV' },
      is_forgivable: { rules: [], api: 'ae', label: 'Es condonable' },
      has_pp: { rules: [], api: 'ae', label: 'Tiene plan de pago' },
      is_blocking: { rules: [], api: 'ae', label: 'Es bloqueante' },

      concept: {
        rules: [''],
        api: '',
        label: 'Concepto',
        list: {
          onRender: renderConceptCell,
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
        label: <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>Estado</span>,
        list: {
          onRender: renderStatusCell,
          order: 5,
        },
        filter: {

          width: '100%',
          options: getStatusOptions,

        },
      },
      due_at: {
        rules: ['required'],
        api: 'ae',
        label: 'Fecha de vencimiento',
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
        },
      },
      debt_amount: {
        rules: [''],
        api: '',
        label: <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Deuda</label>,
        list: {
          onRender: renderDebtAmountCell,
          order: 7,
          sumarize: true,
          onRenderFoot: (item: any, index: number, sumas: any) =>
            renderTotalWithGreenBorder(sumas[item.key]),
        },
      },
      penalty_amount: {
        rules: [''],
        api: '',
        label: <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</label>,
        list: {
          onRender: renderPenaltyAmountCell,
          order: 8,
          sumarize: true,
          onRenderFoot: (item: any, index: number, sumas: any) =>
            renderTotalWithGreenBorder(sumas[item.key]),
        },
      },
      balance_due: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>
            Saldo a cobrar
          </label>
        ),
        list: {
          onRender: renderBalanceDueCell,
          order: 9,
          sumarize: false,
          onRenderFoot: (item: any, index: number, sumas: any) => {
            const totalBalance = (sumas.debt_amount || 0) + (sumas.penalty_amount || 0);
            return renderTotalWithGreenBorder(totalBalance, true);
          },
        },
      },
    };
  }, []);

  const mod: ModCrudType = {
    modulo: 'debts',
    singular: 'Deuda Compartida',
    plural: '',
    export: true,
    filter: true,
    permiso: 'expense',
    extraData: true,
    sumarize: false,
    hideActions: {
      view: false,
      edit: true,
      del: true,
    },
    renderView: (props: any) => {
      const debtId = props.item?.id;
      if (debtId) {
        router.push(`/debts_manager/shared-debt-detail/${debtId}`);
      }
      props.onClose();
      return null;
    },
    titleAdd: 'Crear',
    renderForm: (props: any) => <RenderForm {...props} />,
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
      variant='secondary'
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

  const { userCan, List, onEdit, onDel, extraData, onFilter } = useCrud({
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
        A: 'Por cobrar',
        P: 'Pagada',
        C: 'Cancelada',
        X: 'Anulada',
        M: 'En mora'
      };
      return statusMap[status] || status;
    };

    let finalStatus = item?.status;
    const today = new Date();
    const dueDate = item?.due_at ? new Date(item.due_at) : null;

    if (dueDate && dueDate < today && item?.status === 'A') {
      finalStatus = 'M';
    }

    const debtAmount = parseFloat(item?.amount) || 0;
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;
    const totalBalance = debtAmount + totalPenalty;

    return (
      <RenderItem item={item} onClick={() => {}} onLongPress={onLongPress}>
        <ItemList
          title={`${item?.description || 'Sin concepto'} - ${getStatusText(finalStatus)}`}
          subtitle={`Deuda: Bs ${debtAmount.toFixed(2)} | Multa: Bs ${totalPenalty.toFixed(
            2
          )} | Total: Bs ${totalBalance.toFixed(2)}`}
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
        height={'calc(100vh - 500px)'}
        onTabletRow={renderItem}
        onRowClick={onClickDetail}
        emptyMsg="Lista de deudas grupales vacía. Una vez generes las cuotas"
        emptyLine2="grupales las verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={2500}
        sumarize={false}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          let err: { startDate?: string; endDate?: string } = {};
          if (!startDate) err.startDate = "La fecha de inicio es obligatoria";
          if (!endDate) err.endDate = "La fecha de fin es obligatoria";
          if (startDate && endDate && startDate > endDate)
            err.startDate = "La fecha de inicio no puede ser mayor a la de fin";
          if (
            startDate &&
            endDate &&
            startDate.slice(0, 4) !== endDate.slice(0, 4)
          ) {
            err.startDate =
              "El periodo personalizado debe estar dentro del mismo año";
            err.endDate =
              "El periodo personalizado debe estar dentro del mismo año";
          }
          if (Object.keys(err).length > 0) {
            setCustomDateErrors(err);
            return;
          }
          const customDateFilterString = `${startDate},${endDate}`;
          onFilter("due_at", customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </>
  );
};

export default SharedDebts;
