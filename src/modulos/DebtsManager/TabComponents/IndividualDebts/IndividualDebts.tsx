'use client';
import { useMemo } from 'react';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import useCrudUtils from '../../../shared/useCrudUtils'; // Corregido
import { MONTHS } from '@/mk/utils/date';
import RenderForm from '../../RenderForm/RenderForm'; // Corregido
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import RenderItem from '../../../shared/RenderItem'; // Corregido
import { useAuth } from '@/mk/contexts/AuthProvider';

interface IndividualDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
}

const IndividualDebts: React.FC<IndividualDebtsProps> = ({ openView, setOpenView, viewItem, setViewItem }) => {
  const { setStore, store } = useAuth();

  // Reutilizar las mismas funciones render del componente AllDebts
  const renderAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-</div>;
    const date = new Date(item.due_at);
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

  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.name}</div>
  );

  const renderInterestCell = ({ item }: { item: any }) => (
    <div>{parseFloat(item?.interest) || 0}%</div>
  );

  const renderShowCell = ({ item }: { item: any }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setViewItem(item);
        setOpenView(true);
      }}
      style={{
        background: 'var(--cSuccess)',
        color: 'var(--cWhite)',
        border: 'none',
        padding: '8px 16px',
        borderRadius: 'var(--bRadiusS)',
        cursor: 'pointer',
        fontSize: 'var(--sS)',
        fontWeight: 'var(--bMedium)',
        transition: 'all 0.3s ease',
      }}
    >
      Ver detalle
    </button>
  );

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
    type: 'individual',
  };

  const fields = useMemo(() => {
    return {
      id: { rules: [], api: 'e' },
      begin_at: {
        rules: [''],
        api: '',
        label: 'Fecha',
        list: { order: 1 },
      },
      subcategory: {
        rules: [''],
        api: '',
        label: 'Categoría',
        list: {
          onRender: renderSubcategoryCell,
          order: 2,
        },
      },
      amount: {
        rules: [''],
        api: '',
        label: (
          <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Monto (Bs)</label>
        ),
        list: {
          onRender: renderAmountCell,
          order: 3,
        },
      },
      due_at: {
        rules: [''],
        api: '',
        label: 'Fecha vencimiento',
        list: {
          onRender: renderDueDateCell,
          order: 4,
        },
      },
      interest: {
        rules: [''],
        api: '',
        label: 'Interés',
        list: {
          onRender: renderInterestCell,
          order: 5,
        },
      },
      status: {
        rules: [''],
        api: '',
        label: 'Estado',
        list: {
          onRender: renderStatusCell,
          order: 6,
        },
      },
      show: {
        rules: [''],
        api: '',
        label: 'Detalle',
        form: false,
        list: {
          onRender: renderShowCell,
          order: 7,
        },
      },
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
    modulo: 'debts',
    singular: 'Deuda',
    plural: '',
    export: true,
    filter: true,
    permiso: 'expense',
    extraData: true,
    hideActions: {
      view: true,
      edit: true,
      del: true,
    },
    renderForm: (props: any) => (
      <RenderForm {...props} />
    ),
  };

  const { userCan, List, onEdit, onDel } = useCrud({
    paramsInitial,
    mod,
    fields,
  });

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

    return (
      <RenderItem item={item} onClick={() => {}} onLongPress={onLongPress}>
        <ItemList
          title={`${MONTHS[item?.month]} ${item?.year} - ${getStatusText(item?.status)}`}
          subtitle={`Monto: Bs ${parseFloat(item?.amount || 0).toFixed(2)} - Vence: ${item?.due_at ? new Date(item.due_at).toLocaleDateString('es-ES') : 'Sin fecha'}`}
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
