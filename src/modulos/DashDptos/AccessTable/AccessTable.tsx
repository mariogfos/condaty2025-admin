'use client';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import { getDateTimeStrMesShort } from '@/mk/utils/date';
import Table from '@/mk/components/ui/Table/Table';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import EmptyData from '@/components/NoData/EmptyData';
import {
  IconArrowRight,
  IconArrowLeft,
  IconDelivery,
  IconTaxi,
  IconOther,
  IconExitHome,
} from '@/components/layout/icons/IconsBiblioteca';
import styles from './AccessTable.module.css';

interface AccessTableProps {
  access: any[];

}
const renderSubtitle = (item: any) => {
  let subtitle = 'CI: ' + item.visit?.ci;
  if (item?.other) {
    subtitle = item.other?.other_type?.name;
  }
  if (item?.type === 'O') {
    subtitle = 'CI: ' + item.owner?.ci;
  }
  return subtitle;
};
const visitCell = ({ item }: { item: any }) => {
  const displayUser = item?.type === 'O' ? item.owner : item.visit;
  
  return (
    <div className={styles.visitInfo}>
      {leftAccess(item)}
      <div>
        <p className={styles.visitName}>{getFullName(displayUser)}</p>
        <p className={styles.visitSubtitle}>{renderSubtitle(item)}</p>
      </div>
    </div>
  );
};

const leftAccess = (item: any) => {
  if (item?.other) {
    let icon;
    switch (item?.other?.other_type_id) {
      case 1:
        icon = <IconDelivery color="var(--cBlack)" />;
        break;
      case 2:
        icon = <IconTaxi color="var(--cBlack)" />;
        break;
      default:
        icon = <IconOther color="var(--cBlack)" />;
        break;
    }
    return <div className={styles.iconContainer}>{icon}</div>;
  }
  if (item?.type === 'O') {
    return (
      <Avatar
        hasImage={item?.owner?.has_iamge}
        src={getUrlImages(`/OWNER-${item?.owner?.id}.webp?d=${item?.owner?.updated_at}`)}
        name={getFullName(item.owner)}
        w={40}
        h={40}  
      />
    )
  }
  return (
    <Avatar
      hasImage={item?.visit?.has_image}
      name={getFullName(item.visit)}
      w={40}
      h={40}
     // className={styles.visitorAvatar}
    />
  );
};

const visitedToCell = ({ item }: { item: any }) => {
  // Priorizar mostrar al residente/propietario (owner)
  const person = item?.owner ?? item?.titular?.owner ?? item?.homeowner ?? null;

  const updatedAtQuery = person?.updated_at ? `?d=${person.updated_at}` : '';
  const avatarSrc = person?.id
    ? getUrlImages(`/OWNER-${person.id}.webp${updatedAtQuery}`)
    : '';

  return (
    <div className={styles.visitInfo}>
      <Avatar
        hasImage={person?.has_image}
        src={avatarSrc}
        name={getFullName(person || {})}
        w={32}
        h={32}
      />
      <div>
        <p className={styles.visitName}>{getFullName(person || {})}</p>
        <p className={styles.visitSubtitle}>C.I. {person?.ci || 'Sin registro'}</p>
      </div>
    </div>
  );
};

const entryExitCell = ({ item }: { item: any }) => (
  <div>
    <div className={styles.entryExit}>
      <IconArrowRight size={12} color="var(--cSuccess)" />
      <p className={styles.timeText}>{getDateTimeStrMesShort(item.in_at) || '-/-'}</p>
    </div>
    <div className={styles.entryExit}>
      <IconArrowLeft size={12} color="var(--cError)" />
      <p className={styles.timeText}>{getDateTimeStrMesShort(item.out_at) || '-/-'}</p>
    </div>
  </div>
);

const typeCell = ({ item }: { item: any }) => {
  if (item.type === 'P') {
    return 'Pedido';
  }
  if (item.type === 'I') {
    return 'Individual';
  }
  if (item.type === 'G') {
    return 'QR Grupal';
  }
  if (item.type === 'F') {
    return 'QR Frecuente';
  }
  if (item.type === 'O') {
    return 'Llave QR';
  }
  return '-/-';
};

const AccessTable = ({ access }: AccessTableProps) => {

  const accessHeader = [
    {
      key: 'visit',
      label: 'Visita',
      responsive: 'desktop',
      onRender: visitCell

    },
    {
      key: 'visited_to',
      label: 'Visitó a',
      responsive: 'desktop',
      onRender: visitedToCell,

    },
    {
      key: 'type',
      label: 'Tipo de visita',
      responsive: 'desktop',
      onRender: typeCell,
    },
    {
      key: 'entry_exit',
      label: 'Ingreso/Salida',
      responsive: 'desktop',
      onRender: entryExitCell,
    },
  ];

  if (!access || access.length === 0) {
    return (
      <EmptyData
        message="No existen accesos registrados. El historial de visitantes se mostrará"
        line2="aquí, una vez la unidad reciba visitas."
        centered={true}
        icon={<IconExitHome size={80} color="var(--cWhiteV1)" />}
      />
    );
  }

  return <Table header={accessHeader} data={access.slice(0, 5)} className="striped" style={{ width: '100%', height: '100%' }} />;
};

export default AccessTable;
