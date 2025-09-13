import styles from './Alerts.module.css';
import useCrudUtils from '../shared/useCrudUtils';
import { useMemo, useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import NotAccess from '@/components/layout/NotAccess/NotAccess';
import useCrud from '@/mk/hooks/useCrud/useCrud';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import {
  IconAdmin,
  IconAlert2,
  IconAlert3,
  IconGroup,
  IconGuard,
} from '@/components/layout/icons/IconsBiblioteca';
import { WidgetDashCard } from '@/components/Widgets/WidgetsDashboard/WidgetDashCard/WidgetDashCard';
import { getDateTimeStrMesShort } from '@/mk/utils/date';
import { useAuth } from '@/mk/contexts/AuthProvider';
import RenderView from './RenderView/RenderView';
import {
  getAlertLevelText,
  ALERT_LEVELS,
  getAlertLevelInfo,
  ALERT_LEVEL_OPTIONS,
  ALERT_LEVEL_LABELS,
} from './alertConstants';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';

const paramsInitial = {
  perPage: 20,
  page: 1,
  fullType: 'L',
  searchBy: '',
};

export { getAlertLevelText };

const Alerts = () => {
  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  const mod = {
    modulo: 'alerts',
    singular: 'alerta',
    plural: '',
    permiso: 'alerts',
    extraData: true,
    hideActions: { edit: true, del: true, add: true },
    export: true,
    filter: true,
    renderView: (props: {
      open: boolean;
      onClose: any;
      item: Record<string, any>;
      onConfirm?: Function;
    }) => <RenderView {...props} reLoad={() => reLoad()} />,
  };
  const { setStore } = useAuth();

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

    if (opt === 'created_at' && value === 'custom') {
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

  const renderGuardInfo = ({ item }: { item: any }) => {
    let entityToDisplay = null;
    let avatarTypePrefix = '';
    const isPanic = item?.level === ALERT_LEVELS.PANIC;

    if (isPanic) {
      if (item.owner) {
        entityToDisplay = item.owner;
        avatarTypePrefix = 'OWNER-';
      } else if (item.guardia) {
        entityToDisplay = item.guardia;
        avatarTypePrefix = 'GUARD-';
      }
    } else if (item.guardia) {
      entityToDisplay = item.guardia;
      avatarTypePrefix = 'GUARD-';
    } else if (item.owner) {
      entityToDisplay = item.owner;
      avatarTypePrefix = 'OWNER-';
    }

    const fullName = entityToDisplay ? getFullName(entityToDisplay) : 'Información no disponible';
    const ci = entityToDisplay?.ci;
    const entityId = entityToDisplay?.id;
    const updatedAt = entityToDisplay?.updated_at;

    const avatarSrc =
      entityId && avatarTypePrefix && updatedAt
        ? getUrlImages(`/${avatarTypePrefix}${entityId}.webp?d=${updatedAt}`)
        : null;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {avatarSrc ? (
          <Avatar hasImage={1} src={avatarSrc} name={fullName} />
        ) : (
          <Avatar
            name={
              fullName && fullName !== 'Información no disponible' ? fullName.substring(0, 1) : '?'
            }
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ margin: 0, fontWeight: 500, color: 'var(--cWhite, #fafafa)' }}>{fullName}</p>
          {ci && (
            <span style={{ fontSize: '11px', color: 'var(--cWhiteV1, #a7a7a7)' }}>CI: {ci}</span>
          )}
        </div>
      </div>
    );
  };

  const renderAlertLevel = ({ item }: { item: any }) => {
    const alertLevel = item?.level || ALERT_LEVELS.MEDIUM;
    const { backgroundColor, color, label } = getAlertLevelInfo(alertLevel);

    return (
      <StatusBadge backgroundColor={backgroundColor} color={color}>
        {label}
      </StatusBadge>
    );
  };

  const formatCreatedAt = ({ item }: { item: any }) => {
    return getDateTimeStrMesShort(item.created_at);
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: 'e' },
      created_at: {
        rules: [''],
        api: '',
        label: 'Fecha de creación',
        list: {
          width: '20%',
          onRender: formatCreatedAt,
        },
        filter: {
          key: 'created_at',
          label: 'Periodo',
          options: getPeriodOptions,
        },
      },
      guard_id: {
        rules: ['required'],
        api: 'ae',
        label: 'Informador',
        list: {
          width: '26%',
          onRender: renderGuardInfo,
        },
        form: { type: 'text' },
      },

      level: {
        rules: ['required'],
        api: 'ae',
        label: <span style={{ display: 'block', width: '100%' }}>Grupo de alerta</span>,
        list: {
          width: '12%',
          onRender: renderAlertLevel,
        },
        form: { type: 'select', options: ALERT_LEVEL_OPTIONS },
        filter: {
          label: 'Nivel de alerta',
          width: '100%',
          options: () => [...ALERT_LEVEL_OPTIONS],
          optionLabel: 'name',
          optionValue: 'id',
        },
      },
      descrip: {
        rules: ['required'],
        api: 'ae',
        label: 'Descripción',
        list: {
          width: '42%',
        },
        form: { type: 'text' },
      },
    }),
    []
  );

  const { userCan, List, onSearch, searchs, onEdit, onDel, reLoad, data, onFilter } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });
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
    <div>
      <h1 className={styles.dashboardTitle}>Alertas</h1>
      <div className={styles.dashboardContainer}>
        <div className={styles.allStatsRow}>
          <WidgetDashCard
            title="Alertas Registradas"
            data={String(data?.extraData?.total_alerts || 0)}
            icon={
              <IconAlert2
                color={
                  !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cWhite)'
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl1)',
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
          />
          <WidgetDashCard
            title={`Para ${ALERT_LEVEL_LABELS[ALERT_LEVELS.LOW]}`}
            data={String(data?.extraData?.low_level || 0)}
            icon={
              <IconGuard
                color={
                  !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cInfo)'
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl3)',
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
            style={{ maxWidth: '16%', width: '100%' }}
          />
          <WidgetDashCard
            title={`Para ${ALERT_LEVEL_LABELS[ALERT_LEVELS.MEDIUM]}`}
            data={String(data?.extraData?.medium_level || 0)}
            icon={
              <IconAdmin
                color={
                  !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cWarning)'
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverCompl4)',
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
            style={{ maxWidth: '16%', width: '100%' }}
          />
          <WidgetDashCard
            title={`Para ${ALERT_LEVEL_LABELS[ALERT_LEVELS.HIGH]}`}
            data={String(data?.extraData?.high_level || 0)}
            icon={
              <IconGroup
                color={
                  !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cError)'
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.total_alerts || data?.extraData?.total_alerts === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverError)',
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
            style={{ maxWidth: '16%', width: '100%' }}
          />
          <WidgetDashCard
            title="Emergencias"
            data={String(data?.extraData?.emergency_buttons || 0)}
            icon={
              <IconAlert2
                color={
                  !data?.extraData?.emergency_buttons || data?.extraData?.emergency_buttons === 0
                    ? 'var(--cWhiteV1)'
                    : 'var(--cError)'
                }
                style={{
                  backgroundColor:
                    !data?.extraData?.emergency_buttons || data?.extraData?.emergency_buttons === 0
                      ? 'var(--cHover)'
                      : 'var(--cHoverError)',
                }}
                circle
                size={18}
              />
            }
            className={styles.widgetResumeCard}
            style={{ maxWidth: '16%', width: '100%' }}
          />
        </div>
      </div>

      <List
        height={'calc(100vh - 460px)'}
        emptyMsg="No existe ningún tipo de alerta. Cuando un guardia o residente"
        emptyLine2="registre una, se mostrará aquí."
        emptyIcon={<IconAlert3 size={80} color="var(--cWhiteV1)" />}
        filterBreakPoint={900}
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
          onFilter('created_at', customDateFilterString);
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Alerts;
