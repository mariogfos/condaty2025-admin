'use client';
import { useMemo, useEffect } from 'react';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import useCrudUtils from '../../../shared/useCrudUtils';
import { getDateStrMesShort, MONTHS } from '@/mk/utils/date';
import RenderForm from './RenderForm/RenderForm';
import { IconCategories } from '@/components/layout/icons/IconsBiblioteca';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import RenderItem from '../../../shared/RenderItem';
import { useAuth } from '@/mk/contexts/AuthProvider';
import React from 'react';


interface SharedDebtsProps {
  openView: boolean;
  setOpenView: (open: boolean) => void;
  viewItem: any;
  setViewItem: (item: any) => void;
  onExtraDataChange?: (extraData: any) => void;
}

// Importar useRouter para navegación
import { useRouter } from 'next/navigation';

const SharedDebts: React.FC<SharedDebtsProps> = ({
  openView,
  setOpenView,
  viewItem,
  setViewItem,
  onExtraDataChange,
}) => {
  const { setStore, store } = useAuth();
  const router = useRouter(); // Agregar useRouter

  // Renderizar columna Concepto (descripción)
  const renderConceptCell = ({ item }: { item: any }) => (
    <div>{item?.description || 'Sin descripción'}</div>
  );

  // Renderizar columna Categoría
  const renderCategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.name || '-/-'}</div>
  );

  // Renderizar columna Subcategoría
  const renderSubcategoryCell = ({ item }: { item: any }) => (
    <div>{item?.subcategory?.name || '-/-'}</div>
  );

  // Renderizar columna Distribución
  const renderDistributionCell = ({ item }: { item: any }) => {
    const getDistributionText = (amountType: string) => {
      const distributionMap: { [key: string]: string } = {
        M: 'Por m²',
        P: 'Promedio',
        F: 'Fijo',
      };
      return distributionMap[amountType] || '-/-';
    };

    return <div>{getDistributionText(item?.amount_type)}</div>;
  };

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
        A: 'Por cobrar',
        P: 'Cobrado',
        S: 'Por confirmar',
        M: 'En mora',
        C: 'Cancelada',
        X: 'Anulada',
      };
      return statusMap[status] || status;
    };

    const statusText = getStatusText(item?.status);
    const { color, bgColor } = statusConfig[item?.status] || statusConfig.E;

    return (
      <StatusBadge color={color} backgroundColor={bgColor}>
        {statusText}
      </StatusBadge>
    );
  };

  const renderDueDateCell = ({ item }: { item: any }) => {
    if (!item?.due_at) return <div>-/-</div>;
    return (
      getDateStrMesShort(item.due_at)
    );
  };

  // Renderizar columna Deuda (monto principal)
  const renderDebtAmountCell = ({ item }: { item: any }) => (
    <FormatBsAlign value={parseFloat(item?.amount) || 0} alignRight />
  );

  // Renderizar columna Multa (calcular desde asignados)
  const renderPenaltyAmountCell = ({ item }: { item: any }) => {
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;

    return <FormatBsAlign value={totalPenalty} alignRight />;
  };

  // Renderizar columna Saldo a cobrar (deuda + multas)
  const renderBalanceDueCell = ({ item }: { item: any }) => {
    const debtAmount = parseFloat(item?.amount) || 0;
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;
    const totalBalance = debtAmount + totalPenalty;

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
    { id: 'X', name: 'Anulada' },
  ];

  const getDistributionOptions = () => [
    { id: 'ALL', name: 'Todas las distribuciones' },
    { id: 'M', name: 'Monto fijo' },
    { id: 'P', name: 'Porcentual' },
    { id: 'V', name: 'Variable' },
    { id: 'F', name: 'Fijo' },
  ];

  const getCategoryOptions = () => [
    { id: 'ALL', name: 'Todas las categorías' },
    { id: 'expense', name: 'Expensa' },
    { id: 'reserve', name: 'Reserva' },
    { id: 'other', name: 'Otro' },
  ];

  const getSubcategoryOptions = () => [
    { id: 'ALL', name: 'Todas las subcategorías' },
    { id: 'water', name: 'Agua' },
    { id: 'electricity', name: 'Electricidad' },
    { id: 'gas', name: 'Gas' },
    { id: 'internet', name: 'Internet' },
    { id: 'cleaning', name: 'Limpieza' },
    { id: 'maintenance', name: 'Mantenimiento' },
    { id: 'security', name: 'Seguridad' },
  ];

  const getPeriodOptions = () => {
    const periods = [{ id: 'ALL', name: 'Todos los periodos' }];
    const currentYear = new Date().getFullYear();

    // Generar periodos de los últimos 3 años
    for (let year = currentYear; year >= currentYear - 2; year--) {
      MONTHS.slice(1).forEach((month, index) => {
        periods.push({
          id: `${year}-${String(index + 1).padStart(2, '0')}`,
          name: `${month} ${year}`,
        });
      });
    }

    return periods;
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
    type: 4, // Mantener el tipo actual para deudas grupales
  };

  const fields = useMemo(() => {
    return {
      // Campos principales para el formulario
      id: { rules: [], api: 'e' },
      begin_at: { rules: ['required'], api: 'ae', label: 'Fecha de inicio' },
      type: { rules: [], api: 'ae', label: 'Tipo' },
      description: { rules: [], api: 'ae', label: 'Descripción' },
      category_id: { rules: ['required'], api: 'ae', label: 'Categoría' },
      subcategory_id: { rules: ['required'], api: 'ae', label: 'Subcategoría' },
      asignar: { rules: ['required'], api: 'ae', label: 'Asignación' },
      dpto_id: { rules: [], api: 'ae', label: 'Departamentos' },
      amount_type: { rules: ['required'], api: 'ae', label: 'Tipo de monto' },
      amount: { rules: ['required'], api: 'ae', label: 'Monto' },
      is_advance: { rules: [], api: 'ae', label: 'Es adelanto' },
      interest: { rules: [], api: 'ae', label: 'Interés' },
      has_mv: { rules: [], api: 'ae', label: 'Tiene MV' },
      is_forgivable: { rules: [], api: 'ae', label: 'Es condonable' },
      has_pp: { rules: [], api: 'ae', label: 'Tiene plan de pago' },
      is_blocking: { rules: [], api: 'ae', label: 'Es bloqueante' },

      // Campos solo para visualización (sin api)
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
      },
      due_at: {
        rules: ['required'],
         api: 'ae',
         label: 'Fecha de vencimiento',
        list: {
          onRender: renderDueDateCell,
          order: 6,
        },
      },
      debt_amount: {
        rules: [''],
        api: '',
        label: <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Deuda</label>,
        list: {
          onRender: renderDebtAmountCell,
          order: 7,
        },
      },
      penalty_amount: {
        rules: [''],
        api: '',
        label: <label style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</label>,
        list: {
          onRender: renderPenaltyAmountCell,
          order: 8,
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
        },
      },
      // SOLO FILTROS - NO CAMPOS DE FORMULARIO
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
    modulo: 'debts',
    singular: 'Deuda Compartida',
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
    renderView: (props: any) => {
      // En lugar de mostrar un modal, redirigir a la ruta
      const debtId = props.item?.id;
      if (debtId) {
        router.push(`/debts_manager/shared-debt-detail/${debtId}`);
      }
      // Cerrar cualquier modal que esté abierto
      props.onClose();
      return null; // No renderizar nada ya que estamos redirigiendo
    },
    titleAdd: 'Crear',
    renderForm: (props: any) => <RenderForm {...props} />,
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
        A: 'Por cobrar',
        P: 'Pagada',
        C: 'Cancelada',
        X: 'Anulada',
      };
      return statusMap[status] || status;
    };

    const debtAmount = parseFloat(item?.amount) || 0;
    const totalPenalty =
      item?.asignados?.reduce((sum: number, asignado: any) => {
        return sum + (parseFloat(asignado?.penalty_amount) || 0);
      }, 0) || 0;
    const totalBalance = debtAmount + totalPenalty;

    return (
      <RenderItem item={item} onClick={() => {}} onLongPress={onLongPress}>
        <ItemList
          title={`${item?.description || 'Sin concepto'} - ${getStatusText(item?.status)}`}
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
    // No hacer nada - evitar redirección
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
      />
    </>
  );
};

export default SharedDebts;
