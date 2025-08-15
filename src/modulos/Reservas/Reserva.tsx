'use client';
import useCrud from '@/mk/hooks/useCrud/useCrud';
import NotAccess from '@/components/auth/NotAccess/NotAccess';
import useCrudUtils from '../shared/useCrudUtils';
import { useMemo, useState } from 'react';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import { getDateStrMes, getDateTimeStrMes } from '@/mk/utils/date';
import styles from './Reserva.module.css';
import { format, parse } from 'date-fns';
import ReservationDetailModal from './RenderView/RenderView';
import DateRangeFilterModal from '@/components/DateRangeFilterModal/DateRangeFilterModal';
import CreateReserva from '../CreateReserva/CreateReserva';
import { IconCalendar } from '@/components/layout/icons/IconsBiblioteca';

const mod = {
  modulo: 'reservations',
  singular: 'reserva',
  plural: 'reservas',
  permiso: '',
  extraData: true,
  hideActions: { edit: true, del: true },
  renderForm: (props: any) => <CreateReserva {...props} />,
  renderView: (props: any) => <ReservationDetailModal {...props} />,
  loadView: { fullType: 'DET' },
  filter: true,
  export: true,
  titleAdd: 'Nueva',
};

const periodOptions = [
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

const Reserva = () => {
  // Obtener parámetros de URL
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const unitParam = searchParams.get('unit');

  const paramsInitial = {
    perPage: 20,
    page: 1,
    fullType: 'L',
    searchBy: unitParam || '',
  };

  const [openCustomFilter, setOpenCustomFilter] = useState(false);
  const [customDateErrors, setCustomDateErrors]: any = useState({
    start: '',
    end: '',
  });
  const getReservaStatusOptions = () => [
    { id: 'ALL', name: 'Todos' },
    { id: 'W', name: 'Por confirmar' },
    { id: 'A', name: 'Reservado' },
    { id: 'X', name: 'Rechazado' },
    { id: 'C', name: 'Cancelado' },
    { id: 'F', name: 'Completado' },
  ];

  const onRenderAreaList = ({ item }: any) => {
    const area = item?.area;
    const areaName = area?.title;
    const imageUrl = area?.images?.[0]
      ? getUrlImages(
          `/AREA-${area.images[0].entity_id}-${
            area.images[0].id
          }.webp?d=${new Date().toISOString()}`
        )
      : undefined;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar src={imageUrl} hasImage={2} name={areaName} />
        <p
          style={{
            color: 'var(--cWhite)',
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          {areaName || 'Área no disponible'}
        </p>
      </div>
    );
  };

  const onRenderOwnerList = ({ item }: any) => {
    const owner = item?.owner;
    const dpto = item?.dpto;
    const ownerName = owner ? getFullName(owner) : 'Residente no disponible';
    const dptoNro = dpto?.nro ? dpto.nro : 'Sin Dpto.';

    const imageUrl = owner
      ? getUrlImages(`/OWNER-${owner.id}.webp?d=${owner.updated_at || Date.now()}`)
      : undefined;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar src={imageUrl} name={ownerName} />
        <div>
          <p
            style={{
              color: 'var(--cWhite)',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            {ownerName}
          </p>
          {dpto && (
            <p
              style={{
                fontSize: 14,
                color: 'var(--cWhiteV1)',
              }}
            >
              {dptoNro}
            </p>
          )}
          {!owner && dpto && (
            <p
              style={{
                fontSize: 14,
                color: 'var(--cWhiteV1)',
              }}
            >
              {dptoNro}
            </p>
          )}
        </div>
      </div>
    );
  };

  const fields = useMemo(
    () => ({
      id: { rules: [], api: 'e' },
      area: {
        rules: ['required'],
        api: 'ae',
        label: 'Área Social',
        form: { type: 'text' },
        list: {
          onRender: onRenderAreaList,
        },
      },
      owner: {
        rules: ['required'],
        api: 'ae',
        label: 'Residente',
        form: { type: 'text' },
        list: {
          // width: 470,
          onRender: onRenderOwnerList,
        },
      },
      created_at: {
        label: 'Fecha de solicitud',
        form: false,
        list: {
          // width: 246,
          onRender: (props: any) => {
            return getDateTimeStrMes(props?.value);
          },
        },
      },
      date_at: {
        rules: ['required'],
        api: 'ae',
        label: 'Fecha del evento',
        form: { type: 'date' },
        list: {
          // width: 246,
          onRender: (props: any) => {
            return (
              <div>
                {getDateStrMes(props?.item?.date_at)}{' '}
                {format(parse(props?.item?.start_time, 'HH:mm:ss', new Date()), 'H:mm')}
              </div>
            );
          },
        },
        filter: {
          label: 'Fecha del evento',
          width: '246px',
          options: () => periodOptions,
        },
      },

      status_reservation: {
        rules: ['required'],
        api: 'ae',
        label: 'Estado',
        form: {
          type: 'select',
          options: [
            { id: 'A', name: 'Disponible' },
            { id: 'X', name: 'No disponible' },
            { id: 'M', name: 'En mantenimiento' },
          ],
        },
        list: {
          // width: 180,
          onRender: (props: any) => {
            let status = props?.item?.status as 'W' | 'A' | 'X' | 'C' | 'F' | undefined;

            let dateEnd = new Date(props?.item?.date_end + 'T' + props?.item?.end_time)
              ?.toISOString()
              ?.split('.')[0];

            if (status === 'A' && dateEnd < new Date().toISOString().split('.')[0]) {
              status = 'F';
            }

            const statusMap = {
              W: { label: 'Por confirmar', class: styles.statusW },
              A: { label: 'Reservado', class: styles.statusA },
              X: { label: 'Rechazado', class: styles.statusX },
              C: { label: 'Cancelado', class: styles.statusC },
              F: { label: 'Completado', class: styles.statusF },
            };
            const currentStatus = status ? statusMap[status] : null;

            return (
              <div
                className={`${styles.statusBadge} ${
                  currentStatus ? currentStatus.class : styles.statusUnknown
                }`}
              >
                {currentStatus ? currentStatus.label : 'Estado desconocido'}
              </div>
            );
          },
        },
        filter: {
          label: 'Estado',
          width: '180px',
          options: getReservaStatusOptions,
        },
      },
    }),
    []
  );
  const handleGetFilter = (opt: string, value: string, oldFilterState: any) => {
    const currentFilters = { ...(oldFilterState?.filterBy || {}) };

    if (opt === 'date_at' && value === 'custom') {
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

  const onSaveFilterModal = ({ startDate, endDate }: any) => {
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
    onFilter('date_at', customDateFilterString);
    setOpenCustomFilter(false);
    setCustomDateErrors({});
  };

  const { userCan, List, setStore, onSearch, searchs, onEdit, onDel, onFilter } = useCrud({
    paramsInitial,
    mod,
    fields,
    getFilter: handleGetFilter,
  });
  const { onLongPress, selItem } = useCrudUtils({
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
      <List
        height={'calc(100vh - 360px)'}
        emptyMsg="Sin reservas pendientes. cuando los residentes comiencen"
        emptyLine2="a solicitar reservas de áreas sociales lo verás reflejado aquí."
        emptyIcon={<IconCalendar size={80} color="var(--cWhiteV1)" />}
      />
      <DateRangeFilterModal
        open={openCustomFilter}
        onClose={() => {
          setOpenCustomFilter(false);
          setCustomDateErrors({});
        }}
        onSave={onSaveFilterModal}
        errorStart={customDateErrors.startDate}
        errorEnd={customDateErrors.endDate}
      />
    </div>
  );
};

export default Reserva;
