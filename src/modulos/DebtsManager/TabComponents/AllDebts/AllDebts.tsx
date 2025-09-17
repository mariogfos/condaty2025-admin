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
import React from 'react';
import { formatNumber } from '@/mk/utils/numbers';



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

  const renderUnitCell = ({ item }: { item: any }) => (
    <div>{item?.dpto?.nro || item?.dpto_id}</div>
  );

  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{item?.debt?.subcategory?.padre?.name || '-/-'}</div>
  );

  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.debt?.subcategory?.name || '-/-'}</div>
  );

  const renderDistributionCell = ({ item }: { item: any }) => {
    switch (item?.debt?.amount_type) {
      case "F": {
        return <div>Fijo</div>;
        break;
      }
      case "V": {
        return <div>Variable</div>
        break;
      }
      case "P": {
        return <div>Porcentual</div>
        break;
      }
      case "M": {
        return <div>Por m<sup>2</sup></div>
        break;
      }
      case "A": {
        return <div>Promedio</div>
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


  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.debt?.due_at) return <div>-/-</div>;
    return (
      <div>
        {getDateStrMes(item.debt.due_at)}
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
    { id: 'C', name: 'Cancelada' },
    { id: 'X', name: 'Anulada' }
  ];

  const getDistributionOptions = () => [
    { id: 'ALL', name: 'Todas las distribuciones' },
    { id: 'fixed_unit', name: 'Monto fijo por unidad' },
    { id: 'fixed_group', name: 'Monto fijo grupal' },
    { id: 'percentage', name: 'Porcentual' },
    { id: 'variable', name: 'Variable' }
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

  const renderCustomFooter = (data: any[]) => {
    const totals = calculateTotals(data);

    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--cBlackV2)',
        border: '2px solid #10b981',
        borderRadius: '12px',
        padding: '16px 24px',
        margin: '16px 0',
        fontWeight: 'bold',
        fontSize: '16px',
        color: 'var(--cWhite)'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: 'var(--cWhite)'
        }}>
          Total
        </div>

        <div style={{
          display: 'flex',
          gap: '60px',
          alignItems: 'center'
        }}>
          <div style={{
            textAlign: 'right',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'var(--cWhite)'
          }}>
            Bs {totals.totalDebt.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{
            textAlign: 'right',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'var(--cWhite)'
          }}>
            Bs {totals.totalPenalty.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{
            textAlign: 'right',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid #10b981'
          }}>
            Bs {totals.totalBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    );
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
      amount: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Deuda</label>
        ),
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
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</label>
        ),
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
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Saldo a cobrar</label>
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
      distribution_filter: {
        rules: [],
        api: 'ae',
        label: 'Distribución',
        form: { type: 'select' },
        list: false,
        filter: {
          label: 'Distribución',
          width: '100%',
          options: getDistributionOptions,
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

  const { userCan, List, onEdit, onDel, extraData } = useCrud({
    paramsInitial,
    mod,
    fields,
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
  };

  return (
      <List
        height={'calc(100vh - 500px)'}
        onTabletRow={renderItem}
        onRowClick={onClickDetail}
        emptyMsg="Lista de todas las deudas vacía. Una vez generes las cuotas"
        emptyLine2="de los residentes las verás aquí."
        emptyIcon={<IconCategories size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={2500}
        sumarize={false}
      />
  );
};

export default AllDebts;

