'use client';
import { useState, useEffect } from 'react';
import { getFullName, getUrlImages } from '@/mk/utils/string';
import styles from './DashDptos.module.css';
import { useRouter } from 'next/navigation';
import {
  IconArrowDown,
  IconArrowRight,
  IconArrowLeft,
  IconDelivery,
  IconEdit,
  IconExitHome,
  IconHomePerson2,
  IconOther,
  IconPagos,
  IconReservedAreas,
  IconTaxi,
  IconTrash,
} from '@/components/layout/icons/IconsBiblioteca';
import Button from '@/mk/components/forms/Button/Button';
import Select from '@/mk/components/forms/Select/Select';
import DataModal from '@/mk/components/ui/DataModal/DataModal';
import { useAuth } from '@/mk/contexts/AuthProvider';
import useAxios from '@/mk/hooks/useAxios';
import EmptyData from '@/components/NoData/EmptyData';
import { Avatar } from '@/mk/components/ui/Avatar/Avatar';
import HistoryOwnership from './HistoryOwnership/HistoryOwnership';
import { getDateStrMes, getDateTimeStrMes, getDateTimeStrMesShort } from '@/mk/utils/date';
import RenderView from '../Payments/RenderView/RenderView';
import OwnersRenderView from '../Owners/RenderView/RenderView';
import ProfileModal from '@/components/ProfileModal/ProfileModal';
import Tooltip from '@/mk/components/ui/Tooltip/Tooltip';
import Table from '@/mk/components/ui/Table/Table';
import ItemList from '@/mk/components/ui/ItemList/ItemList';
import Switch from '@/mk/components/forms/Switch/Switch';
import WidgetBase from '@/components/Widgets/WidgetBase/WidgetBase';
import { StatusBadge } from '@/components/StatusBadge/StatusBadge';
import KeyValue from '@/mk/components/ui/KeyValue/KeyValue';
import RenderForm from '../Dptos/RenderForm';
import HeaderBack from '@/mk/components/ui/HeaderBack/HeaderBack';

interface DashDptosProps {
  id: string | number;
}

const PAYMENT_STATUS_MAP = {
  A: { label: 'Por Pagar', backgroundColor: 'var(--cHoverWarning)', color: 'var(--cWarning)' },
  P: { label: 'Pagado', backgroundColor: 'var(--cHoverSuccess)', color: 'var(--cSuccess)' },
  S: { label: 'Por confirmar', backgroundColor: 'var(--cHoverWarning)', color: 'var(--cWarning)' },
  M: { label: 'Moroso', backgroundColor: 'var(--cHoverError)', color: 'var(--cError)' },
  R: { label: 'Rechazado', backgroundColor: 'var(--cHoverError)', color: 'var(--cError)' },
  X: { label: 'Anulado', backgroundColor: 'var(--cHoverCompl5)', color: 'var(--cMediumAlert)' },
} as const;

type PaymentStatus = keyof typeof PAYMENT_STATUS_MAP;

const getPaymentStatus = (status: PaymentStatus) => {
  return (
    PAYMENT_STATUS_MAP[status] || {
      label: status,
      backgroundColor: 'var(--cHoverLight)',
      color: 'var(--cLightDark)',
    }
  );
};

