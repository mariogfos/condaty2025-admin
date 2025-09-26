'use client';
import { useMemo, useEffect, useState } from 'react';
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
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import React from 'react';
import { formatBs, formatNumber } from '@/mk/utils/numbers';

interface AllDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
  onExtraDataChange?: (extraData: any) => void;
}

const AllDebts: React.FC<AllDebtsProps> = ({
  onExtraDataChange
}) => {
  const { setStore, store } = useAuth();
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const renderUnitCell = ({ item }: { item: any }) => (
    <div>{item?.dpto?.nro || item?.dpto_id}</div>
  );

  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{item?.debt?.subcategory?.padre?.name || item?.subcategory?.padre?.name || '-/-'}</div>
  );

  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.debt?.subcategory?.name || item?.subcategory?.name || '-/-'}</div>
  );

  const renderDebtTypeCell = ({ item }: { item: any }) => {
    switch (item?.type) {
      case 0: {
        return <div>Individual</div>
        break;
      }
      case 1: {
        return <div>Expensas</div>;
        break;
      }
      case 2: {
        return <div>Reservas</div>
        break;
      }
      case 3: {
        return <div>Multa por Cancelación</div>
        break;
      }
      case 4: {
        return <div>Compartida</div>
        break;
      }
      case 5: {
        return <div>Condonación</div>
        break;
      }
      default: {
        return <div>-/-</div>
        break;
      }
    }
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
      F: { color: 'var(--cInfo)', bgColor: 'var(--cHoverCompl3)' },
      UNKNOWN: { color: 'var(--cGray)', bgColor: 'var(--cGrayLight)' },
    };

    const getStatusText = (status: string) => {
      const statusMap: { [key: string]: string } = {
        A: 'Por cobrar',
        P: 'Cobrado',
        S: 'Por confirmar',
        M: 'En mora',
        C: 'Cancelada',
        F: 'Perdonada',
        X: 'Anulada',
      };
      return statusMap[status] || 'Estado desconocido';
    };

    let finalStatus = item?.status;

    // Obtener fecha actual solo como string YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dueAtString = item?.debt?.due_at || item?.due_at;


    // Solo marcar en mora si la fecha de vencimiento es MENOR que hoy (no igual)
    if (dueAtString && dueAtString < todayString && item?.status === 'A') {
      finalStatus = 'M';

    } else {

    }

    const statusText = getStatusText(finalStatus);
    const { color, bgColor } = statusConfig[finalStatus] || statusConfig.UNKNOWN;

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
    { id: 'F', name: 'Perdonada' },
    { id: 'S', name: 'Por confirmar' },
    { id: 'M', name: 'En mora' },
    { id: 'C', name: 'Cancelada' },
    { id: 'X', name: 'Anulada' },
  ];

  const getDebtTypeOptions = () => [
    { id: 'ALL', name: 'Todas las deudas' },
    { id: "0", name: 'Individual' },
    { id: "1", name: 'Expensas' },
    { id: "2", name: 'Reservas' },
    { id: "3", name: 'Cancelación' },
    { id: "4", name: 'Compartida' },
    { id: "5", name: 'Condonación' },
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

  const calculateTotals = (data: any[]) => {
    if (!data || data.length === 0) return { totalDebt: 0, totalPenalty: 0, totalBalance: 0 };

    return data.reduce((acc, item) => {
      const debtAmount = parseFloat(item?.amount) || 0;
      const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
      const maintenanceAmount = parseFloat(item?.maintenance_amount) || 0;
      const totalBalance = debtAmount + penaltyAmount + maintenanceAmount;

      return {
        totalDebt: acc.totalDebt + debtAmount,
        totalPenalty: acc.totalPenalty + penaltyAmount,
        totalBalance: acc.totalBalance + totalBalance
      };
    }, { totalDebt: 0, totalPenalty: 0, totalBalance: 0 });
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
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
      due_at: {
        rules: [''],
        api: '',
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
        },
      },
      category_id: {
        rules: [''],
        api: '',
        label: 'Categoría',
        list: {
          onRender: renderCategoryCell,
          order: 2,
        },
        filter: {
          label: 'Categoría',
          width: '100%',
          options: getCategoryOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
      subcategory_id: {
        rules: [''],
        api: '',
        label: 'Subcategoría',
        list: {
          onRender: renderSubcategoryCell,
          order: 3,
        },
        filter: {
          label: 'Subcategoría',
          width: '100%',
          options: getSubcategoryOptions,
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
      type: {
        rules: [''],
        api: '',
        label: 'Tipo',
        list: {
          onRender: renderDebtTypeCell,
          order: 4,
        },
        filter: {
          key: 'type',
          label: 'Tipo',
          width: '100%',
          options: getDebtTypeOptions,
          optionLabel: 'name',
          optionValue: 'id',
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
        },
      },

      amount: {
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
            const totalBalance = (sumas.amount || 0) + (sumas.penalty_amount || 0);
            return renderTotalWithGreenBorder(totalBalance, true);
          },
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
    sumarize: false,
    hideActions: {
      add: true,
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
      <RenderForm
        open={props.open}
        onClose={props.onClose}
        item={props.item}
        setItem={props.setItem}
        execute={props.execute}
        extraData={props.extraData}
        user={props.user}
        reLoad={props.reLoad}
        errors={props.errors}
        setErrors={props.setErrors}
        onSave={props.onSave}
        action={props.action}
      />
    ),
  };

  const { userCan, List, onEdit, onDel, extraData, onFilter } = useCrud({
    paramsInitial,
    mod,
    fields,
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
        'A': 'Por cobrar',
        'P': 'Pagada',
        'C': 'Cancelada',
        'X': 'Anulada',
        'M': 'En mora',
        'F': 'Perdonada'
      };
      return statusMap[status] || status;
    };

    let finalStatus = item?.status;

    // Obtener fecha actual solo como string YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dueAtString = item?.debt?.due_at || item?.due_at;

    // Solo marcar en mora si la fecha de vencimiento es MENOR que hoy (no igual)
    if (dueAtString && dueAtString < todayString && item?.status === 'A') {
      finalStatus = 'M';
    }

    const debtAmount = parseFloat(item?.amount) || 0;
    const penaltyAmount = parseFloat(item?.penalty_amount) || 0;
    const totalBalance = debtAmount + penaltyAmount;

    return (
      <RenderItem item={item} onClick={() => {}} onLongPress={onLongPress}>
        <ItemList
          title={`Unidad ${item?.dpto?.nro || item?.dpto_id} - ${getStatusText(finalStatus)}`}
          subtitle={`Deuda: ${formatBs(debtAmount)} | Multa: ${formatBs(penaltyAmount)} | Total: ${formatBs(totalBalance)}`}
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
        height={'calc(100vh - 550px)'}
        onTabletRow={renderItem}
        onRowClick={onClickDetail}
        emptyMsg="Lista de todas las deudas vacía. Una vez generes las cuotas"
        emptyLine2="de los residentes las verás aquí."
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

export default AllDebts;

