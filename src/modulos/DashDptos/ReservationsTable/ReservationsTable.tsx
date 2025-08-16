'use client';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import Table from '@/mk/components/ui/Table/Table';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import EmptyData from '@/components/NoData/EmptyData';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import { IconReservedAreas } from '@/components/layout/icons/IconsBiblioteca';
import styles from './ReservationsTable.module.css';
import { formatToDayDDMMYYYY } from '@/mk/utils/date';

interface ReservationsTableProps {
  reservations: any[];
  titular: any;
}

const ReservationsTable = ({ reservations, titular }: ReservationsTableProps) => {
  const getHourPeriod = (start_time: any, end_time: any) => {
    const start =
      typeof start_time === 'string' ? new Date(`1970-01-01T${start_time}`) : new Date(start_time);
    const end =
      typeof end_time === 'string' ? new Date(`1970-01-01T${end_time}`) : new Date(end_time);

    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);

    if (hours === 0 && minutes > 0) {
      return `${minutes}m`;
    } else if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return '0m';
  };

  const getReservationStatus = (status: string) => {
    switch (status) {
      case 'A':
        return {
          label: 'Aprobada',
          backgroundColor: 'var(--cHoverSuccess)',
          color: 'var(--cSuccess)',
        };
      case 'W':
        return {
          label: 'En espera',
          backgroundColor: 'var(--cHoverWarning)',
          color: 'var(--cWarning)',
        };
      case 'X':
        return {
          label: 'Rechazada',
          backgroundColor: 'var(--cHoverError)',
          color: 'var(--cError)',
        };
      case 'C':
        return {
          label: 'Cancelada',
          backgroundColor: 'var(--cHoverError)',
          color: 'var(--cError)',
        };
      default:
        return {
          label: 'Desconocido',
          backgroundColor: 'var(--cHoverLight)',
          color: 'var(--cLightDark)',
        };
    }
  };

  const reservationsHeader = [
    {
      key: 'area',
      label: 'Área social',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return (
          <div className={styles.areaInfo}>
            <Avatar
              name={item?.area?.title}
              src={getUrlImages(
                '/AREA-' +
                  item?.area?.id +
                  '-' +
                  item?.area?.images?.[0]?.id +
                  '.webp' +
                  '?' +
                  item?.area?.updated_at
              )}
              w={32}
              h={32}
            />
            <div>
              <p className={styles.areaTitle}>{item?.area?.title}</p>
              <p className={styles.areaDescription}>{item?.area?.description}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'reserved_by',
      label: 'Reservado por',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return (
          <div className={styles.areaInfo}>
            <Avatar
              hasImage={titular?.has_image}
              src={
                titular?.id
                  ? getUrlImages(
                      '/OWNER-' +
                        titular?.id +
                        '.webp' +
                        (titular?.updated_at ? '?d=' + titular?.updated_at : '')
                    )
                  : ''
              }
              name={getFullName(titular)}
              w={32}
              h={32}
            />
            <div>
              <p className={styles.areaTitle}>{getFullName(titular)}</p>
              <p className={styles.areaDescription}>C.I. {titular?.ci || 'Sin registro'}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'reservation_date',
      label: 'Fecha de reserva',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return (
          <div>
            <p className={styles.reservationDate}>
              {formatToDayDDMMYYYY(item.date_at) || 'Sin fecha'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      responsive: 'desktop',
      style: { textAlign: 'center', justifyContent: 'center' },
      onRender: ({ item }: any) => {
        const statusInfo = getReservationStatus(item.status);
        return (
          <StatusBadge backgroundColor={statusInfo.backgroundColor} color={statusInfo.color}>
            {statusInfo.label}
          </StatusBadge>
        );
      },
    },
  ];

  if (!reservations || reservations.length === 0) {
    return (
      <EmptyData
        message="No hay solicitudes de reserva. Una vez los residentes"
        line2="comiencen a reservar áreas sociales se mostrarán aquí."
        icon={<IconReservedAreas size={80} color="var(--cWhiteV1)" />}
        h={120}
        centered={true}
      />
    );
  }

  return <Table header={reservationsHeader} data={reservations.slice(0, 5)} className="striped" style={{ width: '100%', minWidth: '800px' }} />;
};

export default ReservationsTable;