const DashDptos = ({ id }: DashDptosProps) => {
  const { user, showToast, setStore } = useAuth();
  const router = useRouter();
  const [openTitular, setOpenTitular] = useState(false);
  const [openPerfil, setOpenPerfil] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openComprobante, setOpenComprobante] = useState(false);
  const [formState, setFormState] = useState<any>({ isTitular: 'I' });
  const [errorsT, setErrorsT] = useState<any>({});
  const [openTitularHist, setOpenTitularHist] = useState(false);
  const [idPago, setIdPago] = useState<string | null>(null);
  const [idPerfil, setIdPerfil] = useState<string | null>(null);
  const [openDel, setOpenDel] = useState(false);
  const [openDelTitular, setOpenDelTitular] = useState(false);
  const [openOwnerMenu, setOpenOwnerMenu] = useState(false);
  const [openTenantMenu, setOpenTenantMenu] = useState(false);
  const [openTitularSelector, setOpenTitularSelector] = useState(false);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(null);
  const {
    data: dashData,
    reLoad,
    execute,
  } = useAxios('/dptos', 'GET', {
    fullType: 'DET',
    dpto_id: id,
    extraData: true,
  });

  const datas = dashData?.data || {};

  // Cerrar menús cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(`.${styles.menuDots}`) &&
        !target.closest(`.${styles.dropdownMenu}`) &&
        !target.closest(`.${styles.titularDropdown}`)
      ) {
        setOpenOwnerMenu(false);
        setOpenTenantMenu(false);
        setOpenTitularSelector(false);
      }
    };

    if (openOwnerMenu || openTenantMenu || openTitularSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openOwnerMenu, openTenantMenu, openTitularSelector]);

  const locationParams = (path: string, key: string, value: string) => {
    setStore({
      [key]: value,
    });
    router.push(path);
  };

  const onSave = async () => {
    if (!formState.owner_id) {
      setErrorsT({ owner_id: 'Este campo es obligatorio' });
      return;
    }

    try {
      const { data: response } = await execute('/dptos-change-titular', 'POST', {
        owner_id: formState.owner_id,
        dpto_id: id,
      });

      if (response?.success) {
        showToast('Titular actualizado', 'success');
        setOpenTitular(false);
        setErrorsT({});
        reLoad();
      } else {
        showToast(response?.message || 'Error al actualizar titular', 'error');
      }
    } catch (error) {
      showToast('Error al actualizar titular', 'error');
    }
  };

  const handleOpenPerfil = (owner_id: string) => {
    setIdPerfil(owner_id);
    setOpenPerfil(true);
  };

  const handleOpenDependentProfile = (owner_id: string) => {
    setSelectedDependentId(owner_id);
    setOpenProfileModal(true);
  };

  // Header para tabla de accesos
  const accessHeader = [
    {
      key: 'visit',
      label: 'Visita',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {leftAccess(item)}
            <div>
              <p style={{ color: 'var(--cWhite)', margin: 0 }}>{getFullName(item.visit)}</p>
              <p style={{ color: 'var(--cWhiteV1)', margin: 0, fontSize: 'var(--sS)' }}>
                {renderSubtitle(item)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'visited_to',
      label: 'Visitó a',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              hasImage={datas?.titular?.has_image}
              src={
                datas?.titular?.id
                  ? getUrlImages(
                      '/OWNER-' +
                        datas?.titular?.id +
                        '.webp' +
                        (datas?.titular?.updated_at ? '?d=' + datas?.titular?.updated_at : '')
                    )
                  : ''
              }
              name={getFullName(datas?.titular)}
              w={32}
              h={32}
            />
            <div>
              <p style={{ color: 'var(--cWhite)', margin: 0 }}>{getFullName(datas?.titular)}</p>
              <p style={{ color: 'var(--cWhiteV1)', margin: 0, fontSize: 'var(--sS)' }}>
                C.I. {datas?.titular?.ci || 'Sin registro'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'type',
      label: 'Tipo de visita',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item.type === 'P' ? 'Pedido' : item.type == 'I' ? 'Individual' : 'Grupal';
      },
    },
    {
      key: 'entry_exit',
      label: 'Ingreso/Salida',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
              <IconArrowRight size={12} color="var(--cSuccess)" />
              <p style={{ color: 'var(--cWhiteV1)', margin: 0, fontSize: 'var(--sS)' }}>
                {getDateTimeStrMesShort(item.in_at) || '-/-'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
              <IconArrowLeft size={12} color="var(--cError)" />
              <p style={{ color: 'var(--cWhiteV1)', margin: 0, fontSize: 'var(--sS)' }}>
                {getDateTimeStrMesShort(item.out_at) || '-/-'}
              </p>
            </div>
          </div>
        );
      },
    },
  ];

  // Header para tabla de reservas
  const reservationsHeader = [
    {
      key: 'area',
      label: 'Área social',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              <p style={{ color: 'var(--cWhite)', margin: 0 }}>{item?.area?.title}</p>
              <p style={{ color: 'var(--cWhiteV1)', margin: 0, fontSize: 'var(--sS)' }}>
                {item?.area?.description}
              </p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              hasImage={datas?.titular?.has_image}
              src={
                datas?.titular?.id
                  ? getUrlImages(
                      '/OWNER-' +
                        datas?.titular?.id +
                        '.webp' +
                        (datas?.titular?.updated_at ? '?d=' + datas?.titular?.updated_at : '')
                    )
                  : ''
              }
              name={getFullName(datas?.titular)}
              w={32}
              h={32}
            />
            <div>
              <p style={{ color: 'var(--cWhite)', margin: 0 }}>{getFullName(datas?.titular)}</p>
              <p style={{ color: 'var(--cWhiteV1)', margin: 0, fontSize: 'var(--sS)' }}>
                C.I. {datas?.titular?.ci || 'Sin registro'}
              </p>
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
            <p style={{ color: 'var(--cWhite)', margin: 0 }}>{item.date_at || 'Sin fecha'}</p>
            <p style={{ color: 'var(--cWhiteV1)', margin: 0, fontSize: 'var(--sS)' }}>
              {item.start_time?.slice(0, 5)} - {getHourPeriod(item.start_time, item?.end_time)}
            </p>
          </div>
        );
      },
    },
    {
      key: 'people_count',
      label: 'Personas',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item.people_count + ' personas' || 'Sin cantidad';
      },
    },
    {
      key: 'status',
      label: 'Estado',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
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

        const statusInfo = getReservationStatus(item.status);
        return (
          <StatusBadge backgroundColor={statusInfo.backgroundColor} color={statusInfo.color}>
            {statusInfo.label}
          </StatusBadge>
        );
      },
    },
  ];

  const header = [
    {
      key: 'paid_at',
      label: 'Fecha de pago',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return getDateStrMes(item?.paid_at) || '-';
      },
    },
    {
      key: 'categorie',
      label: 'Categoría',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item?.payment?.categoryP?.name || '-';
      },
    },
    {
      key: 'sub_categorie',
      label: 'Sub Categoría',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        return item?.payment?.category?.name || '-';
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      responsive: 'desktop',

      onRender: ({ item }: any) => {
        return item?.amount && item?.penalty_amount
          ? `Bs ${parseFloat(item?.amount) + parseFloat(item?.penalty_amount)}`
          : '-';
      },
    },
    // {
    //   key: "type",
    //   label: "Tipo de pago",
    //   responsive: "desktop",
    //   onRender: ({ item }: any) => {
    //     return item?.payment?.type === "Q"
    //       ? "Qr"
    //       : item?.payment?.type === "T"
    //       ? "Transferencia"
    //       : item?.payment?.type === "O"
    //       ? "Pago en oficina"
    //       : "Sin pago";
    //   },
    // },
    {
      key: 'status',
      label: 'Estado',
      responsive: 'desktop',
      onRender: ({ item }: any) => {
        const status = item?.status as PaymentStatus;
        const statusInfo = getPaymentStatus(status);
        return (
          <StatusBadge backgroundColor={statusInfo.backgroundColor} color={statusInfo.color}>
            {statusInfo.label}
          </StatusBadge>
        );
      },
    },
  ];

  const Br = () => {
    return <div className={styles.br} />;
  };

  type LabelValueProps = {
    value: string;
    label: string;
    colorValue?: string;
  };

  type TitleRenderProps = {
    title: string;
    onClick?: () => void;
  };
  const TitleRender = ({ title, onClick }: TitleRenderProps) => {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3 className={styles.accountTitle}>{title}</h3>
        {onClick && (
          <span className={styles.viewMore} onClick={onClick}>
            Ver más
          </span>
        )}
      </div>
    );
  };
  const onDel = async () => {
    const { data } = await execute('/dptos/' + datas.data.id, 'DELETE');
    if (data?.success) {
      showToast('Unidad eliminada', 'success');
      router.push('/units');
    } else {
      showToast(data?.message || 'Error al eliminar unidad', 'error');
    }
  };

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
      return (
        <div
          style={{
            padding: 8,
            backgroundColor: 'var(--cWhiteV1)',
            borderRadius: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      );
    }
    return (
      <Avatar
        hasImage={item?.visit?.has_image}
        name={getFullName(item.visit)}
        w={40}
        h={40}
        className={styles.visitorAvatar}
      />
    );
  };

  const onTitular = () => {
    if (!datas?.data?.homeowner) {
      showToast(
        'No se puede asignar un titular a esta casa porque no existe un propietario registrado.',
        'error'
      );
      return;
    }
    setOpenTitular(true);
  };
  const renderSubtitle = (item: any) => {
    let subtitle = 'CI: ' + item.visit?.ci;
    if (item?.other) {
      subtitle = item.other?.other_type?.name;
    }
    return subtitle;
  };

  const removeTitular = async () => {
    const { data } = await execute('/dptos-remove-titular', 'POST', {
      dpto_id: datas?.data?.id,
    });
    if (data?.success) {
      showToast('Titular eliminado', 'success');
      reLoad();
      setOpenDelTitular(false);
    } else {
      showToast(data?.message || 'Error al eliminar titular', 'error');
    }
  };

  return (
    <div className={styles.container}>
      <HeaderBack label="Volver a lista de unidades" onClick={() => router.push('/units')} />
      <section>
        <div className={styles.firtsPanel}>
          <div className={styles.infoCard}>
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.title}>
                  {datas?.data?.type.name} {datas?.data?.nro}
                </p>
                <p className={styles.subtitle}> {datas?.data?.description}</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className={styles.iconActions}>
                  <IconEdit size={30} onClick={() => setOpenEdit(true)} />
                </div>
                {!datas?.titular && !datas?.data?.homeowner && (
                  <div className={styles.iconActions}>
                    <IconTrash size={30} onClick={() => setOpenDel(true)} />
                  </div>
                )}
              </div>
            </div>

            <Br />

            {/* Sección de información de la unidad */}
            <div className={styles.unitInfoSection}>
              <div className={styles.unitInfoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Estado</span>
                  <span className={styles.infoValue}>
                    {datas?.titular ? 'Habitada' : 'Disponible'}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Monto expensa</span>
                  <span className={styles.infoValue}>Bs {datas?.data?.expense_amount || '0'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Titular</span>
                  <div
                    className={styles.titularDropdown}
                    onClick={e => {
                      e.stopPropagation();
                      setOpenTitularSelector(!openTitularSelector);
                    }}
                  >
                    <span className={styles.infoValue}>
                      {datas?.titular
                        ? 'Residente'
                        : datas?.data?.homeowner
                        ? 'Propietario'
                        : 'Sin asignar'}
                    </span>
                    <IconArrowDown
                      size={16}
                      className={openTitularSelector ? styles.arrowUp : styles.arrowDown}
                    />
                    {openTitularSelector && (
                      <div className={styles.dropdownMenu}>
                        <div
                          className={styles.menuItem}
                          onClick={e => {
                            e.stopPropagation();
                            setOpenTitularSelector(false);
                            // Lógica para establecer propietario como titular
                          }}
                        >
                          Propietario
                        </div>
                        <div
                          className={styles.menuItem}
                          onClick={e => {
                            e.stopPropagation();
                            setOpenTitularSelector(false);
                            // Lógica para establecer residente como titular
                          }}
                        >
                          Residente
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Br />

              {/* Sección Propietario */}
              {datas?.data?.homeowner && (
                <div className={styles.ownerSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Propietario</h3>
                    <div className={styles.sectionActions}>
                      <div
                        className={styles.menuDots}
                        onClick={e => {
                          e.stopPropagation();

                          setOpenOwnerMenu(!openOwnerMenu);
                        }}
                      >
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                      </div>
                      {openOwnerMenu && (
                        <div className={styles.dropdownMenu}>
                          <div
                            className={styles.menuItem}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenOwnerMenu(false);
                              // Lógica para cambiar/nuevo propietario
                            }}
                          >
                            Cambiar/Nuevo
                          </div>
                          <div
                            className={styles.menuItem}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenOwnerMenu(false);
                              // Lógica para desvincular propietario
                            }}
                          >
                            Desvincular
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.personCard}>
                    <Avatar
                      hasImage={datas?.data?.homeowner?.has_image}
                      src={
                        datas?.data?.homeowner?.id
                          ? getUrlImages(
                              '/OWNER-' +
                                datas?.data?.homeowner?.id +
                                '.webp' +
                                (datas?.data?.homeowner?.updated_at
                                  ? '?d=' + datas?.data?.homeowner?.updated_at
                                  : '')
                            )
                          : ''
                      }
                      name={getFullName(datas?.data?.homeowner)}
                      w={48}
                      h={48}
                    />
                    <div className={styles.personInfo}>
                      <h4 className={styles.personName}>{getFullName(datas?.data?.homeowner)}</h4>
                      <p className={styles.personId}>
                        C.I. {datas?.data?.homeowner?.ci || 'Sin registro'}
                      </p>
                    </div>
                  </div>

                  <div className={styles.contactGrid}>
                    <div className={styles.contactItem}>
                      <span className={styles.contactLabel}>E-mail</span>
                      <span className={styles.contactValue}>
                        {datas?.data?.homeowner?.email || 'Sin email'}
                      </span>
                    </div>
                    <div className={styles.contactItem}>
                      <span className={styles.contactLabel}>Celular</span>
                      <span className={styles.contactValue}>
                        {datas?.data?.homeowner?.phone || 'Sin teléfono'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <Br />
              {/* Sección Residente/Titular */}
              {datas?.titular && (
                <div className={styles.residentSection}>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Residente</h3>
                    <div className={styles.sectionActions}>
                      <div
                        className={styles.menuDots}
                        onClick={e => {
                          e.stopPropagation();

                          setOpenTenantMenu(!openTenantMenu);
                        }}
                      >
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                      </div>
                      {openTenantMenu && (
                        <div className={styles.dropdownMenu}>
                          <div
                            className={styles.menuItem}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenTenantMenu(false);
                              setOpenTitular(true);
                            }}
                          >
                            Cambiar/Nuevo
                          </div>
                          <div
                            className={styles.menuItem}
                            onClick={e => {
                              e.stopPropagation();
                              setOpenTenantMenu(false);
                              setOpenDelTitular(true);
                            }}
                          >
                            Desvincular
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.personCard}>
                    <Avatar
                      hasImage={datas?.titular?.has_image}
                      src={
                        datas?.titular?.id
                          ? getUrlImages(
                              '/OWNER-' +
                                datas?.titular?.id +
                                '.webp' +
                                (datas?.titular?.updated_at
                                  ? '?d=' + datas?.titular?.updated_at
                                  : '')
                            )
                          : ''
                      }
                      name={getFullName(datas?.titular)}
                      w={48}
                      h={48}
                    />
                    <div className={styles.personInfo}>
                      <h4 className={styles.personName}>{getFullName(datas?.titular)}</h4>
                      <p className={styles.personId}>C.I. {datas?.titular?.ci || 'Sin registro'}</p>
                    </div>
                  </div>

                  <div className={styles.contactGrid}>
                    <div className={styles.contactItem}>
                      <span className={styles.contactLabel}>E-mail</span>
                      <span className={styles.contactValue}>
                        {datas?.titular?.email || 'Sin email'}
                      </span>
                    </div>
                    <div className={styles.contactItem}>
                      <span className={styles.contactLabel}>Celular</span>
                      <span className={styles.contactValue}>
                        {datas?.titular?.phone || 'Sin teléfono'}
                      </span>
                    </div>
                  </div>

                  {/* Dependientes */}
                  {datas?.titular?.dependientes && datas.titular.dependientes.length > 0 && (
                    <div className={styles.dependentsSection}>
                      <div className={styles.dependentsHeader}>
                        <h4 className={styles.dependentsTitle}>Dependientes</h4>
                        <div className={styles.dependentsCount}></div>
                      </div>
                      <div className={styles.dependentsGrid}>
                        {datas.titular.dependientes
                          .slice(0, 3)
                          .map((dependiente: any, index: number) => (
                            <Tooltip
                              key={index}
                              title={getFullName(dependiente.owner)}
                              position="top"
                            >
                              <Avatar
                                hasImage={dependiente.owner?.has_image}
                                src={
                                  dependiente.owner?.id
                                    ? getUrlImages(
                                        '/OWNER-' +
                                          dependiente.owner?.id +
                                          '.webp' +
                                          (dependiente.owner?.updated_at
                                            ? '?d=' + dependiente.owner?.updated_at
                                            : '')
                                      )
                                    : ''
                                }
                                name={getFullName(dependiente.owner)}
                                w={40}
                                h={40}
                                onClick={() => handleOpenDependentProfile(dependiente.owner_id)}
                              />
                            </Tooltip>
                          ))}
                      </div>
                    </div>
                  )}

                  {/*    <Button
                    onClick={() => setOpenDelTitular(true)}
                    variant="terciary"
                    style={{
                      padding: 0,
                      color: 'var(--cError)',
                      width: 'fit-content',
                      marginTop: 16,
                    }}
                    small
                  >
                    Eliminar titular
                  </Button> */}
                </div>
              )}

              {/* Estado sin titular */}
              {!datas?.titular && (
                <div className={styles.emptyState}>
                  <EmptyData
                    message="Sin inquilino asignado. Para asignar"
                    line2="un inquilino a esta unidad."
                    icon={<IconHomePerson2 size={32} color="var(--cWhiteV1)" />}
                    centered={true}
                    fontSize={14}
                  />
                  {/*    <Button className={styles.addButton} onClick={onTitular} variant="primary">
                    Agregar Titular
                  </Button> */}
                </div>
              )}
            </div>

            <Button
              variant="terciary"
              small
              style={{
                padding: 0,
                display: 'flex',
                justifyContent: 'flex-start',
                width: 'fit-content',
              }}
              onClick={() => setOpenTitularHist(true)}
            >
              Ver historial de titulares
            </Button>
          </div>

          <WidgetBase
            title={
              <TitleRender
                title="Historial de pagos"
                onClick={() => locationParams('/payments', 'paymentSearchBy', datas?.data?.nro)}
              />
            }
            subtitle={`Últimos ${datas?.payments?.length || 0} pagos`}
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.accountContent}>
              {!datas?.payments || datas.payments.length === 0 ? (
                <EmptyData
                  message="Sin pagos registrados. Cuando esta unidad comience a pagar"
                  line2="expensas y otros conceptos, los verás aquí."
                  centered={true}
                  icon={<IconPagos size={80} color="var(--cWhiteV1)" />}
                />
              ) : (
                <Table header={header} data={datas?.payments} className="striped"  />
              )}
            </div>
          </WidgetBase>
        </div>

        <div className={styles.secondPanel}>
          {/* Historial de Accesos - Tabla */}
          <WidgetBase
            subtitle={'+' + datas.accessCount + ' accesos nuevos este mes'}
            title={
              <TitleRender
                title="Historial de accesos"
                onClick={() => router.push(`/activities?search_by=${datas?.data?.nro}`)}
              />
            }
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.accessContent}>
              {!datas?.access || datas.access.length === 0 ? (
                <EmptyData
                  message="No existen accesos registrados. El historial de visitantes se mostrará"
                  line2="aquí, una vez la unidad reciba visitas."
                  centered={true}
                  icon={<IconExitHome size={80} color="var(--cWhiteV1)" />}
                />
              ) : (
                <Table header={accessHeader} data={datas?.access?.slice(0, 5)} className="striped" />
              )}
            </div>
          </WidgetBase>

          {/* Historial de Reservas - Tabla */}
          <WidgetBase
            title={
              <TitleRender
                title="Historial de reservas"
                onClick={() => router.push(`/reservas?search_by=${datas?.data?.nro}`)}
              />
            }
            subtitle={'+' + datas.reservationsCount + ' reservas nuevas este mes'}
            variant="V1"
            style={{ flex: 1, minWidth: '300px' }}
          >
            <div className={styles.reservationsContent}>
              {!datas?.reservations || datas?.reservations?.length === 0 ? (
                <EmptyData
                  message="No hay solicitudes de reserva. Una vez los residentes"
                  line2="comiencen a reservar áreas sociales se mostrarán aquí."
                  icon={<IconReservedAreas size={80} color="var(--cWhiteV1)" />}
                  h={120}
                  centered={true}
                />
              ) : (
                <Table header={reservationsHeader} data={datas?.reservations?.slice(0, 5)} className="striped" />
              )}
            </div>
          </WidgetBase>
        </div>

        {/* Modales */}
        <DataModal
          title="Cambiar de titular"
          open={openTitular}
          onSave={onSave}
          onClose={() => setOpenTitular(false)}
          buttonText="Guardar"
        >
          <div className={styles.modalContent}>
            <Select
              placeholder="Selecciona al nuevo titular"
              name="owner_id"
              error={errorsT.owner_id}
              required={true}
              value={formState.owner_id || ''}
              onChange={e => setFormState({ ...formState, owner_id: e.target.value })}
              options={(datas?.owners || []).map((owner: any) => ({
                ...owner,
                name: `${getFullName(owner)}`,
              }))}
              optionLabel="name"
              optionValue="id"
              iconRight={<IconArrowDown />}
            />
          </div>
        </DataModal>
        {/* Modales de Historial */}
        {openTitularHist && (
          <HistoryOwnership
            ownershipData={datas?.titularHist || []}
            open={openTitularHist}
            close={() => setOpenTitularHist(false)}
          />
        )}

        {openComprobante && idPago && (
          <RenderView
            open={openComprobante}
            onClose={() => {
              setOpenComprobante(false);
              setIdPago(null);
            }}
            // item={datas.payments?.find(
            //   (pago: any) => pago?.payment?.id === idPago
            // )?.payment || {}}
            // id={idPago}
            extraData={datas}
            payment_id={idPago}
          />
        )}

        {openPerfil && idPerfil && (
          <OwnersRenderView
            open={openPerfil}
            onClose={() => {
              setOpenPerfil(false);
              setIdPerfil(null);
            }}
            item={
              idPerfil === datas?.titular?.id
                ? datas?.titular
                : datas?.titular?.dependientes?.find((dep: any) => dep.owner_id === idPerfil)
                    ?.owner || {}
            }
            reLoad={reLoad}
          />
        )}

        {openEdit && (
          <RenderForm
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            item={datas?.data}
            reLoad={reLoad}
            extraData={dashData?.extraData}
          />
        )}
        {openDel && (
          <DataModal
            title="Eliminar unidad"
            open={openDel}
            onSave={onDel}
            onClose={() => setOpenDel(false)}
            buttonText="Eliminar"
          >
            <div className={styles.modalContent}>
              <p>
                ¿Estás seguro de que quieres eliminar esta unidad? Esta acción no se puede deshacer.
              </p>
            </div>
          </DataModal>
        )}
        {openDelTitular && (
          <DataModal
            title="Eliminar titular"
            open={openDelTitular}
            onSave={removeTitular}
            onClose={() => setOpenDelTitular(false)}
            buttonText="Eliminar"
          >
            <p>¿Estás seguro de que quieres eliminar este titular?</p>
          </DataModal>
        )}

        {openProfileModal && selectedDependentId && (
          <ProfileModal
            open={openProfileModal}
            onClose={() => {
              setOpenProfileModal(false);
              setSelectedDependentId(null);
            }}
            dataID={selectedDependentId}
            title="Perfil del Dependiente"
            titleBack="Volver a la Unidad"
            type="owner"
            reLoad={reLoad}
          />
        )}
      </section>
    </div>
  );
};

export default DashDptos;
