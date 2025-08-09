'use client';
import useCrud, { ModCrudType } from '@/mk/hooks/useCrud/useCrud';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import styles from './ExpensesDetailsView.module.css';
import { useMemo, useState, useEffect } from 'react';
import { getDateStrMes, MONTHS } from '@/mk/utils/date';
import { formatNumber } from '@/mk/utils/numbers';
import useCrudUtils from '@/modulos/shared/useCrudUtils';
import {
  IconArrowLeft,
  IconHandcoin,
  IconMonedas,
  IconMultas,
  IconUnidades,
  IconWallet,
} from '@/components/layout/icons/IconsBiblioteca';
import RenderView from './RenderView/RenderView';
import LoadingScreen from '@/mk/components/ui/LoadingScreen/LoadingScreen';
import { WidgetDashCard } from '@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import FormatBsAlign from '@/mk/utils/FormatBsAlign';

const ExpensesDetails = ({ data, setOpenDetail }: any) => {
  const [statsData, setStatsData] = useState({
    totalUnits: 0,
    paidUnits: 0,
    overdueUnits: 0,
    totalAmount: 0,
    paidAmount: 0,
    penaltyAmount: 0,
    pendingAmount: 0,
  });
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});
  const getDisplayStatus = (item: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (item.status === 'A' && item.debt?.due_at) {
      const dueDate = new Date(item.debt.due_at);
      if (today > dueDate) {
        return { text: 'En mora', code: 'M' };
      }
    }

    switch (item.status) {
      case 'A':
        return { text: 'Por cobrar', code: 'A' };
      case 'E':
        return { text: 'Subir comprobante', code: 'E' };
      case 'P':
        return { text: 'Cobrado', code: 'P' };
      case 'S':
        return { text: 'Por confirmar', code: 'S' };
      case 'M':
        return { text: 'En mora', code: 'M' };
      default:
        return { text: item.status || 'Desconocido', code: item.status || '' };
    }
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

  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === 'paid_at' && value === 'custom') {
      setCustomDateErrors({});
      setOpenCustomFilter(true);
      delete currentFilters[opt];
      return { filterBy: currentFilters };
    }

    if (value === 'ALL') {
      currentFilters[opt] = 'ALL'; // Enviamos 'ALL' explícitamente
    } else if (!value) {
      delete currentFilters[opt];
    } else {
      currentFilters[opt] = value;
    }
    return { filterBy: currentFilters };
  };

  const mod: ModCrudType = {
    modulo: 'debt-dptos',
    singular: '',
    plural: '',
    filter: true,
    export: true,
    permiso: 'expenses',
    hideActions: {
      add: true,
      edit: true,
      del: true,
    },
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
    }) => <RenderView {...props} />,
    extraData: true,
  };

  const paramsInitial = {
    fullType: 'L',
    page: 1,
    perPage: 20,
    debt_id: data.id,
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: 'e' },
      unit: {
        rules: [''],
        api: '',
        label: 'Unidad',
        list: {
          onRender: (props: any) => {
            return <div>{props?.item?.dpto?.nro}</div>;
          },
        },
      },
      address: {
        rules: [''],
        api: '',
        label: 'Dirección',
        list: {
          onRender: (props: any) => {
            return <div>{props?.item?.dpto?.description}</div>;
          },
        },
      },
      paid_at: {
        rules: [''],
        api: '',
        label: 'Fecha de pago',
        list: {
          onRender: (props: any) => {
            return <div>{getDateStrMes(props?.item?.paid_at) || '-/-'}</div>;
          },
        },
        filter: {
          key: 'paid_at',
          label: 'Periodo',
          options: getPeriodOptions,
        },
      },
      due_at: {
        rules: [''],
        api: '',
        label: 'Fecha de plazo',
        list: {
          onRender: (props: any) => {
            return <div>{getDateStrMes(props?.item?.debt?.due_at) || '-/-'}</div>;
          },
        },
      },
      amount: {
        rules: ['required'],
        api: 'e',
        label: <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Expensa</span>,
        list: {
          onRender: (props: any) => {
            return <FormatBsAlign value={props?.item?.amount} alignRight />;
          },
        },
        form: {
          type: 'text',
          label: 'Monto',
        },
      },
      obs: {
        rules: ['required'],
        api: 'e',
        label: 'Motivo del cambio',
        form: {
          type: 'text',
          label: 'Motivo del cambio',
        },
      },
      penalty_amount: {
        rules: [''],
        api: '',
        label: <span style={{ display: 'block', textAlign: 'right', width: '100%' }}>Multa</span>,
        list: {
          onRender: (props: any) => {
            return <FormatBsAlign value={props.item?.penalty_amount} alignRight />;
          },
        },
      },
      status: {
        rules: [''],
        api: '',
        label: <span style={{ display: 'block', textAlign: 'center', width: '100%' }}>Estado</span>,
        list: {
          onRender: (props: any) => {
            const displayStatus = getDisplayStatus(props?.item);
            const statusClass = `${styles.statusBadge} ${styles[`status${displayStatus.code}`]}`;
            return <div className={statusClass}>{displayStatus.text}</div>;
          },
        },
        filter: {
          label: 'Estado',
          width: '278px',
          options: () => {
            return [
              { id: 'ALL', name: 'Todos' },
              { id: 'A', name: 'Por cobrar' },
              { id: 'E', name: 'Por subir comprobante' },
              { id: 'P', name: 'Cobrado' },
              { id: 'S', name: 'Por confirmar' },
              { id: 'M', name: 'En mora' },
            ];
          },
          optionLabel: 'name',
        },
      },
    }),
    []
  );

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel, extraData, onFilter } =
    useCrud({
      paramsInitial,
      mod,
      fields,
      getFilter: handleGetFilter,
    });

  // Update statistics when useCrud data loads
  useEffect(() => {
    if (extraData) {
      setStatsData({
        totalUnits: extraData.assignedUnits || 0,
        paidUnits: extraData.paidUnits || 0,
        overdueUnits: extraData.overdueUnits || 0,
        totalAmount: extraData.expenseAmount || 0,
        paidAmount: extraData.paidAmount || 0,
        penaltyAmount: extraData.penaltyAmount || 0,
        pendingAmount: extraData.pendingAmount || 0,
      });
    }
  }, [extraData]);

  // Initialize crud utils (keeping for potential future use)
  useCrudUtils({
    onSearch,
    searchs,
    setStore,
    mod,
    onEdit,
    onDel,
  });

  if (!userCan(mod.permiso, 'R')) return <NotAccess />;

  return (
    <div className={styles.ExpensesDetailsView}>
      <div className={styles.backButton}>
        <div className={styles.backButtonContent} onClick={() => setOpenDetail(false)}>
          <IconArrowLeft />
          <p>Volver a sección expensas</p>
        </div>
      </div>

      <LoadingScreen>
        <h1 className={styles.dashboardTitle}>
          Expensas de {MONTHS[data?.month]} {data?.year}
        </h1>
        <div className={styles.allStatsRow}>
          {/* Tarjeta 1 (antes en grupo izquierdo) */}
          <WidgetDashCard
            data={statsData.totalUnits}
            title="Total"
            tooltip={true}
            tooltipTitle="Total de unidades asignadas"
            tooltipPosition="right"
            icon={
              <IconUnidades
                color={
                  !statsData.totalUnits || statsData.totalUnits === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cWhite)'
                }
                style={{
                  backgroundColor:
                    !statsData.totalUnits || statsData.totalUnits === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl1)',
                }}
                circle
                size={16}
              />
            }
          />
          {/* Tarjeta 2 (antes en grupo izquierdo) */}
          <WidgetDashCard
            data={statsData.paidUnits}
            title="Al día"
            tooltip={true}
            tooltipTitle="Unidades que han pagado a tiempo"
            tooltipPosition="right"
            icon={
              <IconUnidades
                color={
                  !statsData.paidUnits || statsData.paidUnits === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cSuccess)'
                }
                style={{
                  backgroundColor:
                    !statsData.paidUnits || statsData.paidUnits === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl2)',
                }}
                circle
                size={16}
              />
            }
          />
          {/* Tarjeta 3 (antes en grupo izquierdo) */}
          <WidgetDashCard
            data={statsData.overdueUnits}
            title="Morosas"
            tooltip={true}
            tooltipTitle="Unidades con pagos vencidos"
            tooltipPosition="right"
            icon={
              <IconUnidades
                color={
                  !statsData.overdueUnits || statsData.overdueUnits === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cError)'
                }
                style={{
                  backgroundColor:
                    !statsData.overdueUnits || statsData.overdueUnits === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverError)',
                }}
                circle
                size={16}
              />
            }
          />
          {/* Tarjeta 4 (antes en grupo derecho) */}

          <WidgetDashCard
            data={'Bs ' + formatNumber(statsData.totalAmount)}
            title="Expensa"
            tooltip={true}
            tooltipTitle="Monto total de expensas del período"
            tooltipPosition="left"
            icon={
              <IconMonedas
                color={
                  !statsData.totalAmount || statsData.totalAmount === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cCompl4)'
                }
                style={{
                  backgroundColor:
                    !statsData.totalAmount || statsData.totalAmount === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl7)',
                }}
                circle
                size={18}
              />
            }
          />

          <WidgetDashCard
            data={'Bs ' + formatNumber(statsData.paidAmount)}
            title="Cobrado"
            tooltip={true}
            tooltipTitle="Monto total cobrado hasta la fecha"
            tooltipPosition="left"
            icon={
              <IconWallet
                color={
                  !statsData.paidAmount || statsData.paidAmount === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cSuccess)'
                }
                style={{
                  backgroundColor:
                    !statsData.paidAmount || statsData.paidAmount === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl2)',
                }}
                circle
                size={16}
              />
            }
          />
          {/* Tarjeta 6 (antes en grupo derecho) */}

          <WidgetDashCard
            data={'Bs ' + formatNumber(statsData.penaltyAmount)}
            title="Multas"
            tooltip={true}
            tooltipTitle="Monto total de multas aplicadas"
            tooltipPosition="left"
            icon={
              <IconMultas
                color={
                  !statsData.penaltyAmount || statsData.penaltyAmount === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cAlert)'
                }
                style={{
                  backgroundColor:
                    !statsData.penaltyAmount || statsData.penaltyAmount === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl9)',
                }}
                circle
                size={18}
              />
            }
          />
          {/* Tarjeta 7 (antes en grupo derecho) */}

          <WidgetDashCard
            data={'Bs ' + formatNumber(statsData.pendingAmount)}
            title="Pendiente"
            tooltip={true}
            tooltipTitle="Monto pendiente por cobrar"
            tooltipPosition="left"
            icon={
              <IconHandcoin
                color={
                  !statsData.pendingAmount || statsData.pendingAmount === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cError)'
                }
                style={{
                  backgroundColor:
                    !statsData.pendingAmount || statsData.pendingAmount === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverError)',
                }}
                circle
                size={18}
              />
            }
          />
          {/* Fin de las tarjetas */}
        </div>
        <List height={'calc(100vh - 480px)'} />
      </LoadingScreen>

      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={({ startDate, endDate }) => {
          const errors: { startDate?: string; endDate?: string } = {};

          if (!startDate) {
            errors.startDate = 'La fecha de inicio es obligatoria';
          }
          if (!endDate) {
            errors.endDate = 'La fecha de fin es obligatoria';
          }
          if (startDate && endDate && startDate > endDate) {
            errors.startDate = 'La fecha de inicio no puede ser mayor a la de fin';
          }
          if (startDate && endDate && startDate.slice(0, 4) !== endDate.slice(0, 4)) {
            errors.startDate = 'El periodo personalizado debe estar dentro del mismo año';
            errors.endDate = 'El periodo personalizado debe estar dentro del mismo año';
          }

          if (Object.keys(errors).length > 0) {
            setCustomDateErrors(errors);
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

export default ExpensesDetails;
